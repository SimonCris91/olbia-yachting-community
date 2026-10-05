# Report di intenzionalità — utilizzo di Codex App Server

Data: 5 ottobre 2026  
Progetto iniziale: Yachting Agent AI  
Promotore: Simone Feo  
Natura del documento: indirizzo progettuale e dichiarazione di intenti; non attestazione di servizio già operativo.

## Intenzione

Intendiamo utilizzare Codex App Server come motore di un controller personale che consenta al titolare di assegnare attività agli agenti, seguirne l'avanzamento, esaminare le modifiche proposte e gestire le richieste di approvazione dalla propria interfaccia web e, successivamente, da un dispositivo mobile.

Il primo contesto applicativo è il progetto Yachting Agent AI. Il controller servirà a organizzare e supervisionare il lavoro tecnico sul progetto: analisi del codice, verifiche, preparazione delle modifiche, manutenzione delle integrazioni e produzione di report. L'eventuale estensione ad altri progetti richiederà configurazioni dedicate e autorizzazioni specifiche.

## Valore atteso

L'obiettivo è ridurre la dispersione tra conversazioni, terminali e strumenti di sviluppo, rendendo visibili il lavoro in corso, gli ostacoli e il risultato prodotto. Ogni attività dovrà avere un obiettivo comprensibile, un progetto di riferimento, una cronologia e un esito verificabile.

Il titolare dovrà poter interrompere un lavoro, riprendere una sessione e decidere sulle azioni per cui il runtime richiede approvazione. Il controller dovrà distinguere una modifica proposta da una modifica applicata, una build riuscita da una pubblicazione e un errore tecnico da una richiesta di intervento umano.

## Uso previsto

Il primo caso d'uso sarà: «Controlla il progetto Yachting Agent AI, individua un problema e prepara una modifica con le relative verifiche». Il controller presenterà gli eventi dell'agente, gli eventuali file modificati, il diff disponibile e l'esito dei test. Le azioni esterne seguiranno il perimetro autorizzato dal titolare.

I profili previsti sono assistenza al progetto nautico, qualità e pubblicazione, gestione dei dati. Questi profili sono al momento elementi della UI dimostrativa: non rappresentano processi remoti già attivi.

L'integrazione si baserà sul protocollo App Server per inizializzare la connessione, creare o riprendere thread, avviare turni e ricevere eventi. I tipi TypeScript o gli schemi JSON verranno generati dal binario installato quando necessari, così da mantenere il client coerente con il runtime. Riferimento: [documentazione ufficiale Codex App Server](https://developers.openai.com/codex/app-server).

## Architettura proposta

Il percorso previsto è:

**Interfaccia titolare → backend autenticato → processo Codex App Server → checkout del progetto.**

Il backend gestirà il processo persistente, le sessioni, la trasmissione degli eventi e le risposte alle richieste del runtime. L'interfaccia presenterà lo stato operativo e i controlli necessari. Il metodo di autenticazione di Codex sarà scelto verificando le possibilità del runtime e dell'account utilizzati; non si assume che l'accesso al sito autorizzi automaticamente l'uso di modelli o strumenti.

Le credenziali resteranno nel contesto backend. Il collegamento remoto richiederà controllo degli accessi e associazione di ogni lavoro al relativo utente e progetto. La conservazione della cronologia di un thread non equivale a un agente sempre in esecuzione: la continuità operativa richiederà gestione del processo e riconnessione.

## Stato documentato

Le evidenze seguenti provengono dalle verifiche registrate nel progetto il 5 ottobre 2026. Non è stata effettuata una nuova prova di inferenza per questo report.

| Elemento | Stato |
| --- | --- |
| Cockpit su `/controller` | Implementato nel codice; contiene funzioni dimostrative |
| Accesso del titolare | Controllo server-side implementato; prova autenticata sul deploy ancora da effettuare |
| Grafica e obiettivo del lavoro | CSS reinserito nel checkout; il form acquisisce il testo inserito |
| Collegamento al runtime locale | Bridge avviato; API: connected=true, mode=read-only e lista thread risponde |
| Esecuzione di un lavoro AI dal controller | Interfaccia ed endpoint presenti; nessun turno o inferenza avviati |
| Eventi e approvazioni runtime nella UI locale | Bridge inoltra eventi e richieste; flusso durante un turno resta da verificare |
| Build e test | Build riuscita; 10 test esistenti superati nella verifica precedente |
| GitHub | Ultimo commit documentato: `a722510`; successiva sincronizzazione da verificare |
| Pubblicazione del controller | Non eseguita; il connector Sites ha restituito `project not found` |
| Skill operativa | `codex-personal-controller` salvata e validata localmente |

La verifica locale ha verificato autenticazione, trasporto RPC, stato e lettura thread. Non ha avviato turni, strumenti o inferenze AI. Il bridge deve restare attivo nel terminale per mantenere la sessione locale.

## Percorso di realizzazione

1. Eseguire un primo turno reale dal cockpit locale e visualizzare delta e stato terminale.
2. Verificare richieste di approvazione e diff durante un turno controllato.
3. Aggiungere ripresa dei thread dopo riavvio e recupero dopo interruzione.
4. Ripristinare accesso al progetto Sites, collegare l'interfaccia pubblicata al bridge tramite canale sicuro e verificare desktop/mobile.

## Criterio di completamento

Considereremo il controller operativo quando il titolare potrà inviare un obiettivo dalla schermata, vedere un turno AI reale sul checkout selezionato, seguire gli eventi, rispondere a un'eventuale richiesta di approvazione, interrompere il lavoro e recuperarne la cronologia dopo una riconnessione.

Le verifiche dovranno dimostrare che gli utenti non autorizzati non possono avviare lavori o leggere sessioni del titolare e che i risultati mostrati corrispondono alle operazioni realmente eseguite.

## Dichiarazione conclusiva

L'intenzione è incorporare Codex App Server nel nostro controller personale per rendere il lavoro degli agenti osservabile, controllabile e riprendibile. Il bridge locale ora si connette al runtime e legge i thread; il turno AI dal controller e la pubblicazione del cockpit restano da completare.
