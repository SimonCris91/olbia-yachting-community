import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { isSiteOwner, type ProfileRole } from "../../access";

type Kind = "task" | "purchase" | "job";
const kinds: Kind[] = ["task", "purchase", "job"];

async function userOrError() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await env.DB.prepare("SELECT role FROM profiles WHERE user_id = ?").bind(user.userId).first<{ role: ProfileRole }>();
  return { user, role: profile?.role ?? "private", isOwner: isSiteOwner(user) };
}

function allowedKinds(actor: { role: ProfileRole; isOwner: boolean }): Kind[] {
  if (actor.isOwner || actor.role === "company") return ["task", "purchase", "job"];
  if (actor.role === "operator") return ["task"];
  return ["task", "purchase"];
}

export async function GET() {
  const actor = await userOrError();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const visibleKinds = allowedKinds(actor);
  const placeholders = visibleKinds.map(() => "?").join(", ");
  const { results } = await env.DB.prepare(
    `SELECT id, kind, title, details, done, created_at AS createdAt FROM workspace_items WHERE owner_user_id = ? AND kind IN (${placeholders}) ORDER BY id DESC`,
  ).bind(actor.user.userId, ...visibleKinds).all();
  return Response.json({ items: results ?? [] });
}

export async function POST(request: Request) {
  const actor = await userOrError();
  if (!actor) return Response.json({ error: "Accedi prima di salvare", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const payload = await request.json() as { kind?: Kind; title?: string; details?: string };
  const title = payload.title?.trim();
  if (!payload.kind || !kinds.includes(payload.kind) || !title) return Response.json({ error: "Dati non validi" }, { status: 400 });
  if (!allowedKinds(actor).includes(payload.kind)) return Response.json({ error: "Questa sezione non e disponibile per il tuo accesso" }, { status: 403 });
  const result = await env.DB.prepare(
    "INSERT INTO workspace_items (owner_user_id, kind, title, details) VALUES (?, ?, ?, ?)",
  ).bind(actor.user.userId, payload.kind, title, payload.details?.trim() ?? "").run();
  return Response.json({ item: { id: result.meta.last_row_id, kind: payload.kind, title, details: payload.details?.trim() ?? "", done: false } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await userOrError();
  if (!actor) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const payload = await request.json() as { id?: number; done?: boolean };
  if (!Number.isInteger(payload.id) || typeof payload.done !== "boolean") return Response.json({ error: "Dati non validi" }, { status: 400 });
  const visibleKinds = allowedKinds(actor);
  const placeholders = visibleKinds.map(() => "?").join(", ");
  await env.DB.prepare(`UPDATE workspace_items SET done = ? WHERE id = ? AND owner_user_id = ? AND kind IN (${placeholders})`).bind(payload.done ? 1 : 0, payload.id, actor.user.userId, ...visibleKinds).run();
  return Response.json({ ok: true });
}
