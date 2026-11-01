import * as store from '../store.js';
import { t, lang } from '../i18n.js';
import { esc, todayISO, addDays, addMonths, startOfWeek, parseISO, weekdayNames, monthName, toISO } from '../util.js';
import { layout, catName, fmtD, ring } from '../ui.js';

const state = { period: 'week', offset: 0 };

function range() {
  const s = store.settings(); const today = todayISO();
  if (state.period === 'week') {
    const start = addDays(startOfWeek(today, s.weekStart), state.offset * 7);
    return { start, end: addDays(start, 6), label: `${fmtD(start)} – ${fmtD(addDays(start, 6))}` };
  }
  const first = addMonths(today.slice(0, 8) + '01', state.offset);
  const d = parseISO(first); const end = toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { start: first, end, label: `${monthName(d.getMonth(), lang())} ${d.getFullYear()}` };
}

function streak(tasks) {
  const days = new Set(tasks.filter(x => x.done && x.completedAt).map(x => toISO(new Date(x.completedAt))));
  let n = 0; let day = todayISO();
  if (!days.has(day)) day = addDays(day, -1);   // today not finished yet doesn't break it
  while (days.has(day)) { n++; day = addDays(day, -1); }
  return n;
}

export default function reports() {
  const d = store.data(); const s = d.settings; const { start, end, label } = range();
  const inRange = d.tasks.filter(x => x.date >= start && x.date <= end);
  const done = inRange.filter(x => x.done).length; const total = inRange.length;
  const pct = total ? Math.round(done / total * 100) : 0;

  // bars: days for week, weeks for month
  let buckets;
  if (state.period === 'week') {
    const names = weekdayNames(lang(), s.weekStart, 'short');
    buckets = names.map((n, i) => { const iso = addDays(start, i); return { label: n, list: inRange.filter(x => x.date === iso) }; });
  } else {
    buckets = []; let w = start; let i = 1;
    while (w <= end) { const we = addDays(w, 6) > end ? end : addDays(w, 6); const a = w;
      buckets.push({ label: `${t('report.wk')}${i++}`, list: inRange.filter(x => x.date >= a && x.date <= we) }); w = addDays(we, 1); }
  }
  const max = Math.max(1, ...buckets.map(b => b.list.length));
  const bars = buckets.map(b => {
    const dn = b.list.filter(x => x.done).length; const h = b.list.length / max * 100;
    return `<div class="bar" title="${dn}/${b.list.length}"><small>${b.list.length ? `${dn}/${b.list.length}` : ''}</small>
      <div class="col" style="height:calc((100% - 40px) * ${Math.max(h, 3) / 100})"><i style="height:${b.list.length ? dn / b.list.length * 100 : 0}%"></i></div>
      <small>${esc(b.label)}</small></div>`;
  }).join('');

  const cats = d.categories.map(c => {
    const l = inRange.filter(x => x.category === c.id); return { c, total: l.length, done: l.filter(x => x.done).length };
  }).filter(x => x.total).sort((a, b) => b.total - a.total);

  const body = `
  <div class="row wrap">
    <div class="seg"><button data-period="week" aria-pressed="${state.period === 'week'}">${t('report.weekly')}</button><button data-period="month" aria-pressed="${state.period === 'month'}">${t('report.monthly')}</button></div>
  </div>
  <div class="row" style="margin:12px 0">
    <button class="btn sm" data-off="-1" aria-label="${t('cal.prev')}">‹</button>
    <b style="flex:1;text-align:center">${esc(label)}</b>
    <button class="btn sm" data-off="1" aria-label="${t('cal.next')}" ${state.offset >= 0 ? 'disabled' : ''}>›</button>
  </div>
  <div class="card hero">${ring(pct)}<div class="stats" style="flex:1">
    <div class="stat"><b>${done}</b><span>${t('status.done')}</span></div>
    <div class="stat"><b>${total - done}</b><span>${t('status.pending')}</span></div>
    <div class="stat"><b>${streak(d.tasks)}🔥</b><span>${t('report.streak')}</span></div>
  </div></div>
  <div class="section-title"><h2>${t('report.byDay')}</h2><div class="legend"><span><i class="dot" style="background:var(--accent)"></i>${t('status.done')}</span><span><i class="dot" style="background:var(--surface-2)"></i>${t('report.planned')}</span></div></div>
  <div class="card"><div class="bars">${bars}</div></div>
  <div class="section-title"><h2>${t('report.byCategory')}</h2></div>
  <div class="card">${cats.length ? cats.map(x => `<div class="hbar"><span>${esc(x.c.emoji)} ${esc(catName(x.c))}</span>
      <span class="track"><i style="width:${x.done / x.total * 100}%;background:${esc(x.c.color)}"></i></span><span class="small muted">${x.done}/${x.total}</span></div>`).join('')
    : `<p class="muted" style="margin:0">${t('report.empty')}</p>`}</div>
  <p class="small muted" style="margin:12px 4px">${t('report.tip', { pct })}</p>`;

  return {
    title: t('nav.reports'), live: true,
    html: layout(t('nav.reports'), body, { tab: 'reports' }),
    mount(root, rerender) {
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-period],[data-off]'); if (!b || b.disabled) return;
        if (b.dataset.period) { state.period = b.dataset.period; state.offset = 0; }
        if (b.dataset.off) state.offset = Math.min(0, state.offset + Number(b.dataset.off));
        rerender();
      });
    },
  };
}
