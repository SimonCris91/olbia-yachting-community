"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { demoDisclaimer, demoEntries } from "./demo-data";
import { classifyEntry, closeEntry, confirmEntry, confirmExecution } from "./passport-model.js";
import { entryTypes, passportComponents, type Classification, type ComponentId, type EntryType, type PassportDraft, type PassportEntry, type PassportStatus, type Urgency } from "./types";

const STORAGE_KEY = "orbia-refit-passport-v1";
const MAX_ATTACHMENT_BYTES = 600_000;
const STATUS_VALUES: PassportStatus[] = ["Da verificare", "Confermato", "Chiuso"];
const URGENCY_VALUES: Urgency[] = ["Bassa", "Media", "Alta"];
const componentLabel = (id: ComponentId) => passportComponents.find((component) => component.id === id)?.label ?? "Componente";
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const displayDate = (date: string) => new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));

type FilterValue = "all" | ComponentId;

export default function PassportDashboard() {
  const [entries, setEntries] = useState<PassportEntry[]>(demoEntries);
  const [selectedComponent, setSelectedComponent] = useState<FilterValue>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PassportStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | EntryType>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<{ it: string; en: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<PassportDraft>({
    date: localToday(), type: "Nota tecnica", title: "", description: "", componentId: "general",
    source: "Inserimento manuale locale", status: "Da verificare", urgency: "Media", internalNotes: "",
  });
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [classification, setClassification] = useState<Classification | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item?.id === "string" && typeof item?.source === "string")) {
            setEntries(parsed as PassportEntry[]);
          }
        }
      } catch {
        setNotice("Archivio locale non leggibile: la demo precaricata resta disponibile in memoria.");
      }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  const persistEntries = (nextEntries: PassportEntry[]) => {
    setEntries(nextEntries);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    } catch {
      setNotice("Spazio locale pieno: riduci gli allegati e riprova. I dati non sono stati inviati al server.");
    }
  };

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)), [entries]);
  const filteredEntries = useMemo(() => sortedEntries.filter((entry) =>
    (selectedComponent === "all" || entry.componentId === selectedComponent) &&
    (statusFilter === "all" || entry.status === statusFilter) &&
    (typeFilter === "all" || entry.type === typeFilter),
  ), [sortedEntries, selectedComponent, statusFilter, typeFilter]);
  const openCount = entries.filter((entry) => entry.status !== "Chiuso").length;
  const lastUpdated = sortedEntries[0]?.date ?? localToday();
  const selectedComponentEntries = selectedComponent === "all" ? [] : sortedEntries.filter((entry) => entry.componentId === selectedComponent);
  const componentProblems = selectedComponentEntries.filter((entry) => /problema|anomalia|errore|guasto/i.test(`${entry.type} ${entry.title} ${entry.description}`));
  const componentSpares = selectedComponentEntries.filter((entry) => entry.type === "Ricambio" || entry.type === "Ordine");
  const componentDocuments = selectedComponentEntries.filter((entry) => ["Documento", "Foto", "Fattura", "DDT"].includes(entry.type));
  const componentOpen = selectedComponentEntries.filter((entry) => entry.status !== "Chiuso");

  const updateDraft = <K extends keyof PassportDraft>(key: K, value: PassportDraft[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setClassification({ ...classifyEntry({ ...next, id: "preview", demo: false }), source: next.source || "Fonte non specificata" });
  };

  const selectAttachment = (file?: File) => {
    setAttachment(null);
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setNotice("Per questa demo locale ogni allegato è limitato a 600 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAttachment({ name: file.name, dataUrl: reader.result });
    };
    reader.onerror = () => setNotice("Non riesco a leggere questo allegato.");
    reader.readAsDataURL(file);
  };

  const addEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.source.trim()) {
      setNotice("Indica sempre la fonte o l'origine del dato.");
      return;
    }
    if (draft.status === "Chiuso") {
      setNotice("Una voce non può essere creata già chiusa: prima salvala, poi confermala manualmente e infine chiudila.");
      return;
    }
    const manuallyConfirmed = draft.status === "Confermato";
    if (manuallyConfirmed && !window.confirm("Confermi manualmente l'esattezza di questo dato? La classificazione simulata non conferma nulla.")) return;
    const nextEntry: PassportEntry = {
      ...draft,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: draft.title.trim(),
      description: draft.description.trim(),
      source: draft.source.trim(),
      internalNotes: draft.internalNotes.trim(),
      demo: false,
      ...(manuallyConfirmed ? { status: "Confermato" as const, confirmedAt: new Date().toISOString() } : { status: "Da verificare" as const }),
      ...(attachment ? { attachmentName: attachment.name, attachmentDataUrl: attachment.dataUrl } : {}),
    };
    persistEntries([nextEntry, ...entries]);
    setSelectedComponent(nextEntry.componentId);
    setStatusFilter("all");
    setTypeFilter("all");
    setFormOpen(false);
    setClassification(classifyEntry(nextEntry));
    setDraft({ date: localToday(), type: "Nota tecnica", title: "", description: "", componentId: "general", source: "Inserimento manuale locale", status: "Da verificare", urgency: "Media", internalNotes: "" });
    setAttachment(null);
    setNotice("Elemento salvato solo in questo browser. Nessuna diagnosi o chiusura automatica.");
  };

  const updateEntry = (id: string, transform: (entry: PassportEntry) => PassportEntry) => {
    persistEntries(entries.map((entry) => entry.id === id ? transform(entry) : entry));
  };

  const manuallyConfirm = (entry: PassportEntry) => {
    if (!window.confirm(`Confermi manualmente il dato “${entry.title}”? Questo non attesta che un intervento sia stato eseguito.`)) return;
    try {
      updateEntry(entry.id, (current) => confirmEntry(current));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Conferma non riuscita.");
    }
  };

  const manuallyConfirmExecution = (entry: PassportEntry) => {
    if (!window.confirm(`Attesti manualmente che l'intervento “${entry.title}” è stato realmente eseguito?`)) return;
    try {
      updateEntry(entry.id, (current) => confirmExecution(current));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Attestazione non riuscita.");
    }
  };

  const manuallyClose = (entry: PassportEntry) => {
    if (!window.confirm(`Chiudere la voce “${entry.title}”? Deve essere già confermata manualmente.`)) return;
    try {
      updateEntry(entry.id, (current) => closeEntry(current));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Chiusura non riuscita.");
    }
  };

  const generateReport = () => {
    const reportEntries = selectedComponent === "all" ? sortedEntries : selectedComponentEntries;
    const boat = "Yacht dimostrativo OYC";
    const scopeIt = selectedComponent === "all" ? "Tutti i componenti" : componentLabel(selectedComponent);
    const componentNamesEn: Record<string, string> = {
      engine: "Engine", display: "Display", nmea: "NMEA 2000 network", fuel: "Fuel sensors",
      electrical: "Electrical system", hull: "Hull and deck", safety: "Safety equipment",
      documents: "Documents", general: "General",
    };
    const scopeEn = selectedComponent === "all" ? "All components" : componentNamesEn[selectedComponent] ?? selectedComponent;
    const sources = [...new Set(reportEntries.map((entry) => entry.source))];
    const manualExecutions = reportEntries.filter((entry) => entry.executionConfirmedAt);
    const open = reportEntries.filter((entry) => entry.status !== "Chiuso");
    const issues = reportEntries.filter((entry) => /problema|anomalia|errore|guasto/i.test(`${entry.type} ${entry.title} ${entry.description}`));
    const checks = reportEntries.filter((entry) => entry.status === "Confermato" || entry.status === "Chiuso");
    const materials = reportEntries.filter((entry) => entry.type === "Ricambio" || entry.type === "Ordine");
    const it = [
      "RAPPORTO TECNICO — ITALIANO",
      `Imbarcazione: ${boat} (caso dimostrativo)`,
      "Motore: Honda BF135 (dato del caso, non verificato)",
      "Strumentazione: display ASE 4.3 | Rete: NMEA 2000 | Sensori: due sensori carburante analogici",
      "Area: Olbia / Costa Smeralda (scenario demo)",
      `Ambito: ${scopeIt}`,
      `Problemi segnalati nel testo: ${issues.length ? issues.map((entry) => `${entry.title} — ${entry.description}`).join(" | ") : "nessuna segnalazione rilevata nei record inclusi"}`,
      `Verifiche registrate: ${checks.length ? checks.map((entry) => `${entry.title} [stato ${entry.status}; fonte: ${entry.source}]`).join(" | ") : "nessuna voce confermata manualmente"}`,
      `Interventi eseguiti, solo con attestazione manuale: ${manualExecutions.length ? manualExecutions.map((entry) => `${entry.title} (${entry.executionConfirmedAt})`).join(" | ") : "nessun intervento attestato come eseguito"}`,
      `Ricambi/materiali citati: ${materials.length ? materials.map((entry) => `${entry.title} — ${entry.description}`).join(" | ") : "non indicati"}`,
      `Attività ancora aperte: ${open.length ? open.map((entry) => `${entry.title} (${entry.status})`).join(" | ") : "nessuna"}`,
      "Raccomandazione: confrontare le segnalazioni con manuali, schemi e misure reali; la classificazione locale non costituisce diagnosi.",
      `Fonti/origini: ${sources.join(" | ") || "nessuna"}`,
      "Nota: la demo non attesta lavori, diagnosi o documenti reali.",
    ].join("\n");
    const en = [
      "TECHNICAL REPORT — ENGLISH",
      `Vessel: ${boat} (demonstration case)`,
      "Engine: Honda BF135 (case data, not verified)",
      "Instrumentation: ASE 4.3 display | Network: NMEA 2000 | Sensors: two analogue fuel sensors",
      "Operating area: Olbia / Costa Smeralda (demo scenario)",
      `Scope: ${scopeEn}`,
      `Issues mentioned in the text: ${issues.length ? issues.map((entry) => `${entry.title} — ${entry.description}`).join(" | ") : "no issue found in the included records"}`,
      `Recorded checks: ${checks.length ? checks.map((entry) => `${entry.title} [status ${entry.status}; source: ${entry.source}]`).join(" | ") : "no manually confirmed entry"}`,
      `Work marked as performed, only with manual attestation: ${manualExecutions.length ? manualExecutions.map((entry) => `${entry.title} (${entry.executionConfirmedAt})`).join(" | ") : "no work attested as performed"}`,
      `Spares/materials mentioned: ${materials.length ? materials.map((entry) => `${entry.title} — ${entry.description}`).join(" | ") : "not specified"}`,
      `Open activities: ${open.length ? open.map((entry) => `${entry.title} (${entry.status})`).join(" | ") : "none"}`,
      "Recommendation: compare reports with actual manuals, wiring diagrams and measurements; local classification is not a diagnosis.",
      `Sources/origins: ${sources.join(" | ") || "none"}`,
      "Original record text remains in its entered language; this prototype does not translate records automatically.",
      "Note: demo data does not prove real work, diagnoses or documents.",
    ].join("\n");
    setReport({ it, en });
    setReportOpen(true);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([`${report.it}\n\n${"—".repeat(32)}\n\n${report.en}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "passaporto-refit-report-it-en.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(`${report.it}\n\n${report.en}`);
      setNotice("Rapporto bilingue copiato negli appunti.");
    } catch {
      setNotice("Copia non disponibile: usa il download del rapporto.");
    }
  };

  return (
    <main className="passport-shell">
      <header className="passport-header">
        <Link className="passport-brand" href="/" aria-label="Torna a Yachting Agent AI"><span className="passport-brand-mark">Y</span><span><b>YACHTING</b><small>AGENT AI</small></span></Link>
        <div className="passport-header-right"><span className="passport-demo-tag">{hydrated ? "ARCHIVIO LOCALE PRONTO" : "APRO ARCHIVIO LOCALE…"}</span><Link href="/">Torna alla community</Link></div>
      </header>

      <div className="passport-content">
        <section className="passport-title-row">
          <div><span className="passport-eyebrow">REFIT · MANUTENZIONE · DOCUMENTI</span><h1>Passaporto Digitale Refit</h1><p>Cronologia tecnica dimostrativa della barca, con fonti visibili e conferme sempre in mano all’utente.</p></div>
          <button className="passport-primary" onClick={() => { setFormOpen((open) => !open); setClassification(null); }}>{formOpen ? "Chiudi inserimento" : "+ Nuovo elemento"}</button>
        </section>

        <div className="passport-disclaimer" role="note"><b>Demo isolata.</b> {demoDisclaimer} I dati e gli allegati inseriti restano in questo browser; non vengono inviati al server. Non caricare documenti riservati in questa demo.</div>

        <section className="passport-boat-card" aria-label="Riepilogo imbarcazione dimostrativa">
          <div className="passport-boat-main"><span className="passport-eyebrow">IMBARCAZIONE DIMOSTRATIVA</span><h2>Yacht dimostrativo OYC</h2><span className="passport-status-chip"><i /> Stato generale: da verificare</span></div>
          <dl className="passport-vessel-specs"><div><dt>Motore</dt><dd>Honda BF135</dd></div><div><dt>Strumentazione</dt><dd>ASE 4.3</dd></div><div><dt>Rete / sensori</dt><dd>NMEA 2000 · 2 sensori carburante analogici</dd></div><div><dt>Area operativa</dt><dd>Olbia / Costa Smeralda</dd></div></dl>
          <div className="passport-kpis"><div><strong>{openCount}</strong><span>Attività aperte</span></div><div><strong>{displayDate(lastUpdated)}</strong><span>Ultimo aggiornamento</span></div><div><strong>{entries.length}</strong><span>Voci in cronologia</span></div></div>
        </section>

        {notice && <div className="passport-notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Chiudi avviso">×</button></div>}

        {formOpen && <section className="passport-panel passport-form-panel" aria-labelledby="passport-form-title">
          <div className="passport-section-title"><div><span className="passport-eyebrow">REGISTRAZIONE TRACCIABILE</span><h2 id="passport-form-title">Nuovo elemento tecnico</h2></div><span className="passport-local-pill">Salvataggio locale</span></div>
          <form className="passport-form" onSubmit={addEntry}>
            <label>Tipo elemento<select value={draft.type} onChange={(event) => updateDraft("type", event.target.value as EntryType)}>{entryTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Data<input type="date" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} required /></label>
            <label className="passport-wide">Titolo<input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} maxLength={120} required placeholder="Es. Verifica connettore sensore carburante" /></label>
            <label className="passport-wide">Descrizione libera<textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} rows={3} maxLength={2000} placeholder="Trascrivi solo ciò che è stato riferito o osservato; distingui fatti e ipotesi." /></label>
            <label>Componente collegato<select value={draft.componentId} onChange={(event) => updateDraft("componentId", event.target.value as ComponentId)}>{passportComponents.map((component) => <option key={component.id} value={component.id}>{component.label}</option>)}</select></label>
            <label>Fonte / origine<input value={draft.source} onChange={(event) => updateDraft("source", event.target.value)} maxLength={180} required placeholder="Es. nota tecnico, documento, armatore" /></label>
            <label>Stato del dato<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as PassportStatus)}>{STATUS_VALUES.map((status) => <option key={status} value={status} disabled={status === "Chiuso"}>{status}{status === "Chiuso" ? " — conferma richiesta dopo il salvataggio" : ""}</option>)}</select><small>“Confermato” richiede un’azione esplicita. La chiusura si può fare dalla cronologia solo dopo.</small></label>
            <label>Urgenza<select value={draft.urgency} onChange={(event) => updateDraft("urgency", event.target.value as Urgency)}>{URGENCY_VALUES.map((urgency) => <option key={urgency}>{urgency}</option>)}</select></label>
            <label className="passport-wide">Note interne<textarea value={draft.internalNotes} onChange={(event) => updateDraft("internalNotes", event.target.value)} rows={2} maxLength={1000} placeholder="Annotazioni non incluse nel rapporto condivisibile." /></label>
            <label className="passport-wide passport-file-field">Allegato locale (foto/documento, max 600 KB)<input type="file" accept="image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx" onChange={(event) => selectAttachment(event.target.files?.[0])} />{attachment && <small>Allegato pronto: {attachment.name}</small>}<small>Il file resta nel browser. I segnaposto demo non sono allegati reali.</small></label>
            {classification && <div className="passport-classification passport-wide" aria-live="polite"><div className="passport-section-title"><div><span className="passport-eyebrow">CLASSIFICAZIONE AI SIMULATA</span><h3>Anteprima basata solo sul testo</h3></div><span className="passport-local-pill">Nessuna API AI</span></div><p>{classification.disclaimer}</p><div className="passport-classification-grid"><div><b>Componente</b><span>{classification.component}</span></div><div><b>Problema</b><span>{classification.issue}</span></div><div><b>Intervento menzionato</b><span>{classification.intervention}</span></div><div><b>Materiali riconosciuti</b><span>{classification.materials}</span></div><div><b>Attività ancora aperte</b><span>{classification.openActions}</span></div><div><b>Prossima verifica suggerita</b><span>{classification.nextCheck}</span></div><div><b>Urgenza (scelta utente)</b><span>{classification.urgency}</span></div><div><b>Attenzione</b><span>{classification.attention}</span></div><div className="passport-wide"><b>Fonte</b><span>{classification.source}</span></div></div></div>}
            <div className="passport-form-actions passport-wide"><span>Lo stato “eseguito” non viene mai dedotto dal testo: si attesta separatamente dalla cronologia.</span><button className="passport-primary" type="submit">Salva elemento</button></div>
          </form>
        </section>}

        <div className="passport-workspace">
          <section className="passport-panel passport-timeline-panel" aria-labelledby="passport-timeline-title">
            <div className="passport-section-title"><div><span className="passport-eyebrow">REGISTRO TRACCIABILE</span><h2 id="passport-timeline-title">Cronologia tecnica</h2></div><button className="passport-secondary" onClick={generateReport}>Genera rapporto IT / EN</button></div>
            <div className="passport-filters"><label>Componente<select value={selectedComponent} onChange={(event) => setSelectedComponent(event.target.value as FilterValue)}><option value="all">Tutti i componenti</option>{passportComponents.map((component) => <option key={component.id} value={component.id}>{component.label}</option>)}</select></label><label>Tipo<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | EntryType)}><option value="all">Tutti i tipi</option>{entryTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Stato<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | PassportStatus)}><option value="all">Tutti gli stati</option>{STATUS_VALUES.map((status) => <option key={status}>{status}</option>)}</select></label></div>
            <div className="passport-timeline-count">{filteredEntries.length} voci · ordinate dalla più recente</div>
            <div className="passport-timeline">{filteredEntries.map((entry) => {
              const entryClassification = classifyEntry(entry);
              return <article className="passport-event" key={entry.id}>
                <div className="passport-event-rail"><span className={`passport-event-dot urgency-${entry.urgency.toLowerCase()}`} /></div>
                <div className="passport-event-body">
                  <div className="passport-event-top"><span>{displayDate(entry.date)}</span><span className="passport-type-chip">{entry.type}</span><span className={`passport-urgency-chip urgency-${entry.urgency.toLowerCase()}`}>Urgenza {entry.urgency.toLowerCase()}</span><span className={`passport-state state-${entry.status.toLowerCase().replaceAll(" ", "-")}`}>{entry.status}</span>{entry.demo && <span className="passport-demo-chip">DEMO SIMULATA</span>}</div>
                  <h3>{entry.title}</h3><div className="passport-component-line">{componentLabel(entry.componentId)}</div><p>{entry.description || "Descrizione non inserita."}</p>
                  {entry.attachmentName && <div className="passport-attachment">Allegato: {entry.attachmentDataUrl ? <a href={entry.attachmentDataUrl} download={entry.attachmentName}>{entry.attachmentName}</a> : <span>{entry.attachmentName}</span>}</div>}
                  <div className="passport-source"><b>Fonte / origine</b><span>{entry.source}</span></div>
                  {entry.internalNotes && <details className="passport-internal-notes"><summary>Note interne</summary><p>{entry.internalNotes}</p></details>}
                  <details className="passport-classification-inline"><summary>Mostra classificazione simulata</summary><p><b>Problema:</b> {entryClassification.issue}</p><p><b>Intervento menzionato:</b> {entryClassification.intervention}</p><p><b>Prossima verifica:</b> {entryClassification.nextCheck}</p><p><b>Avvertenza:</b> {entryClassification.disclaimer}</p></details>
                  <div className="passport-manual-status">{entry.confirmedAt && <span>Dato confermato manualmente: {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.confirmedAt))}</span>}{entry.executionConfirmedAt && <span>Esecuzione attestata manualmente: {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.executionConfirmedAt))}</span>}{entry.closedAt && <span>Voce chiusa manualmente: {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.closedAt))}</span>}</div>
                  <div className="passport-event-actions">{entry.status === "Da verificare" && <button onClick={() => manuallyConfirm(entry)}>Conferma dato manualmente</button>}{entry.type === "Intervento" && entry.status === "Confermato" && !entry.executionConfirmedAt && <button onClick={() => manuallyConfirmExecution(entry)}>Attesta intervento eseguito</button>}{entry.status === "Confermato" && <button className="passport-close-action" onClick={() => manuallyClose(entry)}>Segna voce come chiusa</button>}</div>
                </div>
              </article>;
            })}{filteredEntries.length === 0 && <div className="passport-empty">Nessun elemento corrisponde ai filtri.</div>}</div>
          </section>

          <aside className="passport-panel passport-component-panel" aria-labelledby="passport-component-title">
            <span className="passport-eyebrow">SCHEDA COMPONENTE</span><h2 id="passport-component-title">{selectedComponent === "all" ? "Seleziona un componente" : componentLabel(selectedComponent)}</h2>
            {selectedComponent === "all" ? <p>Scegli un componente nel filtro della cronologia per vedere problemi, ricambi, documenti e attività aperte collegati.</p> : <>
              <div className="passport-component-kpi"><strong>{selectedComponentEntries.length}</strong><span>eventi registrati</span></div>
              <ComponentSection title="Ultimi problemi segnalati" entries={componentProblems} empty="Nessuna segnalazione nel registro." />
              <ComponentSection title="Ricambi / ordini" entries={componentSpares} empty="Nessun ricambio associato." />
              <ComponentSection title="Documenti collegati" entries={componentDocuments} empty="Nessun documento associato." />
              <ComponentSection title="Attività ancora aperte" entries={componentOpen} empty="Nessuna attività aperta." />
              <div className="passport-next-check"><b>Prossima verifica suggerita</b><p>Controllare manuali, schema specifico, misure e fonte originaria con un tecnico responsabile.</p><small>Indicazione generica simulata, non istruzione tecnica né diagnosi.</small></div>
            </>}
          </aside>
        </div>

        {reportOpen && report && <div className="passport-modal-backdrop"><section className="passport-report-modal" role="dialog" aria-modal="true" aria-labelledby="passport-report-title"><button className="passport-modal-close" onClick={() => setReportOpen(false)} aria-label="Chiudi rapporto">×</button><span className="passport-eyebrow">OUTPUT BILINGUE</span><h2 id="passport-report-title">Rapporto tecnico demo</h2><p>Le voci chiuse non sono interpretate automaticamente come lavori eseguiti: il rapporto mostra esecuzioni solo se attestate manualmente.</p><div className="passport-report-columns"><pre>{report.it}</pre><pre>{report.en}</pre></div><div className="passport-report-actions"><button className="passport-secondary" onClick={() => void copyReport()}>Copia rapporto</button><button className="passport-primary" onClick={downloadReport}>Scarica TXT bilingue</button></div></section></div>}

        <footer className="passport-footer"><span>Yachting Agent AI · Passaporto Digitale Refit · prototipo locale</span><Link href="/">Yachting Agent AI</Link></footer>
      </div>
    </main>
  );
}

function ComponentSection({ title, entries, empty }: { title: string; entries: PassportEntry[]; empty: string }) {
  return <section className="passport-component-section"><h3>{title}</h3>{entries.length ? <ul>{entries.slice(0, 4).map((entry) => <li key={entry.id}><b>{entry.title}</b><small>{displayDate(entry.date)} · {entry.status} · {entry.source}</small></li>)}</ul> : <p>{empty}</p>}</section>;
}
