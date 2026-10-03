/** @typedef {import("./types").PassportEntry} PassportEntry */
/** @typedef {import("./types").Classification} Classification */

const COMPONENT_LABELS = {
  engine: "Motore Honda BF135",
  display: "Display ASE 4.3",
  nmea: "Rete NMEA 2000",
  "fuel-1": "Sensore carburante 1",
  "fuel-2": "Sensore carburante 2",
  electrical: "Impianto elettrico",
  spares: "Ricambi e materiali",
  admin: "Documenti amministrativi",
  general: "Interventi generici",
};

const MATERIAL_TERMS = [
  "sensore", "cablaggio", "connettore", "fusibile", "cavo", "terminale", "display", "control unit", "chiave", "ricambio", "materiale elettrico",
];

/** @param {PassportEntry} entry */
export function classifyEntry(entry) {
  const text = `${entry.title}. ${entry.description}`.trim();
  const normalized = text.toLocaleLowerCase("it");
  const mentionsProblem = /anomali|instabil|errore|guasto|problema|scostament|intermittent/.test(normalized);
  const materials = MATERIAL_TERMS.filter((term) => normalized.includes(term));
  const hasActionWords = /verific|controll|diagnos|sostit|ripar|intervent/.test(normalized);

  return {
    component: COMPONENT_LABELS[entry.componentId] ?? "Componente da identificare",
    issue: mentionsProblem
      ? `Segnalazione rilevata nel testo: ${text}`
      : "Nessun problema esplicito riconosciuto nel testo; verificare con l'utente.",
    intervention: hasActionWords
      ? `Il testo menziona un'attività: ${text}. Non risulta eseguita finché non viene attestata manualmente.`
      : "Nel testo non è descritto un intervento; nessuna esecuzione viene dedotta.",
    materials: materials.length ? materials.join(", ") : "Nessun materiale riconosciuto nel testo.",
    openActions: entry.status === "Chiuso"
      ? "Nessuna attività aperta associata a questa voce."
      : "Verificare manualmente dati, misure e documenti; aggiornare la voce solo dopo controllo.",
    nextCheck: "Consultare manuale e schema specifici; acquisire evidenze e misure prima di formulare una diagnosi.",
    urgency: entry.urgency,
    attention: "Classificazione testuale dimostrativa: non è una diagnosi né una valutazione di sicurezza.",
    source: entry.source || "Fonte non specificata: dato da verificare.",
    disclaimer: "AI simulata con regole locali. Nessuna API AI è chiamata e nessun dato tecnico mancante viene inventato.",
  };
}

/** @param {PassportEntry} entry @param {string} confirmedAt @returns {PassportEntry} */
export function confirmEntry(entry, confirmedAt = new Date().toISOString()) {
  if (entry.status === "Chiuso") throw new Error("Una voce chiusa non può essere riconfermata.");
  return { ...entry, status: /** @type {PassportEntry["status"]} */ ("Confermato"), confirmedAt };
}

/** @param {PassportEntry} entry @param {string} executionConfirmedAt @returns {PassportEntry} */
export function confirmExecution(entry, executionConfirmedAt = new Date().toISOString()) {
  if (entry.status !== "Confermato") throw new Error("Conferma prima i dati della voce.");
  return { ...entry, executionConfirmedAt };
}

/** @param {PassportEntry} entry @param {string} closedAt @returns {PassportEntry} */
export function closeEntry(entry, closedAt = new Date().toISOString()) {
  if (entry.status !== "Confermato") throw new Error("Puoi chiudere la voce solo dopo averla confermata manualmente.");
  return { ...entry, status: /** @type {PassportEntry["status"]} */ ("Chiuso"), closedAt };
}
