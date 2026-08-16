# Piano affiliazione — assistente nautico commerciale

Aggiornato il 16 agosto 2026.

## Posizionamento

L’app non deve presentarsi come un negozio che vende direttamente. Il percorso previsto è:

1. l’utente descrive il problema o fotografa un componente;
2. lo Yachting Assistant raccoglie i dati tecnici decisivi;
3. l’assistente propone la categoria o il ricambio compatibile, dichiarando le incertezze;
4. l’utente apre un venditore esterno tramite un collegamento tracciato;
5. ordine, pagamento, spedizione, garanzia e reso restano responsabilità del venditore.

## Programmi verificati

- Amazon Programma Affiliazione Italia: `https://programma-affiliazione.amazon.it/`
- eBay Partner Network Italia: `https://partnernetwork.ebay.it/our-program`

La vetrina consulta inoltre i cataloghi ufficiali di Motomarine, Forniture Nautiche Italiane (FNI), TREM, Osculati, Foresti & Suardi, SVB e Marine Hardware. Non è stato verificato un programma affiliato pubblico ufficiale per questi fornitori nella ricerca preliminare. Prima di trasformare i loro collegamenti in affiliati occorre chiedere direttamente alle aziende o verificare la loro presenza su una rete di affiliazione.

## Integrazione tecnica già predisposta

Le schede della vetrina non puntano direttamente al venditore ma a `/api/out?id=...`. Il server accetta un’unica variabile:

`AFFILIATE_LINK_OVERRIDES_JSON`

Il valore deve essere un oggetto JSON che associa l’identificativo della categoria al link completo generato dal programma di affiliazione. Esempio da non pubblicare finché l’account non è approvato:

`{"pumps":"https://www.amazon.it/...link-generato...","engines":"https://www.ebay.it/...link-generato..."}`

Sono consentite soltanto destinazioni HTTPS verso SVB, Osculati, Motomarine, FNI, TREM, Foresti & Suardi, Marine Hardware, Amazon Italia ed eBay Italia. Un dominio diverso viene rifiutato e il collegamento normale resta operativo.

## Obblighi prima dell’attivazione

- Ottenere l’approvazione del programma e usare esclusivamente i link generati dall’account approvato.
- Sostituire l’avviso “nessuna commissione” con un’avvertenza ben visibile sui link affiliati.
- Usare `rel="sponsored"` per i collegamenti affiliati.
- Non mostrare prezzi Amazon copiati manualmente o non aggiornati; utilizzare solo strumenti e API consentiti dalle condizioni del programma.
- Non presentare il venditore come sponsor o partner ufficiale senza autorizzazione scritta.
- Conservare report, pagamenti e documentazione fiscale delle commissioni.
- Verificare con commercialista e consulente privacy gli adempimenti applicabili al gestore.
