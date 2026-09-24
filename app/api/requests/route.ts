import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { isSiteOwner, type ProfileRole } from "../../access";

const locations = ["Olbia", "Porto Cervo", "Porto Rotondo", "Cagliari", "Alghero"];

async function identity() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await env.DB.prepare("SELECT role FROM profiles WHERE user_id = ?").bind(user.userId).first<{ role: ProfileRole }>();
  return { user, role: profile?.role ?? "private", isOwner: isSiteOwner(user) };
}

export async function GET(request: Request) {
  const actor = await identity();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const location = new URL(request.url).searchParams.get("location");
  const base = `SELECT r.id, r.owner_user_id AS ownerId, r.title, r.details, r.category, r.location, r.status,
    r.accepted_by_user_id AS acceptedByUserId,
    CASE WHEN r.accepted_by_user_id IS NULL THEN NULL ELSE COALESCE(p.display_name, 'Operatore') END AS acceptedBy,
    r.created_at AS created
    FROM service_requests r
    LEFT JOIN profiles p ON p.user_id = r.accepted_by_user_id`;
  let rows;
  if (actor.role === "private" && !actor.isOwner) rows = await env.DB.prepare(`${base} WHERE r.owner_user_id = ? ORDER BY r.id DESC LIMIT 50`).bind(actor.user.userId).all();
  else if (location && locations.includes(location)) rows = await env.DB.prepare(`${base} WHERE r.location = ? ORDER BY r.id DESC LIMIT 50`).bind(location).all();
  else rows = await env.DB.prepare(`${base} ORDER BY r.id DESC LIMIT 50`).all();
  return Response.json({ requests: rows.results ?? [], role: actor.role });
}

export async function POST(request: Request) {
  const actor = await identity();
  if (!actor) return Response.json({ error: "Accedi prima di pubblicare una richiesta", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const body = await request.json() as { title?: string; details?: string; category?: string; location?: string };
  const title = body.title?.trim() ?? "";
  if (!title || title.length > 160 || !body.category || !body.location || !locations.includes(body.location)) return Response.json({ error: "Dati richiesta non validi" }, { status: 400 });
  const result = await env.DB.prepare("INSERT INTO service_requests (owner_user_id, title, details, category, location) VALUES (?, ?, ?, ?, ?)").bind(actor.user.userId, title, (body.details ?? "").slice(0, 2000), body.category.slice(0, 80), body.location).run();
  return Response.json({ request: { id: result.meta.last_row_id, ownerId: actor.user.userId, title, details: body.details ?? "", category: body.category, location: body.location, status: "open", created: "Adesso" } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await identity();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const body = await request.json() as { id?: number; action?: string };
  const id = Number(body.id);
  if (!Number.isInteger(id) || !["accept", "close"].includes(body.action ?? "")) return Response.json({ error: "Azione non valida" }, { status: 400 });

  if (body.action === "close") {
    const result = actor.isOwner
      ? await env.DB.prepare("UPDATE service_requests SET status = 'closed' WHERE id = ? AND status IN ('open', 'accepted')").bind(id).run()
      : await env.DB.prepare("UPDATE service_requests SET status = 'closed' WHERE id = ? AND status IN ('open', 'accepted') AND (owner_user_id = ? OR accepted_by_user_id = ?)").bind(id, actor.user.userId, actor.user.userId).run();
    if (!result.meta.changes) return Response.json({ error: "Puoi chiudere solo una tua richiesta o una lavorazione assegnata a te" }, { status: 403 });
    return Response.json({ id, status: "closed" });
  }

  if (actor.role === "private" && !actor.isOwner) return Response.json({ error: "Solo operatori e ditte possono prendere in carico lavori" }, { status: 403 });
  const result = await env.DB.prepare("UPDATE service_requests SET status = 'accepted', accepted_by_user_id = ? WHERE id = ? AND status = 'open'").bind(actor.user.userId, id).run();
  if (!result.meta.changes) return Response.json({ error: "Richiesta non più disponibile" }, { status: 409 });
  return Response.json({ id, status: "accepted", acceptedBy: actor.user.displayName, acceptedByUserId: actor.user.userId });
}
