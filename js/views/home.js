import * as store from '../store.js';
import { t, lang } from '../i18n.js';
import { esc, icon, todayISO, addDays, startOfWeek, parseISO, weekdayNames, daysBetween, fmtTime, toast, $ } from '../util.js';
import { layout, taskList, sortTasks, ring, fmtD, catOf } from '../ui.js';
import { quoteOfDay, randomQuote } from '../quotes.js';
import { voiceSupported, listen, parseSpoken } from '../voice.js';
import { notificationState, askPermission } from '../reminders.js';
import { nextBirthdays } from './birthdays.js';

let shownQuote = null;

function greeting() {
  const h = new Date().getHours();
  return t(h < 12 ? 'home.morning' : h < 17 ? 'home.afternoon' : 'home.evening');
}

function weekWidget(tasks) {
  const s = store.settings(); const today = todayISO(); const start = startOfWeek(today, s.weekStart);
  const names = weekdayNames(lang(), s.weekStart, 'narrow');
  return `<div class="section-title"><h2>${t('widget.week')}</h2><a class="small" href="#/calendar">${t('open')}</a></div>
  <div class="card"><div class="week">${names.map((n, i) => {
    const iso = addDays(start, i); const day = tasks.filter(x => x.date === iso);
    const left = day.filter(x => !x.done).length;
    return `<a href="#/calendar/${iso}" class="${iso === today ? 'today' : ''}">${esc(n)}<b>${parseISO(iso).getDate()}</b><small>${day.length ? `${day.length - left}/${day.length}` : '·'}</small></a>`;
  }).join('')}</div></div>`;
}

function monthWidget(tasks) {
  const today = todayISO(); const ym = today.slice(0, 7);
  const list = sortTasks(tasks.filter(x => x.date.startsWith(ym) && x.date >= today && !x.done)).slice(0, 8);
  return `<div class="section-title"><h2>${t('widget.month')}</h2><a class="small" href="#/calendar">${t('open')}</a></div>
  <div class="list">${list.length ? list.map(x => `<a class="list-row" href="#/task/${esc(x.id)}" style="color:inherit;text-decoration:none">
      <span class="dot" style="background:${esc(catOf(x.category).color)}"></span>
      <span class="label">${esc(x.title)}</span><span class="small muted">${x.date === today ? t('today') : fmtD(x.date)}${x.time ? ' · ' + fmtTime(x.time, lang()) : ''}</span></a>`).join('')
    : `<div class="list-row muted">${t('widget.monthEmpty')}</div>`}</div>`;
}

export default function home() {
  const d = store.data(); const s = d.settings; const u = store.currentUser(); const today = todayISO();
  const todays = d.tasks.filter(x => x.date === today);
  const overdue = d.tasks.filter(x => !x.done && x.date < today);
  const done = todays.filter(x => x.done).length;
  const pct = todays.length ? Math.round(done / todays.length * 100) : 0;
  shownQuote ||= quoteOfDay();
  const q = shownQuote;
  const bdays = nextBirthdays(d.birthdays).filter(b => b.days <= 7).slice(0, 2);
  const perm = notificationState();

  const body = `
  <section class="card hero">
    ${ring(pct)}
    <div style="min-width:0">
      <div class="muted small">${greeting()},</div>
      <h2 style="font-size:1.4rem">${esc(u.name.split(' ')[0])}</h2>
      <div class="small muted">${todays.length ? t('home.progress', { done, total: todays.length }) : t('home.nothingToday')}</div>
      ${d.profile.slogan ? `<div class="small" style="margin-top:4px;font-style:italic">“${esc(d.profile.slogan)}”</div>` : ''}
    </div>
  </section>

  ${perm === 'default' && s.notifications ? `<div class="banner" style="margin-top:12px">${icon('bell')}<div class="small" style="flex:1">${t('home.enableNotif')}</div><button class="btn sm primary" data-action="perm">${t('enable')}</button></div>` : ''}

  ${bdays.map(b => `<a class="banner" href="#/birthdays" style="margin-top:12px;color:inherit;text-decoration:none">
      <div class="countdown">${b.days}<small>${t(b.days === 1 ? 'bday.day' : 'bday.days')}</small></div>
      <div style="flex:1">🎂 ${b.days === 0 ? t('bday.todayTitle', { name: b.name }) : t('bday.soon', { name: b.name })}</div></a>`).join('')}

  <div class="card" style="margin-top:12px">
    <blockquote class="quote" style="margin:0">${esc(lang() === 'hi' ? q.hi : q.en)}<footer>— ${esc(q.by)}</footer></blockquote>
    <div class="row" style="margin-top:10px"><span class="small muted">${t('home.quoteLabel')}</span><span class="spacer"></span>
      <button class="btn sm" data-action="quote">${icon('refresh')}${t('home.newQuote')}</button></div>
  </div>

  ${voiceSupported ? `<button class="btn block" style="margin-top:12px" data-action="voice">${icon('mic')}${t('home.voiceAdd')}</button>` : ''}

  ${overdue.length ? `<div class="section-title"><h2 style="color:var(--danger)">${t('home.overdue')} (${overdue.length})</h2></div>${taskList(sortTasks(overdue))}` : ''}

  <div class="section-title"><h2>${t('home.today')}</h2><a class="small" href="#/tasks">${t('home.seeAll')}</a></div>
  ${taskList(sortTasks(todays), { empty: t('home.emptyToday') })}

  ${s.widgets.week ? weekWidget(d.tasks) : ''}
  ${s.widgets.month ? monthWidget(d.tasks) : ''}`;

  return {
    title: 'DayNest', live: true,
    html: layout('DayNest', body, { tab: 'home' }),
    mount(root, rerender) {
      root.addEventListener('click', async e => {
        const a = e.target.closest('[data-action]')?.dataset.action;
        if (a === 'quote') { shownQuote = randomQuote(shownQuote); rerender(); }
        if (a === 'perm') { await askPermission(); rerender(); }
        if (a === 'voice') {
          const btn = e.target.closest('button'); btn.classList.add('mic', 'listening');
          try {
            const text = await listen(lang());
            const p = parseSpoken(text);
            sessionStorage.setItem('dn.draft', JSON.stringify({ title: p.title, date: p.date || todayISO(), time: p.time }));
            location.hash = '#/task/new';
          } catch (ex) { toast(t(ex.message)); }
          finally { btn.classList.remove('mic', 'listening'); }
        }
      });
    },
  };
}
