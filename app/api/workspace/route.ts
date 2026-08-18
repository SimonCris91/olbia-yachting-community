import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

type Kind = "task" | "purchase" | "order" | "job";
const kinds: Kind[] = ["task", "purchase", "order", "job"];

async function userOrError() {
  const user = await getChatGPTUser();
  if (!user) return null;
  return user;
}

export async function GET() {
  const user = await userOrError();
  if (!user) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const { results } = await env.DB.prepare(
    "SELECT id, kind, title, details, done, created_at AS createdAt FROM workspace_items WHERE owner_user_id = ? ORDER BY id DESC",
  ).bind(user.userId).all();
  return Response.json({ items: results ?? [] });
}

export async function POST(request: Request) {
  const user = await userOrError();
  if (!user) return Response.json({ error: "Accedi prima di salvare", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const payload = await request.json() as { kind?: Kind; title?: string; details?: string };
  const title = payload.title?.trim();
  if (!payload.kind || !kinds.includes(payload.kind) || !title) return Response.json({ error: "Dati non validi" }, { status: 400 });
  const result = await env.DB.prepare(
    "INSERT INTO workspace_items (owner_user_id, kind, title, details) VALUES (?, ?, ?, ?)",
  ).bind(user.userId, payload.kind, title, payload.details?.trim() ?? "").run();
  return Response.json({ item: { id: result.meta.last_row_id, kind: payload.kind, title, details: payload.details?.trim() ?? "", done: false } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await userOrError();
  if (!user) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const payload = await request.json() as { id?: number; done?: boolean };
  if (!Number.isInteger(payload.id) || typeof payload.done !== "boolean") return Response.json({ error: "Dati non validi" }, { status: 400 });
  await env.DB.prepare("UPDATE workspace_items SET done = ? WHERE id = ? AND owner_user_id = ?").bind(payload.done ? 1 : 0, payload.id, user.userId).run();
  return Response.json({ ok: true });
}
