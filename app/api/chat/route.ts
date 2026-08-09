export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "Servizio AI non configurato" }, { status: 503 });

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 8_500_000) return Response.json({ error: "Immagine troppo grande" }, { status: 413 });

    const { message, image } = await request.json() as { message?: string; image?: string };
    if (!message?.trim() && !image) return Response.json({ error: "Messaggio vuoto" }, { status: 400 });
    if ((message?.length ?? 0) > 6_000) return Response.json({ error: "Messaggio troppo lungo" }, { status: 413 });
    if (image && (!/^data:image\/(jpeg|png|webp);base64,/i.test(image) || image.length > 8_000_000)) {
      return Response.json({ error: "Formato o dimensione immagine non supportati" }, { status: 400 });
    }

    const input = image
      ? [{
          role: "user",
          content: [
            { type: "input_text", text: message?.trim() || "Identifica questo componente nautico." },
            { type: "input_image", image_url: image, detail: "high" },
          ],
        }]
      : message!.trim();

    const shouldUseWeb = !image && /prezz|disponibil|fonte|web|online|azienda|operatore|elettricista|meccanico|ricambio|comprare|acquist/i.test(message ?? "");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-terra",
        ...(shouldUseWeb ? { tools: [{ type: "web_search" }] } : {}),
        instructions: "Sei Yacht Master, l'assistente nautico di MetaYachting AI per armatori, comandanti, operatori e cantieri. Aiuta a identificare ricambi, prodotti, componenti fotografati e professionisti. Quando ricevi una foto: descrivi cosa si vede, indica marca/codice se leggibili, spiega a cosa serve, segnala incertezze, suggerisci controlli pratici e parole chiave per cercare il ricambio. Usa la ricerca web solo quando serve verificare codici, prodotti, prezzi o aziende reali e cita fonti affidabili. Non inventare compatibilita, prezzi, numeri di telefono o disponibilita. Per sicurezza, invita a consultare un tecnico qualificato quando il problema puo comportare rischi. Rispondi in italiano in modo pratico e conciso. L'interfaccia e mobile: non usare tabelle Markdown.",
        input,
      }),
    });

    type Annotation = { type?: string; url?: string; title?: string };
    type Content = { type?: string; text?: string; annotations?: Annotation[] };
    type Output = { type?: string; content?: Content[] };
    const data = await response.json() as { output_text?: string; output?: Output[]; error?: { message?: string } };
    if (!response.ok) return Response.json({ error: data.error?.message ?? "Errore OpenAI" }, { status: response.status });

    const contents = (data.output ?? []).flatMap((item) => item.content ?? []);
    const text = data.output_text ?? contents.filter((item) => item.type === "output_text").map((item) => item.text ?? "").join("\n").trim();
    const sources = Array.from(new Map(contents.flatMap((item) => item.annotations ?? []).filter((item) => item.url).map((item) => [item.url!, { url: item.url!, title: item.title ?? "Fonte" }])).values());

    return Response.json(
      { reply: text || "Non ho trovato una risposta utile.", sources: sources.slice(0, 5) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Impossibile contattare Yacht Master" }, { status: 500 });
  }
}
