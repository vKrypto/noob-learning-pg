import * as store from '../store.js';
import { t, lang } from '../i18n.js';
import { esc, icon, $, todayISO, toast, confirmBox } from '../util.js';
import { layout, catName, fmtD, shareText, toggleFromUI } from '../ui.js';
import { voiceSupported, listen, parseSpoken } from '../voice.js';
import { googleCalendarUrl, downloadICS } from '../ics.js';
import { askPermission } from '../reminders.js';

const REMINDERS = [-1, 0, 5, 10, 15, 30, 60, 120, 1440];

export default function taskForm(params, query) {
  const isNew = params.id === 'new';
  const task = isNew ? null : store.getTask(params.id);
  if (!isNew && !task) return { title: t('err.notFound'), html: layout(t('err.notFound'), `<div class="empty"><div class="big">🔍</div>${t('err.notFound')}<p><a class="btn" href="#/tasks">${t('nav.tasks')}</a></p></div>`, { back: '#/tasks' }) };

  let draft = {};
  try { draft = JSON.parse(sessionStorage.getItem('dn.draft') || '{}'); sessionStorage.removeItem('dn.draft'); } catch {}
  const s = store.settings(); const d = store.data();
  const v = task || {
    title: draft.title || '', notes: '', category: query.cat || 'personal',
    date: draft.date || query.date || todayISO(), time: draft.time || '', reminder: s.defaultReminder, repeat: 'none', priority: 'normal',
  };
  const remVal = v.reminder == null ? -1 : v.reminder;
  const remLabel = m => m === -1 ? t('rem.none') : m === 0 ? t('rem.atTime') : m >= 1440 ? t('rem.dayBefore') : m >= 60 ? t('rem.hours', { n: m / 60 }) : t('rem.minutes', { n: m });

  const body = `
  <form class="stack" id="tf" novalidate>
    <label class="field"><span>${t('task.title')}</span>
      <div class="input-wrap"><input class="input" name="title" required maxlength="200" value="${esc(v.title)}" placeholder="${t('task.titlePh')}">
      ${voiceSupported ? `<button type="button" class="icon-btn" data-action="mic" aria-label="${t('voice')}">${icon('mic')}</button>` : ''}</div>
    </label>
    <label class="field"><span>${t('task.category')}</span>
      <select class="input" name="category">${d.categories.map(c => `<option value="${esc(c.id)}" ${c.id === v.category ? 'selected' : ''}>${esc(c.emoji)} ${esc(catName(c))}</option>`).join('')}</select>
    </label>
    <div class="grid-2">
      <label class="field"><span>${t('task.date')}</span><input class="input" type="date" name="date" required value="${esc(v.date)}"></label>
      <label class="field"><span>${t('task.time')}</span><input class="input" type="time" name="time" value="${esc(v.time || '')}"></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>${t('task.reminder')}</span>
        <select class="input" name="reminder">${REMINDERS.map(m => `<option value="${m}" ${m === remVal ? 'selected' : ''}>${remLabel(m)}</option>`).join('')}</select></label>
      <label class="field"><span>${t('task.repeat')}</span>
        <select class="input" name="repeat">${['none', 'daily', 'weekly', 'monthly', 'yearly'].map(r => `<option value="${r}" ${r === v.repeat ? 'selected' : ''}>${t('repeat.' + r)}</option>`).join('')}</select></label>
    </div>
    <label class="list-row card" style="padding:12px 16px">
      <span class="label">❗ ${t('task.high')}</span>
      <span class="switch"><input type="checkbox" name="high" ${v.priority === 'high' ? 'checked' : ''}><span></span></span>
    </label>
    <label class="field"><span>${t('task.notes')}</span><textarea class="input" name="notes" maxlength="2000" placeholder="${t('task.notesPh')}">${esc(v.notes || '')}</textarea></label>
    <p class="error" role="alert"></p>
    <button class="btn primary block">${isNew ? t('task.add') : t('save')}</button>
  </form>

  ${task ? `
  <div class="section-title"><h2>${t('task.more')}</h2></div>
  <div class="list">
    <button class="list-row btn" style="border:0;border-radius:0;width:100%;justify-content:flex-start" data-action="toggle">${icon('check')} ${task.done ? t('task.markPending') : t('task.markDone')}</button>
    <button class="list-row btn" style="border:0;border-radius:0;width:100%;justify-content:flex-start" data-action="share">${icon('share')} ${t('task.share')}</button>
    <a class="list-row btn" style="border:0;border-radius:0;justify-content:flex-start" target="_blank" rel="noopener" href="${esc(googleCalendarUrl(task))}">${icon('calendar')} ${t('task.gcal')}</a>
    <button class="list-row btn" style="border:0;border-radius:0;width:100%;justify-content:flex-start" data-action="ics">${icon('download')} ${t('task.ics')}</button>
    <button class="list-row btn danger" style="border:0;border-radius:0;width:100%;justify-content:flex-start" data-action="delete">${icon('trash')} ${t('task.delete')}</button>
  </div>
  <p class="small muted" style="margin:10px 4px">${t('task.created', { date: fmtD(new Date(task.createdAt).toISOString().slice(0, 10)) })}${task.done && task.completedAt ? ' · ' + t('task.completedOn', { date: fmtD(new Date(task.completedAt).toISOString().slice(0, 10)) }) : ''}</p>` : ''}`;

  return {
    title: isNew ? t('task.new') : t('task.edit'),
    html: layout(isNew ? t('task.new') : t('task.edit'), body, { back: '#/tasks', fab: false }),
    mount(root) {
      const f = $('#tf', root); const err = $('.error', root);
      if (isNew && !v.title) f.title.focus();
      f.addEventListener('submit', async e => {
        e.preventDefault(); err.textContent = '';
        try {
          const reminder = Number(f.reminder.value);
          store.saveTask({
            id: task?.id, title: f.title.value, notes: f.notes.value, category: f.category.value,
            date: f.date.value, time: f.time.value, reminder: reminder < 0 ? null : reminder, repeat: f.repeat.value,
            priority: f.high.checked ? 'high' : 'normal',
          });
          if (reminder >= 0) askPermission();
          toast(isNew ? t('task.added') : t('task.saved'));
          history.length > 1 ? history.back() : (location.hash = '#/tasks');
        } catch (ex) { err.textContent = t(ex.message); }
      });
      root.addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const a = btn.dataset.action;
        if (a === 'mic') {
          btn.classList.add('mic', 'listening');
          try {
            const p = parseSpoken(await listen(lang()));
            f.title.value = p.title; if (p.date) f.date.value = p.date; if (p.time) f.time.value = p.time;
          } catch (ex) { toast(t(ex.message)); }
          finally { btn.classList.remove('mic', 'listening'); }
        }
        if (a === 'toggle') { toggleFromUI(task.id); location.hash = '#/tasks'; }
        if (a === 'share') {
          const when = `${fmtD(task.date)}${task.time ? ' ' + task.time : ''}`;
          shareText(task.title, `📝 ${task.title}\n📅 ${when}${task.notes ? '\n' + task.notes : ''}\n— ${t('share.via')}`, location.origin + location.pathname);
        }
        if (a === 'ics') downloadICS([task], `${task.title.slice(0, 30) || 'task'}.ics`);
        if (a === 'delete' && await confirmBox(t('task.confirmDelete'), t('delete'), t('cancel'))) {
          store.deleteTask(task.id); toast(t('task.deleted')); location.hash = '#/tasks';
        }
      });
    },
  };
}
