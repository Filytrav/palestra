/* Grafici di Palestra: SVG e HTML senza librerie.
   - Linea da 2px, marcatori con anello del colore di sfondo, griglia sottile e piena.
   - Lettura al tocco o con il mouse (il punto più vicino), anche con le frecce della tastiera.
   - Ogni grafico ha la sua tabella dati equivalente, così nessun valore dipende dal tocco. */
(() => {
'use strict';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const fmt = n => nf.format(n);
const compact = n => (Math.abs(n) >= 1000 ? nf.format(Math.round(n / 100) / 10) + 'k' : nf.format(n));
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const dayNum = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; };
const lab = k => { const [, m, d] = k.split('-').map(Number); return `${d} ${MESI[m - 1]}`; };

/* tacche "tonde" per l'asse verticale */
function niceTicks(lo, hi, n, integer) {
  if (hi === lo) { const p = Math.abs(hi) * 0.1 || 1; lo -= p; hi += p; }
  const raw = (hi - lo) / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  if (integer && step < 1) step = 1;
  let start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  if (lo >= 0 && start < 0) start = 0;
  const ticks = [];
  for (let v = start; v <= end + step / 1e6; v += step) ticks.push(+v.toFixed(10));
  return { ticks, min: ticks[0], max: ticks[ticks.length - 1] };
}

function table(head, rows) {
  return `<details class="vz-data"><summary>Mostra i dati</summary><table><thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${
    rows.map(r => `<tr>${r.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join('')}</tr>`).join('')
  }</tbody></table></details>`;
}

/* Grafico a linea nel tempo.
   o = { label, unit, integer, fmtV, points: [{ d: 'AAAA-MM-GG', y: numero, tip: 'testo facoltativo' }] } */
function line(o) {
  const pts = (o.points || []).filter(p => p && Number.isFinite(p.y));
  if (!pts.length) return '';
  const fmtV = o.fmtV || (v => fmt(v) + (o.unit ? ' ' + o.unit : ''));
  const W = 340, H = 200, L = 40, R = 16, T = 20, B = 28, pad = 12;
  const pw = W - L - R, ph = H - T - B;
  const xs = pts.map(p => dayNum(p.d));
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const X = v => (x1 === x0 ? L + pw / 2 : L + pad + (v - x0) * (pw - 2 * pad) / (x1 - x0));
  const tr = (o.trend || []).filter(p => p && Number.isFinite(p.y));
  const ys = pts.map(p => p.y).concat(tr.map(p => p.y));
  const nt = niceTicks(Math.min(...ys), Math.max(...ys), 4, o.integer);
  const Y = v => T + ph - (v - nt.min) * ph / (nt.max - nt.min);
  const P = pts.map((p, i) => ({ x: +X(xs[i]).toFixed(1), y: +Y(p.y).toFixed(1), f: fmtV(p.y), d: lab(p.d), t: p.tip || '' }));
  const base = T + ph;

  const grid = nt.ticks.map((t, i) => {
    const y = Y(t).toFixed(1);
    return `<line class="vz-${i === 0 ? 'axis' : 'grid'}" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="vz-tick" x="${L - 6}" y="${(+y + 4).toFixed(1)}" text-anchor="end">${esc(compact(t))}</text>`;
  }).join('');

  // etichette delle date: prima, ultima ed eventualmente una al centro
  const xl = [];
  const addX = (i) => { const p = P[i]; if (!xl.some(q => Math.abs(q.x - p.x) < 56) ) xl.push({ x: p.x, d: p.d }); };
  addX(0);
  if (P.length > 1) {
    const last = P[P.length - 1];
    if (last.x - P[0].x >= 56) xl.push({ x: last.x, d: last.d });
    if (P.length > 2) {
      const mid = (P[0].x + last.x) / 2;
      let bi = -1, bd = 1e9;
      P.forEach((p, i) => { const dd = Math.abs(p.x - mid); if (dd < bd && Math.abs(p.x - P[0].x) >= 56 && Math.abs(p.x - last.x) >= 56) { bd = dd; bi = i; } });
      if (bi >= 0) xl.push({ x: P[bi].x, d: P[bi].d });
    }
  }
  const xlab = xl.map(q => `<text class="vz-tick" x="${q.x}" y="${H - 8}" text-anchor="middle">${esc(q.d)}</text>`).join('');

  const path = P.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const area = P.length > 1 ? `<path class="vz-area" d="M${P[0].x} ${base} ${P.map(p => `L${p.x} ${p.y}`).join(' ')} L${P[P.length - 1].x} ${base} Z"/>` : '';
  const trendPath = tr.length > 1 ? `<path class="vz-trend" d="${tr.map((p, i) => `${i ? 'L' : 'M'}${X(dayNum(p.d)).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ')}"/>` : '';
  const line2 = P.length > 1 ? `<path class="vz-line" d="${path}"/>` : '';
  const dots = (P.length <= 30 ? P : [P[P.length - 1]]).map(p => `<circle class="vz-dot" cx="${p.x}" cy="${p.y}" r="4"/>`).join('');
  const lp = P[P.length - 1];
  const endY = lp.y < T + 6 ? lp.y + 18 : lp.y - 10;
  const endLab = `<text class="vz-end" x="${lp.x}" y="${endY.toFixed(1)}" text-anchor="${lp.x > W - 56 ? 'end' : 'middle'}">${esc(lp.f)}</text>`;

  const rows = pts.map(p => [lab(p.d), fmtV(p.y), p.tip || '']);
  const hasTip = rows.some(r => r[2]);
  const label = o.label || 'Andamento';
  return `<figure class="vz" data-vz="line">
    <div class="vz-read" aria-live="polite"><i class="vz-key"></i><b data-r="f">${esc(lp.f)}</b><span data-r="d">${esc(lp.d)}</span><span data-r="t">${esc(lp.t)}</span></div>
    <svg class="vz-svg" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${esc(label)}: ${esc(P[0].d)} ${esc(P[0].f)}, ${esc(lp.d)} ${esc(lp.f)}" data-i="${P.length - 1}" data-pts="${esc(JSON.stringify(P))}">
      ${grid}${xlab}${area}${trendPath}${line2}
      <line class="vz-cross" x1="0" x2="0" y1="${T}" y2="${base}" style="display:none"/>
      ${dots}
      <circle class="vz-hl" r="6" cx="0" cy="0" style="display:none"/>
      ${endLab}
      <rect class="vz-hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
    </svg>
    ${table(hasTip ? ['Data', label, 'Dettaglio'] : ['Data', label], hasTip ? rows : rows.map(r => r.slice(0, 2)))}
  </figure>`;
}

/* Barre orizzontali, una sola serie.
   o = { label, summary, max (facoltativo, per fissare il fondo scala), items: [{ label, value, f, tip }] } */
function bars(o) {
  const items = o.items || [];
  const max = o.max || Math.max(0, ...items.map(i => i.value)) || 1;
  const rows = items.map(it => {
    const w = it.value > 0 ? Math.max(it.value / max * 100, 1.5) : 0;
    const tip = it.tip || '';
    return `<li class="vz-row${it.value ? '' : ' zero'}"><span class="vz-lab">${esc(it.label)}</span>
      <button type="button" class="vz-track" data-lab="${esc(it.label)}" data-f="${esc(it.f)}" data-tip="${esc(tip)}" aria-label="${esc(`${it.label}: ${it.f}${tip ? ', ' + tip : ''}`)}"><i class="vz-bar" style="--w:${w.toFixed(2)}"></i><b class="vz-val">${esc(it.f)}</b></button></li>`;
  }).join('');
  const hasTip = items.some(i => i.tip);
  return `<figure class="vz" data-vz="bars">
    <div class="vz-read" aria-live="polite" data-default="${esc(o.summary || '')}"><span data-r="all">${esc(o.summary || '')}</span></div>
    <ul class="vz-bars">${rows}</ul>
    ${table(hasTip ? ['Gruppo', o.label || 'Valore', 'Dettaglio'] : ['Gruppo', o.label || 'Valore'], items.map(i => (hasTip ? [i.label, i.f, i.tip || ''] : [i.label, i.f])))}
  </figure>`;
}

/* ---- interazione ---- */
const cache = new WeakMap();
function pts(svg) {
  let p = cache.get(svg);
  if (!p) { try { p = JSON.parse(svg.dataset.pts || '[]'); } catch (e) { p = []; } cache.set(svg, p); }
  return p;
}

function select(svg, i) {
  const P = pts(svg);
  if (!P.length) return;
  i = Math.max(0, Math.min(P.length - 1, i));
  const p = P[i];
  const cross = svg.querySelector('.vz-cross'), hl = svg.querySelector('.vz-hl');
  cross.setAttribute('x1', p.x); cross.setAttribute('x2', p.x); cross.style.display = '';
  hl.setAttribute('cx', p.x); hl.setAttribute('cy', p.y); hl.style.display = '';
  const fig = svg.closest('.vz');
  fig.querySelector('[data-r=f]').textContent = p.f;
  fig.querySelector('[data-r=d]').textContent = p.d;
  fig.querySelector('[data-r=t]').textContent = p.t;
  svg.dataset.i = String(i);
}

function nearest(svg, clientX) {
  const r = svg.getBoundingClientRect();
  const P = pts(svg);
  if (!r.width || !P.length) return -1;
  const x = (clientX - r.left) * (svg.viewBox.baseVal.width / r.width);
  let bi = 0, bd = 1e9;
  P.forEach((p, i) => { const dd = Math.abs(p.x - x); if (dd < bd) { bd = dd; bi = i; } });
  return bi;
}

function onPointer(e) {
  const hit = e.target && e.target.closest ? e.target.closest('.vz-hit') : null;
  if (!hit) return;
  const svg = hit.ownerSVGElement;
  const i = nearest(svg, e.clientX);
  if (i >= 0) select(svg, i);
}

function barRead(btn) {
  const rd = btn.closest('.vz').querySelector('.vz-read');
  rd.textContent = `${btn.dataset.lab}: ${btn.dataset.f}${btn.dataset.tip ? ' · ' + btn.dataset.tip : ''}`;
}

document.addEventListener('pointermove', onPointer);
document.addEventListener('pointerdown', onPointer);
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const svg = e.target && e.target.closest ? e.target.closest('svg.vz-svg') : null;
  if (!svg) return;
  e.preventDefault();
  select(svg, (+svg.dataset.i || 0) + (e.key === 'ArrowRight' ? 1 : -1));
});
['click', 'pointerover', 'focusin'].forEach(ev => document.addEventListener(ev, e => {
  const btn = e.target && e.target.closest ? e.target.closest('.vz-track') : null;
  if (btn) barRead(btn);
}));

window.VZ = { line, bars, select, fmt, compact, lab };
})();
