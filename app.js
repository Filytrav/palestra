(() => {
'use strict';

const D = window.APP_DATA;
const VZ = window.VZ;
const KEY = 'palestra.v1';      // stessa chiave delle versioni precedenti: i dati si conservano
const VERSION = '1.5';

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
const fmtInt = n => Math.round(n).toLocaleString('it-IT');
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const recText = s => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}` : `${s} s`);
const shortMeal = m => (m.name.startsWith('Spuntino') ? 'Spuntino' : m.name);
const groupName = id => (D.groups.find(g => g[0] === id) || D.groups[D.groups.length - 1])[1];
const kgText = v => (v == null ? 'corpo libero' : `${fmtN(v)} kg`);

/* ---------- varianti e gruppi: struttura di un esercizio ----------
   Esercizio semplice:   { id, name, group, sets, reps, kg, note }
   Con varianti:         { id, name, group, note, variants: [{ id, name, sets, reps, kg }] }
   Le serie registrate stanno sotto una chiave: id dell'esercizio, oppure id~variante. */
const hasVars = ex => Array.isArray(ex.variants) && ex.variants.length > 0;
const skey = (ex, v) => (v ? `${ex.id}~${v.id}` : ex.id);
const plan = (ex, v) => (v ? { name: v.name, sets: v.sets, reps: v.reps, kg: v.kg, note: ex.note } : { name: ex.name, sets: ex.sets, reps: ex.reps, kg: ex.kg, note: ex.note });

/* sposta le serie già registrate di un esercizio sotto la chiave della sua prima variante */
function moveHistory(s, exId, toKey, name, group) {
  Object.values(s.days).forEach(d => {
    if (d.sets && d.sets[exId]) { d.sets[toKey] = d.sets[exId]; delete d.sets[exId]; }
    if (d.count && d.count[exId] != null) { d.count[toKey] = d.count[exId]; delete d.count[exId]; }
    if (d.names && d.sets && d.sets[toKey]) d.names[toKey] = name;
    if (d.grp && d.sets && d.sets[toKey]) d.grp[toKey] = group;
    if (d.sets && d.sets[toKey]) { d.variant ||= {}; d.variant[exId] = toKey.split('~')[1]; }
  });
}
function toVariants(s, ex, variants) {
  ex.variants = variants;
  delete ex.sets; delete ex.reps; delete ex.kg;
  moveHistory(s, ex.id, skey(ex, variants[0]), variants[0].name, ex.group);
}

/* ---------- stato salvato nel telefono ---------- */
const WEEK_DEFAULT = ['rest', 'train', 'rest', 'train', 'rest', 'train', 'rest'];

function migrate(s) {
  s = (s && typeof s === 'object') ? s : {};
  s.settings = Object.assign({ rest: 90, theme: 'apple' }, s.settings);
  if (!['apple', 'dark', 'sport'].includes(s.settings.theme)) s.settings.theme = 'apple';
  s.shop = Object.assign({ bought: {}, have: {} }, s.shop);
  s.shop.bought ||= {}; s.shop.have ||= {};
  s.choices ||= {}; s.toppings ||= {}; s.days ||= {};
  s.week = Array.isArray(s.week) && s.week.length === 7 ? s.week : WEEK_DEFAULT.slice();
  s.weights = Array.isArray(s.weights) && s.weights.length ? s.weights : [{ d: D.diet.start, kg: D.diet.startWeight }];
  s.workouts = Array.isArray(s.workouts) && s.workouts.length ? s.workouts : clone(D.workouts);

  // giorni registrati: la v1.1 teneva i pasti in due posti, qui li uniamo
  Object.values(s.days).forEach(d => {
    d.sets ||= {}; d.meals ||= {}; d.names ||= {}; d.count ||= {}; d.grp ||= {}; d.variant ||= {};
    const q = d.quick || {};
    ['colazione', 'pranzo', 'spuntino', 'cena'].forEach(m => { if (q[m]) d.meals[m] = true; });
    d.quick = { creatina: !!q.creatina };
    delete d.introDone;
  });

  // scheda: gruppo muscolare e varianti
  s.workouts.forEach(w => (w.exercises || []).forEach(ex => {
    if (!ex.group) ex.group = D.exGroup[ex.id] || 'altro';
    const defs = D.variantDefs[ex.id];
    if (defs && !hasVars(ex)) {
      const split = defs[0].kg != null && ex.kg === defs[0].kg;
      const vs = defs.map(df => ({ id: df.id, name: df.name, sets: ex.sets, reps: ex.reps, kg: split ? df.kg : ex.kg }));
      if (ex.note === 'Carico indicato in scheda: 14/12') delete ex.note;
      toVariants(s, ex, vs);
      // la prima variante eredita le serie già registrate: il suo carico di scheda parte dal massimo usato
      const used = Object.values(s.days).flatMap(d => (d.sets?.[skey(ex, vs[0])] || []).filter(x => x && x.done && x.kg)).map(x => x.kg);
      if (used.length) vs[0].kg = Math.max(...used);
    }
  }));
  s.v = 2;
  return s;
}

const defaults = () => migrate(clone(D.seed));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* dati non leggibili: si riparte dai dati di base */ }
  return defaults();
}

let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Salvataggio non riuscito'); }
}

const ui = {
  tab: 'oggi', view: 'home', dietView: 'train', stView: 'progressi',
  pg: { period: '30', key: null, metric: 'kg', mg: 'sets' }
};

/* ---------- giorno corrente ---------- */
function dayRec(k) {
  const d = S.days[k] || (S.days[k] = {});
  d.sets ||= {}; d.meals ||= {}; d.names ||= {}; d.count ||= {}; d.grp ||= {}; d.variant ||= {}; d.quick ||= {};
  return d;
}
const getSets = (k, key) => S.days[k]?.sets?.[key] || [];
const doneSets = (rec, key) => ((rec && rec.sets && rec.sets[key]) || []).filter(s => s && s.done);
const hasDone = rec => Object.values(rec?.sets || {}).some(arr => arr.some(s => s && s.done));

function dayType(k) {
  const t = S.days[k]?.type;
  if (t === 'train' || t === 'rest') return t;
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

/* variante scelta per oggi: quella segnata, altrimenti l'ultima usata, altrimenti la prima */
function selVariant(k, ex) {
  if (!hasVars(ex)) return null;
  const hit = ex.variants.find(v => v.id === S.days[k]?.variant?.[ex.id]);
  if (hit) return hit;
  const days = Object.keys(S.days).filter(d => d <= k).sort().reverse();
  for (const d of days) {
    const v = ex.variants.find(x => doneSets(S.days[d], skey(ex, x)).length);
    if (v) return v;
  }
  return ex.variants[0];
}

const rowCount = (k, key, p) => S.days[k]?.count?.[key] ?? (p.sets || 3);

function ensureSet(k, ex, v, key, p, i) {
  const d = dayRec(k);
  d.wid = workoutFor(k).id;
  d.type = 'train';
  d.names[key] = p.name;
  d.grp[key] = ex.group || 'altro';
  if (v) d.variant[ex.id] = v.id;
  const arr = d.sets[key] || (d.sets[key] = []);
  if (!arr[i]) arr[i] = { kg: null, reps: null, done: false };
  return arr[i];
}

function workoutProgress(k, w) {
  let total = 0, done = 0;
  w.exercises.forEach(ex => {
    const v = selVariant(k, ex), p = plan(ex, v), key = skey(ex, v);
    total += rowCount(k, key, p);
    done += getSets(k, key).filter(s => s && s.done).length;
  });
  return { total, done };
}

function nextSet(k, w) {
  for (const ex of w.exercises) {
    const v = selVariant(k, ex), p = plan(ex, v), key = skey(ex, v);
    const n = rowCount(k, key, p), arr = getSets(k, key);
    for (let i = 0; i < n; i++) if (!(arr[i] && arr[i].done)) return { name: p.name, i };
  }
  return null;
}

function metaText(pr, nx) {
  if (nx) return `Prossima serie: ${nx.name}, serie ${nx.i + 1}. Recupero ${recText(S.settings.rest)}.`;
  return pr.total ? 'Allenamento completato. Ottimo lavoro.' : `Recupero ${recText(S.settings.rest)}.`;
}

function history(key) {
  return Object.keys(S.days).sort()
    .map(d => ({ d, sets: doneSets(S.days[d], key) }))
    .filter(h => h.sets.length);
}
const lastTime = (key, k) => history(key).filter(h => h.d < k).pop();
function lastKg(key) {
  const h = history(key).pop();
  if (!h) return null;
  const m = Math.max(...h.sets.map(s => s.kg || 0));
  return m > 0 ? m : null;
}

function bestKg(key, k, skip) {
  // prev: massimo degli allenamenti precedenti; cur: massimo delle altre serie di oggi
  let prev = 0, cur = 0;
  for (const [d, rec] of Object.entries(S.days)) {
    (rec.sets?.[key] || []).forEach((s, j) => {
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

function targetText(p) {
  if (!(p.sets && p.reps)) return 'Da definire';
  return `${p.sets} serie da ${p.reps}, ${kgText(p.kg)}`;
}

/* ---------- dieta ---------- */
const itemFood = it => (it.choices
  ? (it.choices.includes(S.choices[it.id]) ? S.choices[it.id] : it.choices[0])
  : it.food);
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
    top = `<select class="sub2" data-chg="topping" data-item="${it.id}" aria-label="Condimento">${it.toppings.map(c =>
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

function mealCard(m, date) {
  const done = !!(date && S.days[date]?.meals?.[m.id]);
  const check = date
    ? `<button class="check${done ? ' done' : ''}" data-act="meal" data-id="${m.id}" aria-pressed="${done}" aria-label="${esc(m.name)}: segna come fatto"></button>`
    : '';
  return `<section class="meal-card${done ? ' done' : ''}">
    <div class="meal-head"><h3>${esc(m.name)}</h3><small>${m.time}</small>${check}</div>
    <ul class="items">${m.items.map(itemHtml).join('')}</ul>
  </section>`;
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

function nextTrain() {
  const t = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
    if (S.week[wdIndex(d)] === 'train') return i === 1 ? 'domani' : DAYS_FULL[wdIndex(d)];
  }
  return null;
}

/* ---------- schermata: Oggi ---------- */
const ICON = {
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  bowl: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.5 1.5-1.5 1.5-3M14 7c0-1.5 1.5-1.5 1.5-3"/>',
  go: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>'
};
const svg = (p, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;

function segDay(type) {
  const b = (v, label) => `<button class="${type === v ? 'on' : ''}" data-act="type" data-v="${v}" aria-pressed="${type === v}">${label}</button>`;
  return `<div class="seg" role="group" aria-label="Tipo di giorno">${b('train', 'Allenamento')}${b('rest', 'Riposo')}</div>`;
}

function renderHome() {
  const k = todayKey(), d = dayRec(k), type = dayType(k), train = type === 'train';
  const w = workoutFor(k), pr = workoutProgress(k, w);
  const meals = D.diet[type].meals;
  const mdone = meals.filter(m => d.meals[m.id]).length;
  const nextMeal = meals.find(m => !d.meals[m.id]);
  const nx = nextTrain();
  const wp = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
  const mp = Math.round(mdone / meals.length * 100);

  const work = `<button class="big-btn" data-act="open" data-v="workout"${train ? '' : ' disabled'} aria-label="Allenamento">
      <div class="big-top"><span class="big-ico">${svg(ICON.dumbbell)}</span>${svg(ICON.go, 'big-go')}</div>
      <div><h2>Allenamento</h2>
        <p>${train ? `${esc(w.name)}, ${pr.done} di ${pr.total} serie` : `Oggi è riposo${nx ? `. Prossimo allenamento: ${nx}` : ''}`}</p>
        <div class="meter"><i style="--w:${train ? wp : 0}%"></i></div></div>
    </button>`;
  const diet = `<button class="big-btn" data-act="open" data-v="meals" aria-label="Dieta">
      <div class="big-top"><span class="big-ico">${svg(ICON.bowl)}</span>${svg(ICON.go, 'big-go')}</div>
      <div><h2>Dieta</h2>
        <p>${mdone} di ${meals.length} pasti${nextMeal ? `. Prossimo: ${esc(shortMeal(nextMeal))}, ${nextMeal.time}` : '. Tutto fatto per oggi'}</p>
        <div class="meter"><i style="--w:${mp}%"></i></div></div>
    </button>`;
  const quick = `<section class="quick"><h3>Segna al volo</h3><div class="quick-row">
      <button class="mini-toggle${d.quick.creatina ? ' on' : ''}" data-act="creatina" aria-pressed="${!!d.quick.creatina}">Creatina</button>
      ${meals.map(m => `<button class="mini-toggle${d.meals[m.id] ? ' on' : ''}" data-act="meal" data-id="${m.id}" aria-pressed="${!!d.meals[m.id]}">${esc(shortMeal(m))}</button>`).join('')}
    </div></section>`;
  return `<div class="home">
    <h1 class="date">${esc(fmtLong(new Date()))}</h1>
    ${segDay(type)}
    <div class="home-grid">${work}${diet}</div>
    ${quick}
  </div>`;
}

const subhead = () => `<div class="subhead"><button class="back" data-act="home" aria-label="Torna a Oggi">${svg(ICON.back)}</button><h1 class="date">${esc(fmtLong(new Date()))}</h1></div>`;

function exHtml(k, ex) {
  const v = selVariant(k, ex), p = plan(ex, v), key = skey(ex, v);
  const n = rowCount(k, key, p);
  const last = lastTime(key, k);
  const best = bestKg(key, k, -1).prev;
  const chips = hasVars(ex) && ex.variants.length > 1
    ? `<div class="var-row" role="group" aria-label="Scegli l'esercizio">${ex.variants.map(x => {
        const kg = lastKg(skey(ex, x)) ?? x.kg;
        return `<button class="var-chip${x.id === v.id ? ' on' : ''}" data-act="variant" data-ex="${esc(ex.id)}" data-v="${esc(x.id)}" aria-pressed="${x.id === v.id}"><span>${esc(x.name)}</span><small>${kg != null ? fmtN(kg) + ' kg' : 'da definire'}</small></button>`;
      }).join('')}</div>`
    : '';
  const rows = Array.from({ length: n }, (_, i) => {
    const r = getSets(k, key)[i];
    const kg = r?.kg ?? (v ? (lastKg(key) ?? p.kg) : p.kg);   // varianti: parte dall'ultimo peso usato con quell'esercizio
    const reps = r?.reps ?? p.reps;
    const done = !!r?.done;
    return `<div class="set-row" data-i="${i}">
      <div class="n">${i + 1}</div>
      <label class="field"><input class="kg" data-inp="set" inputmode="decimal" value="${kg == null ? '' : fmtN(kg)}" aria-label="Chili, serie ${i + 1}"><span>kg</span></label>
      <label class="field"><input class="reps" data-inp="set" inputmode="numeric" value="${reps ?? ''}" aria-label="Ripetizioni, serie ${i + 1}"><span>rip</span></label>
      <button class="plate${done ? ' done' : ''}" data-act="plate" aria-pressed="${done}" aria-label="Serie ${i + 1} completata"></button>
    </div>`;
  }).join('');
  const info = [
    p.note ? esc(p.note) : '',
    last ? `Ultima volta, ${fmtShort(last.d)}: ${esc(setsText(last.sets))}` : '',
    best > 0 ? `Massimo: ${fmtN(best)} kg` : ''
  ].filter(Boolean).join(' · ');
  return `<article class="exercise" data-ex="${esc(ex.id)}">
    ${chips}
    <div class="exercise-head"><h3>${esc(p.name)}</h3><small>${esc(targetText(p))}</small></div>
    ${info ? `<p class="last">${info}</p>` : ''}
    <div class="sets">${rows}</div>
    <div class="ex-actions"><button class="lnk" data-act="addset">Aggiungi serie</button><button class="lnk" data-act="rmset">Togli l'ultima</button></div>
  </article>`;
}

function renderWorkoutView() {
  const k = todayKey();
  const w = workoutFor(k), pr = workoutProgress(k, w), nx = nextSet(k, w);
  const chips = S.workouts.map(x =>
    `<button class="chip${x.id === w.id ? ' on' : ''}" data-act="wid" data-id="${esc(x.id)}" aria-pressed="${x.id === w.id}">${esc(x.name)}</button>`).join('');
  return `${subhead()}
    <section class="hero">
      <div class="hero-top">
        <div><span class="badge">${esc(DAYS_FULL[wdIndex(new Date())])}</span><h2>${esc(w.name)}</h2></div>
        <div class="score" data-score><strong>${pr.done}</strong><span>/${pr.total} serie</span></div>
      </div>
      <div class="chip-row" role="group" aria-label="Giorno di scheda">${chips}</div>
      <p class="meta" data-meta>${esc(metaText(pr, nx))}</p>
    </section>
    ${w.exercises.map(ex => exHtml(k, ex)).join('')}
    <label class="notes"><span>Note dell'allenamento</span><textarea data-inp="note" rows="2">${esc(S.days[k]?.note || '')}</textarea></label>`;
}

function renderMealsView() {
  const k = todayKey(), d = dayRec(k), type = dayType(k);
  const meals = D.diet[type].meals;
  const done = meals.filter(m => d.meals[m.id]).length;
  return `${subhead()}
    <section class="hero">
      <div class="hero-top">
        <div><span class="badge">${type === 'train' ? 'Giorno di allenamento' : 'Giorno di riposo'}</span><h2>Dieta</h2></div>
        <div class="score"><strong>${done}</strong><span>/${meals.length} pasti</span></div>
      </div>
      <p class="meta">${D.diet[type].kcal} kcal oggi. Tocca la spunta quando hai mangiato.</p>
    </section>
    ${meals.map(m => mealCard(m, k)).join('')}
    ${macrosHtml(type)}`;
}

function renderOggi() {
  if (ui.view === 'workout' && dayType(todayKey()) !== 'train') ui.view = 'home';
  return ui.view === 'workout' ? renderWorkoutView() : ui.view === 'meals' ? renderMealsView() : renderHome();
}

/* ---------- schermata: Scheda (modifica) ---------- */
function renderScheda() {
  const groupOpts = cur => D.groups.map(g => `<option value="${g[0]}"${g[0] === cur ? ' selected' : ''}>${g[1]}</option>`).join('');
  const nums = (kind, o) => `<div class="nums">
      <label><span>Serie</span><input data-chg="${kind}" data-f="sets" inputmode="numeric" value="${o.sets ?? ''}"></label>
      <label><span>Rip</span><input data-chg="${kind}" data-f="reps" inputmode="numeric" value="${o.reps ?? ''}"></label>
      <label><span>Kg</span><input data-chg="${kind}" data-f="kg" inputmode="decimal" value="${o.kg == null ? '' : fmtN(o.kg)}"></label>
    </div>`;
  return `<header class="top"><h1>Scheda</h1><p class="sub">Cambia esercizi, serie, ripetizioni e carichi. Gli esercizi con più varianti hanno pesi separati per ciascuna. Gli allenamenti già registrati restano com'erano.</p></header>`
    + S.workouts.map((w, wi) => `<section class="card"><h2>${esc(w.name)}</h2>
      ${w.exercises.map((ex, ei) => `<div class="erow" data-w="${wi}" data-e="${ei}">
        <input data-chg="ex" data-f="name" value="${esc(ex.name)}" aria-label="Nome dell'esercizio">
        <label class="sel"><span>Gruppo muscolare</span><select data-chg="ex" data-f="group">${groupOpts(ex.group)}</select></label>
        ${hasVars(ex)
          ? ex.variants.map((v, vi) => `<div class="vrow" data-vi="${vi}">
              <input data-chg="var" data-f="name" value="${esc(v.name)}" aria-label="Nome della variante">
              ${nums('var', v)}
              ${ex.variants.length > 1 ? `<button class="lnk danger" data-act="delvar">Elimina questa variante</button>` : ''}
            </div>`).join('')
          : nums('ex', ex)}
        <input data-chg="ex" data-f="note" value="${esc(ex.note || '')}" placeholder="Nota (facoltativa)" aria-label="Nota">
        <button class="lnk" data-act="addvar">Aggiungi una variante</button>
        <button class="lnk danger" data-act="delex" aria-label="Elimina ${esc(ex.name)}">Elimina esercizio</button>
      </div>`).join('')}
      <button class="btn" data-act="addex" data-w="${wi}">Aggiungi esercizio</button>
    </section>`).join('');
}

/* ---------- schermata: Dieta ---------- */
function renderDieta() {
  const t = ui.dietView;
  const segBtn = (v, label) => `<button class="${t === v ? 'on' : ''}" data-act="dview" data-v="${v}" aria-pressed="${t === v}">${label}</button>`;
  return `<header class="top"><h1>Dieta</h1><p class="sub">${checkInfo()}</p></header>
    <div class="seg" role="group" aria-label="Tipo di giorno">${segBtn('train', 'Allenamento')}${segBtn('rest', 'Riposo')}</div>
    <p class="sub tight">Obiettivo: massa muscolare con meno grasso possibile, con pasti puliti e pochi grassi. Dove vedi una freccia puoi cambiare alimento.</p>
    ${D.diet[t].meals.map(m => mealCard(m, null)).join('')}
    ${macrosHtml(t)}`;
}

/* ---------- schermata: Spesa ---------- */
function shoppingTotals() {
  const tot = {};
  const add = (fid, g, pz, qb) => {
    const t = tot[fid] || (tot[fid] = { g: 0, pz: 0, qb: false });
    t.g += g || 0; t.pz += pz || 0; if (qb) t.qb = true;
  };
  S.week.forEach(ty => {
    if (ty !== 'train' && ty !== 'rest') return;
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
    `<button class="wd t-${t}" data-act="wk" data-i="${i}" aria-label="${DAYS_FULL[i]}: ${label[t] || 'escluso'}"><span class="dn">${DAYS[i]}</span><span class="st">${sym[t] || '–'}</span></button>`).join('');
  const row = (g, inHave) => {
    const bought = !!S.shop.bought[g.fid];
    return `<li class="${bought ? 'got' : ''}${inHave ? ' nobox' : ''}">
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

/* ---------- statistiche per i progressi ---------- */
function trackables() {
  const list = [], seen = new Set();
  const push = (key, name, group) => { if (!seen.has(key)) { seen.add(key); list.push({ key, name, group: group || 'altro' }); } };
  S.workouts.forEach(w => w.exercises.forEach(ex => {
    if (hasVars(ex)) ex.variants.forEach(v => push(skey(ex, v), v.name, ex.group));
    else push(ex.id, ex.name, ex.group);
  }));
  Object.keys(S.days).sort().forEach(k => {
    const d = S.days[k];
    Object.keys(d.sets || {}).forEach(key => { if (doneSets(d, key).length) push(key, d.names?.[key] || key, d.grp?.[key]); });
  });
  return list;
}

function stats(sets) {
  let maxKg = 0, vol = 0, reps = 0, e1 = 0;
  sets.forEach(s => {
    const kg = s.kg || 0, r = s.reps || 0;
    if (kg > maxKg) maxKg = kg;
    vol += kg * r; reps += r;
    if (kg > 0 && r > 0) { const e = r === 1 ? kg : kg * (1 + r / 30); if (e > e1) e1 = e; }
  });
  return { maxKg, vol, reps, sets: sets.length, e1 };
}

function inPeriod(k) {
  if (ui.pg.period === 'all') return true;
  const cut = new Date(); cut.setDate(cut.getDate() - (+ui.pg.period - 1));
  return k >= keyOf(cut);
}
const periodText = () => (ui.pg.period === 'all' ? 'in tutto lo storico' : `negli ultimi ${ui.pg.period} giorni`);
const trainedDays = () => Object.keys(S.days).sort().filter(k => hasDone(S.days[k]));

const METRICS = {
  kg: { label: 'Carico massimo', unit: 'kg', integer: false },
  e1rm: { label: '1RM stimato', unit: 'kg', integer: false },
  vol: { label: 'Volume', unit: 'kg', integer: false },
  reps: { label: 'Ripetizioni', unit: 'rip', integer: true },
  sets: { label: 'Serie', unit: 'serie', integer: true }
};

function metricValue(m, st) {
  return { kg: st.maxKg, e1rm: Math.round(st.e1 * 10) / 10, vol: Math.round(st.vol), reps: st.reps, sets: st.sets }[m];
}

function periodTotals() {
  let days = 0, sets = 0, vol = 0;
  trainedDays().filter(inPeriod).forEach(k => {
    days++;
    Object.keys(S.days[k].sets).forEach(key => { const st = stats(doneSets(S.days[k], key)); sets += st.sets; vol += st.vol; });
  });
  return { days, sets, vol };
}

/* ---------- schermata: Storico ---------- */
function renderStorico() {
  const seg = (v, label) => `<button class="${ui.stView === v ? 'on' : ''}" data-act="stview" data-v="${v}" aria-pressed="${ui.stView === v}">${label}</button>`;
  const body = ui.stView === 'progressi' ? renderProgressi() : ui.stView === 'allenamenti' ? renderRegistro() : renderDati();
  return `<header class="top"><h1>Storico</h1></header>
    <div class="seg three" role="group" aria-label="Sezioni dello storico">${seg('progressi', 'Progressi')}${seg('allenamenti', 'Allenamenti')}${seg('dati', 'Dati')}</div>
    ${body}`;
}

function renderProgressi() {
  const per = (v, label) => `<button class="chip${ui.pg.period === v ? ' on' : ''}" data-act="period" data-v="${v}" aria-pressed="${ui.pg.period === v}">${label}</button>`;
  const tot = periodTotals();
  const tile = (label, val, unit) => `<div class="tile"><span>${label}</span><b>${val}${unit ? `<small> ${unit}</small>` : ''}</b></div>`;

  /* peso corporeo */
  const ws = S.weights.slice().sort((a, b) => (a.d < b.d ? -1 : 1));
  let wp = ws.filter(w => inPeriod(w.d));
  if (!wp.length) wp = ws.slice(-1);
  const cur = ws[ws.length - 1], firstP = wp[0];
  const diff = cur.kg - firstP.kg;
  const wDiff = wp.length < 2 ? 'Prima rilevazione del periodo' : `${diff > 0 ? '+' : ''}${fmtN(diff)} kg dal ${fmtShort(firstP.d)}`;
  const weightCard = `<section class="card"><h2>Peso corporeo</h2>
      <p class="big">${fmtN(cur.kg)}<small> kg</small></p>
      <p class="sub tight">${wDiff}</p>
      ${VZ.line({ label: 'Peso corporeo', unit: 'kg', points: wp.map(w => ({ d: w.d, y: w.kg })) })}
      <div class="inline"><label class="field"><input id="w-in" inputmode="decimal" placeholder="${fmtN(cur.kg)}" aria-label="Peso di oggi in chili"><span>kg</span></label><button class="btn solid" data-act="wsave">Salva il peso</button></div>
    </section>`;

  /* esercizio */
  const tr = trackables();
  if (!tr.some(t => t.key === ui.pg.key)) {
    const days = trainedDays();
    let pick = null;
    if (days.length) { const rec = S.days[days[days.length - 1]]; pick = Object.keys(rec.sets).find(key => doneSets(rec, key).length); }
    ui.pg.key = pick || (tr[0] && tr[0].key) || null;
  }
  let exCard = '';
  if (ui.pg.key) {
    const hist = history(ui.pg.key).filter(h => inPeriod(h.d));
    const allHist = history(ui.pg.key);
    const hasKg = allHist.some(h => h.sets.some(s => s.kg));
    const metric = (!hasKg && ['kg', 'e1rm', 'vol'].includes(ui.pg.metric)) ? 'reps' : ui.pg.metric;
    const M = METRICS[metric];
    const pts = hist.map(h => ({ d: h.d, y: metricValue(metric, stats(h.sets)), tip: setsText(h.sets) }))
      .filter(p => (['kg', 'e1rm', 'vol'].includes(metric) ? p.y > 0 : true));
    const opts = D.groups.map(g => {
      const items = tr.filter(t => t.group === g[0]);
      return items.length ? `<optgroup label="${esc(g[1])}">${items.map(t => `<option value="${esc(t.key)}"${t.key === ui.pg.key ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</optgroup>` : '';
    }).join('');
    const mchips = Object.keys(METRICS).map(m => `<button class="chip${m === metric ? ' on' : ''}" data-act="metric" data-v="${m}" aria-pressed="${m === metric}">${METRICS[m].label}</button>`).join('');
    const fv = v => `${VZ.fmt(v)} ${M.unit}`;
    let tiles = '';
    if (pts.length) {
      const best = Math.max(...pts.map(p => p.y)), last = pts[pts.length - 1].y;
      const delta = pts.length > 1 ? last - pts[0].y : null;
      tiles = `<div class="tiles">${tile('Migliore', VZ.fmt(best), M.unit)}${tile('Ultimo', VZ.fmt(last), M.unit)}${tile('Variazione', delta == null ? '—' : `${delta > 0 ? '+' : ''}${VZ.fmt(Math.round(delta * 100) / 100)}`, delta == null ? '' : M.unit)}</div>`;
    }
    exCard = `<section class="card"><h2>Esercizio</h2>
      <select class="pick" data-chg="pgkey" aria-label="Esercizio">${opts}</select>
      <div class="metrics" role="group" aria-label="Cosa mostrare">${mchips}</div>
      ${pts.length
        ? `${tiles}${VZ.line({ label: M.label, unit: M.unit, integer: M.integer, fmtV: fv, points: pts })}
           ${pts.length < 2 ? '<p class="sub tight">Dopo il prossimo allenamento compare l\'andamento.</p>' : ''}`
        : `<p class="empty">Nessuna serie completata per questo esercizio ${periodText()}.</p>`}
    </section>`;
  }

  /* gruppi muscolari */
  const gmap = {};
  tr.forEach(t => { (gmap[t.group] ||= { sets: 0, vol: 0, keys: new Set(), has: true }); });
  trainedDays().filter(inPeriod).forEach(k => {
    const rec = S.days[k];
    Object.keys(rec.sets).forEach(key => {
      const t = tr.find(x => x.key === key);
      const g = t ? t.group : (rec.grp?.[key] || 'altro');
      const st = stats(doneSets(rec, key));
      if (!st.sets) return;
      const o = (gmap[g] ||= { sets: 0, vol: 0, keys: new Set() });
      o.sets += st.sets; o.vol += st.vol; o.keys.add(key);
    });
  });
  const mgMetric = ui.pg.mg;
  const items = D.groups.map(g => ({ id: g[0], label: g[1], o: gmap[g[0]] })).filter(x => x.o && (x.o.sets > 0 || x.id !== 'altro'))
    .map(x => {
      const value = mgMetric === 'vol' ? Math.round(x.o.vol) : x.o.sets;
      const f = mgMetric === 'vol' ? `${fmtInt(x.o.vol)} kg` : String(x.o.sets);
      const tip = mgMetric === 'vol'
        ? `${x.o.sets} serie, ${x.o.keys.size} ${x.o.keys.size === 1 ? 'esercizio' : 'esercizi'}`
        : `${fmtInt(x.o.vol)} kg sollevati, ${x.o.keys.size} ${x.o.keys.size === 1 ? 'esercizio' : 'esercizi'}`;
      return { label: x.label, value, f, tip };
    })
    .sort((a, b) => b.value - a.value);
  const totalMg = items.reduce((a, i) => a + i.value, 0);
  const mgSeg = (v, label) => `<button class="${mgMetric === v ? 'on' : ''}" data-act="mgmetric" data-v="${v}" aria-pressed="${mgMetric === v}">${label}</button>`;
  const muscleCard = `<section class="card"><h2>Gruppi muscolari</h2>
      <div class="seg small" role="group" aria-label="Cosa contare">${mgSeg('sets', 'Serie')}${mgSeg('vol', 'Volume')}</div>
      ${totalMg
        ? VZ.bars({ label: mgMetric === 'vol' ? 'Volume (kg)' : 'Serie', summary: `Totale ${mgMetric === 'vol' ? fmtInt(totalMg) + ' kg' : totalMg + ' serie'} ${periodText()}. Tocca una barra per il dettaglio.`, items })
        : `<p class="empty">Nessuna serie completata ${periodText()}.</p>`}
      <p class="sub tight">Ogni esercizio conta per il suo gruppo principale, che puoi cambiare in Scheda.</p>
    </section>`;

  /* volume per allenamento */
  const sessDays = trainedDays().filter(inPeriod);
  const volPts = sessDays.map(k => {
    const rec = S.days[k];
    let vol = 0, sets = 0;
    Object.keys(rec.sets).forEach(key => { const st = stats(doneSets(rec, key)); vol += st.vol; sets += st.sets; });
    const w = S.workouts.find(x => x.id === rec.wid);
    return { d: k, vol, sets, tip: `${w ? w.name : 'Allenamento'}, ${sets} serie` };
  });
  const useVol = volPts.some(p => p.vol > 0);
  const volCard = `<section class="card"><h2>${useVol ? 'Volume per allenamento' : 'Serie per allenamento'}</h2>
      ${volPts.length
        ? VZ.line({ label: useVol ? 'Volume' : 'Serie', unit: useVol ? 'kg' : 'serie', integer: !useVol, points: volPts.map(p => ({ d: p.d, y: useVol ? Math.round(p.vol) : p.sets, tip: p.tip })) })
        : `<p class="empty">Nessun allenamento ${periodText()}.</p>`}
      ${useVol ? '<p class="sub tight">Chili sollevati in totale: serie × ripetizioni × kg.</p>' : ''}
    </section>`;

  return `<div class="filters" role="group" aria-label="Periodo">${per('7', '7 giorni')}${per('30', '30 giorni')}${per('all', 'Sempre')}</div>
    <div class="tiles">${tile('Allenamenti', tot.days)}${tile('Serie', tot.sets)}${tile('Volume', fmtInt(tot.vol), 'kg')}</div>
    ${weightCard}${exCard}${muscleCard}${volCard}`;
}

function renderRegistro() {
  const days = trainedDays().reverse().slice(0, 40);
  if (!days.length) return '<p class="empty">Quando completi delle serie compaiono qui.</p>';
  return `<section class="card" style="padding-top:4px">${days.map(k => {
    const rec = S.days[k];
    const w = S.workouts.find(x => x.id === rec.wid);
    let sets = 0, vol = 0;
    const lines = Object.keys(rec.sets).map(key => {
      const ds = doneSets(rec, key);
      if (!ds.length) return '';
      const st = stats(ds); sets += st.sets; vol += st.vol;
      return `<li>${esc(rec.names?.[key] || key)}<span>${esc(setsText(ds))}</span></li>`;
    }).join('');
    return `<details class="sess"><summary><b>${esc(fmtShortWd(k))}</b><span>${esc(w ? w.name : 'Allenamento')}</span><span class="r">${sets} serie, ${fmtInt(vol)} kg</span></summary><ul>${lines}</ul>${rec.note ? `<p class="note">${esc(rec.note)}</p>` : ''}</details>`;
  }).join('')}</section>`;
}

function renderDati() {
  const th = (v, l) => `<option value="${v}"${S.settings.theme === v ? ' selected' : ''}>${l}</option>`;
  return `<section class="card"><h2>Preferenze</h2>
      <label class="setting"><span>Recupero tra le serie</span>
        <select data-chg="rest" aria-label="Secondi di recupero">${[45, 60, 90, 120, 150, 180, 240].map(s => `<option value="${s}"${S.settings.rest === s ? ' selected' : ''}>${recText(s)}</option>`).join('')}</select></label>
      <label class="setting"><span>Stile dell'app</span>
        <select data-chg="theme" aria-label="Stile dell'app">${th('apple', 'Apple-like')}${th('dark', 'Scuro')}${th('sport', 'Sport')}</select></label>
    </section>
    <section class="card"><h2>I tuoi dati</h2>
      <p class="sub tight">I dati restano su questo telefono. Salva ogni tanto un backup.</p>
      <div class="btns"><button class="btn" data-act="export">Esporta il backup</button>
        <label class="btn">Importa un backup<input type="file" accept="application/json,.json" data-chg="import" hidden></label>
        <button class="btn danger" data-act="reset">Ripristina i dati di base</button></div>
    </section>
    <p class="sub">Palestra, versione ${VERSION}</p>`;
}

/* ---------- disegno ---------- */
const screens = { oggi: renderOggi, scheda: renderScheda, dieta: renderDieta, spesa: renderSpesa, storico: renderStorico };
let renderedDay = todayKey();

function render(keep) {
  const y = window.scrollY || 0;
  renderedDay = todayKey();
  document.body.classList.remove('theme-apple', 'theme-dark', 'theme-sport');
  document.body.classList.add(`theme-${S.settings.theme}`);
  $('#app').innerHTML = screens[ui.tab]();
  document.body.dataset.view = ui.tab === 'oggi' ? ui.view : ui.tab;
  $$('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
  try { window.scrollTo(0, keep ? y : 0); } catch (e) { /* ambienti senza scroll */ }
  keepAwake(ui.tab === 'oggi' && ui.view === 'workout');
}

function updateProgress() {
  const k = todayKey(), w = workoutFor(k), pr = workoutProgress(k, w);
  const sc = $('[data-score]');
  if (sc) sc.innerHTML = `<strong>${pr.done}</strong><span>/${pr.total} serie</span>`;
  const mt = $('[data-meta]');
  if (mt) mt.textContent = metaText(pr, nextSet(k, w));
}

function go(view) {
  if (view !== 'home' && ui.view === 'home') { try { history.pushState({ v: view }, ''); } catch (e) { /* non disponibile */ } }
  ui.view = view;
  render(false);
}
window.addEventListener('popstate', () => { if (ui.tab === 'oggi' && ui.view !== 'home') { ui.view = 'home'; render(false); } });

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
  el.hidden = !(ui.tab === 'oggi' && ui.view === 'workout');   // il timer si vede solo durante l'allenamento
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
  else keepAwake(ui.tab === 'oggi' && ui.view === 'workout');
});

/* ---------- azioni (click) ---------- */
const A = {
  tab(el) {
    const t = el.dataset.tab;
    if (t === 'oggi' && ui.tab === 'oggi') ui.view = 'home';
    ui.tab = t;
    render(false);
  },
  home() {
    ui.view = 'home';
    render(false);
    try { if (history.state && history.state.v) history.back(); } catch (e) { /* niente */ }
  },
  open(el) { go(el.dataset.v); },
  type(el) { const d = dayRec(todayKey()); d.type = el.dataset.v; save(); render(true); },
  wid(el) { dayRec(todayKey()).wid = el.dataset.id; save(); render(true); },
  variant(el) { dayRec(todayKey()).variant[el.dataset.ex] = el.dataset.v; save(); render(true); },
  dview(el) { ui.dietView = el.dataset.v; render(true); },

  plate(el) {
    const k = todayKey(), row = el.closest('.set-row'), ex = findEx(el.closest('.exercise').dataset.ex), i = +row.dataset.i;
    const v = selVariant(k, ex), p = plan(ex, v), key = skey(ex, v);
    const r = ensureSet(k, ex, v, key, p, i);
    r.kg = num($('.kg', row).value);
    r.reps = num($('.reps', row).value);
    r.done = !r.done;
    el.classList.toggle('done', r.done);
    el.setAttribute('aria-pressed', String(r.done));
    if (r.done) {
      startTimer(S.settings.rest);
      const best = bestKg(key, k, i);
      if (r.kg && best.prev > 0 && r.kg > best.prev && r.kg > best.cur) toast(`Nuovo massimo: ${fmtN(r.kg)} kg su ${p.name}`);
    }
    save();
    updateProgress();
  },
  addset(el) {
    const k = todayKey(), ex = findEx(el.closest('.exercise').dataset.ex);
    const v = selVariant(k, ex), p = plan(ex, v), key = skey(ex, v);
    const d = dayRec(k); d.wid = workoutFor(k).id; d.type = 'train';
    d.count[key] = rowCount(k, key, p) + 1;
    save(); render(true);
  },
  rmset(el) {
    const k = todayKey(), ex = findEx(el.closest('.exercise').dataset.ex);
    const v = selVariant(k, ex), p = plan(ex, v), key = skey(ex, v);
    const d = dayRec(k); d.wid = workoutFor(k).id; d.type = 'train';
    const n = Math.max(1, rowCount(k, key, p) - 1);
    d.count[key] = n;
    if (d.sets[key]) d.sets[key].length = Math.min(d.sets[key].length, n);
    save(); render(true);
  },
  meal(el) { const d = dayRec(todayKey()); d.meals[el.dataset.id] = !d.meals[el.dataset.id]; save(); render(true); },
  creatina() { const d = dayRec(todayKey()); d.quick.creatina = !d.quick.creatina; save(); render(true); },

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

  stview(el) { ui.stView = el.dataset.v; render(false); },
  period(el) { ui.pg.period = el.dataset.v; render(true); },
  metric(el) { ui.pg.metric = el.dataset.v; render(true); },
  mgmetric(el) { ui.pg.mg = el.dataset.v; render(true); },
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
    if (!confirm('Tornare ai dati di base della versione 1.5 (scheda, dieta e allenamento del 13/10)? Gli altri allenamenti e i pesi registrati verranno eliminati. Non si può annullare.')) return;
    S = defaults(); save(); render(false); toast('Dati di base ripristinati');
  },

  addex(el) {
    S.workouts[+el.dataset.w].exercises.push({ id: uid(), name: 'Nuovo esercizio', group: 'altro', sets: 3, reps: 10, kg: null });
    save(); render(true);
  },
  delex(el) {
    const row = el.closest('.erow');
    if (!confirm('Eliminare questo esercizio dalla scheda? Le serie già registrate restano nello storico.')) return;
    S.workouts[+row.dataset.w].exercises.splice(+row.dataset.e, 1);
    save(); render(true);
  },
  addvar(el) {
    const row = el.closest('.erow'), ex = S.workouts[+row.dataset.w].exercises[+row.dataset.e];
    if (!hasVars(ex)) {
      toVariants(S, ex, [{ id: 'v' + uid(), name: ex.name, sets: ex.sets, reps: ex.reps, kg: ex.kg }]);
    }
    const f = ex.variants[0];
    ex.variants.push({ id: 'v' + uid(), name: 'Nuova variante', sets: f.sets, reps: f.reps, kg: f.kg });
    save(); render(true);
  },
  delvar(el) {
    const row = el.closest('.erow'), ex = S.workouts[+row.dataset.w].exercises[+row.dataset.e];
    if (ex.variants.length < 2 || !confirm('Eliminare questa variante? Le serie già registrate restano nello storico.')) return;
    ex.variants.splice(+el.closest('.vrow').dataset.vi, 1);
    save(); render(true);
  },

  tadd() { if (timer) { timer.end += 15000; timer.total += 15; timer.buzzed = false; } drawTimer(); },
  tstop() { timer = null; drawTimer(); }
};

/* ---------- azioni (cambio valore) ---------- */
const intOrNull = v => (v === '' ? null : (Math.max(0, parseInt(v, 10) || 0) || null));
const C = {
  choice(el) { S.choices[el.dataset.item] = el.value; save(); render(true); },
  topping(el) { S.toppings[el.dataset.item] = el.value; save(); render(true); },
  pgkey(el) { ui.pg.key = el.value; render(true); },
  rest(el) { S.settings.rest = +el.value; save(); },
  theme(el) {
    S.settings.theme = ['apple', 'dark', 'sport'].includes(el.value) ? el.value : 'apple';
    save(); render(true);
  },
  ex(el) {
    const row = el.closest('.erow'), ex = S.workouts[+row.dataset.w].exercises[+row.dataset.e];
    const f = el.dataset.f, v = el.value.trim();
    if (f === 'name') ex.name = v || 'Esercizio';
    else if (f === 'note') ex.note = v;
    else if (f === 'group') ex.group = v;
    else if (f === 'kg') ex.kg = num(v);
    else ex[f] = intOrNull(v);
    save();
  },
  var(el) {
    const row = el.closest('.erow'), ex = S.workouts[+row.dataset.w].exercises[+row.dataset.e];
    const vr = ex.variants[+el.closest('.vrow').dataset.vi];
    const f = el.dataset.f, v = el.value.trim();
    if (f === 'name') vr.name = v || 'Variante';
    else if (f === 'kg') vr.kg = num(v);
    else vr[f] = intOrNull(v);
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
        S = migrate(data);
        save(); render(false); toast('Backup importato');
      } catch (e) { toast('File non valido'); }
    };
    fr.readAsText(file);
  }
};

/* ---------- azioni (digitazione) ---------- */
const I = {
  set(el) {
    const k = todayKey(), row = el.closest('.set-row'), ex = findEx(el.closest('.exercise').dataset.ex);
    const v = selVariant(k, ex), p = plan(ex, v), key = skey(ex, v);
    const r = ensureSet(k, ex, v, key, p, +row.dataset.i);
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
