import type { ReactNode } from "react";

export function LegalShell({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <a className="legal-brand" href="/" aria-label="Torna a Olbia Yachting Community">
          <img src="/yachting-community-logo.png" alt="" />
          <span><b>Olbia Yachting Community</b><small>Yachting Community Assistant</small></span>
        </a>
        <a className="legal-back" href="/">Torna all’app</a>
      </header>
      <article className="legal-card">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="legal-updated">Aggiornamento: {updated}</p>
        {children}
      </article>
    </main>
  );
}
