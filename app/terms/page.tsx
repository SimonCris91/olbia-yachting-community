import type { Metadata } from "next";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Termini e trasparenza - Olbia Yachting Community",
  description: "Stato del servizio, limiti dell’assistente AI e regole d’uso di Olbia Yachting Community.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Termini e trasparenza", description: "Stato e regole d’uso di Olbia Yachting Community.", images: [] },
  twitter: { card: "summary", title: "Termini e trasparenza", description: "Stato e regole d’uso di Olbia Yachting Community.", images: [] },
};

export default function TermsPage() {
  return (
    <LegalShell eyebrow="NOTE LEGALI" title="Termini, proprietà e trasparenza" updated="16 agosto 2026">
      <div className="legal-alert"><b>Versione in sviluppo</b><p>La piattaforma contiene funzioni operative e sezioni ancora dimostrative. Gli elementi demo sono indicati nell’interfaccia. Pagamenti e abbonamenti commerciali non sono ancora attivi.</p></div>

      <section><h2>Assistente AI</h2><p>Le risposte possono essere incomplete o inesatte. Non costituiscono diagnosi professionale, certificazione, preventivo vincolante o istruzione di navigazione. Per motori, impianti elettrici, sicurezza, emergenze e compatibilità dei componenti occorre verificare con un tecnico qualificato e con la documentazione ufficiale del produttore.</p></section>

      <section><h2>Fotografie e contenuti</h2><p>L’utente deve avere il diritto di caricare fotografie e informazioni inserite nell’app. È vietato pubblicare materiale illecito, dati personali non necessari, segreti professionali o contenuti appartenenti a terzi senza autorizzazione.</p></section>

      <section><h2>Operatori e richieste</h2><p>I profili degli operatori possono essere pubblicati direttamente dagli utenti. La dicitura “Verificato” viene mostrata solo quando il relativo stato è presente nel sistema; in assenza di tale dicitura, l’app non garantisce identità, qualifiche, disponibilità, prezzi o qualità del servizio. Ogni accordo operativo rimane tra le parti coinvolte.</p></section>

      <section><h2>Marchio e identità grafica</h2><p>“Olbia Yachting Community”, il logo nautico, la composizione grafica e gli elementi visivi sono utilizzati come identità del progetto. Non viene utilizzato il simbolo ® e non viene dichiarata una registrazione del marchio. I termini geografici o descrittivi restano utilizzabili nei limiti previsti dalla legge; non è consentito copiare la composizione grafica del progetto o presentarsi come servizio ufficiale senza autorizzazione.</p></section>

      <section><h2>Servizi esterni</h2><p>Risultati web, collegamenti, prezzi e disponibilità possono cambiare. L’utente deve verificarli direttamente presso la fonte. Telegram e gli altri siti collegati sono servizi indipendenti.</p></section>

      <section><h2>Vetrina nautica</h2><p>La vetrina raccoglie collegamenti verso cataloghi esterni e non costituisce un negozio interno. Olbia Yachting Community non è il venditore, non incassa i pagamenti e non gestisce spedizioni, garanzie, resi o assistenza sul prodotto. Al momento i collegamenti non generano commissioni; ogni futura affiliazione dovrà essere dichiarata chiaramente accanto ai collegamenti interessati.</p></section>

      <section><h2>Completamento prima del lancio commerciale</h2><p>Prima di vendere abbonamenti o promuovere il servizio su larga scala saranno necessari i dati completi del gestore, un contatto legale e privacy, condizioni contrattuali definitive, criteri di rimborso, verifica dei fornitori e una valutazione professionale sul deposito del marchio.</p></section>
    </LegalShell>
  );
}
