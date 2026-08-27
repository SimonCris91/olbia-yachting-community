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
