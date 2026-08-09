import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const locations = ["Olbia", "Porto Cervo", "Porto Rotondo", "Cagliari", "Alghero"];

async function identity() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await env.DB.prepare("SELECT role FROM profiles WHERE user_id = ?").bind(user.userId).first<{ role: "private" | "operator" | "company" }>();
  return { user, role: profile?.role ?? "private" };
}

export async function GET(request: Request) {
  const actor = await identity();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const location = new URL(request.url).searchParams.get("location");
  const base = "SELECT id, owner_user_id AS ownerId, title, details, category, location, status, accepted_by_user_id AS acceptedBy, created_at AS created FROM service_requests";
  let rows;
  if (actor.role === "private") rows = await env.DB.prepare(`${base} WHERE owner_user_id = ? ORDER BY id DESC LIMIT 50`).bind(actor.user.userId).all();
  else if (location && locations.includes(location)) rows = await env.DB.prepare(`${base} WHERE location = ? ORDER BY id DESC LIMIT 50`).bind(location).all();
  else rows = await env.DB.prepare(`${base} ORDER BY id DESC LIMIT 50`).all();
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
  if (actor.role === "private") return Response.json({ error: "Solo operatori e ditte possono prendere in carico lavori" }, { status: 403 });
  const body = await request.json() as { id?: number; action?: string };
  if (!Number.isInteger(body.id) || body.action !== "accept") return Response.json({ error: "Azione non valida" }, { status: 400 });
  const result = await env.DB.prepare("UPDATE service_requests SET status = 'accepted', accepted_by_user_id = ? WHERE id = ? AND status = 'open'").bind(actor.user.userId, body.id).run();
  if (!result.meta.changes) return Response.json({ error: "Richiesta non più disponibile" }, { status: 409 });
  return Response.json({ id: body.id, status: "accepted", acceptedBy: actor.user.displayName });
}
