import type { Metadata } from "next";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  title: "Informativa privacy preliminare - Olbia Yachting Community",
  description: "Informazioni trasparenti sui dati trattati dalla web app Olbia Yachting Community.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Informativa privacy preliminare", description: "Dati e servizi utilizzati da Olbia Yachting Community.", images: [] },
  twitter: { card: "summary", title: "Informativa privacy preliminare", description: "Dati e servizi utilizzati da Olbia Yachting Community.", images: [] },
};

export default function PrivacyPage() {
  return (
    <LegalShell eyebrow="PRIVACY" title="Informativa privacy preliminare" updated="16 agosto 2026">
      <div className="legal-alert"><b>Documento preliminare</b><p>Prima dell’apertura commerciale il gestore deve integrare identità, indirizzo e contatto dedicato del titolare del trattamento, basi giuridiche e tempi definitivi di conservazione. Questa pagina descrive intanto in modo trasparente il funzionamento reale della versione attuale.</p></div>

      <section><h2>Dati utilizzati</h2><p>L’accesso tramite ChatGPT rende disponibili all’app un identificativo utente, l’indirizzo email e, quando presente, il nome del profilo. L’app può inoltre memorizzare ruolo, piano selezionato, username Telegram, mansioni, prodotti, richieste di intervento e dati professionali pubblicati volontariamente dagli operatori.</p></section>

      <section><h2>Assistente AI e fotografie</h2><p>I messaggi inviati alla chat e le fotografie scelte dall’utente vengono trasmessi a OpenAI per generare la risposta. Quando la domanda richiede prodotti, prezzi, fonti o aziende, può essere attivata la ricerca web. Le conversazioni non vengono salvate nel database dell’app dalla versione attuale; viene registrato soltanto un conteggio tecnico giornaliero delle richieste per applicare i limiti d’uso.</p></section>

      <section><h2>Spazio personale e community</h2><p>Agenda e lista acquisti sono associate all’account autenticato. Le richieste di intervento possono essere visibili agli operatori e alle ditte in base a ruolo e località. Telefono, email, sito e Telegram inseriti in un profilo operatore sono destinati alla pubblicazione nella community: non inserirli se non vuoi renderli visibili agli utenti autorizzati.</p></section>

      <section><h2>Contatti verso aziende</h2><p>Quando l’utente sceglie di aprire Email o WhatsApp dalla directory, l’app registra azienda selezionata, canale, località, codice di riferimento, identificativo account o stato anonimo e data/ora. Questi dati servono a misurare l’utilizzo della directory e le possibili richieste commerciali. Il testo del messaggio, il destinatario effettivo e l’eventuale invio non vengono salvati dall’app. Il messaggio viene soltanto precompilato e resta sotto il controllo dell’utente. Il periodo definitivo di conservazione dovrà essere indicato prima del lancio commerciale.</p></section>

      <section><h2>Dati locali e geolocalizzazione</h2><p>Lingua, località scelta, piano, ruolo e modalità demo possono essere conservati nel browser. La versione attuale non legge automaticamente la posizione GPS: la località viene selezionata dall’utente.</p></section>

      <section><h2>Fornitori e collegamenti esterni</h2><p>Il servizio utilizza l’infrastruttura di autenticazione e hosting di ChatGPT/Sites e la OpenAI Responses API. I collegamenti a Telegram, siti di operatori e fonti web portano a servizi esterni con proprie informative.</p></section>

      <section><h2>Sicurezza e scelte dell’utente</h2><p>Non caricare fotografie contenenti persone, documenti, coordinate precise, targhe, informazioni riservate o altri dati non necessari. Le credenziali OpenAI restano sul server e non vengono inviate al browser. Per richieste di accesso, correzione o cancellazione dovrà essere pubblicato un contatto privacy dedicato prima dell’apertura commerciale.</p></section>
    </LegalShell>
  );
}
