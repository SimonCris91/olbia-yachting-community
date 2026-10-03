import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const categories = ["Meccanica", "Elettrica", "Elettronica", "Refit", "Pulizia", "Altro"] as const;

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Accedi prima di analizzare una richiesta", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "Servizio AI non configurato" }, { status: 503 });

    const body = await request.json() as { message?: string; location?: string };
    const message = body.message?.trim() ?? "";
    if (message.length < 5 || message.length > 5_000) return Response.json({ error: "Incolla un messaggio WhatsApp valido (massimo 5.000 caratteri)" }, { status: 400 });

    const day = new Date().toISOString().slice(0, 10);
    const subject = `user:${user.userId}`;
    await env.DB.prepare("INSERT INTO ai_usage (subject, day, requests) VALUES (?, ?, 1) ON CONFLICT(subject, day) DO UPDATE SET requests = requests + 1, updated_at = CURRENT_TIMESTAMP").bind(subject, day).run();
    const usage = await env.DB.prepare("SELECT requests FROM ai_usage WHERE subject = ? AND day = ?").bind(subject, day).first<{ requests: number }>();
    if ((usage?.requests ?? 101) > 100) return Response.json({ error: "Limite giornaliero AI raggiunto (100)" }, { status: 429 });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-terra",
        instructions: `Trasforma un messaggio WhatsApp ricevuto da un cliente nautico in una scheda di lavoro chiara per Yachting Agent AI. Non inventare barca, luogo, urgenza, guasto, ricambi o contatti non presenti. Inserisci nei campi mancanti le informazioni essenziali da chiedere. La localita selezionata nell'app e ${body.location ?? "Olbia"}. Se il testo non riguarda nautica, assistenza, fornitura o lavoro di bordo, imposta isRelevant su false. Prepara anche una risposta WhatsApp breve e professionale che confermi la ricezione e chieda solo i dati mancanti.`,
        input: message,
        text: {
          format: {
            type: "json_schema",
            name: "nautical_whatsapp_intake",
            strict: true,
            schema: {
              type: "object",
              properties: {
                isRelevant: { type: "boolean" },
                title: { type: "string" },
                category: { type: "string", enum: categories },
                details: { type: "string" },
                urgency: { type: "string", enum: ["Non indicata", "Bassa", "Media", "Alta", "Emergenza"] },
                missing: { type: "array", items: { type: "string" } },
                replyMessage: { type: "string" },
              },
              required: ["isRelevant", "title", "category", "details", "urgency", "missing", "replyMessage"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
    if (!response.ok) return Response.json({ error: data.error?.message ?? "Analisi AI non disponibile" }, { status: response.status });
    const outputText = data.output_text ?? (data.output ?? []).flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text").map((item) => item.text ?? "").join("");
    if (!outputText) return Response.json({ error: "L'AI non ha restituito una scheda valida" }, { status: 502 });

    const draft = JSON.parse(outputText) as { isRelevant: boolean; title: string; category: string; details: string; urgency: string; missing: string[]; replyMessage: string };
    if (!categories.includes(draft.category as (typeof categories)[number])) draft.category = "Altro";
    return Response.json({ draft: {
      isRelevant: !!draft.isRelevant,
      title: String(draft.title ?? "Richiesta da WhatsApp").slice(0, 160),
      category: draft.category,
      details: String(draft.details ?? "").slice(0, 2_000),
      urgency: String(draft.urgency ?? "Non indicata"),
      missing: Array.isArray(draft.missing) ? draft.missing.map(String).slice(0, 8) : [],
      replyMessage: String(draft.replyMessage ?? "").slice(0, 1_500),
    } });
  } catch {
    return Response.json({ error: "Impossibile analizzare la richiesta WhatsApp" }, { status: 500 });
  }
}
