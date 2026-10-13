(() => {
'use strict';

const D = window.APP_DATA;
const KEY = 'palestra.v1';

/* ---------- utilità ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => keyOf(new Date());
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const wdIndex = d => (d.getDay() + 6) % 7; // 0 = lunedì
const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAYS_FULL = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
const fmtLong = d => d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = k => fromKey(k).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
const fmtShortWd = k => fromKey(k).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const num = v => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fmtN = n => (Math.round(n * 100) / 100).toString().replace('.', ',');
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- stato salvato nel telefono ---------- */
const defaults = () => ({
  v: 1,
  workouts: clone(D.workouts),
  week: ['train', 'rest', 'train', 'rest', 'train', 'rest', 'rest'], // lun..dom: train | rest | off
  days: {},
  choices: {},
  toppings: {},
  shop: { bought: {}, have: {} },
  weights: [{ d: D.diet.start, kg: D.diet.startWeight }],
  settings: { rest: 90 }
});

function load() {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = Object.assign(base, JSON.parse(raw));
      s.settings = Object.assign({ rest: 90 }, s.settings);
      s.shop = Object.assign({ bought: {}, have: {} }, s.shop);
      return s;
    }
  } catch (e) { /* dati non leggibili: si riparte dai predefiniti */ }
  return base;
}

let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Salvataggio non riuscito'); }
}

const ui = { tab: 'oggi', dietView: 'train', exId: null };

/* ---------- giorno corrente ---------- */
function dayRec(k) {
  const d = S.days[k] || (S.days[k] = {});
  d.sets ||= {}; d.meals ||= {}; d.names ||= {}; d.count ||= {};
  return d;
}
const getSets = (k, exId) => S.days[k]?.sets?.[exId] || [];
const hasDone = rec => Object.values(rec?.sets || {}).some(arr => arr.some(s => s && s.done));

function dayType(k) {
  const t = S.days[k]?.type;
  if (t) return t;
  return S.week[wdIndex(fromKey(k))] === 'train' ? 'train' : 'rest';
}

function suggestedWid(k) {
  const past = Object.keys(S.days).filter(d => d < k && S.days[d].wid && hasDone(S.days[d])).sort();
  if (!past.length) return S.workouts[0].id;
  const i = S.workouts.findIndex(w => w.id === S.days[past[past.length - 1]].wid);
  return S.workouts[(i + 1) % S.workouts.length].id;
}

function workoutFor(k) {
  const id = S.days[k]?.wid;
  return S.workouts.find(w => w.id === id) || S.workouts.find(w => w.id === suggestedWid(k)) || S.workouts[0];
}

const findEx = id => workoutFor(todayKey()).exercises.find(e => e.id === id);
const rowCount = (k, ex) => S.days[k]?.count?.[ex.id] ?? (ex.sets || 3);
const colorClass = w => `d-${w.color}`;

function ensureSet(k, ex, i) {
  const d = dayRec(k);
  d.wid = workoutFor(k).id;
  d.type = 'train';
  d.names[ex.id] = ex.name;
  const arr = d.sets[ex.id] || (d.sets[ex.id] = []);
  if (!arr[i]) arr[i] = { kg: null, reps: null, done: false };
  return arr[i];
}

function history(exId) {
  return Object.keys(S.days).sort()
    .map(d => ({ d, sets: getSets(d, exId).filter(s => s && s.done) }))
    .filter(h => h.sets.length);
}
const lastTime = (exId, k) => history(exId).filter(h => h.d < k).pop();

function bestKg(exId, k, skip) {
  // prev: massimo degli allenamenti precedenti; cur: massimo delle altre serie di oggi
  let prev = 0, cur = 0;
  for (const [d, rec] of Object.entries(S.days)) {
    (rec.sets?.[exId] || []).forEach((s, j) => {
      if (!s || !s.done || !s.kg) return;
      if (d === k) { if (j !== skip && s.kg > cur) cur = s.kg; }
      else if (d < k && s.kg > prev) prev = s.kg;
    });
  }
  return { prev, cur };
}

function setsText(sets) {
  const kgs = new Set(sets.map(s => s.kg));
  if (kgs.size === 1) {
    const kg = sets[0].kg;
    return `${kg != null ? fmtN(kg) + ' kg' : 'corpo libero'}, ${sets.map(s => s.reps ?? '?').join(' ')} rip`;
  }
  return sets.map(s => `${s.kg != null ? fmtN(s.kg) : '-'}×${s.reps ?? '?'}`).join(', ');
}

function targetText(ex) {
  if (!(ex.sets && ex.reps)) return 'Da definire';
  return `${ex.sets} serie da ${ex.reps}, ${ex.kg != null ? fmtN(ex.kg) + ' kg' : 'corpo libero'}`;
}

/* ---------- dieta ---------- */
const itemFood = it => it.choices
  ? (it.choices.includes(S.choices[it.id]) ? S.choices[it.id] : it.choices[0])
  : it.food;
const itemTopping = it => {
  if (!it.toppings) return null;
  return it.toppings.includes(S.toppings[it.id]) ? S.toppings[it.id] : it.toppings[0];
};

function itemHtml(it) {
  const fid = itemFood(it);
  const main = it.choices
    ? `<select data-chg="choice" data-item="${it.id}" aria-label="Scelta dell'alimento">${it.choices.map(c =>
        `<option value="${c}"${c === fid ? ' selected' : ''}>${esc(D.food[c].name)}</option>`).join('')}</select>`
    : `<span>${esc(D.food[fid].name)}</span>`;
  let top = '';
  if (it.toppings) {
    const t = itemTopping(it);
    top = `<select class="sub" data-chg="topping" data-item="${it.id}" aria-label="Condimento">${it.toppings.map(c =>
      `<option value="${c}"${c === t ? ' selected' : ''}>${esc(D.toppings[c].label)}</option>`).join('')}</select>`;
  }
  return `<li><div class="food">${main}${top}</div><b class="g">${it.g} g</b></li>`;
}

function macrosHtml(t) {
  const d = D.diet[t];
  const cell = (label, val, unit, pct) =>
    `<div><dt>${label}${pct != null ? ', ' + fmtN(pct) + '%' : ''}</dt><dd>${val}<small> ${unit}</small></dd></div>`;
  return `<dl class="macros">${cell('Calorie', d.kcal, 'kcal')}${cell('Proteine', d.p, 'g', d.pct.p)}${cell('Carboidrati', d.c, 'g', d.pct.c)}${cell('Grassi', d.f, 'g', d.pct.f)}</dl>`;
}

function mealsHtml(t, date) {
  const rec = date ? S.days[date] : null;
  return D.diet[t].meals.map(m => {
    const done = !!rec?.meals?.[m.id];
    const tick = date
      ? `<button class="tick" data-act="meal" data-id="${m.id}" aria-pressed="${done}" aria-label="${m.name}: segna come mangiato">${done ? 'Mangiato' : 'Segna'}</button>`
      : '';
    return `<section class="meal${done ? ' done' : ''}">
      <div class="meal-head"><h3>${m.name}</h3><span class="time">${m.time}</span>${tick}</div>
      <ul class="items">${m.items.map(itemHtml).join('')}</ul>
    </section>`;
  }).join('') + macrosHtml(t);
}

function checkInfo() {
  const s = fromKey(D.diet.start);
  const c = new Date(s.getFullYear(), s.getMonth(), s.getDate() + D.diet.weeks * 7);
  const days = Math.round((c - fromKey(todayKey())) / 86400000);
  const when = c.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  if (days > 1) return `Controllo il ${when}, tra ${days} giorni.`;
  if (days === 1) return `Controllo domani, ${when}.`;
  if (days === 0) return 'Controllo oggi.';
  return `Il controllo era previsto il ${when}.`;
}

/* ---------- schermata: Oggi ---------- */
function nextTrain() {
  const t = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
    if (S.week[wdIndex(d)] === 'train') return i === 1 ? 'domani' : DAYS_FULL[wdIndex(d)];
  }
  return null;
}

function exHtml(k, ex) {
  const n = rowCount(k, ex);
  const last = lastTime(ex.id, k);
  const rows = Array.from({ length: n }, (_, i) => {
    const r = getSets(k, ex.id)[i];
    const kg = r?.kg ?? ex.kg;
    const reps = r?.reps ?? ex.reps;
    const done = !!r?.done;
    return `<div class="set" data-i="${i}">
      <span class="n">${i + 1}</span>
      <label class="fld"><input class="kg" data-inp="set" inputmode="decimal" value="${kg == null ? '' : fmtN(kg)}" aria-label="Chili, serie ${i + 1}"><span>kg</span></label>
      <label class="fld"><input class="reps" data-inp="set" inputmode="numeric" value="${reps ?? ''}" aria-label="Ripetizioni, serie ${i + 1}"><span>rip</span></label>
      <button class="plate${done ? ' done' : ''}" data-act="plate" aria-pressed="${done}" aria-label="Serie ${i + 1} completata"></button>
    </div>`;
  }).join('');
  return `<article class="ex" data-ex="${ex.id}">
    <div class="ex-head"><h3>${esc(ex.name)}</h3><p class="tgt">${esc(targetText(ex))}</p></div>
    ${ex.note ? `<p class="last">${esc(ex.note)}</p>` : ''}
    ${last ? `<p class="last">Ultima volta, ${fmtShort(last.d)}: ${esc(setsText(last.sets))}</p>` : ''}
    <div class="sets">${rows}</div>
    <div class="ex-actions"><button class="lnk" data-act="addset">Aggiungi serie</button><button class="lnk" data-act="rmset">Togli l'ultima</button></div>
  </article>`;
}

function workoutBlock(k) {
  const w = workoutFor(k);
  const chips = S.workouts.map(x =>
    `<button class="chip ${colorClass(x)}${x.id === w.id ? ' on' : ''}" data-act="wid" data-id="${x.id}" aria-pressed="${x.id === w.id}">${esc(x.name)}</button>`).join('');
  const total = w.exercises.reduce((a, ex) => a + rowCount(k, ex), 0);
  const done = w.exercises.reduce((a, ex) => a + getSets(k, ex.id).filter(s => s && s.done).length, 0);
  const auto = !S.days[k]?.wid && done === 0;
  return `<section class="workout ${colorClass(w)}">
    <div class="chips" role="group" aria-label="Giorno di scheda">${chips}</div>
    <div class="wk-head"><h2>${esc(w.name)}</h2><p class="prog" data-prog>${done} di ${total} serie</p></div>
    ${auto ? '<p class="sub tight">È il prossimo in rotazione. Tocca un altro giorno per cambiarlo.</p>' : ''}
    ${w.exercises.map(ex => exHtml(k, ex)).join('')}
    <label class="notes"><span>Note dell'allenamento</span><textarea data-inp="note" rows="2">${esc(S.days[k]?.note || '')}</textarea></label>
  </section>`;
}

function renderOggi() {
  const k = todayKey();
  const type = dayType(k);
  const segBtn = (v, label) => `<button class="${type === v ? 'on' : ''}" data-act="type" data-v="${v}" aria-pressed="${type === v}">${label}</button>`;
  let body;
  if (type === 'train') {
    body = workoutBlock(k);
  } else {
    const nx = nextTrain();
    body = `<p class="rest-note">Giorno di riposo.${nx ? ` Il prossimo allenamento è ${nx}.` : ''}</p>`;
  }
  return `<header class="top"><h1>${fmtLong(new Date())}</h1></header>
    <div class="seg" role="group" aria-label="Tipo di giorno">${segBtn('train', 'Allenamento')}${segBtn('rest', 'Riposo')}</div>
    ${body}
    <section class="meals">
      <h2>Pasti di oggi</h2>
      <p class="sub tight">${type === 'train' ? 'Dieta dei giorni di allenamento.' : 'Dieta dei giorni non allenamento.'}</p>
      ${mealsHtml(type, k)}
    </section>`;
}

/* ---------- schermata: Scheda (modifica) ---------- */
function renderScheda() {
  return `<header class="top"><h1>Scheda</h1><p class="sub">Cambia esercizi, serie, ripetizioni e carichi. Gli allenamenti già registrati restano com'erano.</p></header>`
    + S.workouts.map((w, wi) => `<section class="edit ${colorClass(w)}">
      <h2><span class="dot"></span>${esc(w.name)}</h2>
      ${w.exercises.map((ex, ei) => `<div class="erow" data-w="${wi}" data-e="${ei}">
        <input class="name" data-chg="ex" data-f="name" value="${esc(ex.name)}" aria-label="Nome dell'esercizio">
        <div class="nums">
          <label><span>Serie</span><input data-chg="ex" data-f="sets" inputmode="numeric" value="${ex.sets ?? ''}"></label>
          <label><span>Rip</span><input data-chg="ex" data-f="reps" inputmode="numeric" value="${ex.reps ?? ''}"></label>
          <label><span>Kg</span><input data-chg="ex" data-f="kg" inputmode="decimal" value="${ex.kg == null ? '' : fmtN(ex.kg)}"></label>
        </div>
        <input class="note" data-chg="ex" data-f="note" value="${esc(ex.note || '')}" placeholder="Nota (facoltativa)" aria-label="Nota">
        <button class="lnk danger" data-act="delex" aria-label="Elimina ${esc(ex.name)}">Elimina</button>
      </div>`).join('')}
      <button class="btn" data-act="addex" data-w="${wi}">Aggiungi esercizio</button>
    </section>`).join('');
}

/* ---------- schermata: Dieta ---------- */
function renderDieta() {
  const t = ui.dietView;
  const segBtn = (v, label) => `<button class="${t === v ? 'on' : ''}" data-act="dview" data-v="${v}" data-view="${v}" aria-pressed="${t === v}">${label}</button>`;
  return `<header class="top"><h1>Dieta</h1><p class="sub">${checkInfo()}</p></header>
    <div class="seg" role="group" aria-label="Tipo di giorno">${segBtn('train', 'Allenamento')}${segBtn('rest', 'Riposo')}</div>
    <p class="sub tight">Obiettivo: massa muscolare con meno grasso possibile, con pasti puliti e pochi grassi. Dove vedi la sottolineatura puoi cambiare alimento.</p>
    ${mealsHtml(t, null)}`;
}

/* ---------- schermata: Spesa ---------- */
function shoppingTotals() {
  const tot = {};
  const add = (fid, g, pz, qb) => {
    const t = tot[fid] || (tot[fid] = { g: 0, pz: 0, qb: false });
    t.g += g || 0; t.pz += pz || 0; if (qb) t.qb = true;
  };
  S.week.forEach(ty => {
    if (ty === 'off') return;
    D.diet[ty].meals.forEach(m => m.items.forEach(it => {
      add(itemFood(it), it.g);
      const tp = itemTopping(it);
      const ex = tp && D.toppings[tp].extra;
      if (ex) add(ex.food, 0, ex.pz, ex.qb);
    }));
  });
  return tot;
}

function qtyText(t) {
  const parts = [];
  if (t.g) parts.push(t.g >= 1000 ? `${fmtN(t.g / 1000)} kg` : `${t.g} g`);
  if (t.pz) parts.push(`${t.pz} ${t.pz > 1 ? 'scatolette' : 'scatoletta'}`);
  return parts.length ? parts.join(' + ') : 'q.b.';
}

function shoppingRows() {
  const tot = shoppingTotals();
  return D.cats.map(([cid, label]) => ({
    cid, label,
    items: Object.keys(tot).filter(fid => D.food[fid].cat === cid)
      .sort((a, b) => D.food[a].name.localeCompare(D.food[b].name, 'it'))
      .map(fid => ({ fid, name: D.food[fid].name, t: tot[fid] }))
  })).filter(c => c.items.length);
}

function renderSpesa() {
  const groups = shoppingRows();
  const nTrain = S.week.filter(x => x === 'train').length;
  const nRest = S.week.filter(x => x === 'rest').length;
  const label = { train: 'allenamento', rest: 'riposo', off: 'escluso' };
  const sym = { train: 'A', rest: 'R', off: '–' };
  const week = S.week.map((t, i) =>
    `<button class="wd t-${t}" data-act="wk" data-i="${i}" aria-label="${DAYS_FULL[i]}: ${label[t]}"><span class="dn">${DAYS[i]}</span><span class="st">${sym[t]}</span></button>`).join('');
  const row = (g, inHave) => {
    const bought = !!S.shop.bought[g.fid];
    return `<li class="${bought ? 'got' : ''}">
      ${inHave ? '' : `<button class="box" data-act="bought" data-id="${g.fid}" aria-pressed="${bought}" aria-label="Preso: ${esc(g.name)}"></button>`}
      <span class="nm">${esc(g.name)}</span><b class="q">${qtyText(g.t)}</b>
      <button class="lnk" data-act="have" data-id="${g.fid}">${inHave ? 'Rimetti in lista' : 'Ho già'}</button>
    </li>`;
  };
  const toBuy = groups.map(c => ({ ...c, items: c.items.filter(i => !S.shop.have[i.fid]) })).filter(c => c.items.length);
  const have = groups.flatMap(c => c.items).filter(i => S.shop.have[i.fid]);
  return `<header class="top"><h1>Lista della spesa</h1>
      <p class="sub">${nTrain} ${nTrain === 1 ? 'giorno' : 'giorni'} di allenamento e ${nRest} di riposo nella settimana.</p></header>
    <div class="week" role="group" aria-label="Settimana">${week}</div>
    <p class="legend">Tocca un giorno per cambiarlo: A allenamento, R riposo, il trattino lo esclude dalla spesa.</p>
    ${toBuy.map(c => `<section class="shop"><h2>${c.label}</h2><ul class="list">${c.items.map(g => row(g, false)).join('')}</ul></section>`).join('')}
    ${have.length ? `<section class="shop"><h2>Già in casa</h2><ul class="list">${have.map(g => row(g, true)).join('')}</ul></section>` : ''}
    <div class="btns"><button class="btn solid" data-act="copy">Copia la lista</button><button class="btn" data-act="clearbought">Azzera le spunte</button></div>
    <p class="sub tight">Le quantità cambiano con le scelte fatte nella dieta, come tipo di carne, pesce, riso e condimento.</p>`;
}

/* ---------- schermata: Storico ---------- */
function chart(points, unit) {
  if (points.length < 2) return '<p class="empty">Il grafico compare dopo due rilevazioni.</p>';
  const W = 320, H = 140, mx = 34, my = 22;
  const ys = points.map(p => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const X = i => mx + i * (W - mx - 12) / (points.length - 1);
  const Y = v => H - my - (v - lo) * (H - 2 * my) / (hi - lo);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.5"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento: ${esc(unit)}">
    <text x="2" y="${(Y(hi) + 4).toFixed(1)}">${fmtN(hi)}</text><text x="2" y="${(Y(lo) + 4).toFixed(1)}">${fmtN(lo)}</text>
    <path d="${line}"/>${dots}
    <text x="${mx}" y="${H - 4}">${esc(points[0].x)}</text><text x="${W - 12}" y="${H - 4}" text-anchor="end">${esc(points[points.length - 1].x)}</text>
  </svg>`;
}

function renderStorico() {
  const ws = S.weights;
  const cur = ws[ws.length - 1], first = ws[0];
  const diff = cur.kg - first.kg;
  const exs = S.workouts.flatMap(x => x.exercises.map(e => ({ id: e.id, name: e.name })));
  if (!exs.some(e => e.id === ui.exId)) ui.exId = (exs.find(e => history(e.id).length) || exs[0] || {}).id;
  const hist = ui.exId ? history(ui.exId) : [];
  const useReps = hist.length && hist.every(h => h.sets.every(s => !s.kg));
  const pts = hist.map(h => ({
    x: fmtShort(h.d),
    y: useReps ? h.sets.reduce((a, s) => a + (s.reps || 0), 0) : Math.max(...h.sets.map(s => s.kg || 0))
  }));
  const sessions = Object.keys(S.days).sort().reverse().filter(d => hasDone(S.days[d])).slice(0, 8);
  const sessHtml = sessions.map(d => {
    const rec = S.days[d];
    const w = S.workouts.find(x => x.id === rec.wid);
    const sets = Object.values(rec.sets).flat().filter(s => s && s.done);
    const vol = Math.round(sets.reduce((a, s) => a + (s.kg || 0) * (s.reps || 0), 0));
    return `<li><b>${esc(fmtShortWd(d))}</b><span>${esc(w ? w.name : 'Allenamento')}</span><span class="r">${sets.length} serie, ${vol.toLocaleString('it-IT')} kg sollevati</span></li>`;
  }).join('');
  const lastEx = hist.slice(-5).reverse().map(h => `<li><b>${esc(fmtShort(h.d))}</b><span class="r">${esc(setsText(h.sets))}</span></li>`).join('');
  return `<header class="top"><h1>Storico</h1></header>
    <section class="blk">
      <h2>Peso corporeo</h2>
      <p class="big">${fmtN(cur.kg)}<small> kg</small></p>
      <p class="sub tight">${diff === 0 ? 'Uguale al peso di partenza' : `${diff > 0 ? '+' : ''}${fmtN(diff)} kg dal ${fmtShort(first.d)}`}</p>
      ${chart(ws.slice(-24).map(w => ({ x: fmtShort(w.d), y: w.kg })), 'peso in kg')}
      <div class="inline"><label class="fld wide"><input id="w-in" inputmode="decimal" placeholder="${fmtN(cur.kg)}" aria-label="Peso di oggi in chili"><span>kg</span></label><button class="btn solid" data-act="wsave">Salva il peso</button></div>
    </section>
    <section class="blk">
      <h2>Esercizio</h2>
      <select class="pick" data-chg="exsel" aria-label="Esercizio">${exs.map(e => `<option value="${e.id}"${e.id === ui.exId ? ' selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
      <p class="sub tight">${useReps ? 'Ripetizioni totali per allenamento' : 'Carico massimo per allenamento, in kg'}</p>
      ${hist.length ? chart(pts, useReps ? 'ripetizioni' : 'kg') + `<ul class="rows">${lastEx}</ul>` : '<p class="empty">Nessuna serie completata per questo esercizio.</p>'}
    </section>
    <section class="blk">
      <h2>Ultimi allenamenti</h2>
      ${sessHtml ? `<ul class="rows">${sessHtml}</ul>` : '<p class="empty">Quando completi delle serie compaiono qui.</p>'}
    </section>
    <section class="blk">
      <h2>Impostazioni e dati</h2>
      <label class="setting"><span>Recupero tra le serie</span>
        <select data-chg="rest" aria-label="Secondi di recupero">${[45, 60, 90, 120, 150, 180, 240].map(s => `<option value="${s}"${S.settings.rest === s ? ' selected' : ''}>${s >= 60 ? Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '') : s + ' s'}</option>`).join('')}</select></label>
      <p class="sub tight">I dati restano su questo telefono. Salva ogni tanto un backup.</p>
      <div class="btns"><button class="btn" data-act="export">Esporta il backup</button>
        <label class="btn">Importa un backup<input type="file" accept="application/json,.json" data-chg="import" hidden></label>
        <button class="btn danger" data-act="reset">Cancella tutto</button></div>
    </section>`;
}

/* ---------- disegno ---------- */
const screens = { oggi: renderOggi, scheda: renderScheda, dieta: renderDieta, spesa: renderSpesa, storico: renderStorico };
let renderedDay = todayKey();

function render(keep) {
  const y = window.scrollY || 0;
  renderedDay = todayKey();
  $('#app').innerHTML = screens[ui.tab]();
  $$('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
  try { window.scrollTo(0, keep ? y : 0); } catch (e) { /* ambienti senza scroll */ }
  keepAwake(ui.tab === 'oggi' && dayType(todayKey()) === 'train');
}

function updateProgress() {
  const el = $('[data-prog]');
  if (el) el.textContent = `${$$('.plate.done').length} di ${$$('.plate').length} serie`;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- timer di recupero ---------- */
let timer = null;
function startTimer(sec) { timer = { end: Date.now() + sec * 1000, total: sec, buzzed: false, doneAt: 0 }; drawTimer(); }
function drawTimer() {
  const el = $('#timer');
  if (!timer) { el.hidden = true; return; }
  const msLeft = timer.end - Date.now();
  const left = Math.ceil(msLeft / 1000);
  if (left <= 0) {
    if (!timer.buzzed) { timer.buzzed = true; timer.doneAt = Date.now(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
    if (Date.now() - timer.doneAt > 5000) { timer = null; el.hidden = true; return; }
  }
  const shown = Math.max(left, 0);
  el.hidden = false;
  $('.t-num', el).textContent = `${Math.floor(shown / 60)}:${pad(shown % 60)}`;
  $('.t-lab', el).textContent = left <= 0 ? 'Prossima serie' : 'Recupero';
  $('.bar', el).style.width = `${Math.max(0, Math.min(100, msLeft / (timer.total * 1000) * 100))}%`;
}
setInterval(drawTimer, 250);

/* ---------- schermo acceso durante l'allenamento ---------- */
let wake = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) {
      if (!wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
    } else if (wake) { await wake.release(); wake = null; }
  } catch (e) { /* non supportato */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (todayKey() !== renderedDay) render(false);
  else keepAwake(ui.tab === 'oggi' && dayType(todayKey()) === 'train');
});

/* ---------- azioni (click) ---------- */
const A = {
  tab(el) { ui.tab = el.dataset.tab; render(false); },
  type(el) { dayRec(todayKey()).type = el.dataset.v; save(); render(true); },
  wid(el) { const d = dayRec(todayKey()); d.wid = el.dataset.id; save(); render(true); },
  dview(el) { ui.dietView = el.dataset.v; render(true); },

  plate(el) {
    const k = todayKey(), row = el.closest('.set'), ex = findEx(el.closest('.ex').dataset.ex), i = +row.dataset.i;
    const r = ensureSet(k, ex, i);
    r.kg = num($('.kg', row).value);
    r.reps = num($('.reps', row).value);
    r.done = !r.done;
    el.classList.toggle('done', r.done);
    el.setAttribute('aria-pressed', String(r.done));
    if (r.done) {
      startTimer(S.settings.rest);
      const best = bestKg(ex.id, k, i);
      if (r.kg && best.prev > 0 && r.kg > best.prev && r.kg > best.cur) toast(`Nuovo massimo: ${fmtN(r.kg)} kg su ${ex.name}`);
    }
    save();
    updateProgress();
  },
  addset(el) {
    const k = todayKey(), ex = findEx(el.closest('.ex').dataset.ex);
    const d = dayRec(k); d.wid = workoutFor(k).id; d.type = 'train';
    d.count[ex.id] = rowCount(k, ex) + 1;
    save(); render(true);
  },
  rmset(el) {
    const k = todayKey(), ex = findEx(el.closest('.ex').dataset.ex);
    const d = dayRec(k); d.wid = workoutFor(k).id; d.type = 'train';
    const n = Math.max(1, rowCount(k, ex) - 1);
    d.count[ex.id] = n;
    if (d.sets[ex.id]) d.sets[ex.id].length = Math.min(d.sets[ex.id].length, n);
    save(); render(true);
  },
  meal(el) { const d = dayRec(todayKey()); d.meals[el.dataset.id] = !d.meals[el.dataset.id]; save(); render(true); },

  wk(el) {
    const i = +el.dataset.i, order = ['train', 'rest', 'off'];
    S.week[i] = order[(order.indexOf(S.week[i]) + 1) % 3];
    save(); render(true);
  },
  bought(el) { S.shop.bought[el.dataset.id] = !S.shop.bought[el.dataset.id]; save(); render(true); },
  have(el) { S.shop.have[el.dataset.id] = !S.shop.have[el.dataset.id]; save(); render(true); },
  clearbought() { S.shop.bought = {}; save(); render(true); },
  copy() {
    const lines = ['Lista della spesa'];
    shoppingRows().forEach(c => {
      const items = c.items.filter(i => !S.shop.have[i.fid]);
      if (!items.length) return;
      lines.push('', c.label);
      items.forEach(i => lines.push(`- ${i.name}: ${qtyText(i.t)}`));
    });
    const text = lines.join('\n');
    const ok = () => toast('Lista copiata');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok, () => toast('Copia non riuscita'));
    else toast('Copia non disponibile su questo browser');
  },

  wsave() {
    const v = num($('#w-in').value);
    if (v == null || v < 20 || v > 300) return toast('Inserisci un peso valido');
    const d = todayKey(), e = S.weights.find(x => x.d === d);
    if (e) e.kg = v; else S.weights.push({ d, kg: v });
    S.weights.sort((a, b) => (a.d < b.d ? -1 : 1));
    save(); render(true); toast('Peso salvato');
  },
  export() {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `palestra-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  },
  reset() {
    if (!confirm('Cancellare scheda, allenamenti registrati e peso? Non si può annullare.')) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* niente */ }
    S = defaults(); render(false); toast('Dati cancellati');
  },

  addex(el) {
    S.workouts[+el.dataset.w].exercises.push({ id: uid(), name: 'Nuovo esercizio', sets: 3, reps: 10, kg: null });
    save(); render(true);
  },
  delex(el) {
    const row = el.closest('.erow');
    if (!confirm('Eliminare questo esercizio dalla scheda?')) return;
    S.workouts[+row.dataset.w].exercises.splice(+row.dataset.e, 1);
    save(); render(true);
  },

  tadd() { if (timer) { timer.end += 15000; timer.total += 15; timer.buzzed = false; } drawTimer(); },
  tstop() { timer = null; drawTimer(); }
};

/* ---------- azioni (cambio valore) ---------- */
const C = {
  choice(el) { S.choices[el.dataset.item] = el.value; save(); render(true); },
  topping(el) { S.toppings[el.dataset.item] = el.value; save(); render(true); },
  exsel(el) { ui.exId = el.value; render(true); },
  rest(el) { S.settings.rest = +el.value; save(); },
  ex(el) {
    const row = el.closest('.erow'), ex = S.workouts[+row.dataset.w].exercises[+row.dataset.e];
    const f = el.dataset.f, v = el.value.trim();
    if (f === 'name') ex.name = v || 'Esercizio';
    else if (f === 'note') ex.note = v;
    else if (f === 'kg') ex.kg = num(v);
    else ex[f] = v === '' ? null : (Math.max(0, parseInt(v, 10) || 0) || null);
    save();
  },
  import(el) {
    const file = el.files && el.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if (!data || !Array.isArray(data.workouts) || typeof data.days !== 'object') throw new Error('formato');
        S = Object.assign(defaults(), data);
        save(); render(false); toast('Backup importato');
      } catch (e) { toast('File non valido'); }
    };
    fr.readAsText(file);
  }
};

/* ---------- azioni (digitazione) ---------- */
const I = {
  set(el) {
    const k = todayKey(), row = el.closest('.set'), ex = findEx(el.closest('.ex').dataset.ex);
    const r = ensureSet(k, ex, +row.dataset.i);
    r.kg = num($('.kg', row).value);
    r.reps = num($('.reps', row).value);
    save();
  },
  note(el) { dayRec(todayKey()).note = el.value; save(); }
};

document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && A[el.dataset.act]) A[el.dataset.act](el, e); });
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && C[el.dataset.chg]) C[el.dataset.chg](el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (el && I[el.dataset.inp]) I[el.dataset.inp](el, e); });

/* ---------- avvio ---------- */
render(false);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
