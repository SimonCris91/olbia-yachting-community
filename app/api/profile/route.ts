import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const roles = ["private", "operator", "company"] as const;
type Role = (typeof roles)[number];

async function currentProfile() {
  const user = await getChatGPTUser();
  if (!user) return { user: null, profile: null };

  await env.DB.prepare(
    "INSERT INTO profiles (user_id, email, display_name) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name",
  ).bind(user.userId, user.email, user.displayName).run();

  const profile = await env.DB.prepare(
    "SELECT user_id AS userId, email, display_name AS displayName, role, plan FROM profiles WHERE user_id = ?",
  ).bind(user.userId).first();
  return { user, profile };
}

export async function GET() {
  const { user, profile } = await currentProfile();
  if (!user) return Response.json({ error: "Accedi per salvare e gestire i tuoi dati", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  return Response.json({ profile });
}

export async function PATCH(request: Request) {
  const { user } = await currentProfile();
  if (!user) return Response.json({ error: "Accesso richiesto", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const payload = await request.json() as { role?: Role };
  if (!payload.role || !roles.includes(payload.role)) return Response.json({ error: "Ruolo non valido" }, { status: 400 });
  await env.DB.prepare("UPDATE profiles SET role = ? WHERE user_id = ?").bind(payload.role, user.userId).run();
  return Response.json({ role: payload.role });
}
