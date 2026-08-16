const destinations: Record<string, string> = {
  safety: "https://www.svb24.com/en/category/life-jackets-buoyancy-aids",
  pumps: "https://www.osculati.com/it/11141/16-pompe-sentina-giranti-autoclavi",
  fenders: "https://www.osculati.com/it/11682/parabordi-boe",
  ropes: "https://www.osculati.com/it/11001/ancoraggio-e-ormeggio",
  antifouling: "https://www.svb24.com/en/category/antifouling",
  instruments: "https://www.svb24.com/en/category/instrument-systems",
  toilets: "https://www.svb24.com/en/category/marine-toilets",
  engines: "https://www.svb24.com/en/category/spares-for-boat-motors",
};

const allowedHosts = new Set(["www.svb24.com", "svb24.com", "www.osculati.com", "osculati.com", "www.amazon.it", "amazon.it", "www.ebay.it", "ebay.it"]);

function affiliateOverrides() {
  const raw = process.env.AFFILIATE_LINK_OVERRIDES_JSON;
  if (!raw) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch {
    return {} as Record<string, string>;
  }
}

function safeDestination(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.has(url.hostname.toLowerCase()) ? url : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const base = destinations[id];
  if (!base) return Response.json({ error: "Collegamento non disponibile" }, { status: 404 });

  const override = affiliateOverrides()[id];
  const destination = safeDestination(override) ?? safeDestination(base);
  if (!destination) return Response.json({ error: "Destinazione non valida" }, { status: 400 });

  return Response.redirect(destination.toString(), 302);
}
