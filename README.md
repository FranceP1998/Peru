# Perù: il nostro viaggio

Sito statico (HTML, CSS e JavaScript, senza server) pensato per GitHub Pages.

## Pubblicarlo su GitHub

1. Crea un repository e carica `index.html`, `data.js`, `app.js`.
2. Vai in Settings, Pages, scegli il ramo `main` e la cartella `/ (root)`.
3. Dopo un minuto il sito è online all'indirizzo che GitHub ti indica.

## Dove si modifica cosa

- `data.js`: il programma. Orari, descrizioni, costi, esperienze extra. È il posto giusto per sostituire l'Excel: ogni giorno è un blocco, ogni voce ha un orario e un testo. Dopo ogni modifica fai commit: la cronologia di GitHub tiene tutte le versioni.
- Dal sito stesso: data di partenza, persone, aeroporto, orari dei voli e scali, esperienze extra attive, importi, cifre pagate, stato delle prenotazioni, appunti per giorno e nuove esperienze personalizzate.

## Dove restano salvate le modifiche fatte dal sito

Nel browser di chi le fa (localStorage). Non vanno perse se chiudi la pagina. Se cambi telefono o browser, usa "Esporta le modifiche" in fondo alla pagina e "Importa un file" dall'altra parte. Per condividerle in due, vedi la sezione sul salvataggio su Google Drive.

## Cosa non può fare un sito statico

- Leggere i prezzi dai siti delle compagnie aeree, di Cruz del Sur, PeruRail e simili: i siti li bloccano. Per questo ci sono i link ufficiali e campi dove scrivere il prezzo visto, che il sito ricorda per ogni combinazione di bagagli.
- Il cambio (soles e dollari) arriva in automatico da ExchangeRate-API.
- Le date di apertura delle prenotazioni vanno confermate sui siti ufficiali e scritte nella sezione "Da prenotare".

## Importi segnati "stima"

Sono segnaposto miei: pisco, tour in giornata sul Titicaca, ingressi Vinicunca, taxi, guida a Machu Picchu e i 150 € per ciascuno dei quattro trasferimenti privati (i 600 € del tuo Excel divisi in parti uguali). Correggili nella sezione Costi.

## Salvataggio condiviso su Google Drive

Le scelte fatte dal sito (extra, importi, prenotazioni, appunti) si salvano in un file nel tuo Drive tramite uno script Google. Non scade e non va in pausa. Il collegamento è automatico: `config.js` contiene l'indirizzo dello script e un codice, e chiunque apra il sito si collega da solo.

Per rifare la configurazione da capo:
1. Su script.google.com crea un progetto e incolla `Code.gs`.
2. Distribuisci, Nuova distribuzione, App web. Esegui come: te stesso. Chi può accedere: Chiunque.
3. Incolla l'indirizzo dell'app web (finisce con `/exec`) in `config.js`, campo `url`. Il campo `code` è un codice qualsiasi di almeno 16 caratteri.
4. Apri il sito per primo dal tuo computer: i dati di quel dispositivo diventano il salvataggio su Drive.

Nel Drive compare la cartella "Viaggio in Perù (salvataggio)" con il file `viaggio-peru.json`. Lo script accetta un solo codice, il primo che salva. Per cambiarlo, in Apps Script apri Impostazioni progetto e cancella le proprietà `CODICE`, `VERSIONE` e `FILE_ID`. Se modifichi `Code.gs`, pubblica una nuova versione (Distribuisci, Gestisci distribuzioni, modifica, Nuova versione).

Il sito è pubblico: chi conosce l'indirizzo può vedere e modificare il viaggio. Per questo la pagina chiede ai motori di ricerca di non indicizzarla. Non mettere dati sensibili.

## Mappa e altimetria

- Altimetria: due viste, "Pernottamenti" e "Completa" (tutte le tappe con spostamento). Le altitudini sono indicative, e si modificano in `data.js` (campo `stops` di ogni giorno).
- Mappa: ogni spostamento ha il suo mezzo (aereo, auto, bus, treno, barca, a piedi), con la luna per i tragitti di notte. Le strade di auto e bus sono calcolate al volo da OpenStreetMap (servizio pubblico OSRM) e ricordate nel browser. Se non si caricano, la mappa mostra linee dritte e la tabella ha il link a Google Maps per ogni tratto.

## Tempi per gli aeroporti

I minuti in auto da Aosta, da Torino e da Vecchiano sono in `data.js`, nella costante `AIRPORTS` (campo `from`). Non si cambiano dal sito. Sono valori approssimativi: controllali con Google Maps.

## Confronto voli

Nella sezione Voli inserisci, per ogni aeroporto, tutte le offerte che trovi (compagnia, orari di andata e ritorno con scalo, bagagli, prezzo). Il sito le confronta ricalcolando l'intero programma (notti a Lima, giorni in più, pasti) e ti fa scegliere: il volo scelto aggiorna orari, scalo, prezzo e notti a Lima. Finché non scegli, il programma usa orari di esempio.
