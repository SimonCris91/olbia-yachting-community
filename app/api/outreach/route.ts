import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const channels = ["email", "whatsapp"] as const;
const locations = ["Olbia", "Porto Cervo", "Porto Rotondo", "Cagliari", "Alghero"] as const;

export async function POST(request: Request) {
  let payload: { providerId?: string; channel?: string; location?: string; reference?: string };
  try {
    payload = JSON.parse(await request.text()) as typeof payload;
  } catch {
    return Response.json({ error: "Dati non validi" }, { status: 400 });
  }

  const providerId = payload.providerId?.trim();
  const channel = payload.channel?.trim();
  const location = payload.location?.trim();
  const reference = payload.reference?.trim();
  if (!providerId || !/^[a-z0-9-]{2,80}$/.test(providerId) || !channel || !channels.includes(channel as (typeof channels)[number]) || !location || !locations.includes(location as (typeof locations)[number]) || !reference || !/^[A-Z0-9-]{8,100}$/.test(reference)) {
    return Response.json({ error: "Dati non validi" }, { status: 400 });
  }

  const user = await getChatGPTUser();
  await env.DB.prepare(
    "INSERT INTO outreach_events (actor_id, provider_id, channel, location, reference) VALUES (?, ?, ?, ?, ?)",
  ).bind(user?.userId ?? "anonymous", providerId, channel, location, reference).run();

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
