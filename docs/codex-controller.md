# Controller Codex — percorso di integrazione

Il percorso `/controller` è un cockpit titolare protetto. In questa prima versione visualizza agenti, eventi e gate di approvazione con dati locali di prototipo; non avvia processi e non espone token.

## Collegamento previsto

Il backend controller dovrà avviare `codex app-server --listen stdio://` come processo figlio controllato e parlare con lui tramite JSONL/JSON-RPC. Il browser parlerà solo con il backend autenticato tramite HTTPS/SSE o WebSocket. Per il client personale si verifica prima l'autenticazione supportata dal runtime Codex installato; un eventuale flusso OAuth integrato richiede gestione del rinnovo lato backend.

Sequenza minima:

1. `initialize` con `clientInfo` stabile.
2. `initialized`.
3. `thread/start` e persistenza dell'ID thread.
4. `turn/start` per il lavoro richiesto.
5. rendering di `item/started`, delta e `item/completed`.
6. pausa su richiesta di approvazione; esecuzione solo dopo conferma esplicita.
7. salvataggio del diff e chiusura con `turn/completed`.

Prima di attivare il collegamento reale servono un runtime persistente backend, gestione OAuth/refresh token, allowlist del titolare, audit log e kill switch. Il controller non deve mai ricevere `OPENAI_API_KEY` o token ChatGPT nel browser.

## Verifica locale del 5 ottobre 2026

`scripts/check-codex-app-server.mjs` ha avviato il binario Codex installato, completato initialize/initialized e ricevuto una risposta a thread/list. Il helper termina il processo dopo la prova e non avvia thread, turni, strumenti o inferenza. La prova conferma il trasporto RPC locale, non l'accesso a un modello o il controllo remoto.

Il controller ora include il CSS nel checkout canonico e conserva l'obiettivo inserito nella bozza simulata. Build e dieci test esistenti superati. Il deploy resta non eseguito: Sites risponde project not found per il progetto configurato. Skill operativa locale: `D:/CodexHome/skills/codex-personal-controller/SKILL.md`.
