import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { isSiteOwner, type ProfileRole } from "../../../access";

const CONFIRMATION = "PURGE_PREVIOUS_YACHTING_DATA_V1";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Accesso richiesto" }, { status: 401 });
  if (!isSiteOwner(user)) return Response.json({ error: "Operazione riservata al titolare" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { confirmation?: string };
  if (body.confirmation !== CONFIRMATION) return Response.json({ error: "Conferma di pulizia non valida" }, { status: 400 });
  const profile = await env.DB.prepare("SELECT role FROM profiles WHERE user_id = ?").bind(user.userId).first<{ role: ProfileRole }>();
  if (!profile) return Response.json({ error: "Profilo non trovato" }, { status: 404 });
  const results = await env.DB.batch([
    env.DB.prepare("DELETE FROM workspace_items WHERE owner_user_id = ?").bind(user.userId),
    env.DB.prepare("DELETE FROM service_requests WHERE owner_user_id = ?").bind(user.userId),
    env.DB.prepare("DELETE FROM operators WHERE owner_user_id = ?").bind(user.userId),
  ]);
  const deleted = results.reduce((total, result) => total + (result.meta.changes ?? 0), 0);
  return Response.json({ ok: true, deleted });
}
