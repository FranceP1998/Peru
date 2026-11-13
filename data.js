/* =====================================================================
   DATI DEL VIAGGIO IN PERÙ
   Questo file è la "fonte di verità" del programma. Si modifica a mano:
   orari, descrizioni, costi, esperienze extra. Il sito (app.js) lo legge.
   Importi: `pen` = soles, `eur` = euro. scope 'pp' = a testa, 'sh' = in due.
   ===================================================================== */

const toMin = s => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const fmt = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const it = (id, t, x, k = 'visit') => ({ id, t: t || '', x, k });   // k: move | visit | food | sleep | tip

const MEAL_EUR = 28;   // 420 € di pasti / 15 giorni, come nel tuo Excel (a testa, per giorno)

const REGIONS = {
  viaggio:  { name: 'In viaggio',           color: '#6B7480' },
  lima:     { name: 'Lima',                 color: '#4F6A86' },
  costa:    { name: 'Costa e deserto',      color: '#C48A1F' },
  sud:      { name: 'Arequipa e Colca',     color: '#9B3F55' },
  titicaca: { name: 'Lago Titicaca',        color: '#1D7390' },
  cusco:    { name: 'Cusco e Valle Sacra',  color: '#3F7F5B' }
};

// Origini di partenza. Per Pisa si parte sempre da Vecchiano.
const ORIGINS = {
  Aosta:  { name: 'Aosta' },
  Torino: { name: 'Torino' }
};
// Minuti in auto dalla città di partenza all'aeroporto. Valori approssimativi da controllare con Google Maps:
// si cambiano solo qui, non dal sito.
const AIRPORTS = {
  TRN: { code: 'TRN', name: 'Torino Caselle',        lat: 45.2008, lng: 7.6496, from: { Aosta: 80,  Torino: 25 } },
  LIN: { code: 'LIN', name: 'Milano Linate',         lat: 45.4451, lng: 9.2767, from: { Aosta: 120, Torino: 105 } },
  MXP: { code: 'MXP', name: 'Milano Malpensa',       lat: 45.6306, lng: 8.7281, from: { Aosta: 110, Torino: 85 } },
  BGY: { code: 'BGY', name: 'Bergamo Orio al Serio', lat: 45.6739, lng: 9.7042, from: { Aosta: 140, Torino: 125 } },
  PSA: { code: 'PSA', name: 'Pisa Galilei',          lat: 43.6839, lng: 10.3927, from: { 'Vecchiano (PI)': 20 }, fixedOrigin: 'Vecchiano (PI)' }
};

const SITES = {
  cruz:  { name: 'Cruz del Sur',  url: 'https://www.cruzdelsur.com.pe' },
  inka:  { name: 'Inka Express',  url: 'https://www.inkaexpress.com' },
  mer:   { name: 'Turismo Mer',   url: 'https://turismomer.com' },
  rail:  { name: 'PeruRail',      url: 'https://www.perurail.com' },
  mp:    { name: 'Machu Picchu (biglietti ufficiali)', url: 'https://tuboleto.cultura.pe' }
};

const AIRLINES_INTL = [
  { id: 'iberia',  name: 'Iberia',      url: 'https://www.iberia.com' },
  { id: 'aeu',     name: 'Air Europa',  url: 'https://www.aireuropa.com' },
  { id: 'latam',   name: 'LATAM',       url: 'https://www.latamairlines.com' },
  { id: 'ita',     name: 'ITA Airways', url: 'https://www.ita-airways.com' },
  { id: 'klm',     name: 'KLM',         url: 'https://www.klm.it' },
  { id: 'af',      name: 'Air France',  url: 'https://wwws.airfrance.it' }
];
const AIRLINES_DOM = [
  { id: 'latam',  name: 'LATAM',        url: 'https://www.latamairlines.com' },
  { id: 'sky',    name: 'Sky Airline',  url: 'https://www.skyairline.com' },
  { id: 'jet',    name: 'JetSMART',     url: 'https://jetsmart.com' }
];


/* ---- Luoghi (coordinate approssimative, per la mappa) e tragitti ---- */
const PLACE = {
  'Aeroporto di Lima (LIM)': [-12.0219, -77.1143], 'Hotel a Lima': [-12.1219, -77.0297], 'Terminal Cruz del Sur': [-12.0885, -77.0160],
  'Lima': [-12.0464, -77.0428], 'Paracas': [-13.8333, -76.25], 'Isole Ballestas': [-13.7333, -76.4], 'Ica': [-14.0678, -75.7286],
  'Huacachina': [-14.0875, -75.7633], 'Arequipa': [-16.409, -71.5375], 'Mirador de los Andes': [-15.8039, -71.4272],
  'Chivay': [-15.6372, -71.6019], 'Cruz del Cóndor': [-15.6097, -71.8864], 'Puno': [-15.8402, -70.0219],
  'Isole Uros': [-15.8228, -69.9689], 'Taquile': [-15.7667, -69.6833], 'Amantaní': [-15.6667, -69.7],
  'Pucará': [-15.0357, -70.3689], 'Abra La Raya': [-14.48, -70.97], 'Sicuani': [-14.2667, -71.2333], 'Raqchi': [-14.4667, -71.4667],
  'Andahuaylillas': [-13.6833, -71.6667], 'Cusco': [-13.5319, -71.9675], 'Aeroporto di Cusco (CUZ)': [-13.5357, -71.9388],
  'Pisac': [-13.4208, -71.8486], 'Moray': [-13.3292, -72.1953], 'Saline di Maras': [-13.3125, -72.1561],
  'Ollantaytambo': [-13.2583, -72.2639], 'Aguas Calientes': [-13.1547, -72.5258], 'Machu Picchu': [-13.1631, -72.545],
  'Quesiuno (inizio trekking)': [-13.885, -71.31], 'Vinicunca': [-13.8697, -71.3033]
};
// m: plane | car | bus | train | boat | foot. night: tragitto di notte. via: tappe intermedie lungo la strada. far: non disegnare (volo intercontinentale)
const leg = (a, b, m, t, o = {}) => ({ a, b, m, t, ...o });
const homeAp = D => D.ap ? { n: `${D.ap.name} (${D.ap.code})`, ll: [D.ap.lat, D.ap.lng] } : { n: 'Italia', ll: [45.46, 9.19] };
const MODES = { plane: 'Aereo', car: 'Auto o taxi', bus: 'Bus', train: 'Treno', boat: 'Barca', foot: 'A piedi' };

/* ---- Voci di costo generali (non legate a un giorno) ---- */
function GENERAL(D) {
  return [
    { id: 'volo_intl', label: 'Voli internazionali A/R (bagagli e posto inclusi)', eur: 900, scope: 'pp', cat: 'Voli',
      book: { site: 'Sito della compagnia aerea', url: '', rec: 150,
              open: 'Le compagnie aprono le vendite circa 11 mesi prima (indicativo): controlla sul sito della compagnia.' } },
    { id: 'esim', label: 'eSIM Saily 10 GB', eur: 26.49, scope: 'pp', cat: 'Altro' },
    { id: 'parcheggio', label: 'Parcheggio in aeroporto', eur: 0, scope: 'sh', cat: 'Trasporti', tbd: true,
      book: { site: 'Sito dell’aeroporto', url: '', rec: 60, open: 'Molti aeroporti permettono di prenotare il parcheggio online: controlla sul sito dell’aeroporto di partenza.' } },
    { id: 'extra', label: 'Extra e imprevisti', eur: 100, scope: 'pp', cat: 'Altro' }
  ];
}

/* ---- Giorni del programma ---------------------------------------------
   Ogni blocco è un giorno. `show` decide se compare (dipende da opzioni ed
   esperienze extra). `make` costruisce descrizione, orari e costi.
   ----------------------------------------------------------------------- */
const BLOCKS = [

  { id: 'partenza', region: 'viaggio',
    make: D => {
      if (!D.ap) return {
        title: 'Partenza dall’Italia', short: 'Volo', place: 'In volo', alt: null, ll: [-12.0464, -77.0428],
        desc: ['Il volo intercontinentale non è ancora scelto: nella sezione Voli confronti gli aeroporti e, quando scegli, qui compaiono aeroporto, orari e scalo.',
               'Lima è 7 ore indietro rispetto all’Italia con l’ora legale (6 con l’ora solare).'],
        items: [it('fly', '', 'Volo per Lima: aeroporto e orari da definire nella sezione Voli', 'move'), it('night', '', 'Notte in volo', 'sleep')],
        costs: [], legs: [leg(homeAp(D), 'Aeroporto di Lima (LIM)', 'plane', 'da definire', { far: true })], stops: []
      };
      const f = D.f, ap = D.ap, dep = toMin(f.out), arr = dep - 180, home = arr - D.drive;
      const same = f.dayOff === 0;
      const la = f.layArr ? toMin(f.layArr) : null, ld = f.layDep ? toMin(f.layDep) : null;
      const layGap = la != null && ld != null ? ((ld - la) + 1440) % 1440 : null;
      const layTxt = layGap != null ? ` (scalo di ${Math.floor(layGap / 60)} h ${String(layGap % 60).padStart(2, '0')})` : '';
      const items = [
        it('home', fmt(home), `Partenza da ${D.originName} verso ${ap.name} (${ap.code})`, 'move'),
        it('apt', fmt(arr), `Arrivo in aeroporto a ${ap.name}: check-in e consegna bagagli`, 'move'),
        it('fly', f.out, `Decollo ${ap.code} → ${f.layover || 'Lima (LIM)'}`, 'move'),
        f.layover ? it('layArr', f.layArr, `Arrivo a ${f.layover} per lo scalo${layTxt}`, 'move') : null,
        f.layover ? it('layDep', f.layDep, `Decollo ${f.layover} → Lima (LIM)${la != null && ld != null && ld < la ? ' (giorno dopo)' : ''}`, 'move') : null
      ];
      const costs = [];
      if (same) {
        items.push(it('land', f.land, 'Atterraggio a Lima (LIM): controllo passaporti e ritiro bagagli', 'move'));
        items.push(it('taxi0', '', 'Taxi verso l’hotel di Lima (Miraflores)', 'move'));
        items.push(it('sleep0', '', 'Pernottamento a Lima', 'sleep'));
        costs.push({ id: 'taxi_lim', label: 'Taxi aeroporto → hotel a Lima', pen: 100, scope: 'sh', cat: 'Trasporti' });
        costs.push({ id: 'hotel_lima', label: 'Hotel Lima, 1 notte', eur: 90, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } });
      } else {
        items.push(it('night', '', 'Notte in volo', 'sleep'));
      }
      return {
        title: same ? 'Partenza e arrivo a Lima' : 'Partenza dall’Italia',
        short: 'Volo', place: same ? 'Lima' : 'In volo', alt: same ? 150 : null, ll: [-12.0464, -77.0428],
        desc: [
          `Si parte da ${D.originName} verso ${ap.name}. ${same ? 'Il volo atterra a Lima in serata, quindi la prima notte è a Lima.' : 'Il volo è di notte: si arriva a Lima la mattina dopo.'} Lima è 7 ore indietro rispetto all’Italia con l’ora legale (6 con l’ora solare).`,
          'Consiglio: tieni nel bagaglio a mano documenti, una giacca e una scorta di contanti in euro per il primo cambio.'
        ],
        items, costs,
        legs: [leg({ n: `${ap.name} (${ap.code})`, ll: [ap.lat, ap.lng] }, 'Aeroporto di Lima (LIM)', 'plane', f.layover ? `con scalo a ${f.layover}` : 'diretto', { far: true })].concat(same ? [leg('Aeroporto di Lima (LIM)', 'Hotel a Lima', 'car', '45 min / 1 h 15')] : []),
        stops: same ? [['Lima', 150]] : []
      };
    } },

  { id: 'lima_notte', region: 'lima',
    show: D => D.limaStart && D.f.dayOff === 1,
    make: D => {
      const f = D.f, land = D.land;
      return {
        title: 'Arrivo a Lima e notte in città', short: 'Lima', place: 'Lima', alt: 150, ll: [-12.1219, -77.0297],
        desc: [
          'Atterrando troppo tardi per prendere con calma l’ultimo bus per Paracas, la scelta più serena è dormire a Lima e ripartire il mattino dopo senza fretta.',
          'Zona consigliata: Miraflores o Barranco, vicine al mare, con ristoranti e molto più tranquille del centro storico.'
        ],
        items: [
          it('land', f.land, 'Atterraggio a Lima (LIM)', 'move'),
          it('imm', fmt(land + D.c.imm), 'Controllo passaporti, ritiro bagagli, cambio e acquisto SIM', 'move'),
          it('taxi', fmt(land + D.c.imm + 30), 'Taxi verso l’hotel (Miraflores)', 'move'),
          it('checkin_l', '', 'Check-in o deposito bagagli e riposo', 'sleep'),
          it('lima_walk', '', 'Pomeriggio libero: lungomare di Miraflores, parco dell’Amore, Barranco', 'tip'),
          it('lima_dinner', '', 'Cena libera (ceviche a Lima è un classico)', 'food'),
          it('sleep_l', '', 'Pernottamento a Lima', 'sleep')
        ],
        costs: [
          { id: 'taxi_lim', label: 'Taxi aeroporto → hotel a Lima', pen: 100, scope: 'sh', cat: 'Trasporti' },
          { id: 'hotel_lima', label: 'Hotel Lima, 1 notte', eur: 90, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
        ],
        legs: [leg('Aeroporto di Lima (LIM)', 'Hotel a Lima', 'car', '45 min / 1 h 15')],
        stops: [['Lima', 150]]
      };
    } },

  { id: 'lima_paracas', region: 'costa',
    show: D => D.limaStart,
    make: D => {
      const b = D.bus2;
      return {
        title: 'Da Lima a Paracas', short: 'Paracas', place: 'Paracas', alt: 5, ll: [-13.8333, -76.25],
        desc: [
          'Mattina con calma e poi bus Cruz del Sur dal terminal di Javier Prado verso Paracas: circa 3 ore e mezza di viaggio lungo la costa del Pacifico.',
          'Paracas è un piccolo villaggio di pescatori all’ingresso della riserva nazionale. Pomeriggio e sera sono liberi: passeggiata sul lungomare, eventuale degustazione di pisco e una cena a base di pesce prima di salire in montagna.'
        ],
        items: [
          it('wake', fmt(b - 150), 'Sveglia e colazione con calma', 'food'),
          it('checkout', fmt(b - 105), 'Check-out e taxi verso il terminal Cruz del Sur (Javier Prado)', 'move'),
          it('bus', fmt(b), 'Partenza bus Cruz del Sur per Paracas', 'move'),
          it('arrive', fmt(b + 210), 'Arrivo a Paracas', 'move'),
          it('checkin', '', 'Check-in in hotel e tempo libero', 'sleep'),
          it('walk', '', 'Passeggiata sul lungomare', 'tip'),
          it('dinner', '', 'Cena di pesce: ceviche e altri piatti tipici della costa peruviana', 'tip'),
          it('sleep', '', 'Pernottamento a Paracas', 'sleep')
        ],
        costs: [
          { id: 'taxi_term', label: 'Taxi hotel → terminal Cruz del Sur (stima)', pen: 40, scope: 'sh', cat: 'Trasporti', est: true },
          { id: 'bus_lp', label: 'Bus Cruz del Sur Lima → Paracas', pen: 60, scope: 'pp', cat: 'Trasporti', note: '3 h 30',
            book: { site: SITES.cruz.name, url: SITES.cruz.url, rec: 30, open: 'Verifica sul sito la finestra di vendita online della tratta.' } },
          { id: 'hotel_paracas', label: 'Hotel Paracas, 1 notte', eur: 80, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
        ],
        legs: [leg('Hotel a Lima', 'Terminal Cruz del Sur', 'car', '20 / 40 min'), leg('Terminal Cruz del Sur', 'Paracas', 'bus', '3 h 30')],
        stops: [['Lima', 150], ['Paracas', 5]]
      };
    } },

  { id: 'arrivo_paracas', region: 'costa',
    show: D => !D.limaStart,
    make: D => {
      const f = D.f, land = D.land, b = D.busUse;
      return {
        title: 'Arrivo a Lima e bus per Paracas', short: 'Paracas', place: 'Paracas', alt: 5, ll: [-13.8333, -76.25],
        desc: [
          'Dall’aeroporto si va dritti al terminal Cruz del Sur di Javier Prado e si prende il bus per Paracas (circa 3 ore e mezza). Lima, per questo viaggio, si lascia da parte: al massimo si recupera l’ultimo giorno.',
          'Paracas è un piccolo villaggio di pescatori all’ingresso della riserva nazionale. Pomeriggio e sera liberi: passeggiata sul lungomare, eventuale degustazione di pisco e una cena a base di pesce prima di salire in montagna.'
        ],
        items: [
          it('land', f.land, 'Atterraggio a Lima (LIM)', 'move'),
          it('imm', fmt(land + D.c.imm), 'Partenza dall’aeroporto dopo passaporti, bagagli, cambio e SIM', 'move'),
          it('term', fmt(land + D.c.imm + D.c.taxi), 'Arrivo al terminal degli autobus di Javier Prado', 'move'),
          it('bus', fmt(b), 'Partenza bus Cruz del Sur per Paracas', 'move'),
          it('arrive', fmt(b + 210), 'Arrivo a Paracas', 'move'),
          it('checkin', '', 'Check-in in hotel e tempo libero', 'sleep'),
          it('walk', '', 'Passeggiata sul lungomare', 'tip'),
          it('dinner', '', 'Cena di pesce: ceviche e altri piatti tipici della costa peruviana', 'tip'),
          it('sleep', '', 'Pernottamento a Paracas', 'sleep')
        ],
        costs: [
          { id: 'taxi_lim', label: 'Taxi aeroporto → terminal a Lima', pen: 100, scope: 'sh', cat: 'Trasporti' },
          { id: 'bus_lp', label: 'Bus Cruz del Sur Lima → Paracas', pen: 60, scope: 'pp', cat: 'Trasporti', note: '3 h 30',
            book: { site: SITES.cruz.name, url: SITES.cruz.url, rec: 30, open: 'Verifica sul sito la finestra di vendita online della tratta.' } },
          { id: 'hotel_paracas', label: 'Hotel Paracas, 1 notte', eur: 80, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
        ],
        legs: [leg('Aeroporto di Lima (LIM)', 'Terminal Cruz del Sur', 'car', `${D.c.taxi} min`), leg('Terminal Cruz del Sur', 'Paracas', 'bus', '3 h 30')],
        stops: [['Lima', 150], ['Paracas', 5]]
      };
    } },

  { id: 'ballestas', region: 'costa',
    make: D => ({
      title: 'Isole Ballestas, Huacachina e bus notturno', short: 'Bus', place: 'Bus notturno verso Arequipa', alt: null, ll: [-14.0678, -75.7286],
      pts: [['Isole Ballestas', -13.7333, -76.4], ['Huacachina', -14.0875, -75.7633]],
      desc: [
        'Alle 8:00, primo orario disponibile e il migliore per luce e fauna, si parte in barca dal molo di Paracas verso le Isole Ballestas. Sono due ore di escursione tra leoni marini, pinguini di Humboldt e migliaia di uccelli marini. Non si sbarca. Dalla barca si vede in genere anche il Candelabro, il grande geoglifo sul fianco della penisola.',
        'Poi bus per Ica, bagagli nel locker della stazione e pomeriggio all’oasi di Huacachina, tra dune alte decine di metri: buggy e sandboarding al tramonto. In serata si torna a Ica e si sale sul bus notturno per Arequipa.'
      ],
      items: [
        it('wake', '06:00', 'Sveglia e colazione', 'food'),
        it('pier', '07:30', 'Arrivo al molo di Paracas', 'move'),
        it('boat', '08:00', 'Partenza escursione alle Isole Ballestas', 'visit'),
        it('back', '10:00', 'Rientro al molo', 'move'),
        it('bags', '10:30', 'Ritiro bagagli in hotel', 'move'),
        it('busst', '11:00', 'Arrivo alla stazione bus di Paracas', 'move'),
        it('bus1', '11:30', 'Partenza bus Cruz del Sur per Ica', 'move'),
        it('ica', '12:40', 'Arrivo a Ica', 'move'),
        it('locker', '', 'Deposito bagagli nel locker della stazione bus', 'move'),
        it('ica_lunch', '', 'Pranzo a Ica', 'food'),
        it('station', '20:30', 'Arrivo alla stazione dei bus di Ica e ritiro bagagli', 'move'),
        it('night_bus', '21:20', 'Partenza bus Cruz del Sur notturno per Arequipa', 'move')
      ],
      costs: [
        { id: 'ballestas', label: 'Escursione Isole Ballestas (base, tassa turistica, uso molo)', pen: 56, scope: 'pp', cat: 'Attività', note: '2 ore',
          book: { site: 'Operatore locale / sito dell’agenzia', url: '', rec: 14, open: 'Si può prenotare online o in loco: meglio fissare l’orario delle 8:00.' } },
        { id: 'bus_pi', label: 'Bus Cruz del Sur Paracas → Ica', pen: 25, scope: 'pp', cat: 'Trasporti', note: '1 ora',
          book: { site: SITES.cruz.name, url: SITES.cruz.url, rec: 30, open: 'Verifica sul sito la finestra di vendita online della tratta.' } },
        { id: 'bus_ia', label: 'Bus notturno 1ª classe Ica → Arequipa', pen: 185, scope: 'pp', cat: 'Trasporti', note: 'circa 12 ore',
          book: { site: SITES.cruz.name, url: SITES.cruz.url, rec: 30, open: 'Verifica sul sito la finestra di vendita online della tratta.' } }
      ],
      legs: [leg('Paracas', 'Isole Ballestas', 'boat', '2 ore (andata e ritorno)'), leg('Paracas', 'Ica', 'bus', '1 h 10')]
        .concat(D.ex.huaca_A || D.ex.huaca_B ? [leg('Ica', 'Huacachina', 'car', '15 min (andata e ritorno)')] : [])
        .concat([leg('Ica', 'Arequipa', 'bus', 'circa 11 h 40', { night: true })]),
      stops: [['Paracas', 5], ['Isole Ballestas', 0], ['Paracas', 5], ['Ica', 406]].concat(D.ex.huaca_A || D.ex.huaca_B ? [['Huacachina', 410], ['Ica', 406]] : [])
    }) },

  { id: 'arequipa', region: 'sud',
    make: D => ({
      title: 'Arequipa e il Monastero di Santa Catalina', short: 'Arequipa', place: 'Arequipa', alt: 2335, ll: [-16.409, -71.5375],
      stops: [['Arequipa', 2335]],
      desc: [
        'Si arriva in mattinata con il bus notturno. Arequipa, la “Città Bianca”, ha un centro storico UNESCO costruito in pietra vulcanica chiara e dominato dal vulcano Misti.',
        'Il Monastero di Santa Catalina, fondato nel 1579, è una piccola città dentro la città, con vicoli, patii e celle colorate. Dopo la notte in bus la giornata è tranquilla: serata presto a letto perché l’indomani si parte all’alba.'
      ],
      items: [
        it('arr', '09:00', 'Arrivo ad Arequipa', 'move'),
        it('checkin', '', 'Check-in in hotel e giorno libero', 'sleep'),
        it('catalina', '', 'Visita al Monastero di Santa Catalina', 'visit'),
        it('early', '', 'Sera a letto presto', 'tip'),
        it('sleep', '', 'Pernottamento ad Arequipa', 'sleep')
      ],
      costs: [
        { id: 'catalina', label: 'Monastero di Santa Catalina', pen: 50, scope: 'pp', cat: 'Ingressi' },
        { id: 'hotel_arequipa', label: 'Hotel Arequipa, 1 notte', eur: 60, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ]
    }) },

  { id: 'chivay', region: 'sud',
    make: D => ({
      title: 'Da Arequipa a Chivay, nel Canyon del Colca', short: 'Chivay', place: 'Chivay', alt: 3633, ll: [-15.6372, -71.6019],
      pts: [['Mirador de los Andes (4.910 m)', -15.8, -71.45]],
      peak: { name: 'Mirador de los Andes', alt: 4910 },
      desc: [
        'Si parte presto con auto, autista e guida privati e si sale dolcemente verso l’altopiano, con soste nei villaggi per abituarsi all’altitudine. Il punto più alto è il Mirador de los Andes, intorno ai 4.900 m, con vista sui vulcani.',
        'Chivay sta a circa 3.600 m: nel pomeriggio si riposa. Come attività facoltativa ci sono le terme del paese, ideali dopo la salita.'
      ],
      items: [
        it('wake', '06:00', 'Sveglia e colazione', 'food'),
        it('dep', '07:00', 'Check-out e partenza con mezzo privato e guida', 'move'),
        it('stops', '', 'Trasferimento verso Chivay con diverse soste per acclimatarsi all’altitudine', 'move'),
        it('mirador', '12:00', 'Arrivo al Mirador de los Andes', 'visit'),
        it('mir_dep', '12:45', 'Partenza', 'move'),
        it('arr', '13:30', 'Arrivo a Chivay (Canyon del Colca)', 'move'),
        it('chivay_checkin', '', 'Check-in in hotel', 'sleep'),
        it('free', '', 'Pomeriggio libero per acclimatarsi all’altitudine', 'tip'),
        it('sleep', '', 'Pernottamento a Chivay', 'sleep')
      ],
      costs: [
        { id: 'transfer_chivay', label: 'Auto con autista e guida: Arequipa → Chivay (stima)', eur: 150, scope: 'sh', cat: 'Trasporti', est: true,
          book: { site: 'Agenzia / autista privato', url: '', rec: 60, open: 'Da concordare con l’operatore: chiedi preventivo con largo anticipo.' } },
        { id: 'boleto_colca', label: 'Boleto turistico del Colca', pen: 70, scope: 'pp', cat: 'Ingressi', cash: true,
          book: { site: 'Boleto turistico del Colca (sito ufficiale)', url: '', rec: 0, open: 'Di solito si paga all’ingresso della valle: incolla qui il link ufficiale quando lo hai.' } },
        { id: 'hotel_chivay', label: 'Hotel Chivay, 1 notte', eur: 50, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Arequipa', 'Chivay', 'car', 'circa 6 h 30 con soste', { via: ['Mirador de los Andes'] })],
      stops: [['Arequipa', 2335], ['Mirador de los Andes', 4910], ['Chivay', 3633]]
    }) },

  { id: 'colca_puno', region: 'sud',
    make: D => ({
      title: 'Cruz del Cóndor e trasferimento a Puno', short: 'Puno', place: 'Puno', alt: 3830, ll: [-15.8402, -70.0219],
      pts: [['Cruz del Cóndor', -15.6097, -71.8864]],
      desc: [
        'Sveglia all’alba per essere alla Cruz del Cóndor la mattina presto, quando i condor sfruttano le prime correnti termiche sul canyon, uno dei più profondi del mondo.',
        'Si torna a Chivay con soste nei villaggi, nei miradores e davanti ai terrazzamenti. Dopo pranzo parte il lungo trasferimento verso Puno, sul Lago Titicaca (circa 7 ore con soste).'
      ],
      items: [
        it('wake', '06:00', 'Sveglia e colazione', 'food'),
        it('dep', '07:00', 'Check-out e partenza con mezzo privato e guida', 'move'),
        it('condor', '08:30', 'Arrivo al Mirador Cruz del Cóndor', 'visit'),
        it('c_dep', '09:30', 'Partenza', 'move'),
        it('villages', '', 'Rientro verso Chivay con tappe nei paesini e nei punti panoramici della valle (Mirador de Choquetico, terrazzamenti)', 'visit'),
        it('chivay', '12:00', 'Arrivo a Chivay e pranzo', 'food'),
        it('to_puno', '13:00', 'Partenza per Puno (trasferimento lungo con soste)', 'move'),
        it('puno', '20:00', 'Arrivo a Puno (Lago Titicaca)', 'move'),
        it('checkin', '', 'Check-in in hotel. Serata e cena libere', 'sleep'),
        it('sleep', '', 'Pernottamento a Puno', 'sleep')
      ],
      costs: [
        { id: 'transfer_colca', label: 'Auto con autista e guida: Colca → Puno (stima)', eur: 150, scope: 'sh', cat: 'Trasporti', est: true,
          book: { site: 'Agenzia / autista privato', url: '', rec: 60, open: 'Da concordare con l’operatore: chiedi preventivo con largo anticipo.' } },
        { id: 'hotel_puno_1', label: 'Hotel Puno, 1 notte', eur: 80, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Chivay', 'Cruz del Cóndor', 'car', 'circa 1 h 30 (andata e ritorno)'), leg('Chivay', 'Puno', 'car', 'circa 7 ore con soste')],
      stops: [['Chivay', 3633], ['Cruz del Cóndor', 3700], ['Chivay', 3633], ['Puno', 3830]]
    }) },

  { id: 'titicaca_giorno', region: 'titicaca',
    show: D => !D.ex.amantani,
    make: D => ({
      title: 'Isole Uros e Taquile in giornata', short: 'Puno', place: 'Puno', alt: 3830, ll: [-15.8402, -70.0219],
      pts: [['Isole Uros', -15.8228, -69.9689], ['Taquile', -15.7667, -69.6833]],
      desc: [
        'Giornata in barca dal porto di Puno: prima le Isole Uros, galleggianti e costruite con la totora, la canna del lago; poi Taquile, con la sua tradizione tessile riconosciuta dall’UNESCO.',
        'Si rientra a Puno nel pomeriggio, con la sera libera. Questa è la versione “leggera”: per dormire in un’isola e vedere il tramonto dal centro del lago attiva l’esperienza extra con notte ad Amantaní.'
      ],
      items: [
        it('wake', '07:00', 'Sveglia e colazione', 'food'),
        it('pick', '08:00', 'Ritiro in hotel e trasferimento al porto', 'move'),
        it('uros', '', 'Visita alle Isole Uros in barca', 'visit'),
        it('taquile', '', 'Arrivo a Taquile e visita dell’isola con resti inca', 'visit'),
        it('lunch', '', 'Pranzo sull’isola', 'food'),
        it('back', '17:30', 'Rientro a Puno', 'move'),
        it('sleep', '', 'Serata libera e pernottamento a Puno', 'sleep')
      ],
      costs: [
        { id: 'tour_titicaca_day', label: 'Tour in giornata Uros e Taquile (stima)', pen: 130, scope: 'pp', cat: 'Attività', est: true,
          book: { site: 'GetYourGuide / agenzia locale', url: '', rec: 30, open: 'Prenotabile online con cancellazione gratuita.' } },
        { id: 'hotel_puno_2', label: 'Hotel Puno, 1 notte', eur: 80, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Puno', 'Isole Uros', 'boat', 'circa 1 h'), leg('Isole Uros', 'Taquile', 'boat', 'circa 2 h'), leg('Taquile', 'Puno', 'boat', 'circa 3 h')],
      stops: [['Puno', 3830], ['Isole Uros', 3810], ['Taquile', 3950], ['Puno', 3830]]
    }) },

  { id: 'amantani_1', region: 'titicaca',
    show: D => D.ex.amantani,
    make: D => ({
      title: 'Tour sul Titicaca: Uros e notte ad Amantaní', short: 'Amantaní', place: 'Isola di Amantaní', alt: 4000, ll: [-15.6667, -69.7],
      pts: [['Isole Uros', -15.8228, -69.9689]],
      desc: [
        'Si lasciano i bagagli grandi in hotel e ci vengono a prendere per il tour di due giorni. Prima tappa le Isole Uros, poi barca fino ad Amantaní, dove si pranza e si dorme da una famiglia locale.',
        'Dalla cima dell’isola, vicino al santuario di Pachatata, si vede il tramonto dal centro del lago. La sistemazione è semplice (spesso senza acqua corrente): è parte dell’esperienza.'
      ],
      items: [
        it('wake', '06:00', 'Sveglia e colazione', 'food'),
        it('checkout', '07:30', 'Check-out e deposito bagagli in hotel', 'move'),
        it('tour', '', 'Partenza tour di 2 giorni sul Lago Titicaca: vengono a prenderci in hotel', 'move'),
        it('uros', '', 'Visita alle Isole Uros in barca', 'visit'),
        it('boat', '', 'Trasferimento in barca all’isola di Amantaní', 'move'),
        it('lunch', '', 'Pranzo presso la famiglia locale (incluso)', 'food'),
        it('pacha', '', 'Visita al santuario di Pachatata', 'visit'),
        it('sunset', '', 'Tramonto dalla cima dell’isola', 'visit'),
        it('sleep', '', 'Pernottamento in casa della famiglia locale', 'sleep')
      ],
      costs: [
        { id: 'tour_titicaca_2d', label: 'Tour di 2 giorni sul Titicaca con notte ad Amantaní (GetYourGuide)', eur: 60, scope: 'pp', cat: 'Attività',
          book: { site: 'GetYourGuide', url: 'https://www.getyourguide.it', rec: 30, open: 'Prenotabile online con cancellazione gratuita.' } }
      ],
      legs: [leg('Puno', 'Isole Uros', 'boat', 'circa 1 h'), leg('Isole Uros', 'Amantaní', 'boat', 'circa 3 h')],
      stops: [['Puno', 3830], ['Isole Uros', 3810], ['Amantaní', 4000]]
    }) },

  { id: 'amantani_2', region: 'titicaca',
    show: D => D.ex.amantani,
    make: D => ({
      title: 'Taquile e rientro a Puno', short: 'Puno', place: 'Puno', alt: 3830, ll: [-15.8402, -70.0219],
      pts: [['Taquile', -15.7667, -69.6833]],
      desc: [
        'Colazione dalla famiglia e barca verso Taquile: visita dell’isola con i resti inca, le tecniche agricole e l’artigianato tessile.',
        'Pranzo non incluso. Rientro a Puno nel tardo pomeriggio e accompagnamento in hotel.'
      ],
      items: [
        it('wake', '07:00', 'Sveglia e colazione', 'food'),
        it('taquile', '', 'Partenza per l’isola di Taquile', 'move'),
        it('visit', '', 'Visita dell’isola con resti inca', 'visit'),
        it('craft', '', 'Presentazione delle tecniche agricole e artigianali dell’isola', 'visit'),
        it('lunch', '', 'Pranzo (non incluso)', 'food'),
        it('back', '18:00', 'Rientro a Puno e accompagnamento in hotel', 'move'),
        it('checkin', '', 'Check-in in hotel. Serata e cena libere', 'sleep'),
        it('sleep', '', 'Pernottamento a Puno', 'sleep')
      ],
      costs: [
        { id: 'hotel_puno_2', label: 'Hotel Puno, 1 notte', eur: 80, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Amantaní', 'Taquile', 'boat', 'circa 1 h 30'), leg('Taquile', 'Puno', 'boat', 'circa 3 h')],
      stops: [['Amantaní', 4000], ['Taquile', 3950], ['Puno', 3830]]
    }) },

  { id: 'ruta_sol', region: 'titicaca',
    make: D => ({
      title: 'Da Puno a Cusco sulla Ruta del Sol', short: 'Cusco', place: 'Cusco', alt: 3399, ll: [-13.5319, -71.9675],
      pts: [['Pucará', -15.0333, -70.3667], ['Abra La Raya (4.338 m)', -14.4833, -71.0], ['Raqchi', -14.4667, -71.4667], ['Andahuaylillas', -13.6833, -71.6667]],
      peak: { name: 'Abra La Raya', alt: 4338 },
      desc: [
        'Bus turistico (Inka Express o Turismo Mer) con soste guidate lungo la Ruta del Sol, la strada che attraversa l’altopiano da Puno a Cusco. Si parte presto dal terminal e si arriva a Cusco nel tardo pomeriggio.',
        'Tappe: Pucará, Abra La Raya (4.338 m, il punto più alto del percorso), il pranzo a Sicuani, il tempio di Raqchi dedicato a Wiracocha e la chiesa di Andahuaylillas, detta la “Cappella Sistina delle Ande”.'
      ],
      items: [
        it('wake', '04:40', 'Sveglia', 'food'),
        it('co', '05:10', 'Check-out e colazione', 'food'),
        it('dep', '05:40', 'Partenza', 'move'),
        it('term', '05:55', 'Arrivo al terminal bus di Puno', 'move'),
        it('bus', '06:10', 'Partenza del bus turistico sulla Ruta del Sol', 'move'),
        it('pucara', '08:50', 'Arrivo a Pucará', 'visit'),
        it('pu_dep', '09:20', 'Partenza', 'move'),
        it('raya', '11:00', 'Arrivo ad Abra La Raya', 'visit'),
        it('ra_dep', '11:10', 'Partenza', 'move'),
        it('sicuani', '11:35', 'Sosta pranzo a Sicuani', 'food'),
        it('si_dep', '12:35', 'Partenza', 'move'),
        it('raqchi', '13:00', 'Arrivo a Raqchi', 'visit'),
        it('rq_dep', '13:30', 'Partenza', 'move'),
        it('andahua', '15:30', 'Arrivo ad Andahuaylillas', 'visit'),
        it('an_dep', '16:00', 'Partenza', 'move'),
        it('cusco', '17:30', 'Arrivo a Cusco', 'move'),
        it('checkin', '', 'Check-in in hotel. Serata e cena libere', 'sleep'),
        it('sleep', '', 'Pernottamento a Cusco', 'sleep')
      ],
      costs: [
        { id: 'bus_ruta', label: 'Bus turistico Puno → Cusco con fermate (Inka Express o Turismo Mer)', eur: 43.565, scope: 'pp', cat: 'Trasporti', note: 'circa 11 h con soste',
          book: { site: 'Inka Express o Turismo Mer', url: SITES.inka.url, url2: SITES.mer.url, rec: 45, open: 'Confronta orari e prezzi sui due siti ufficiali.' } },
        { id: 'ruta_ingressi', label: 'Biglietti d’ingresso alle fermate della Ruta del Sol', pen: 53, scope: 'pp', cat: 'Ingressi', cash: true },
        { id: 'hotel_cusco_1', label: 'Hotel Cusco, 1 notte', eur: 50, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Puno', 'Cusco', 'bus', '11 h 20 con soste', { via: ['Pucará', 'Abra La Raya', 'Sicuani', 'Raqchi', 'Andahuaylillas'] })],
      stops: [['Puno', 3830], ['Pucará', 3900], ['Abra La Raya', 4338], ['Sicuani', 3550], ['Raqchi', 3500], ['Andahuaylillas', 3100], ['Cusco', 3399]]
    }) },

  { id: 'valle_sacra', region: 'cusco',
    make: D => ({
      title: 'Valle Sacra e treno per Aguas Calientes', short: 'Aguas C.', place: 'Aguas Calientes', alt: 2040, ll: [-13.1547, -72.5258],
      pts: [['Pisac', -13.4208, -71.8486], ['Moray', -13.3292, -72.1953], ['Saline di Maras', -13.3125, -72.1561], ['Ollantaytambo', -13.2583, -72.2639]],
      desc: [
        'Giornata nella Valle Sacra con mezzo, autista e guida privati (diversi da quelli del Colca): Pisac e il suo mercato, i terrazzamenti circolari di Moray, le saline di Maras con migliaia di vasche e infine la fortezza di Ollantaytambo.',
        'Alle 19:04 si prende il treno da Ollantaytambo per Aguas Calientes (circa 1 h 40), il villaggio ai piedi di Machu Picchu. Per la tariffa si prende sempre la più bassa (Expedition), senza Vistadome o Hiram Bingham.'
      ],
      items: [
        it('wake', '06:00', 'Sveglia e colazione', 'food'),
        it('co', '06:45', 'Check-out', 'move'),
        it('dep', '07:00', 'Partenza con mezzo privato e guida per il tour nella Valle Sacra', 'move'),
        it('pisac', '08:30', 'Arrivo a Pisac', 'visit'),
        it('pi_dep', '10:30', 'Partenza', 'move'),
        it('moray', '12:30', 'Arrivo a Moray: pranzo e visita al sito archeologico', 'visit'),
        it('mo_dep', '14:30', 'Partenza', 'move'),
        it('maras', '15:00', 'Arrivo alle Saline di Maras', 'visit'),
        it('ma_dep', '15:30', 'Partenza', 'move'),
        it('ollan', '17:00', 'Arrivo a Ollantaytambo', 'visit'),
        it('ol_end', '18:30', 'Fine visita e partenza per la stazione', 'move'),
        it('station', '18:50', 'Arrivo in stazione', 'move'),
        it('train', '19:04', 'Partenza treno', 'move'),
        it('ac', '20:45', 'Arrivo ad Aguas Calientes', 'move'),
        it('checkin', '', 'Check-in in hotel. Serata e cena libere', 'sleep'),
        it('sleep', '', 'Pernottamento ad Aguas Calientes', 'sleep')
      ],
      costs: [
        { id: 'transfer_valle', label: 'Auto con autista e guida: Valle Sacra (stima)', eur: 150, scope: 'sh', cat: 'Trasporti', est: true,
          book: { site: 'Agenzia / autista privato', url: '', rec: 60, open: 'Da concordare con l’operatore: chiedi preventivo con largo anticipo.' } },
        { id: 'boleto_cusco', label: 'Boleto turistico integrale di Cusco (musei e siti, inclusi Ollantaytambo e Moray)', pen: 130, scope: 'pp', cat: 'Ingressi', cash: true,
          book: { site: 'Boleto turistico di Cusco (sito ufficiale)', url: '', rec: 0, open: 'Incolla qui il link ufficiale quando lo hai: così vedi sempre il prezzo giusto.' } },
        { id: 'maras', label: 'Saline di Maras', pen: 20, scope: 'pp', cat: 'Ingressi', cash: true },
        { id: 'treno_ida', label: 'Treno Ollantaytambo → Aguas Calientes (tariffa più bassa)', pen: 233, scope: 'pp', cat: 'Trasporti', note: '1 h 40',
          book: { site: SITES.rail.name, url: SITES.rail.url, rec: 90, open: 'PeruRail consiglia di acquistare almeno 3 mesi prima in alta stagione. Vendita online tutto l’anno.' } },
        { id: 'hotel_ac', label: 'Hotel Aguas Calientes, 1 notte', eur: 50, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Cusco', 'Pisac', 'car', 'circa 1 h 30'), leg('Pisac', 'Moray', 'car', 'circa 2 h'), leg('Moray', 'Saline di Maras', 'car', '30 min'), leg('Saline di Maras', 'Ollantaytambo', 'car', 'circa 1 h 30'), leg('Ollantaytambo', 'Aguas Calientes', 'train', '1 h 41')],
      stops: [['Cusco', 3399], ['Pisac', 2972], ['Moray', 3500], ['Saline di Maras', 3380], ['Ollantaytambo', 2792], ['Aguas Calientes', 2040]]
    }) },

  { id: 'machu_picchu', region: 'cusco',
    make: D => ({
      title: 'Machu Picchu', short: 'Cusco', place: 'Cusco', alt: 3399, ll: [-13.5319, -71.9675],
      pts: [['Machu Picchu', -13.1631, -72.545]],
      peak: { name: 'Machu Picchu', alt: 2430 },
      desc: [
        'Sveglia presto e prima navetta delle 5:30 da Aguas Calientes: si arriva all’ingresso mentre la cittadella si sveglia. Machu Picchu, costruita nel XV secolo e patrimonio UNESCO dal 1983, si visita seguendo un circuito a orario fisso: il percorso e l’eventuale salita al Huayna Picchu si scelgono con le opzioni qui sotto.',
        'Dopo la visita si torna ad Aguas Calientes, un breve relax e il treno del pomeriggio fino a Ollantaytambo, poi bus fino a Cusco. Se la visita finisce tardi si può dormire ad Aguas Calientes e rientrare la mattina dopo.',
        'Da verificare: diverse fonti riportano che dal 2025 per entrare a Machu Picchu serve una guida abilitata, e le regole sui biglietti cambiano spesso. Controlla sempre su tuboleto.cultura.pe prima di acquistare.'
      ],
      items: [
        it('wake', '04:30', 'Sveglia', 'food'),
        it('dep', '05:00', 'Partenza', 'move'),
        it('shst', '05:15', 'Arrivo alla stazione delle navette', 'move'),
        it('shuttle', '05:30', 'Partenza prima navetta', 'move'),
        it('mp_arr', '06:00', 'Arrivo a Machu Picchu', 'visit'),
        it('mp_visit', '07:00', 'Visita del sito archeologico', 'visit'),
        it('mp_end', '14:00', 'Fine visita e navetta di rientro', 'move'),
        it('mp_ac', '14:30', 'Arrivo ad Aguas Calientes', 'move'),
        it('mp_relax', '14:45', 'Arrivo in hotel e breve relax', 'sleep'),
        it('mp_checkout', '15:45', 'Check-out e partenza', 'move'),
        it('mp_station', '16:00', 'Arrivo alla stazione del treno', 'move'),
        it('mp_train', '16:22', 'Partenza treno', 'move'),
        it('mp_ollan', '18:20', 'Arrivo a Ollantaytambo e partenza in bus', 'move'),
        it('mp_cusco', '20:30', 'Arrivo a Cusco', 'move'),
        it('mp_hotel', '', 'Check-in in hotel. Serata e cena libere', 'sleep'),
        it('mp_sleep', '', 'Pernottamento a Cusco', 'sleep')
      ],
      costs: [
        { id: 'navetta', label: 'Navetta Aguas Calientes ↔ Machu Picchu (andata e ritorno)', eur: 29.6242, scope: 'pp', cat: 'Trasporti', cash: false,
          book: { site: 'Consettur (navetta ufficiale)', url: '', rec: 30, open: 'Si acquista online o in stazione: incolla qui il link ufficiale.' } },
        { id: 'treno_ritorno', label: 'Treno + bus Aguas Calientes → Ollantaytambo → Cusco', pen: 400, scope: 'pp', cat: 'Trasporti',
          book: { site: SITES.rail.name, url: SITES.rail.url, rec: 90, open: 'PeruRail consiglia di acquistare almeno 3 mesi prima in alta stagione. Vendita online tutto l’anno.' } },
        { id: 'hotel_cusco_2', label: 'Hotel Cusco, 1 notte', eur: 50, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Aguas Calientes', 'Machu Picchu', 'bus', '30 min (navetta)')]
        .concat(D.ex.ac_stay ? [] : [leg('Aguas Calientes', 'Cusco', 'train', '1 h 58 di treno più circa 2 h 10 di bus', { m2: 'bus', via: ['Ollantaytambo'] })]),
      stops: [['Aguas Calientes', 2040], ['Machu Picchu', 2430], ['Aguas Calientes', 2040]].concat(D.ex.ac_stay ? [] : [['Ollantaytambo', 2792], ['Cusco', 3399]])
    }) },

  { id: 'cusco_libero', region: 'cusco',
    make: D => ({
      title: 'Giornata libera a Cusco', short: 'Cusco', place: 'Cusco', alt: 3399, ll: [-13.5319, -71.9675],
      legs: D.ex.ac_stay ? [leg('Aguas Calientes', 'Cusco', 'train', '1 h 58 di treno più circa 2 h 10 di bus', { m2: 'bus', via: ['Ollantaytambo'] })] : [],
      stops: D.ex.ac_stay ? [['Aguas Calientes', 2040], ['Ollantaytambo', 2792], ['Cusco', 3399]] : [['Cusco', 3399]],
      desc: [
        'Giornata intera per esplorare Cusco senza orari, riposando in vista dell’escursione ad alta quota del giorno dopo.',
        'Da non perdere: Plaza de Armas e la cattedrale, il Qorikancha, il quartiere di San Blas, il mercato di San Pedro e, con il Boleto turistico, Sacsayhuamán e gli altri siti vicini.'
      ],
      items: [
        it('wake', '08:00', 'Sveglia e colazione', 'food'),
        it('free', '', 'Giornata libera intera per esplorare Cusco e riposare in anteprima dell’escursione successiva', 'tip'),
        it('sleep', '', 'Pernottamento a Cusco', 'sleep')
      ],
      costs: [
        { id: 'hotel_cusco_3', label: 'Hotel Cusco, 1 notte', eur: 50, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ]
    }) },

  { id: 'vinicunca', region: 'cusco',
    make: D => ({
      title: 'Vinicunca e Valle Rossa', short: 'Cusco', place: 'Cusco', alt: 3399, ll: [-13.5319, -71.9675],
      pts: [['Vinicunca', -13.8697, -71.3033]],
      peak: { name: 'Vinicunca', alt: 5036 },
      desc: [
        'Sveglia alle 4:00 e partenza con mezzo, autista e guida privati. Colazione lungo la strada, poi trekking da Cusipata fino a Vinicunca, la Montaña de Siete Colores (5.036 m), e di lì alla Valle Rossa.',
        'È l’escursione più alta del viaggio: serve essere ben acclimatati e fare il trekking con calma. Si rientra a Cusco in serata.'
      ],
      items: [
        it('wake', '04:00', 'Sveglia', 'food'),
        it('dep', '04:30', 'Partenza con mezzo privato e guida', 'move'),
        it('brk', '', 'Sosta colazione nel tragitto', 'food'),
        it('cusi', '08:00', 'Arrivo a Cusipata e partenza trekking', 'move'),
        it('vini', '09:45', 'Arrivo a Vinicunca', 'visit'),
        it('vi_dep', '10:15', 'Partenza trekking', 'move'),
        it('rossa', '11:00', 'Arrivo alla Valle Rossa', 'visit'),
        it('back', '11:30', 'Partenza trekking di rientro', 'move'),
        it('lunch', '14:00', 'Arrivo a Cusipata e pranzo', 'food'),
        it('ret', '15:30', 'Partenza', 'move'),
        it('cusco', '18:30', 'Arrivo a Cusco', 'move'),
        it('sleep', '', 'Serata e cena libere, pernottamento a Cusco', 'sleep')
      ],
      costs: [
        { id: 'transfer_vini', label: 'Auto con autista e guida: Vinicunca (stima)', eur: 150, scope: 'sh', cat: 'Trasporti', est: true,
          book: { site: 'Agenzia / autista privato', url: '', rec: 60, open: 'Da concordare con l’operatore: chiedi preventivo con largo anticipo.' } },
        { id: 'vini_ingressi', label: 'Ingressi Vinicunca e Valle Rossa (stima)', pen: 50, scope: 'pp', cat: 'Ingressi', est: true, cash: true },
        { id: 'hotel_cusco_4', label: 'Hotel Cusco, 1 notte', eur: 50, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
      ],
      legs: [leg('Cusco', 'Quesiuno (inizio trekking)', 'car', 'circa 3 h 30'), leg('Quesiuno (inizio trekking)', 'Vinicunca', 'foot', 'circa 1 h 45')],
      stops: [['Cusco', 3399], ['Quesiuno (inizio trekking)', 4326], ['Vinicunca', 5036], ['Valle Rossa', 4800], ['Quesiuno (inizio trekking)', 4326], ['Cusco', 3399]]
    }) },

  { id: 'cusco_lima', region: 'lima',
    show: D => D.limaEnd,
    make: D => {
      const f = D.f;
      return {
        title: 'Volo Cusco → Lima e giornata a Lima', short: 'Lima', place: 'Lima', alt: 150, ll: [-12.1219, -77.0297],
        desc: [
          'Volo di mattina da Cusco a Lima e resto della giornata libero per girare la città, che finora si è solo sfiorata: Miraflores, Barranco, il centro storico.',
          'Si dorme a Lima e il giorno dopo c’è con calma il volo di rientro in Italia.'
        ],
        items: [
          it('wake', fmt(toMin(f.domDep) - 150), 'Sveglia e colazione', 'food'),
          it('apt', fmt(toMin(f.domDep) - 120), 'Trasferimento all’aeroporto di Cusco (CUZ)', 'move'),
          it('fly', f.domDep, 'Volo Cusco → Lima', 'move'),
          it('land', f.domArr, 'Arrivo a Lima e trasferimento in hotel', 'move'),
          it('free', '', 'Resto della giornata libero per girare la città', 'tip'),
          it('sleep', '', 'Pernottamento a Lima', 'sleep')
        ],
        costs: [
          { id: 'volo_cl', label: 'Volo Cusco → Lima (bagaglio in stiva e a mano)', eur: 110, scope: 'pp', cat: 'Voli',
            book: { site: 'Sito della compagnia aerea', url: '', rec: 120, open: 'Controlla sul sito della compagnia da quando sono aperte le vendite.' } },
          { id: 'hotel_lima', label: 'Hotel Lima, 1 notte', eur: 90, scope: 'sh', cat: 'Alloggi', book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }
        ],
        legs: [leg('Aeroporto di Cusco (CUZ)', 'Aeroporto di Lima (LIM)', 'plane', 'circa 1 h 30')],
        stops: [['Cusco', 3399], ['Lima', 150]]
      };
    } },

  { id: 'rientro', region: 'viaggio',
    show: D => D.limaEnd,
    make: D => {
      const f = D.f;
      return {
        title: 'Volo di rientro in Italia', short: 'Volo', place: 'In volo', alt: null, ll: [-12.0464, -77.0428],
        desc: ['Ultima mattina a Lima, poi trasferimento in aeroporto per il volo di rientro. Si arriva in Italia con il fuso orario di 6 o 7 ore in avanti.'],
        items: [
          it('wake', '', 'Sveglia e colazione', 'food'),
          it('free', '', 'Mattina libera a Lima o ultimi acquisti', 'tip'),
          it('apt', fmt(toMin(f.intlDep) - 180), 'Arrivo in aeroporto a Lima (LIM), 3 ore prima del volo', 'move'),
          it('fly', f.intlDep, 'Decollo da Lima verso l’Italia', 'move'),
          f.retLayover ? it('rlay', f.retLayArr, `Scalo a ${f.retLayover}${f.retLayDep ? ` (ripartenza alle ${f.retLayDep})` : ''}`, 'move') : null,
          it('arr', f.intlArr, `Arrivo in Italia${f.intlOff ? ' (giorno dopo)' : ''}`, 'move')
        ],
        costs: [],
        legs: [leg('Aeroporto di Lima (LIM)', homeAp(D), 'plane', 'circa 13 h con scalo', { far: true })],
        stops: [['Lima', 150]]
      };
    } },

  { id: 'rientro_diretto', region: 'viaggio',
    show: D => !D.limaEnd,
    make: D => {
      const f = D.f;
      return {
        title: 'Volo Cusco → Lima e rientro in Italia', short: 'Volo', place: 'In volo', alt: null, ll: [-12.0464, -77.0428],
        desc: [
          'Gli orari dei voli permettono di non fermarsi a Lima: volo da Cusco, cambio di aeroporto o di terminal con calma e subito volo per l’Italia.',
          'Se il volo interno ritarda c’è poco margine: per questo conviene scegliere una coincidenza ampia o aggiungere la notte a Lima.'
        ],
        items: [
          it('wake', fmt(toMin(f.domDep) - 150), 'Sveglia e colazione', 'food'),
          it('apt', fmt(toMin(f.domDep) - 120), 'Trasferimento all’aeroporto di Cusco (CUZ)', 'move'),
          it('fly', f.domDep, 'Volo Cusco → Lima', 'move'),
          it('land', f.domArr, 'Arrivo a Lima: ritiro bagagli e check-in per il volo internazionale', 'move'),
          it('fly2', f.intlDep, 'Decollo da Lima verso l’Italia', 'move'),
          f.retLayover ? it('rlay', f.retLayArr, `Scalo a ${f.retLayover}${f.retLayDep ? ` (ripartenza alle ${f.retLayDep})` : ''}`, 'move') : null,
          it('arr', f.intlArr, `Arrivo in Italia${f.intlOff ? ' (giorno dopo)' : ''}`, 'move')
        ],
        costs: [
          { id: 'volo_cl', label: 'Volo Cusco → Lima (bagaglio in stiva e a mano)', eur: 110, scope: 'pp', cat: 'Voli',
            book: { site: 'Sito della compagnia aerea', url: '', rec: 120, open: 'Controlla sul sito della compagnia da quando sono aperte le vendite.' } }
        ],
        legs: [leg('Aeroporto di Cusco (CUZ)', 'Aeroporto di Lima (LIM)', 'plane', 'circa 1 h 30'), leg('Aeroporto di Lima (LIM)', homeAp(D), 'plane', 'circa 13 h con scalo', { far: true })],
        stops: [['Cusco', 3399], ['Lima', 150]]
      };
    } }
];

/* ---- Esperienze extra e varianti ----------------------------------------
   Ogni extra può aggiungere voci di programma e costi in giorni precisi.
   `ops[giorno]`: after{idVoce:[voci]}, first[], hide[], dropCosts[], costs[], desc[].
   `group`: opzioni alternative (si sceglie una sola).
   `def`: acceso di default. Gli importi segnati est:true sono stime mie.
   ----------------------------------------------------------------------- */
const sameOp = (days, op) => Object.fromEntries(days.map(d => [d, op]));

const EXTRAS = [
  { id: 'pisco', title: 'Degustazione di pisco a Paracas',
    blurb: 'Serata a Paracas con degustazione di pisco in una cantina o in un locale della zona, da scegliere.',
    def: false,
    ops: sameOp(['arrivo_paracas', 'lima_paracas'], {
      after: { checkin: [it('pisco', '17:30', 'Degustazione di pisco (cantina o locale da scegliere)', 'visit')] },
      costs: [{ id: 'pisco', label: 'Degustazione di pisco (stima)', pen: 60, scope: 'pp', cat: 'Attività', est: true,
                book: { site: 'Locale o cantina da scegliere', url: '', rec: 14, open: 'Da cercare: di solito si prenota il giorno prima.' } }]
    }) },

  { id: 'terme', title: 'Terme di Chivay',
    blurb: 'Bagno nelle terme del paese nel pomeriggio libero, dopo la salita in quota.',
    def: true,
    ops: { chivay: {
      after: { free: [it('terme', '17:00', 'Terme di Chivay', 'visit')] },
      costs: [{ id: 'terme', label: 'Terme di Chivay', pen: 15, scope: 'pp', cat: 'Attività', cash: true }]
    } } },

  { id: 'amantani', title: 'Notte sul Lago Titicaca, ad Amantaní',
    blurb: 'Invece della gita in giornata: dormi da una famiglia sull’isola e vedi il tramonto dal centro del lago. Allunga il viaggio di un giorno.',
    def: true, adds: 'day', ops: {}, slotDays: ['titicaca_giorno', 'amantani_1'], slotAnchor: '__first' },

  { id: 'huaca_A', group: 'huaca', title: 'Huacachina: tour guidato da Ica',
    blurb: 'Tour organizzato con trasferimento incluso, escursione all’osservatorio dell’oasi, buggy e sandboarding al tramonto.',
    def: true,
    ops: { ballestas: {
      after: { ica_lunch: [
        it('h_start', '14:30', 'Inizio escursione a Huacachina (trasferimento da Ica incluso)', 'move'),
        it('h_trek', '', 'Trekking all’osservatorio dell’oasi', 'visit'),
        it('h_buggy', '', 'Areneros (buggy) e sandboarding sulle dune al tramonto', 'visit'),
        it('h_end', '18:30', 'Fine escursione e visita libera dell’oasi', 'visit'),
        it('h_dinner', '', 'Cena all’oasi', 'food'),
        it('h_back', '20:00', 'Trasferimento dall’oasi a Ica', 'move')
      ] },
      costs: [{ id: 'huaca_tour', label: 'Huacachina: buggy e sandboarding da Ica (tour)', eur: 34.852, scope: 'pp', cat: 'Attività',
                book: { site: 'GetYourGuide / agenzia locale', url: '', rec: 30, open: 'Prenotabile online con cancellazione gratuita.' } }]
    } } },

  { id: 'huaca_B', group: 'huaca', title: 'Huacachina: taxi e buggy in autonomia',
    blurb: 'Taxi da Ica all’oasi e buggy con sandboarding acquistati in loco. Più libertà, ma un po’ più di organizzazione.',
    def: false,
    ops: { ballestas: {
      after: { ica_lunch: [
        it('h_taxi', '14:30', 'Taxi da Ica all’oasi di Huacachina (privato o pubblico)', 'move'),
        it('h_look', '', 'Visita dell’oasi e della vista dall’alto', 'visit'),
        it('h_buggy', '', 'Buggy e sandboarding sulle dune al tramonto (acquisto in loco)', 'visit'),
        it('h_dinner', '', 'Cena all’oasi', 'food'),
        it('h_back', '20:00', 'Taxi di ritorno a Ica', 'move')
      ] },
      costs: [
        { id: 'huaca_taxi', label: 'Taxi Ica ↔ Huacachina (stima)', pen: 30, scope: 'sh', cat: 'Trasporti', est: true },
        { id: 'huaca_buggy', label: 'Huacachina: buggy e tassa, da pagare in loco', pen: 74, scope: 'pp', cat: 'Attività', cash: true }
      ]
    } } },

  { id: 'huaca_none', group: 'huaca', title: 'Salta Huacachina',
    blurb: 'Pomeriggio libero a Ica, senza escursione.',
    def: false,
    ops: { ballestas: {
      after: { ica_lunch: [it('h_none', '', 'Pomeriggio libero a Ica (Plaza de Armas, cantine di pisco)', 'tip')] }
    } } },

  { id: 'mp_huayna', group: 'mp', title: 'Machu Picchu con salita al Huayna Picchu',
    blurb: 'Circuito completo con l’ingresso supplementare al Huayna Picchu (orari fissi, posti limitati).',
    def: true,
    ops: { machu_picchu: {
      after: { mp_arr: [it('mp_route', '', 'Percorso: cittadella con salita al Huayna Picchu (ingresso a orario prefissato)', 'tip')] },
      costs: [{ id: 'mp_ticket', label: 'Biglietto Machu Picchu con Huayna Picchu', pen: 200, scope: 'pp', cat: 'Ingressi',
                book: { site: SITES.mp.name, url: SITES.mp.url, rec: 120, open: 'Biglietti rilasciati a lotti sul portale ufficiale (per il 2026 da metà novembre 2025). Controlla il calendario ufficiale.' } }]
    } } },

  { id: 'mp_std', group: 'mp', title: 'Machu Picchu, circuito standard',
    blurb: 'Solo la cittadella, senza montagne supplementari. Costa meno e lascia più tempo.',
    def: false,
    ops: { machu_picchu: {
      after: { mp_arr: [it('mp_route', '', 'Percorso: circuito standard della cittadella', 'tip')] },
      costs: [{ id: 'mp_ticket', label: 'Biglietto Machu Picchu, circuito standard (da verificare)', pen: 152, scope: 'pp', cat: 'Ingressi', est: true,
                book: { site: SITES.mp.name, url: SITES.mp.url, rec: 120, open: 'Biglietti rilasciati a lotti sul portale ufficiale (per il 2026 da metà novembre 2025). Controlla il calendario ufficiale.' } }]
    } } },

  { id: 'mp_guide', title: 'Guida ufficiale a Machu Picchu',
    blurb: 'Se la guida abilitata è obbligatoria (verifica sul sito ufficiale), aggiungila al preventivo.',
    def: false,
    ops: { machu_picchu: {
      after: { mp_arr: [it('mp_guide_i', '', 'Visita con guida abilitata', 'visit')] },
      costs: [{ id: 'mp_guide', label: 'Guida a Machu Picchu (stima)', pen: 80, scope: 'pp', cat: 'Attività', est: true,
                book: { site: 'Guida o agenzia abilitata', url: '', rec: 60, open: 'Va prenotata insieme o poco dopo il biglietto: chiedi all’operatore.' } }]
    } } },

  { id: 'ac_stay', title: 'Dormire ad Aguas Calientes se la visita finisce tardi',
    blurb: 'Una notte in più nel villaggio e treno la mattina dopo. Non allunga il viaggio, ma accorcia la giornata libera a Cusco.',
    def: false,
    ops: {
      machu_picchu: {
        hide: ['mp_checkout', 'mp_station', 'mp_train', 'mp_ollan', 'mp_cusco', 'mp_hotel', 'mp_sleep'],
        dropCosts: ['hotel_cusco_2'],
        after: { mp_relax: [
          it('ac_free', '', 'Pomeriggio libero ad Aguas Calientes e cena', 'food'),
          it('ac_sleep', '', 'Pernottamento ad Aguas Calientes', 'sleep')
        ] },
        costs: [{ id: 'hotel_ac2', label: 'Hotel Aguas Calientes, 2ª notte', eur: 50, scope: 'sh', cat: 'Alloggi',
                  book: { site: 'Booking / sito hotel', url: '', rec: 0, open: 'Prenota con cancellazione gratuita appena le date sono fissate.' } }]
      },
      cusco_libero: {
        hide: ['wake', 'free'],
        first: [
          it('ac_train', '', 'Treno del mattino Aguas Calientes → Ollantaytambo e bus fino a Cusco', 'move'),
          it('ac_arr', '', 'Arrivo a Cusco e check-in', 'move'),
          it('ac_free', '', 'Resto della giornata libero per girare Cusco e riposare', 'tip')
        ]
      }
    } }
];

const GROUPS = {
  huaca: 'Huacachina: come la facciamo?',
  mp: 'Machu Picchu: percorso e biglietto'
};

/* ---- Opzioni di viaggio (automatico / sì / no) ---- */
const OPTIONS = [
  { id: 'start', title: 'Notte a Lima all’arrivo',
    blurb: 'Se l’aereo atterra troppo tardi per prendere in comodità l’ultimo bus Cruz del Sur per Paracas, si dorme a Lima. In automatico decide il sito in base agli orari dei voli.' },
  { id: 'end', title: 'Notte a Lima prima del volo di rientro',
    blurb: 'Se la coincidenza tra il volo Cusco → Lima e il volo di ritorno è stretta, si dorme a Lima. In automatico decide il sito.' }
];
