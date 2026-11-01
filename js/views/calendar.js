import * as store from '../store.js';
import { t, lang } from '../i18n.js';
import { esc, icon, todayISO, parseISO, toISO, addMonths, weekdayNames, monthName } from '../util.js';
import { layout, taskList, sortTasks, fmtD, catOf } from '../ui.js';
import { downloadICS } from '../ics.js';

let selected = null;

export default function calendar(params) {
  const today = todayISO();
  if (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) selected = params.date;
  selected ||= today;
  const s = store.settings(); const d = store.data();
  const first = parseISO(selected.slice(0, 8) + '01');
  const lead = (first.getDay() - s.weekStart + 7) % 7;
  const start = new Date(first); start.setDate(1 - lead);
  const cells = Array.from({ length: 42 }, (_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); return toISO(x); });
  const byDay = {};
  d.tasks.forEach(x => (byDay[x.date] ||= []).push(x));
  // Birthdays repeat every year in the visible month.
  const bdays = d.birthdays.filter(b => b.date.slice(5, 7) === selected.slice(5, 7));

  const grid = cells.map(iso => {
    const list = byDay[iso] || [];
    const isB = bdays.some(b => b.date.slice(5) === iso.slice(5)) && iso.slice(5, 7) === selected.slice(5, 7);
    const dots = list.slice(0, 3).map(x => `<i style="background:${x.done ? 'var(--muted)' : esc(catOf(x.category).color)}"></i>`).join('');
    const cls = [iso.slice(0, 7) !== selected.slice(0, 7) && 'other', iso === today && 'today', iso === selected && 'sel'].filter(Boolean).join(' ');
    return `<button class="${cls}" data-date="${iso}" aria-label="${fmtD(iso)}${list.length ? ', ' + list.length : ''}">${parseISO(iso).getDate()}<span class="dots">${isB ? '<i style="background:#d14d7a"></i>' : ''}${dots}</span></button>`;
  }).join('');

  const dayTasks = sortTasks(byDay[selected] || []);
  const dayB = d.birthdays.filter(b => b.date.slice(5) === selected.slice(5));

  const body = `
  <div class="card">
    <div class="row" style="margin-bottom:10px">
      <button class="icon-btn" data-month="-1" aria-label="${t('cal.prev')}">${icon('back')}</button>
      <h2 style="flex:1;text-align:center">${monthName(first.getMonth(), lang())} ${first.getFullYear()}</h2>
      <button class="icon-btn" data-month="1" aria-label="${t('cal.next')}" style="transform:scaleX(-1)">${icon('back')}</button>
    </div>
    <div class="cal-head">${weekdayNames(lang(), s.weekStart, 'narrow').map(n => `<span>${esc(n)}</span>`).join('')}</div>
    <div class="cal">${grid}</div>
    <div class="row wrap" style="margin-top:12px">
      <button class="btn sm" data-date="${today}">${t('today')}</button><span class="spacer"></span>
      <button class="btn sm" data-action="ics">${icon('download')}${t('cal.export')}</button>
    </div>
  </div>
  <div class="section-title"><h2>${selected === today ? t('today') : fmtD(selected)}</h2><a class="small" href="#/task/new?date=${selected}">+ ${t('task.add')}</a></div>
  ${dayB.map(b => `<div class="banner" style="margin-bottom:8px">🎂 ${t('bday.of', { name: b.name })}</div>`).join('')}
  ${taskList(dayTasks, { empty: t('cal.empty') })}`;

  return {
    title: t('nav.calendar'), live: true,
    html: layout(t('nav.calendar'), body, { tab: 'calendar' }),
    mount(root, rerender) {
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-date],[data-month],[data-action="ics"]'); if (!b) return;
        if (b.dataset.date) { selected = b.dataset.date; history.replaceState(null, '', `#/calendar/${selected}`); rerender(); }
        if (b.dataset.month) { selected = addMonths(selected.slice(0, 8) + '01', Number(b.dataset.month)); history.replaceState(null, '', `#/calendar/${selected}`); rerender(); }
        if (b.dataset.action === 'ics') {
          const list = d.tasks.filter(x => !x.done && x.date >= today);
          downloadICS(list.length ? list : d.tasks, 'remind-myself-tasks.ics');
        }
      });
    },
  };
}
