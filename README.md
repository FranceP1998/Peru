# Perù: il nostro viaggio

Sito statico (HTML, CSS e JavaScript, senza server) pensato per GitHub Pages.

## Pubblicarlo su GitHub

1. Crea un repository e carica `index.html`, `data.js`, `app.js`.
2. Vai in Settings, Pages, scegli il ramo `main` e la cartella `/ (root)`.
3. Dopo un minuto il sito è online all'indirizzo che GitHub ti indica.

## Dove si modifica cosa

- `data.js`: il programma. Orari, descrizioni, costi, esperienze extra. È il posto giusto per sostituire l'Excel: ogni giorno è un blocco, ogni voce ha un orario e un testo. Dopo ogni modifica fai commit: la cronologia di GitHub tiene tutte le versioni.
- Dal sito stesso: data di partenza, persone, aeroporto, orari dei voli, esperienze extra attive, importi, cifre pagate, stato delle prenotazioni, appunti per giorno e nuove esperienze personalizzate.

## Dove restano salvate le modifiche fatte dal sito

Nel browser di chi le fa (localStorage). Non vanno perse se chiudi la pagina. Se cambi telefono o browser, usa "Esporta le modifiche" in fondo alla pagina e "Importa un file" dall'altra parte. Per vedere le stesse modifiche in tempo reale in due, serve un piccolo servizio online (per esempio Firebase o Supabase): è un passo successivo.

## Cosa non può fare un sito statico

- Leggere i prezzi dai siti delle compagnie aeree, di Cruz del Sur, PeruRail e simili: i siti li bloccano. Per questo ci sono i link ufficiali e campi dove scrivere il prezzo visto, che il sito ricorda per ogni combinazione di bagagli.
- Leggere il cambio da Il Sole 24 Ore: non c'è un servizio pubblico. Il cambio automatico arriva da ExchangeRate-API e si può sostituire a mano.
- Le date di apertura delle prenotazioni vanno confermate sui siti ufficiali e scritte nella sezione "Da prenotare".

## Importi segnati "stima"

Sono segnaposto miei: pisco, tour in giornata sul Titicaca, ingressi Vinicunca, taxi, guida a Machu Picchu e i 150 € per ciascuno dei quattro trasferimenti privati (i 600 € del tuo Excel divisi in parti uguali). Correggili nella sezione Costi.

## Salvataggio condiviso con Supabase

1. In Supabase apri SQL Editor, incolla il contenuto di `supabase.sql` e premi Run.
2. `config.js` contiene l'indirizzo del progetto e la chiave pubblica (publishable).
3. Apri il sito, in fondo alla pagina premi "Crea un nuovo codice", poi "Copia il link da condividere" e mandalo all'altra persona.
4. I due dispositivi si aggiornano da soli ogni pochi secondi. Se due persone salvano insieme, vince la versione già salvata e il sito avvisa.

Chi ha il link può modificare il viaggio: non pubblicarlo. Nel progetto Supabase non mettere dati sensibili.
Il piano gratuito mette in pausa il progetto dopo una settimana senza attività: si riattiva con un clic dalla dashboard e i dati restano.
