import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const roles = ["private", "operator", "company"] as const;
type Role = (typeof roles)[number];

async function ensureProfileTelegramColumn() {
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id TEXT NOT NULL,
      email TEXT,
      display_name TEXT,
      telegram TEXT,
      role TEXT NOT NULL DEFAULT 'private',
      plan TEXT NOT NULL DEFAULT 'standard',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const columns = await env.DB.prepare("PRAGMA table_info(profiles)").all<{ name: string }>();
  if (!(columns.results ?? []).some((column) => column.name === "telegram")) {
    await env.DB.exec("ALTER TABLE profiles ADD COLUMN telegram TEXT;");
  }
  await env.DB.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);");
}

async function currentProfile() {
  const user = await getChatGPTUser();
  if (!user) return { user: null, profile: null };

  await ensureProfileTelegramColumn();
  await env.DB.prepare(
    "INSERT INTO profiles (user_id, email, display_name) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name",
  ).bind(user.userId, user.email, user.displayName).run();

  const profile = await env.DB.prepare(
    "SELECT user_id AS userId, email, display_name AS displayName, telegram, role, plan FROM profiles WHERE user_id = ?",
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
  const payload = await request.json() as { role?: Role; telegram?: string | null };
  if (payload.role && !roles.includes(payload.role)) return Response.json({ error: "Ruolo non valido" }, { status: 400 });
  await ensureProfileTelegramColumn();
  if (payload.role) await env.DB.prepare("UPDATE profiles SET role = ? WHERE user_id = ?").bind(payload.role, user.userId).run();
  if (payload.telegram !== undefined) {
    await env.DB.prepare("UPDATE profiles SET telegram = ? WHERE user_id = ?").bind(payload.telegram?.trim() || null, user.userId).run();
  }
  return Response.json({ role: payload.role, telegram: payload.telegram?.trim() || null });
}
