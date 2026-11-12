'use strict';
/* =====================================================================
   Logica del sito. Il programma sta in data.js; qui c'è tutto il resto.
   Le modifiche si salvano nel browser (localStorage) e si possono
   esportare/importare come file JSON (in fondo alla pagina).
   ===================================================================== */

const KEY = 'peru-trip-v1';
const DEFAULT = {
  v: 1, start: '', persons: 2, airport: 'LIN', drive: {},
  fl: { out: '20:20', layover: 'Madrid', land: '06:30', dayOff: 1, buses: '10:30, 13:30',
        domDep: '07:30', domArr: '09:00', intlDep: '23:30', intlArr: '18:30', intlOff: 1,
        bagsCabin: 1, bagsHold: 1 },
  cfg: { imm: 90, taxi: 90, comfort: 60 },
  lima: { start: 'auto', end: 'yes' },
  ex: {}, custom: [], items: {}, notes: {},
  rate: { pen: 3.8728, src: 'valore del tuo Excel', ts: null, manual: false },
  fare: { p: {}, use: {}, extra: { intl: [], dom: [] } },
  ui: { tab: 'itin', open: {} }
};
EXTRAS.forEach(e => { DEFAULT.ex[e.id] = !!e.def; });

const clone = o => JSON.parse(JSON.stringify(o));
function merge(a, b) {
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return merge(clone(DEFAULT), s); } catch (e) { /* stato non leggibile: si riparte dal default */ }
  return clone(DEFAULT);
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage pieno o bloccato */ } schedulePush(); }

/* ---------- utilità ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf0 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nfp = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const eur0 = n => nf0.format(n), eur2 = n => nf2.format(n), solFmt = n => 'S/ ' + nfp.format(n);
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const dateAdd = (S0, i) => { if (!S0.start) return null; const [y, m, d] = S0.start.split('-').map(Number); return new Date(y, m - 1, d + i); };
const fmtDate = d => d ? d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
const fmtDateLong = d => d ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const isoDate = d => d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : '';
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
function setPath(o, path, v) { const p = path.split('.'); let t = o; for (let i = 0; i < p.length - 1; i++) t = t[p[i]] = t[p[i]] || {}; t[p[p.length - 1]] = v; }

/* ---------- logica del viaggio ---------- */
function derive(S0) {
  const f = S0.fl, c = S0.cfg, ap = AIRPORTS[S0.airport];
  const drive = S0.drive && S0.drive[S0.airport] != null ? S0.drive[S0.airport] : ap.drive;
  const buses = String(f.buses).split(',').map(s => s.trim()).filter(Boolean).map(toMin).sort((a, b) => a - b);
  const lastBus = buses.length ? buses[buses.length - 1] : toMin('13:30');
  const land = toMin(f.land), ready = land + c.imm + c.taxi;
  const bus = buses.find(b => b >= ready + c.comfort);
  const startRec = f.dayOff === 0 || bus === undefined;
  const limaStart = f.dayOff === 0 ? true : (S0.lima.start === 'auto' ? startRec : S0.lima.start === 'yes');
  const busUse = bus !== undefined ? bus : lastBus;
  const bus2 = buses.find(b => b >= toMin('10:00')) !== undefined ? buses.find(b => b >= toMin('10:00')) : lastBus;
  const gap = toMin(f.intlDep) - toMin(f.domArr);
  const endRec = gap < 60 + 180 + c.comfort;
  const limaEnd = S0.lima.end === 'auto' ? endRec : S0.lima.end === 'yes';
  return { S: S0, f, c, ap, drive, buses, lastBus, land, ready, bus, busUse, bus2, startRec, limaStart, gap, endRec, limaEnd, ex: S0.ex };
}

const allExtras = S0 => EXTRAS.concat((S0.custom || []).map(toExtra));
function toExtra(c) {
  const costs = [];
  if (c.amt != null && c.amt !== '') {
    const cost = { id: c.id + '_c', label: c.title, scope: c.scope || 'pp', cat: 'Attività' };
    cost[c.cur === 'PEN' ? 'pen' : 'eur'] = +c.amt;
    if (c.book) cost.book = { site: c.site || 'Sito da indicare', url: c.url || '', rec: +c.rec || 0, open: c.open || '' };
    costs.push(cost);
  }
  return { id: c.id, custom: true, title: c.title, blurb: c.desc || '', on: !!c.on,
    ops: { [c.day]: { after: { [c.after || '__end']: [it(c.id, c.t || '', c.title, 'visit')] }, costs } } };
}
const isOn = (S0, e) => e.custom ? e.on : !!S0.ex[e.id];

function applyOps(day, op, tag) {
  if (op.hide) day.items = day.items.filter(i => !op.hide.includes(i.id));
  if (op.dropCosts) day.costs = day.costs.filter(c => !op.dropCosts.includes(c.id));
  if (op.first) day.items.unshift(...op.first.map(i => ({ ...i, src: tag })));
  if (op.after) for (const [id, list] of Object.entries(op.after)) {
    const add = list.map(i => ({ ...i, src: tag }));
    const idx = day.items.findIndex(i => i.id === id);
    if (idx < 0) day.items.push(...add); else day.items.splice(idx + 1, 0, ...add);
  }
  if (op.costs) day.costs.push(...op.costs.map(c => ({ ...c, src: tag })));
  if (op.desc) day.desc.push(...op.desc);
}

function buildDays(S0) {
  const D = derive(S0), out = [];
  for (const b of BLOCKS) {
    if (b.show && !b.show(D)) continue;
    const d = b.make(D);
    d.id = b.id; d.region = b.region;
    d.items = d.items.filter(Boolean); d.costs = (d.costs || []).slice(); d.desc = (d.desc || []).slice();
    d.costs.push({ id: 'pasti_' + b.id, label: 'Pasti (stima)', eur: MEAL_EUR, scope: 'pp', cat: 'Pasti' });
    out.push(d);
  }
  for (const e of allExtras(S0)) {
    if (!isOn(S0, e) || !e.ops) continue;
    for (const d of out) if (e.ops[d.id]) applyOps(d, e.ops[d.id], e.id);
  }
  out.forEach((d, i) => { d.n = i + 1; d.date = dateAdd(S0, i); });
  return out;
}

/* ---------- costi ---------- */
const curOf = c => c.pen != null ? 'PEN' : 'EUR';
const nativeAmt = (S0, c) => { const o = S0.items[c.id] || {}; return o.amt != null ? o.amt : (c.pen != null ? c.pen : c.eur); };
const unitEur = (S0, c) => { const a = nativeAmt(S0, c); return curOf(c) === 'PEN' ? a / S0.rate.pen : a; };
const lineEst = (S0, c) => unitEur(S0, c) * (c.scope === 'pp' ? S0.persons : 1);
const isPaid = (S0, c) => { const o = S0.items[c.id] || {}; return o.paid != null && o.paid !== ''; };
const lineEur = (S0, c) => isPaid(S0, c) ? +S0.items[c.id].paid : lineEst(S0, c);

function allCosts(S0, days) {
  const L = [];
  GENERAL(derive(S0)).forEach(c => L.push({ ...c, day: null }));
  days.forEach(d => d.costs.forEach(c => L.push({ ...c, day: d })));
  return L;
}
function totals(S0, days) {
  days = days || buildDays(S0);
  const L = allCosts(S0, days);
  let total = 0, paid = 0;
  for (const c of L) { const v = lineEur(S0, c); total += v; if (isPaid(S0, c)) paid += v; }
  return { days: days.length, nights: days.length - 1, total, perPerson: total / S0.persons, paid, left: total - paid, L };
}
const dayTotal = (S0, d) => d.costs.reduce((a, c) => a + lineEur(S0, c), 0);

/* Impatto di un'esperienza sul totale (a testa) e sulla durata */
function impactOf(e, T0) {
  const S2 = clone(S);
  let on = isOn(S, e);
  if (e.custom) { const c = S2.custom.find(x => x.id === e.id); c.on = !on; }
  else if (e.group) { if (on) return { current: true }; EXTRAS.filter(x => x.group === e.group).forEach(x => { S2.ex[x.id] = false; }); S2.ex[e.id] = true; }
  else S2.ex[e.id] = !on;
  const T2 = totals(S2);
  const dEur = on ? T0.total - T2.total : T2.total - T0.total;
  const dDays = on ? T0.days - T2.days : T2.days - T0.days;
  return { on, dPer: dEur / S.persons, dDays };
}
function impactOpt(which, T0) {
  const mode = S.lima[which], D = derive(S);
  const effective = which === 'start' ? D.limaStart : D.limaEnd;
  const S2 = clone(S); S2.lima[which] = effective ? 'no' : 'yes';
  const T2 = totals(S2);
  const dEur = effective ? T0.total - T2.total : T2.total - T0.total;
  return { on: effective, dPer: dEur / S.persons, dDays: effective ? T0.days - T2.days : T2.days - T0.days, mode };
}
function impactLabel(im) {
  if (!im || im.current) return '';
  const p = Math.round(im.dPer);
  let s = (im.on ? 'costa ' : (p >= 0 ? 'aggiunge ' : 'fa risparmiare ')) + eur0(Math.abs(im.dPer)) + ' a testa';
  if (im.dDays) s += (im.dDays > 0 ? ', +' : ', ') + im.dDays + (Math.abs(im.dDays) === 1 ? ' giorno' : ' giorni');
  return s;
}

/* ---------- messaggi sulle coincidenze ---------- */
function startMsg(D) {
  const f = D.f;
  if (f.dayOff === 0) return 'Atterri la sera: la prima notte è a Lima.';
  if (D.bus != null) return `Atterri alle ${f.land}: sei al terminal Cruz del Sur verso le ${fmt(D.ready)} e il primo bus con almeno ${D.c.comfort} minuti di margine è quello delle ${fmt(D.bus)}.`;
  return `Atterri alle ${f.land}: arrivi al terminal verso le ${fmt(D.ready)} e non c’è un bus con ${D.c.comfort} minuti di margine (l’ultimo è alle ${fmt(D.lastBus)}). Conviene dormire a Lima.`;
}
function endMsg(D) {
  const h = (D.gap / 60).toFixed(1).replace('.', ',');
  return `Il volo da Cusco atterra a Lima alle ${D.f.domArr} e quello per l’Italia parte alle ${D.f.intlDep}: tra i due ci sono ${h} ore. ${D.endRec ? 'Sono poche per bagagli, check-in e margine: conviene dormire a Lima.' : 'Bastano per fare tutto con calma, senza notte a Lima.'}`;
}

/* ---------- rendering ---------- */
const app = document.getElementById('app');
const TABS = [['itin', 'Itinerario'], ['extra', 'Esperienze extra'], ['costi', 'Costi'], ['pren', 'Da prenotare'], ['voli', 'Voli'], ['mappa', 'Mappa e tempi'], ['siti', 'Siti ufficiali']];
let CTX = null;   // calcoli condivisi del render corrente

function render() {
  const y = window.scrollY;
  const D = derive(S), days = buildDays(S), T = totals(S, days);
  CTX = { D, days, T, ex: allExtras(S) };
  const tab = S.ui.tab;
  let body = '';
  if (tab === 'itin') body = itinTab();
  else if (tab === 'extra') body = extraTab();
  else if (tab === 'costi') body = costiTab();
  else if (tab === 'pren') body = prenTab();
  else if (tab === 'voli') body = voliTab();
  else if (tab === 'mappa') body = mappaTab();
  else body = sitiTab();
  app.innerHTML = hero() + `<nav class="tabs" aria-label="Sezioni"><div class="wrap" role="tablist">${TABS.map(([k, n]) => `<button class="tab" role="tab" aria-selected="${tab === k}" data-act="tab" data-tab="${k}">${n}</button>`).join('')}</div></nav><main class="wrap" id="main">${body}</main>` + footer();
  if (tab === 'mappa') initMap();
  window.scrollTo(0, y);
}

function hero() {
  const { D, days, T } = CTX;
  const last = days[days.length - 1];
  const dates = S.start ? `dal ${fmtDateLong(days[0].date)} al ${fmtDateLong(last.date)}` : 'scegli la data di partenza per vedere le date';
  return `<header class="hero wrap">
    <div class="hero-top">
      <div><h1>Perù</h1><p class="sub">${days.length} giorni da Lima a Cusco, ${dates}.</p></div>
      <div class="controls">
        <label>Data di partenza<input type="date" data-bind="start" value="${esc(S.start)}"></label>
        <label>Persone<input type="number" min="1" max="10" data-bind="persons" data-type="int" value="${S.persons}"></label>
        <label>Aeroporto di partenza<select data-bind="airport">${Object.values(AIRPORTS).map(a => `<option value="${a.code}" ${S.airport === a.code ? 'selected' : ''}>${a.name} (${a.code})</option>`).join('')}</select></label>
      </div>
    </div>
    ${S.start ? '' : '<p class="hint">Senza data i giorni restano “Giorno 1, Giorno 2…”. Scegli la data e tutto si aggiorna: date, scadenze di prenotazione, link ai voli.</p>'}
    <div class="stats">
      <div class="stat"><b>${eur0(T.perPerson)}</b><span>a testa, stima totale</span></div>
      <div class="stat"><b>${eur0(T.total)}</b><span>in ${S.persons}</span></div>
      <div class="stat"><b>${eur0(T.paid)}</b><span>già pagato</span></div>
      <div class="stat"><b>${nfp.format(S.rate.pen)}</b><span>soles per 1 €</span></div>
    </div>
    <div class="profile">${profileSVG(days)}</div>
    <p class="small" style="margin:6px 0 0">Il profilo mostra l’altitudine di ogni pernottamento: toccando un giorno si apre il programma. ${legend(days)}</p>
  </header>`;
}
function legend(days) {
  const seen = [...new Set(days.map(d => d.region))];
  return seen.map(r => `<span style="white-space:nowrap;margin-right:12px"><span style="display:inline-block;width:11px;height:11px;background:${REGIONS[r].color};opacity:.75;vertical-align:-1px;margin-right:5px"></span>${REGIONS[r].name}</span>`).join('');
}

function profileSVG(days) {
  const W = 1100, H = 262, L = 46, R = 14, T = 40, B = 52, n = days.length, step = (W - L - R) / n, maxA = 5200;
  const X = i => L + step * (i + .5), Y = a => T + (H - T - B) * (1 - a / maxA);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profilo altimetrico dei pernottamenti del viaggio">`;
  days.forEach((d, i) => {
    s += `<a data-act="goday" data-id="${d.id}" tabindex="0" role="link" aria-label="Giorno ${d.n}: ${esc(d.title)}"><title>Giorno ${d.n}: ${esc(d.title)}</title><rect class="band" x="${L + step * i}" y="${T - 14}" width="${step}" height="${H - T - B + 14}" fill="${REGIONS[d.region].color}" opacity=".18"/></a>`;
  });
  [0, 2000, 4000].forEach(a => {
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(a)}" y2="${Y(a)}" stroke="#9AAAA3" stroke-width="1" stroke-dasharray="3 5"/><text x="${L - 7}" y="${Y(a) + 4}" text-anchor="end" font-size="11" fill="#586870">${a} m</text>`;
  });
  const pts = days.map((d, i) => d.alt != null ? [X(i), Y(d.alt), d] : null).filter(Boolean);
  if (pts.length > 1) s += `<polyline fill="none" stroke="#17272F" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/>`;
  days.forEach((d, i) => {
    if (d.peak) {
      const below = d.alt != null && d.peak.alt < d.alt;
      s += `<path d="M${X(i) - 7},${Y(d.peak.alt) + 9} L${X(i)},${Y(d.peak.alt) - 3} L${X(i) + 7},${Y(d.peak.alt) + 9} Z" fill="#B83D6A"/><text x="${X(i)}" y="${below ? Y(d.peak.alt) + 23 : Y(d.peak.alt) - 8}" text-anchor="middle" font-size="10.5" fill="#8B2349" style="paint-order:stroke" stroke="#EDF1EF" stroke-width="3">${esc(d.peak.name)} ${d.peak.alt} m</text>`;
    }
  });
  pts.forEach(p => {
    const d = p[2];
    s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="#fff" stroke="#17272F" stroke-width="2.5"/>`;
    const lowPoint = p[1] > H - B - 18;               // vicino al mare: etichetta sopra il punto
    const peakBelow = d.peak && d.peak.alt < d.alt;    // picco sotto il pernottamento: etichetta sopra
    const ly = (lowPoint || peakBelow) ? p[1] - 12 : p[1] + 20;
    s += `<text x="${p[0].toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#17272F" style="paint-order:stroke" stroke="#EDF1EF" stroke-width="3.5">${esc(d.short || '')}</text>`;
  });
  days.forEach((d, i) => {
    s += `<text x="${X(i)}" y="${H - 28}" text-anchor="middle" font-size="12" font-weight="600" fill="#17272F">${d.n}</text>`;
    if (d.date) s += `<text x="${X(i)}" y="${H - 13}" text-anchor="middle" font-size="10.5" fill="#586870">${d.date.getDate()}/${d.date.getMonth() + 1}</text>`;
  });
  return s + '</svg>';
}

/* ----- tab: itinerario ----- */
function itinTab() {
  const { days } = CTX;
  return `<h2>Il programma, giorno per giorno</h2>
  <p class="lead">Tocca un giorno per aprire descrizione, scaletta oraria e costi. Le caselle tratteggiate sono esperienze che puoi aggiungere o togliere: compaiono esattamente nel punto della giornata in cui avverrebbero.</p>
  <div class="inl" style="margin-bottom:14px"><button class="btn ghost sm" data-act="openall">Apri tutti</button><button class="btn ghost sm" data-act="closeall">Chiudi tutti</button></div>
  ${days.map(dayHTML).join('')}`;
}

function dayHTML(d) {
  const open = !!S.ui.open[d.id];
  const per = dayTotal(S, d) / S.persons;
  const alt = d.place ? `Notte: ${esc(d.place)}${d.alt != null ? ', ' + d.alt + ' m' : ''}` : '';
  return `<article class="day" id="day-${d.id}" style="--rc:${REGIONS[d.region].color}">
    <button class="day-head" data-act="toggleDay" data-id="${d.id}" aria-expanded="${open}">
      <span class="dn">Giorno ${d.n}<span class="dd">${esc(fmtDate(d.date))}</span></span>
      <span class="dt">${esc(d.title)}<span class="dp">${alt}</span></span>
      <span class="dc">${eur0(per)}<small>a testa</small></span>
    </button>
    <div class="day-body" ${open ? '' : 'hidden'}>${open ? dayBody(d) : ''}</div>
  </article>`;
}

function dayBody(d) {
  const D = CTX.D;
  let banner = '';
  if (['arrivo_paracas', 'lima_notte', 'lima_paracas'].includes(d.id)) banner = `<div class="warn">${esc(startMsg(D))} Puoi cambiare gli orari nella sezione Voli.</div>`;
  if (['cusco_lima', 'rientro', 'rientro_diretto'].includes(d.id)) banner = `<div class="warn">${esc(endMsg(D))}</div>`;
  const rows = d.costs.map(c => {
    const paid = isPaid(S, c);
    const base = curOf(c) === 'PEN' ? `${solFmt(nativeAmt(S, c))} ≈ ${eur2(unitEur(S, c))}` : eur2(nativeAmt(S, c));
    return `<tr><td>${esc(c.label)}${c.est ? '<span class="esttag">stima</span>' : ''}${paid ? '<span class="paidtag">pagato</span>' : ''}<br><span class="small">${base} ${c.scope === 'pp' ? 'a testa' : 'in ' + S.persons}</span></td><td>${eur2(lineEur(S, c))}</td></tr>`;
  }).join('');
  return `<div class="cols">
    <div class="desc">${d.desc.map(p => `<p>${esc(p)}</p>`).join('')}${banner}
      <h3 style="font-size:17px;margin:16px 0 4px">Costi del giorno</h3>
      <table class="mini">${rows}<tr class="tot"><td>Totale del giorno in ${S.persons}</td><td>${eur2(dayTotal(S, d))}</td></tr><tr class="tot"><td>A testa</td><td>${eur2(dayTotal(S, d) / S.persons)}</td></tr></table>
      <textarea class="note" data-note="${d.id}" placeholder="Appunti per questo giorno (alternative, nomi di locali, numeri utili…)">${esc(S.notes[d.id] || '')}</textarea>
    </div>
    <div><h3 style="font-size:17px;margin:0 0 6px">Scaletta</h3>${tlHTML(d)}</div>
  </div>`;
}

function slotAnchorOf(e, dayId) {
  const op = e.ops && e.ops[dayId];
  if (e.slotAnchor) return e.slotAnchor;
  if (op && op.after) return Object.keys(op.after)[0];
  if (op && op.first) return '__first';
  return null;
}
function slotDaysOf(e) { return e.slotDays || (e.ops ? [Object.keys(e.ops)[0]] : []); }

function itemLI(i) {
  return `<li class="k-${i.k}${i.src ? ' is-extra' : ''}"><time>${esc(i.t)}</time><span class="dot"></span><span class="tx">${esc(i.x)}</span></li>`;
}


function radioHTML(o, name) {
  const im = impactOf(o, CTX.T);
  return `<label class="radio"><input type="radio" name="${name}" ${isOn(S, o) ? 'checked' : ''} data-act="pick" data-id="${o.id}"><span><b>${esc(o.title)}</b><br><span class="impact ${!im.current && im.dPer < 0 ? 'neg' : ''}">${im.current ? 'scelta attuale' : esc(impactLabel(im))}</span><br><span class="small">${esc(o.blurb)}</span></span></label>`;
}

function tlHTML(d) {
  const ex = CTX.ex, ghosts = {}, seenG = {};
  for (const e of ex) {
    if (!slotDaysOf(e).includes(d.id)) continue;
    const anchor = slotAnchorOf(e, d.id);
    if (!anchor) continue;
    if (e.group) { if (seenG[e.group]) continue; seenG[e.group] = 1; (ghosts[anchor] = ghosts[anchor] || []).push({ kind: 'group', g: e.group }); }
    else (ghosts[anchor] = ghosts[anchor] || []).push({ kind: 'ex', e });
  }
  const slotHTML = g => {
    if (g.kind === 'group') {
      const opts = EXTRAS.filter(x => x.group === g.g);
      return `<li class="blk"><div class="slot ${'on'}"><h4>${esc(GROUPS[g.g])}</h4>${opts.map(o => radioHTML(o, `g-${g.g}-${d.id}`)).join('')}</div></li>`;
    }
    const e = g.e, on = isOn(S, e), im = impactOf(e, CTX.T);
    return `<li class="blk"><div class="slot ${on ? 'on' : ''}"><h4>${on ? '' : 'Esperienza extra: '}${esc(e.title)}</h4><p>${esc(e.blurb)}</p><div class="row"><span class="impact ${im.dPer < 0 && !im.on ? 'neg' : ''}">${esc(impactLabel(im))}</span><button class="btn sm ex ${on ? 'ghost' : ''}" data-act="toggleEx" data-id="${e.id}">${on ? 'Rimuovi' : 'Aggiungi qui'}</button></div></div></li>`;
  };
  let html = '<ul class="tl">';
  if (ghosts['__first']) html += ghosts['__first'].map(slotHTML).join('');
  let i = 0; const items = d.items;
  while (i < items.length) {
    const it0 = items[i];
    html += itemLI(it0);
    if (ghosts[it0.id]) html += ghosts[it0.id].map(slotHTML).join('');
    i++;
  }
  // voci di extra non di gruppo, attivi: titolo sopra al blocco (inserite nel flusso)
  return html + '</ul>' + activeExtraNote(d);
}
function activeExtraNote(d) {
  const names = [...new Set(d.items.filter(i => i.src).map(i => i.src))]
    .map(id => CTX.ex.find(e => e.id === id)).filter(e => e && !e.group).map(e => e.title);
  return names.length ? `<p class="small" style="margin-top:10px"><span style="color:var(--ex);font-weight:600">In rosa</span> le voci aggiunte da: ${names.map(esc).join(', ')}.</p>` : '';
}

/* ----- tab: esperienze extra ----- */
function extraTab() {
  const { T, days, D } = CTX;
  const dayOf = id => days.find(d => d.id === id);
  const cards = [];
  const done = {};
  for (const e of CTX.ex) {
    if (e.group) { if (done[e.group]) continue; done[e.group] = 1;
      const opts = EXTRAS.filter(x => x.group === e.group);
      cards.push(`<div class="excard on"><h4>${esc(GROUPS[e.group])}</h4>${opts.map(o => radioHTML(o, `x-${e.group}`)).join('')}</div>`);
      continue;
    }
    const on = isOn(S, e), im = impactOf(e, T);
    const dayId = slotDaysOf(e).find(id => dayOf(id)) || slotDaysOf(e)[0];
    const dd = dayOf(dayId);
    cards.push(`<div class="excard ${on ? 'on' : ''}"><h4>${esc(e.title)}</h4><p>${esc(e.blurb)}</p>
      <span class="where">${dd ? 'Nel giorno ' + dd.n + (dd.date ? ', ' + fmtDate(dd.date) : '') : 'Nel programma'}</span>
      <div class="row"><span class="impact ${im.dPer < 0 && !im.on ? 'neg' : ''}">${esc(impactLabel(im))}</span>
      <button class="btn sm ex ${on ? 'ghost' : ''}" data-act="toggleEx" data-id="${e.id}">${on ? 'Rimuovi' : 'Aggiungi'}</button>
      ${e.custom ? `<button class="btn sm ghost" data-act="delCustom" data-id="${e.id}">Elimina</button>` : ''}</div></div>`);
  }
  const opts = OPTIONS.map(o => {
    const im = impactOpt(o.id, T);
    const msg = o.id === 'start' ? startMsg(D) : endMsg(D);
    const eff = o.id === 'start' ? D.limaStart : D.limaEnd;
    return `<div class="excard ${eff ? 'on' : ''}"><h4>${esc(o.title)}</h4><p>${esc(o.blurb)}</p><p><b>${esc(msg)}</b></p>
      <div class="row"><label class="small">Scelta <select data-bind="lima.${o.id}"><option value="auto" ${S.lima[o.id] === 'auto' ? 'selected' : ''}>Automatica</option><option value="yes" ${S.lima[o.id] === 'yes' ? 'selected' : ''}>Sì, dormo a Lima</option><option value="no" ${S.lima[o.id] === 'no' ? 'selected' : ''}>No</option></select></label>
      <span class="impact">${esc(impactLabel(im))}</span></div></div>`;
  }).join('');
  return `<h2>Esperienze extra e varianti</h2>
  <p class="lead">Ogni esperienza dice quanto costa davvero aggiungerla: biglietti, ma anche notti in più, pasti e trasferimenti. Gli importi segnati “stima” sono miei segnaposto, da correggere nella sezione Costi.</p>
  <h3 style="margin:8px 0 10px">Aggiungere o togliere</h3><div class="exgrid">${cards.join('')}</div>
  <div class="inl" style="margin:18px 0 30px"><button class="btn" data-act="newCustom">Aggiungi una tua esperienza</button></div>
  <h3 style="margin:8px 0 10px">Notti a Lima all’inizio e alla fine</h3><div class="exgrid">${opts}</div>`;
}

/* ----- tab: costi ----- */
const CATS = ['Voli', 'Trasporti', 'Alloggi', 'Attività', 'Ingressi', 'Pasti', 'Altro'];
function costiTab() {
  const { T, days } = CTX;
  const L = T.L;
  const byCat = CATS.map(c => { const rows = L.filter(x => x.cat === c); const tot = rows.reduce((a, x) => a + lineEur(S, x), 0), paid = rows.filter(x => isPaid(S, x)).reduce((a, x) => a + lineEur(S, x), 0); return { c, tot, paid }; }).filter(r => r.tot > 0);
  const rateTs = S.rate.ts ? new Date(S.rate.ts).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' }) : 'mai aggiornato';
  const cash = L.filter(x => x.cash && curOf(x) === 'PEN');
  const cashTot = cash.reduce((a, x) => a + nativeAmt(S, x) * (x.scope === 'pp' ? S.persons : 1), 0);
  return `<h2>Costi</h2>
  <p class="lead">Le stime partono dai tuoi importi. Quando prenoti, scrivi la cifra pagata in euro: quella resta fissa anche se il cambio si muove.</p>
  <div class="rate">
    <span>1 € =</span> <b>${nfp.format(S.rate.pen)} S/</b>
    <span class="small">Fonte: ${esc(S.rate.src)}. Aggiornato: ${esc(rateTs)}.</span>
    <button class="btn sm ghost" data-act="rateRefresh">Aggiorna dal web</button>
    <label class="small">Imposta a mano <input class="num" type="text" inputmode="decimal" data-rate="manual" placeholder="${nfp.format(S.rate.pen)}"></label>
    ${S.rate.manual ? '<button class="btn sm ghost" data-act="rateAuto">Torna all’automatico</button>' : ''}
    <a class="small" href="https://www.ilsole24ore.com" target="_blank" rel="noopener">Controlla su Il Sole 24 Ore</a>
  </div>
  <p class="small" style="margin-top:-12px">Il Sole 24 Ore non offre un servizio pubblico che un sito possa leggere da solo: il cambio automatico arriva da ExchangeRate-API (tasso di mercato). Se preferisci il valore del Sole 24 Ore, copialo qui sopra a mano e resta fisso finché non lo cambi.</p>

  <div class="grid2" style="margin:24px 0 8px">
    <div class="panel"><h3>Riepilogo</h3>
      <table class="mini"><tr><td>Totale stimato in ${S.persons}</td><td>${eur2(T.total)}</td></tr><tr><td>A testa</td><td>${eur2(T.perPerson)}</td></tr><tr><td>Già pagato</td><td>${eur2(T.paid)}</td></tr><tr class="tot"><td>Ancora da pagare (stima)</td><td>${eur2(T.left)}</td></tr></table></div>
    <div class="panel"><h3>Contanti da portare in soles</h3><p class="small">Voci da pagare in loco.</p>
      <table class="mini">${cash.map(x => `<tr><td>${esc(x.label)}</td><td>${solFmt(nativeAmt(S, x) * (x.scope === 'pp' ? S.persons : 1))}</td></tr>`).join('')}<tr class="tot"><td>Totale</td><td>${solFmt(cashTot)} ≈ ${eur0(cashTot / S.rate.pen)}</td></tr></table></div>
  </div>

  <h3 style="margin:22px 0 4px">Per categoria</h3>
  <div class="tblwrap"><table class="tbl"><tr><th>Categoria</th><th class="r">Totale in ${S.persons}</th><th class="r">A testa</th><th class="r">Già pagato</th></tr>
  ${byCat.map(r => `<tr><td>${r.c}</td><td class="r">${eur2(r.tot)}</td><td class="r">${eur2(r.tot / S.persons)}</td><td class="r">${r.paid ? eur2(r.paid) : '–'}</td></tr>`).join('')}
  <tr class="sum"><td>Totale</td><td class="r">${eur2(T.total)}</td><td class="r">${eur2(T.perPerson)}</td><td class="r">${eur2(T.paid)}</td></tr></table></div>

  <h3 style="margin:22px 0 4px">Per giornata</h3>
  <div class="tblwrap"><table class="tbl"><tr><th>Giorno</th><th>Cosa</th><th class="r">In ${S.persons}</th><th class="r">A testa</th></tr>
  ${days.map(d => `<tr><td>${d.n}${d.date ? ', ' + esc(fmtDate(d.date)) : ''}</td><td>${esc(d.title)}</td><td class="r">${eur0(dayTotal(S, d))}</td><td class="r">${eur0(dayTotal(S, d) / S.persons)}</td></tr>`).join('')}
  <tr><td>–</td><td>Voci generali (voli, eSIM, extra)</td><td class="r">${eur0(L.filter(x => !x.day).reduce((a, x) => a + lineEur(S, x), 0))}</td><td class="r">${eur0(L.filter(x => !x.day).reduce((a, x) => a + lineEur(S, x), 0) / S.persons)}</td></tr>
  <tr class="sum"><td></td><td>Totale</td><td class="r">${eur0(T.total)}</td><td class="r">${eur0(T.perPerson)}</td></tr></table></div>

  <h3 style="margin:22px 0 4px">Tutte le voci</h3>
  <p class="small">Modifica l’importo nella valuta della voce. In “Pagato” metti il totale in euro realmente pagato per quella voce, per tutte le persone.</p>
  <div class="tblwrap"><table class="tbl"><tr><th>Voce</th><th>Giorno</th><th class="r">Importo</th><th class="r">Stima in euro</th><th class="r">Pagato in euro</th></tr>
  ${L.map(c => { const o = S.items[c.id] || {}; return `<tr class="${isPaid(S, c) ? 'paid' : ''}"><td>${esc(c.label)}${c.est ? '<span class="esttag">stima</span>' : ''}<br><span class="small">${c.scope === 'pp' ? 'a testa' : 'in ' + S.persons}</span></td><td>${c.day ? c.day.n : '–'}</td>
    <td class="r">${curOf(c) === 'PEN' ? 'S/' : '€'} <input class="num" type="text" inputmode="decimal" data-item="${c.id}" data-field="amt" value="${nativeAmt(S, c)}"></td>
    <td class="r">${eur2(lineEst(S, c))}</td>
    <td class="r">€ <input class="num" type="text" inputmode="decimal" data-item="${c.id}" data-field="paid" value="${o.paid != null ? o.paid : ''}" placeholder="–"></td></tr>`; }).join('')}
  </table></div>`;
}

/* ----- tab: da prenotare ----- */
function prenTab() {
  const { T, days } = CTX;
  const rows = T.L.filter(c => c.book).map(c => {
    const o = S.items[c.id] || {};
    const date = c.day ? c.day.date : days[0].date;
    const rec = c.book.rec > 0 && date ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - c.book.rec) : null;
    return { c, o, date, rec, booked: o.status === 'booked', order: c.day ? c.day.n : 0 };
  });
  rows.sort((a, b) => (a.booked - b.booked) || (a.rec && b.rec ? a.rec - b.rec : a.order - b.order));
  const t0 = today();
  const chipFor = r => {
    if (r.booked) return '<span class="chip ok">Prenotato</span>';
    if (r.o.opens) { const op = new Date(r.o.opens + 'T00:00:00'); const dd = daysBetween(t0, op); if (dd > 0) return `<span class="chip ${dd < 30 ? 'soon' : ''}">Apre tra ${dd} giorni</span>`; return '<span class="chip todo">Aperta: da prenotare</span>'; }
    if (r.rec) { const dd = daysBetween(t0, r.rec); return dd <= 0 ? '<span class="chip soon">Da prenotare ora</span>' : `<span class="chip">Entro ${esc(fmtDateLong(r.rec))}</span>`; }
    return '<span class="chip todo">Da prenotare</span>';
  };
  return `<h2>Da prenotare</h2>
  <p class="lead">Tutto ciò che si può riservare in anticipo, con il sito ufficiale dove farlo. La colonna “Consigliato” si calcola dalla data di partenza. La data di apertura delle vendite non la so con certezza per ogni servizio e cambia negli anni: quando la trovi sul sito, scrivila e il promemoria si aggiorna.</p>
  <div class="tblwrap"><table class="tbl"><tr><th>Cosa</th><th>Quando serve</th><th>Dove prenotare</th><th>Si apre il</th><th>Consigliato</th><th>Stato</th><th class="r">Pagato in euro</th></tr>
  ${rows.map(r => { const b = r.c.book, o = r.o; const url = o.url || b.url;
    return `<tr class="${r.booked ? 'paid' : ''}"><td><b>${esc(r.c.label)}</b>${r.c.est ? '<span class="esttag">stima</span>' : ''}<br><span class="small">${esc(b.open || '')}</span></td>
    <td>${r.c.day ? 'Giorno ' + r.c.day.n + (r.date ? '<br>' + esc(fmtDate(r.date)) : '') : 'Prima di partire' + (r.date ? '<br>' + esc(fmtDate(r.date)) : '')}</td>
    <td>${url ? `<a class="btn sm ghost" href="${esc(url)}" target="_blank" rel="noopener">${esc(b.site)}</a>` : esc(b.site)}${b.url2 ? `<br><a class="small" href="${esc(b.url2)}" target="_blank" rel="noopener">Turismo Mer</a>` : ''}
      ${url ? '' : `<br><input type="text" style="width:150px;margin-top:4px" data-item="${r.c.id}" data-field="url" placeholder="Incolla il link" value="${esc(o.url || '')}">`}</td>
    <td><input type="date" data-item="${r.c.id}" data-field="opens" value="${esc(o.opens || '')}"></td>
    <td>${r.rec ? esc(fmtDate(r.rec)) : (b.rec > 0 ? b.rec + ' giorni prima' : '–')}<br>${chipFor(r)}</td>
    <td><select data-item="${r.c.id}" data-field="status"><option value="todo" ${r.booked ? '' : 'selected'}>Da prenotare</option><option value="booked" ${r.booked ? 'selected' : ''}>Prenotato</option></select><br><input type="text" style="width:130px;margin-top:4px" data-item="${r.c.id}" data-field="ref" placeholder="Codice conferma" value="${esc(o.ref || '')}"></td>
    <td class="r">€ <input class="num" type="text" inputmode="decimal" data-item="${r.c.id}" data-field="paid" value="${o.paid != null ? o.paid : ''}" placeholder="${eur0(lineEst(S, r.c)).replace(/\s?€/, '')}"></td></tr>`; }).join('')}
  </table></div>
  <p class="small">Quando segni “Pagato in euro”, la voce smette di seguire il cambio e il totale usa la cifra reale.</p>`;
}

/* ----- tab: voli ----- */
function fareKey(kind, id) { const f = S.fl; return kind === 'intl' ? `${kind}|${id}|${S.airport}|${f.bagsCabin}|${f.bagsHold}` : `${kind}|${id}|${f.bagsCabin}|${f.bagsHold}`; }
function syncFare() {
  [['intl', 'volo_intl'], ['dom', 'volo_cl']].forEach(([kind, item]) => {
    const use = S.fare.use[kind];
    S.items[item] = S.items[item] || {};
    const p = use && S.fare.p[fareKey(kind, use)];
    if (p && p.v != null) S.items[item].amt = p.v; else delete S.items[item].amt;
  });
}
function fareCard(kind) {
  const list = (kind === 'intl' ? AIRLINES_INTL : AIRLINES_DOM).concat(S.fare.extra[kind]);
  const f = S.fl, ap = AIRPORTS[S.airport];
  const title = kind === 'intl' ? `Volo ${ap.code} → Lima e ritorno` : 'Volo Cusco → Lima';
  return `<div class="panel"><h3>${title}</h3>
    <p class="small">Prezzo a persona${kind === 'intl' ? ' per andata e ritorno' : ''}, con ${f.bagsCabin} bagaglio a mano e ${f.bagsHold} in stiva. Apri il sito della compagnia, imposta gli stessi bagagli e scrivi il prezzo che vedi: il sito non può leggere i prezzi dei siti delle compagnie, ma ricorda quelli che inserisci per ogni combinazione di bagagli.</p>
    <div class="tblwrap"><table class="tbl"><tr><th>Compagnia</th><th class="r">Prezzo visto</th><th>Controllato</th><th>Uso nel preventivo</th></tr>
    ${list.map(a => { const k = fareKey(kind, a.id), p = S.fare.p[k]; return `<tr><td><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a>${a.custom ? ` <button class="btn sm ghost" data-act="delAirline" data-kind="${kind}" data-id="${a.id}">x</button>` : ''}</td>
      <td class="r">€ <input class="num" type="text" inputmode="decimal" data-fare="${k}" value="${p ? p.v : ''}" placeholder="–"></td>
      <td>${p && p.ts ? esc(new Date(p.ts).toLocaleDateString('it-IT')) : '–'}</td>
      <td><label><input type="radio" name="use-${kind}" ${S.fare.use[kind] === a.id ? 'checked' : ''} data-act="useFare" data-kind="${kind}" data-id="${a.id}"> usa questo</label></td></tr>`; }).join('')}</table></div>
    <div class="inl"><input type="text" id="al-${kind}-n" placeholder="Altra compagnia"><input type="text" id="al-${kind}-u" placeholder="Sito (https://…)"><button class="btn sm ghost" data-act="addAirline" data-kind="${kind}">Aggiungi</button></div></div>`;
}
function voliTab() {
  const { D, days } = CTX;
  const f = S.fl, ap = AIRPORTS[S.airport], last = days[days.length - 1];
  const d1 = S.start ? S.start : '', d2 = last.date ? isoDate(last.date) : '';
  const gf = `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${ap.code} to LIM` + (d1 ? ` on ${d1}` : '') + (d2 ? ` through ${d2}` : ''))}`;
  const sk = d1 && d2 ? `https://www.skyscanner.it/trasporti/voli/${ap.code.toLowerCase()}/lim/${d1.slice(2).replace(/-/g, '')}/${d2.slice(2).replace(/-/g, '')}/?adultsv2=${S.persons}` : 'https://www.skyscanner.it';
  const inp = (path, label, type = 'time', extra = '') => `<label class="small">${label}<br><input type="${type}" data-bind="${path}" value="${esc(path.split('.').reduce((o, k) => o[k], S))}" ${extra}></label>`;
  return `<h2>Voli e orari di arrivo</h2>
  <p class="lead">I voli si prenotano sempre dal sito della compagnia, mai da intermediari. Google Voli e Skyscanner qui servono solo per scoprire quali compagnie e orari esistono: poi si va al sito ufficiale.</p>
  <div class="grid2">
    <div class="panel"><h3>Dove si parte</h3>
      <p>${esc(ap.home)} verso ${esc(ap.name)} (${ap.code}). Tempo di viaggio per l’aeroporto in minuti:</p>
      <table class="mini">${Object.values(AIRPORTS).map(a => `<tr><td>${esc(a.name)} (${a.code}) da ${esc(a.home)}${a.est ? '<span class="esttag">stima</span>' : ''}</td><td><input class="num" style="width:70px" type="text" inputmode="numeric" data-bind="drive.${a.code}" data-type="int" value="${S.drive[a.code] != null ? S.drive[a.code] : a.drive}"></td></tr>`).join('')}</table>
      <p class="small">Si arriva in aeroporto 3 ore prima del decollo. Con Pisa si parte da Vecchiano, con gli altri aeroporti da Aosta.</p></div>
    <div class="panel"><h3>Bagagli per persona</h3>
      <div class="inl"><label class="small">A mano<br><select data-bind="fl.bagsCabin" data-type="int">${[0, 1, 2].map(n => `<option ${f.bagsCabin === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="small">In stiva<br><select data-bind="fl.bagsHold" data-type="int">${[0, 1, 2].map(n => `<option ${f.bagsHold === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <p class="small">I prezzi che scrivi sotto vengono ricordati per ogni combinazione di bagagli e di aeroporto.</p>
      <div class="inl"><a class="btn sm ghost" href="${esc(gf)}" target="_blank" rel="noopener">Confronta su Google Voli</a><a class="btn sm ghost" href="${esc(sk)}" target="_blank" rel="noopener">Confronta su Skyscanner</a></div></div>
  </div>
  <div class="grid2" style="margin-top:24px">${fareCard('intl')}${fareCard('dom')}</div>
  <h3 style="margin:24px 0 6px">Orari che guidano il programma</h3>
  <p class="small">Scrivi gli orari dei voli scelti: il programma del primo e dell’ultimo giorno si ricalcola e il sito decide se serve una notte a Lima.</p>
  <div class="inl" style="gap:18px">
    ${inp('fl.out', `Decollo da ${ap.code}`)}${inp('fl.layover', 'Scalo (città)', 'text')}${inp('fl.land', 'Atterraggio a Lima')}
    <label class="small">Arrivo a Lima<br><select data-bind="fl.dayOff" data-type="int"><option value="1" ${f.dayOff === 1 ? 'selected' : ''}>il giorno dopo</option><option value="0" ${f.dayOff === 0 ? 'selected' : ''}>lo stesso giorno</option></select></label>
  </div>
  <div class="inl" style="gap:18px;margin-top:12px">
    ${inp('fl.buses', 'Orari bus Cruz del Sur Lima → Paracas (separati da virgola)', 'text', 'style="width:260px"')}
    ${inp('cfg.imm', 'Minuti per dogana e bagagli', 'number', 'data-type="int" style="width:90px"')}
    ${inp('cfg.taxi', 'Minuti dall’aeroporto al terminal', 'number', 'data-type="int" style="width:90px"')}
    ${inp('cfg.comfort', 'Margine minimo prima del bus (minuti)', 'number', 'data-type="int" style="width:90px"')}
  </div>
  <p class="small"><b>${esc(startMsg(D))}</b></p>
  <div class="inl" style="gap:18px;margin-top:12px">
    ${inp('fl.domDep', 'Volo Cusco → Lima: decollo')}${inp('fl.domArr', 'Volo Cusco → Lima: atterraggio')}${inp('fl.intlDep', 'Volo Lima → Italia: decollo')}${inp('fl.intlArr', 'Arrivo in Italia')}
    <label class="small">Arrivo in Italia<br><select data-bind="fl.intlOff" data-type="int"><option value="1" ${f.intlOff === 1 ? 'selected' : ''}>il giorno dopo</option><option value="0" ${f.intlOff === 0 ? 'selected' : ''}>lo stesso giorno</option></select></label>
  </div>
  <p class="small"><b>${esc(endMsg(D))}</b></p>`;
}

/* ----- tab: mappa e tempi ----- */
function mappaTab() {
  const { days } = CTX;
  const legs = [];
  days.forEach(d => (d.legs || []).forEach(l => legs.push({ n: d.n, l })));
  return `<h2>Mappa e tempi di percorrenza</h2>
  <p class="lead">Le tappe del viaggio nell’ordine in cui le percorri. I tempi sono quelli del tuo programma e delle soste previste.</p>
  <div id="map" role="img" aria-label="Mappa delle tappe del viaggio in Perù"></div>
  <div class="tblwrap"><table class="tbl"><tr><th>Giorno</th><th>Da</th><th>A</th><th>Come</th><th>Quanto</th></tr>
  ${legs.map(x => `<tr><td>${x.n}</td><td>${esc(x.l[0])}</td><td>${esc(x.l[1])}</td><td>${esc(x.l[2])}</td><td>${esc(x.l[3])}</td></tr>`).join('')}</table></div>`;
}
let MAP = null;
function initMap() {
  const el = document.getElementById('map');
  if (!el) return;
  if (typeof L === 'undefined') { el.innerHTML = '<p style="padding:16px">La mappa non si è caricata: controlla la connessione e ricarica la pagina.</p>'; return; }
  if (MAP) { MAP.remove(); MAP = null; }
  MAP = L.map(el, { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '&copy; OpenStreetMap' }).addTo(MAP);
  const path = [];
  CTX.days.forEach(d => {
    if (d.ll && (!path.length || path[path.length - 1].join() !== d.ll.join())) path.push(d.ll);
    if (d.ll && d.place) L.circleMarker(d.ll, { radius: 7, color: REGIONS[d.region].color, weight: 3, fillColor: '#fff', fillOpacity: 1 }).addTo(MAP).bindPopup(`<b>Giorno ${d.n}</b><br>${esc(d.place)}`);
    (d.pts || []).forEach(p => L.circleMarker([p[1], p[2]], { radius: 4, color: '#B83D6A', weight: 2, fillColor: '#B83D6A', fillOpacity: .9 }).addTo(MAP).bindPopup(esc(p[0])));
  });
  const line = L.polyline(path, { color: '#17272F', weight: 3, dashArray: '2 7' }).addTo(MAP);
  MAP.fitBounds(line.getBounds(), { padding: [30, 30] });
}

/* ----- tab: siti ufficiali ----- */
function sitiTab() {
  const card = (name, url, note) => `<div class="panel"><h3>${esc(name)}</h3><p>${esc(note)}</p><a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener">Apri il sito ufficiale</a></div>`;
  return `<h2>Siti ufficiali</h2>
  <p class="lead">Orari, tariffe e biglietti vanno sempre controllati dai siti ufficiali. Qui trovi quelli del tuo programma.</p>
  <div class="grid2">
    ${card('Cruz del Sur', SITES.cruz.url, 'Bus Lima → Paracas, Paracas → Ica e notturno Ica → Arequipa.')}
    ${card('Inka Express', SITES.inka.url, 'Bus turistico Puno → Cusco con fermate sulla Ruta del Sol. In alternativa Turismo Mer: confronta orari e prezzi.')}
    ${card('Turismo Mer', SITES.mer.url, 'Seconda opzione per il bus turistico Puno → Cusco.')}
    ${card('PeruRail', SITES.rail.url, 'Treno Ollantaytambo ↔ Aguas Calientes. Si prende sempre la tariffa più bassa (Expedition), senza Vistadome né Hiram Bingham.')}
    ${card('Machu Picchu, biglietti ufficiali', SITES.mp.url, 'Unico portale ufficiale del Ministero della Cultura: controlla prezzi, circuiti e regole su guida obbligatoria.')}
  </div>
  <h3 style="margin:26px 0 6px">Boleto turistico di Cusco e del Colca</h3>
  <p class="small">Incolla qui i link ufficiali per averli sempre a portata di mano. Li usa anche la sezione “Da prenotare”.</p>
  <div class="inl"><label class="small">Boleto turistico di Cusco<br><input type="text" style="width:300px" data-item="boleto_cusco" data-field="url" value="${esc((S.items.boleto_cusco || {}).url || '')}" placeholder="https://…"></label>
  <label class="small">Boleto turistico del Colca<br><input type="text" style="width:300px" data-item="boleto_colca" data-field="url" value="${esc((S.items.boleto_colca || {}).url || '')}" placeholder="https://…"></label></div>`;
}

function footer() {
  return `<footer class="foot"><div class="wrap">${syncPanel()}<p>Le modifiche si salvano da sole in questo browser. Per portarle su un altro dispositivo o condividerle con il tuo ragazzo, esporta il file e importalo dall’altra parte.</p>
  <div class="inl"><button class="btn ghost sm" data-act="export">Esporta le modifiche</button><button class="btn ghost sm" data-act="import">Importa un file</button><button class="btn ghost sm" data-act="reset">Ricomincia da zero</button><input type="file" id="file" accept="application/json" hidden></div>
  <p style="margin-top:14px">Cambio da <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a>. Mappa © OpenStreetMap.</p></div></footer>`;
}

/* ---------- dialog: esperienza personalizzata ---------- */
function openCustomDialog() {
  const days = CTX.days;
  const dlg = document.getElementById('dlg');
  dlg.innerHTML = `<form method="dialog" id="cform"><h3 style="margin-bottom:12px">Aggiungi una tua esperienza</h3>
    <label>Titolo<input type="text" name="title" required></label>
    <label>Descrizione<textarea name="desc" rows="2"></textarea></label>
    <label>In quale giorno<select name="day" id="cday">${days.map(d => `<option value="${d.id}">Giorno ${d.n}: ${esc(d.title)}</option>`).join('')}</select></label>
    <label>Dopo quale momento<select name="after" id="cafter"></select></label>
    <label>Orario (facoltativo)<input type="time" name="t"></label>
    <div class="inl"><label>Costo<input type="text" inputmode="decimal" name="amt" style="width:100px"></label>
      <label>Valuta<select name="cur"><option value="EUR">Euro</option><option value="PEN">Soles</option></select></label>
      <label>Per<select name="scope"><option value="pp">a testa</option><option value="sh">in due</option></select></label></div>
    <label style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="book" style="width:auto"> Si può prenotare in anticipo</label>
    <label>Sito dove prenotare (facoltativo)<input type="text" name="url" placeholder="https://…"></label>
    <div class="inl" style="justify-content:flex-end"><button class="btn ghost" value="cancel" formnovalidate>Annulla</button><button class="btn" value="ok">Salva</button></div></form>`;
  const fillAfter = () => { const d = days.find(x => x.id === document.getElementById('cday').value); document.getElementById('cafter').innerHTML = d.items.map(i => `<option value="${esc(i.id)}">${esc((i.t ? i.t + '  ' : '') + i.x)}</option>`).join('') + '<option value="__end">Alla fine della giornata</option>'; };
  dlg.showModal(); fillAfter();
  document.getElementById('cday').addEventListener('change', fillAfter);
  document.getElementById('cform').addEventListener('submit', ev => {
    if (ev.submitter && ev.submitter.value === 'cancel') return;
    const fd = new FormData(ev.target);
    S.custom.push({ id: 'c' + Date.now(), title: fd.get('title'), desc: fd.get('desc'), day: fd.get('day'), after: fd.get('after'), t: fd.get('t'),
      amt: num(fd.get('amt')), cur: fd.get('cur'), scope: fd.get('scope'), book: !!fd.get('book'), url: fd.get('url'), on: true });
    save(); render(); toast('Esperienza aggiunta al programma');
  });
}

/* ---------- cambio ---------- */
async function fetchRate(silent) {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/EUR');
    const j = await r.json();
    if (j.result === 'success' && j.rates && j.rates.PEN) {
      S.rate.pen = +j.rates.PEN.toFixed(4); S.rate.src = 'ExchangeRate-API (tasso di mercato)';
      S.rate.ts = j.time_last_update_utc ? new Date(j.time_last_update_utc).toISOString() : new Date().toISOString(); S.rate.manual = false;
      save(); render(); if (!silent) toast('Cambio aggiornato');
      return;
    }
    throw new Error('risposta non valida');
  } catch (e) { if (!silent) toast('Non riesco ad aggiornare il cambio: uso l’ultimo salvato'); }
}

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

/* ---------- eventi ---------- */
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (act === 'tab') { S.ui.tab = el.dataset.tab; save(); render(); window.scrollTo(0, 0); }
  else if (act === 'toggleDay') { S.ui.open[id] = !S.ui.open[id]; save(); render(); }
  else if (act === 'openall') { CTX.days.forEach(d => { S.ui.open[d.id] = true; }); save(); render(); }
  else if (act === 'closeall') { S.ui.open = {}; save(); render(); }
  else if (act === 'goday') { S.ui.tab = 'itin'; S.ui.open[id] = true; save(); render(); const t = document.getElementById('day-' + id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (act === 'toggleEx') { const e = CTX.ex.find(x => x.id === id); if (e.custom) { const c = S.custom.find(x => x.id === id); c.on = !c.on; } else S.ex[id] = !S.ex[id]; save(); render(); }
  else if (act === 'pick') { const e = EXTRAS.find(x => x.id === id); EXTRAS.filter(x => x.group === e.group).forEach(x => { S.ex[x.id] = false; }); S.ex[id] = true; save(); render(); }
  else if (act === 'newCustom') openCustomDialog();
  else if (act === 'delCustom') { S.custom = S.custom.filter(c => c.id !== id); save(); render(); }
  else if (act === 'rateRefresh') fetchRate(false);
  else if (act === 'rateAuto') { S.rate.manual = false; save(); fetchRate(false); }
  else if (act === 'useFare') { S.fare.use[el.dataset.kind] = id; syncFare(); save(); render(); }
  else if (act === 'addAirline') { const k = el.dataset.kind, n = document.getElementById(`al-${k}-n`).value.trim(), u = document.getElementById(`al-${k}-u`).value.trim(); if (n) { S.fare.extra[k].push({ id: 'x' + Date.now(), name: n, url: u || '#', custom: true }); save(); render(); } }
  else if (act === 'delAirline') { const k = el.dataset.kind; S.fare.extra[k] = S.fare.extra[k].filter(a => a.id !== id); save(); render(); }
  else if (act === 'syncNew') connect(newCode());
  else if (act === 'syncJoin') connect(document.getElementById('synccode').value);
  else if (act === 'syncCopy') {
    const link = location.origin + location.pathname + '#v=' + S.sync.code;
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => toast('Link copiato'), () => prompt('Copia questo link:', link));
  }
  else if (act === 'syncOff') { if (confirm('Scollegare questo dispositivo? Le modifiche già salvate online restano al sicuro.')) { delete S.sync; save(); render(); } }
  else if (act === 'export') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }));
    a.download = 'viaggio-peru.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  else if (act === 'import') document.getElementById('file').click();
  else if (act === 'reset') { if (confirm('Cancellare tutte le modifiche e ripartire dal programma iniziale?')) { S = clone(DEFAULT); save(); render(); } }
});

document.addEventListener('change', ev => {
  const el = ev.target;
  if (el.id === 'file' && el.files[0]) {
    el.files[0].text().then(t => { try { S = merge(clone(DEFAULT), JSON.parse(t)); save(); render(); toast('Modifiche importate'); } catch (e) { toast('File non valido'); } });
    return;
  }
  if (el.dataset.bind) {
    let v = el.value;
    if (el.dataset.type === 'int') { v = parseInt(v, 10); if (isNaN(v)) return; }
    if (el.dataset.bind === 'persons') v = Math.max(1, Math.min(10, v));
    setPath(S, el.dataset.bind, v);
    if (el.dataset.bind === 'airport' || el.dataset.bind.startsWith('fl.bags')) syncFare();
    save(); render();
  } else if (el.dataset.item) {
    const id = el.dataset.item, f = el.dataset.field;
    S.items[id] = S.items[id] || {};
    if (f === 'amt' || f === 'paid') { const n = num(el.value); if (n == null) delete S.items[id][f]; else S.items[id][f] = n; }
    else if (el.value === '') delete S.items[id][f]; else S.items[id][f] = el.value;
    save(); render();
  } else if (el.dataset.note) { S.notes[el.dataset.note] = el.value; save(); }
  else if (el.dataset.fare) {
    const n = num(el.value);
    if (n == null) delete S.fare.p[el.dataset.fare]; else S.fare.p[el.dataset.fare] = { v: n, ts: new Date().toISOString() };
    syncFare(); save(); render();
  } else if (el.dataset.rate) {
    const n = num(el.value);
    if (n && n > 0) { S.rate.pen = n; S.rate.manual = true; S.rate.src = 'inserito a mano'; S.rate.ts = new Date().toISOString(); save(); render(); }
  }
});
document.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('a[data-act=goday]')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
});


/* ---------- salvataggio condiviso (Supabase) ---------- */
const SB = (typeof SUPABASE_CONFIG !== 'undefined') ? SUPABASE_CONFIG : null;
let pushTimer = null, syncing = false;
const canSync = () => !!(SB && S.sync && S.sync.code);
const payload = () => { const p = clone(S); delete p.ui; delete p.sync; return p; };
async function rpc(fn, body) {
  const r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB.key }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function adopt(remote, version) {
  const ui = S.ui, sync = S.sync;
  S = merge(clone(DEFAULT), remote); S.ui = ui; S.sync = { ...sync, version, status: 'ok', ts: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignora */ }
}
function paintSync() {
  const el = document.getElementById('syncstat');
  if (el) el.textContent = syncText();
}
function syncText() {
  if (!S.sync || !S.sync.code) return 'Non collegato: le modifiche restano solo su questo dispositivo.';
  if (S.sync.status === 'offline') return 'Non riesco a raggiungere il servizio: riprovo da solo. Le modifiche sono salvate qui.';
  return S.sync.ts ? 'Collegato. Ultimo salvataggio ' + new Date(S.sync.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + '.' : 'Collegato.';
}
function schedulePush() {
  if (!canSync() || syncing) return;
  clearTimeout(pushTimer); pushTimer = setTimeout(push, 1200);
}
async function push() {
  if (!canSync()) return;
  pushTimer = null;
  try {
    const res = await rpc('save_trip', { p_code: S.sync.code, p_data: payload(), p_base_version: S.sync.version || 0 });
    if (res.ok) { S.sync.version = res.version; S.sync.status = 'ok'; S.sync.ts = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignora */ } }
    else if (res.conflict) { adopt(res.data, res.version); render(); toast('Nel frattempo c’è stata un’altra modifica: ho caricato la versione più recente'); }
    else toast('Salvataggio online non riuscito' + (res.error ? ': ' + res.error : ''));
  } catch (e) { if (S.sync) S.sync.status = 'offline'; }
  paintSync();
}
async function pull(silent) {
  if (!canSync() || pushTimer) return;
  const a = document.activeElement;
  if (silent && a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;     // non interrompere chi sta scrivendo
  try {
    const res = await rpc('get_trip', { p_code: S.sync.code });
    if (res && res.version > (S.sync.version || 0)) { adopt(res.data, res.version); render(); if (!silent) toast('Aggiornato con le ultime modifiche'); }
    else if (!res) await push();
    else { S.sync.status = 'ok'; S.sync.ts = Date.now(); }
  } catch (e) { S.sync.status = 'offline'; }
  paintSync();
}
async function connect(code) {
  code = String(code || '').trim();
  if (code.length < 16) { toast('Il codice deve avere almeno 16 caratteri'); return; }
  S.sync = { code, version: 0, status: 'ok', ts: null };
  try {
    const res = await rpc('get_trip', { p_code: code });
    if (res) { adopt(res.data, res.version); toast('Collegato: ho caricato il viaggio condiviso'); }
    else { await push(); toast('Collegato: il viaggio è ora salvato online'); }
  } catch (e) { S.sync.status = 'offline'; toast('Non riesco a collegarmi: controlla la connessione'); }
  save(); render();
}
const newCode = () => { const a = 'abcdefghjkmnpqrstuvwxyz23456789', r = new Uint8Array(24); crypto.getRandomValues(r); return [...r].map(x => a[x % a.length]).join(''); };
function syncPanel() {
  if (!SB) return '';
  if (!S.sync || !S.sync.code) return `<p><b>Salvataggio condiviso.</b> Crea un codice e passa il link a chi vuoi: vedrete le stesse modifiche. Chi ha il link può modificare, quindi non condividerlo in pubblico.</p>
    <div class="inl"><button class="btn sm" data-act="syncNew">Crea un nuovo codice</button><input type="text" id="synccode" placeholder="oppure incolla un codice" style="width:260px"><button class="btn ghost sm" data-act="syncJoin">Collega</button></div>
    <p class="small" id="syncstat">${esc(syncText())}</p>`;
  return `<p><b>Salvataggio condiviso attivo.</b> <span id="syncstat">${esc(syncText())}</span></p>
    <div class="inl"><button class="btn sm" data-act="syncCopy">Copia il link da condividere</button><button class="btn ghost sm" data-act="syncOff">Scollega questo dispositivo</button></div>`;
}

/* ---------- avvio ---------- */
render();
(function () {
  const m = location.hash.match(/^#v=([a-z0-9]{16,64})$/i);
  if (m && SB) { history.replaceState(null, '', location.pathname + location.search); if (!S.sync || S.sync.code !== m[1]) connect(m[1]); }
  else pull(true);
  setInterval(() => pull(true), 25000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(true); });
})();
(function () {
  const old = !S.rate.ts || (Date.now() - new Date(S.rate.ts).getTime()) > 6 * 3600 * 1000;
  if (!S.rate.manual && old) fetchRate(true);
})();
