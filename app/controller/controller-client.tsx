"use client";

import { useMemo, useState } from "react";

type Agent = { id: string; name: string; detail: string; state: "idle" | "ready" | "blocked"; color: string };

const agents: Agent[] = [
  { id: "yachting", name: "Yachting Agent AI", detail: "Richieste, cataloghi e assistenza nautica", state: "ready", color: "aqua" },
  { id: "quality", name: "Quality & Deploy", detail: "Build, test, diff e pubblicazione Sites", state: "idle", color: "gold" },
  { id: "data", name: "Data steward", detail: "Database, simulazioni e separazione ruoli", state: "idle", color: "blue" },
];

const initialEvents = [
  { time: "09:42", label: "Sistema", text: "Controller pronto · nessun agente remoto attivo" },
  { time: "09:41", label: "Quality & Deploy", text: "Ultimo controllo: build e test completati" },
  { time: "09:39", label: "Yachting Agent AI", text: "Demo nautica disponibile nelle sezioni operative" },
];

export default function ControllerClient({ displayName }: { displayName: string }) {
  const [selected, setSelected] = useState("yachting");
  const [events, setEvents] = useState(initialEvents);
  const [approval, setApproval] = useState(false);
  const [notice, setNotice] = useState("Controller in modalità prototipo sicura");
  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === selected) ?? agents[0], [selected]);

  function startRun() {
    setNotice("Esecuzione locale simulata: in attesa del collegamento App Server");
    setEvents((current) => [{ time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), label: selectedAgent.name, text: "Richiesta preparata; nessuna modifica è stata eseguita" }, ...current]);
    setApproval(true);
  }

  return <main className="controller-page">
    <header className="controller-header">
      <div><a className="controller-back" href="/">← Yachting Agent AI</a><p className="eyebrow">CENTRO DI CONTROLLO</p><h1>Il tuo cockpit per gli agenti</h1><p className="controller-lead">Crea lavori, osserva gli eventi e approva le modifiche prima che diventino operative.</p></div>
      <div className="controller-owner"><span>Accesso titolare</span><strong>{displayName}</strong><a href="/signout-with-chatgpt?return_to=%2Fcontroller">Esci</a></div>
    </header>
    <section className="controller-notice"><span className="status-dot" />{notice}<small>App Server: collegamento non ancora configurato</small></section>
    <div className="controller-grid">
      <section className="controller-card agents-card"><div className="card-heading"><div><p className="eyebrow">AGENTI</p><h2>Squadra operativa</h2></div><span className="pill">{agents.length} disponibili</span></div>{agents.map((agent) => <button key={agent.id} className={`agent-row ${selected === agent.id ? "selected" : ""}`} onClick={() => setSelected(agent.id)}><i className={`agent-icon ${agent.color}`}>✦</i><span><strong>{agent.name}</strong><small>{agent.detail}</small></span><em className={`agent-state ${agent.state}`}>{agent.state === "ready" ? "Pronto" : agent.state === "idle" ? "In attesa" : "Bloccato"}</em></button>)}</section>
      <section className="controller-card run-card"><p className="eyebrow">NUOVO LAVORO</p><h2>{selectedAgent.name}</h2><p className="muted">Descrivi il risultato che vuoi ottenere. Il controller preparerà il lavoro e chiederà conferma prima di ogni azione sensibile.</p><label>Obiettivo<textarea defaultValue="Controlla lo stato del progetto nautico e prepara un riepilogo delle prossime attività." /></label><div className="run-actions"><button className="primary-controller" onClick={startRun}>Prepara lavoro</button><span>Diff e approvazione sempre richiesti</span></div></section>
      <section className="controller-card events-card"><div className="card-heading"><div><p className="eyebrow">EVENTI</p><h2>Attività recente</h2></div><span className="live-chip">● LIVE LOCALE</span></div><div className="event-list">{events.map((event, index) => <article key={`${event.time}-${index}`}><time>{event.time}</time><div><strong>{event.label}</strong><p>{event.text}</p></div></article>)}</div></section>
      <section className="controller-card approval-card"><p className="eyebrow">GATE DI SICUREZZA</p><h2>Approvazioni</h2>{approval ? <div className="approval-request"><span className="approval-icon">!</span><div><strong>Richiesta pronta per la revisione</strong><p>Nessuna azione è stata eseguita. Collega l’App Server per ricevere diff reali.</p></div><div className="approval-actions"><button onClick={() => { setApproval(false); setNotice("Richiesta rifiutata senza modifiche"); }}>Rifiuta</button><button disabled>Approva</button></div></div> : <div className="empty-approval"><span>✓</span><p>Nessuna approvazione in sospeso</p><small>Le modifiche sensibili compariranno qui prima dell’esecuzione.</small></div>}</section>
    </div>
    <footer className="controller-footer">Prototipo titolare · dati e azioni separati dall’area pubblica · token e credenziali non vengono mai mostrati</footer>
  </main>;
}
