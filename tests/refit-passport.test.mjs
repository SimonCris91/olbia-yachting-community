import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { classifyEntry, closeEntry, confirmEntry, confirmExecution } from "../app/refit-passport/passport-model.js";

const exampleEntry = {
  id: "test-1",
  date: "2026-10-03",
  type: "Intervento",
  title: "Verifica cablaggio sensore",
  description: "Segnalata anomalia intermittente; controllo da programmare.",
  componentId: "fuel-1",
  source: "Nota dell'armatore — demo test",
  status: "Da verificare",
  urgency: "Media",
  internalNotes: "",
};

test("demo includes at least 20 fully sourced, explicitly simulated records", async () => {
  const data = await readFile(new URL("../app/refit-passport/demo-data.ts", import.meta.url), "utf8");
  assert.equal((data.match(/id: "demo-\d{3}"/g) ?? []).length, 20);
  assert.equal((data.match(/source: simulatedSource/g) ?? []).length, 20);
  assert.equal((data.match(/demo: true/g) ?? []).length, 20);
  assert.match(data, /dato simulato, non documento reale/);
  assert.match(data, /Honda BF135/);
  assert.match(data, /ASE 4\.3/);
  assert.match(data, /NMEA 2000/);
});

test("classification is deterministic/local and never changes execution or record status", () => {
  const original = structuredClone(exampleEntry);
  const classification = classifyEntry(exampleEntry);
  assert.equal(classification.component, "Sensore carburante 1");
  assert.match(classification.issue, /anomalia intermittente/i);
  assert.match(classification.disclaimer, /nessuna API AI/i);
  assert.match(classification.attention, /non è una diagnosi/i);
  assert.deepEqual(exampleEntry, original);
  assert.equal(exampleEntry.status, "Da verificare");
  assert.equal(exampleEntry.executionConfirmedAt, undefined);
});

test("manual workflow separates data confirmation, execution attestation, and closure", () => {
  const confirmed = confirmEntry(exampleEntry, "2026-10-03T10:00:00.000Z");
  assert.equal(confirmed.status, "Confermato");
  assert.equal(confirmed.confirmedAt, "2026-10-03T10:00:00.000Z");
  assert.equal(confirmed.executionConfirmedAt, undefined);

  assert.throws(() => closeEntry(exampleEntry, "2026-10-03T10:01:00.000Z"), /solo dopo averla confermata manualmente/);
  assert.throws(() => confirmExecution(exampleEntry, "2026-10-03T10:01:00.000Z"), /Conferma prima/);

  const executed = confirmExecution(confirmed, "2026-10-03T10:02:00.000Z");
  assert.equal(executed.executionConfirmedAt, "2026-10-03T10:02:00.000Z");
  const closed = closeEntry(confirmed, "2026-10-03T10:03:00.000Z");
  assert.equal(closed.status, "Chiuso");
  assert.equal(closed.executionConfirmedAt, undefined);
  assert.equal(closed.closedAt, "2026-10-03T10:03:00.000Z");
});

test("operational screen supports traceability, filters, bilingual report and local-only storage", async () => {
  const [page, rootPage] = await Promise.all([
    readFile(new URL("../app/refit-passport/passport-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(page, /source: draft\.source\.trim\(\)/);
  assert.match(page, /Genera rapporto IT \/ EN/);
  assert.match(page, /TECHNICAL REPORT — ENGLISH/);
  assert.match(page, /RAPPORTO TECNICO — ITALIANO/);
  assert.match(page, /Conferma dato manualmente/);
  assert.match(page, /Attesta intervento eseguito/);
  assert.match(page, /Segna voce come chiusa/);
  assert.match(rootPage, /href="\/refit-passport"/);
});
