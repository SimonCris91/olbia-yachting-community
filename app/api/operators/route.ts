import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { isSiteOwner, type ProfileRole } from "../../access";

const locations = ["Olbia", "Porto Cervo", "Porto Rotondo", "Golfo Aranci", "La Maddalena", "Cagliari", "Alghero"] as const;
const roles = ["operator", "company"] as const;

async function identity() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await env.DB.prepare("SELECT role FROM profiles WHERE user_id = ?").bind(user.userId).first<{ role: ProfileRole }>();
  return { user, role: profile?.role ?? "private", isOwner: isSiteOwner(user) };
}

function parseJsonArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const actor = await identity();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });

  const url = new URL(request.url);
  const location = url.searchParams.get("location");
  const category = url.searchParams.get("category");

  let query = "SELECT id, owner_user_id AS ownerUserId, display_name AS name, category, locations, phone, email, website, telegram, tags, note, verified, active FROM operators WHERE active = 1";
  const bindings: string[] = [];

  if (location && locations.includes(location as (typeof locations)[number])) {
    query += " AND locations LIKE ?";
    bindings.push(`%\"${location}\"%`);
  }
  if (category?.trim()) {
    query += " AND category = ?";
    bindings.push(category.trim());
  }
  query += " ORDER BY verified DESC, display_name ASC LIMIT 100";

  const rows = await env.DB.prepare(query).bind(...bindings).all<{
    id: number;
    ownerUserId: string;
    name: string;
    category: string;
    locations: string;
    phone: string;
    email: string;
    website: string;
    telegram: string;
    tags: string;
    note: string;
    verified: number;
    active: number;
  }>();

  const mine = (await env.DB.prepare(
    "SELECT id, owner_user_id AS ownerUserId, display_name AS name, category, locations, phone, email, website, telegram, tags, note, verified, active FROM operators WHERE owner_user_id = ? LIMIT 1"
  ).bind(actor.user.userId).first<{
    id: number;
    ownerUserId: string;
    name: string;
    category: string;
    locations: string;
    phone: string;
    email: string;
    website: string;
    telegram: string;
    tags: string;
    note: string;
    verified: number;
    active: number;
  }>()) ?? null;

  const mapOperator = (row: {
    id: number;
    ownerUserId: string;
    name: string;
    category: string;
    locations: string;
    phone: string;
    email: string;
    website: string;
    telegram: string;
    tags: string;
    note: string;
    verified: number;
    active: number;
  }) => ({
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    category: row.category,
    locations: parseJsonArray(row.locations),
    phone: row.phone,
    email: row.email,
    website: row.website,
    telegram: row.telegram,
    tags: parseJsonArray(row.tags),
    note: row.note,
    verified: !!row.verified,
    active: !!row.active,
  });

  return Response.json({
    operators: (rows.results ?? []).map(mapOperator),
    mine: mine ? mapOperator(mine) : null,
    role: actor.role,
  });
}

export async function POST(request: Request) {
  const actor = await identity();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  if (!actor.isOwner && !roles.includes(actor.role as (typeof roles)[number])) {
    return Response.json({ error: "Solo operatori e ditte possono pubblicare un profilo operatore" }, { status: 403 });
  }

  const body = await request.json() as {
    name?: string;
    category?: string;
    locations?: string[];
    phone?: string;
    email?: string;
    website?: string;
    telegram?: string;
    note?: string;
    tags?: string[];
  };

  const name = body.name?.trim() ?? "";
  const category = body.category?.trim() ?? "";
  const selectedLocations = Array.from(new Set((body.locations ?? []).filter((item): item is string => locations.includes(item as (typeof locations)[number]))));
  const tags = Array.from(new Set((body.tags ?? []).map((item) => item.trim()).filter((item) => item.length > 0))).slice(0, 8);
  const phone = (body.phone ?? "").trim().slice(0, 50);
  const email = (body.email ?? actor.user.email ?? "").trim().slice(0, 120);
  const website = (body.website ?? "").trim().slice(0, 200);
  const telegram = (body.telegram ?? "").trim().slice(0, 120);
  const note = (body.note ?? "").trim().slice(0, 600);

  if (!name || !category || !selectedLocations.length) {
    return Response.json({ error: "Completa nome, categoria e almeno una localita" }, { status: 400 });
  }

  await env.DB.prepare(`
    INSERT INTO operators (owner_user_id, display_name, category, locations, phone, email, website, telegram, tags, note, verified, active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(owner_user_id) DO UPDATE SET
      display_name = excluded.display_name,
      category = excluded.category,
      locations = excluded.locations,
      phone = excluded.phone,
      email = excluded.email,
      website = excluded.website,
      telegram = excluded.telegram,
      tags = excluded.tags,
      note = excluded.note,
      active = 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    actor.user.userId,
    name,
    category,
    JSON.stringify(selectedLocations),
    phone,
    email,
    website,
    telegram,
    JSON.stringify(tags),
    note,
  ).run();

  const operator = await env.DB.prepare(
    "SELECT id, owner_user_id AS ownerUserId, display_name AS name, category, locations, phone, email, website, telegram, tags, note, verified, active FROM operators WHERE owner_user_id = ? LIMIT 1"
  ).bind(actor.user.userId).first<{
    id: number;
    ownerUserId: string;
    name: string;
    category: string;
    locations: string;
    phone: string;
    email: string;
    website: string;
    telegram: string;
    tags: string;
    note: string;
    verified: number;
    active: number;
  }>();

  return Response.json({
    operator: operator ? {
      id: operator.id,
      ownerUserId: operator.ownerUserId,
      name: operator.name,
      category: operator.category,
      locations: parseJsonArray(operator.locations),
      phone: operator.phone,
      email: operator.email,
      website: operator.website,
      telegram: operator.telegram,
      tags: parseJsonArray(operator.tags),
      note: operator.note,
      verified: !!operator.verified,
      active: !!operator.active,
    } : null
  });
}

export async function PATCH(request: Request) {
  const actor = await identity();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  if (!actor.isOwner && !roles.includes(actor.role as (typeof roles)[number])) {
    return Response.json({ error: "Solo operatori e ditte possono modificare un profilo operatore" }, { status: 403 });
  }

  const body = await request.json() as { active?: boolean };
  if (typeof body.active !== "boolean") return Response.json({ error: "Stato profilo non valido" }, { status: 400 });

  await env.DB.prepare("UPDATE operators SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE owner_user_id = ?").bind(body.active ? 1 : 0, actor.user.userId).run();
  return Response.json({ active: body.active });
}
