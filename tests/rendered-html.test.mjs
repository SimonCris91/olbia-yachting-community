import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Olbia Yachting Community entry experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Olbia Yachting Community - Yachting Assistant<\/title>/i);
  assert.match(html, /OLBIA YACHTING COMMUNITY/);
  assert.match(html, /Prepariamo il tuo spazio personale/);
  assert.match(html, /olbia-yachting-brand\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps real commesse connected to the authenticated workspace", async () => {
  const [page, workspaceRoute, schema] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/workspace/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(workspaceRoute, /type Kind = "task" \| "purchase" \| "job"/);
  assert.match(schema, /enum: \["task", "purchase", "job"\]/);
  assert.match(page, /saveWorkspaceItem\("job"/);
  assert.match(page, /Archivio reale e personale/);
  assert.match(page, /Segna completata/);
  assert.doesNotMatch(page, /M\/Y Aurora.*Consegna 18 agosto/);
});

test("keeps accepted requests assigned and supports a real close lifecycle", async () => {
  const [page, requestsRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/requests/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(requestsRoute, /accepted_by_user_id AS acceptedByUserId/);
  assert.match(requestsRoute, /body\.action === "close"/);
  assert.match(requestsRoute, /owner_user_id = \? OR accepted_by_user_id = \?/);
  assert.match(page, /request\.acceptedByUserId === currentUserId/);
  assert.match(page, /action: "close"/);
  assert.match(page, /Chiudi lavorazione/);
});

test("supports assisted WhatsApp intake and verified supplier catalog links", async () => {
  const [page, whatsappRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/whatsapp/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Importa da WhatsApp/);
  assert.match(page, /La lettura automatica dei messaggi richiede un account WhatsApp Business Platform/);
  assert.match(page, /https:\/\/www\.svb-marine\.it\//);
  assert.match(page, /https:\/\/cataloghi\.motomarine\.it\//);
  assert.match(page, /https:\/\/www\.marinehardware\.it\//);
  assert.match(whatsappRoute, /text:\s*\{\s*format:\s*\{/);
  assert.match(whatsappRoute, /nautical_whatsapp_intake/);
  assert.doesNotMatch(page, /Link affiliato attivo/);
});

test("selects role-specific app areas at sign-in and protects owner access", async () => {
  const [page, profileRoute, requestsRoute, workspaceRoute, access] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/profile/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/requests/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/workspace/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/access.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Come vuoi accedere\?/);
  assert.match(page, /Accesso: \{accessLabels\[accountType\]\}/);
  assert.match(page, /option\.id !== "owner" \|\| isOwner/);
  assert.doesNotMatch(page, /useState<AccountType>\("owner"\)/);
  assert.match(profileRoute, /isOwner: isSiteOwner\(user\)/);
  assert.match(requestsRoute, /actor\.role === "private" && !actor\.isOwner/);
  assert.match(workspaceRoute, /Questa sezione non e disponibile per il tuo accesso/);
  assert.match(access, /OWNER_EMAILS/);
});
