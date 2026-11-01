// Shared UI pieces: page layout, nav, drawer, task rows.
import * as store from './store.js';
import { t, lang } from './i18n.js';
import { esc, icon, fmtDate, fmtTime, todayISO, taskDateTime, toast } from './util.js';
import { playTone } from './sound.js';

export function catOf(id) {
  return store.data().categories.find(c => c.id === id) || { id, name: id, color: '#888', emoji: '🏷️' };
}
export function catName(c) { return c.name || t(`cat.${c.id}`); }
export const fmtD = iso => fmtDate(iso, store.settings().dateFormat, lang());

export function avatar(cls = '') {
  const u = store.currentUser(); const p = store.data()?.profile;
  if (p?.photo) return `<img class="avatar ${cls}" src="${esc(p.photo)}" alt="">`;
  return `<span class="avatar ${cls}" aria-hidden="true">${u?.name ? esc(u.name.trim().charAt(0).toUpperCase()) : '🙂'}</span>`;
}

const TABS = [
  ['home', 'home', 'nav.home'], ['tasks', 'list', 'nav.tasks'], ['calendar', 'calendar', 'nav.calendar'],
  ['reports', 'chart', 'nav.reports'], ['profile', 'user', 'nav.profile'],
];

/**
 * Page layout. opts: { tab, back, actions, fab }
 */
export function layout(title, body, opts = {}) {
  const u = store.currentUser();
  const left = opts.back
    ? `<a class="icon-btn" href="${esc(opts.back)}" aria-label="${t('back')}">${icon('back')}</a>`
    : `<button class="icon-btn" data-action="drawer" aria-label="${t('menu')}">${icon('menu')}</button>`;
  return `
  <div class="shell">
    <header class="topbar">${left}<h1>${esc(title)}</h1>${opts.actions || ''}</header>
    <main>${body}</main>
  </div>
  ${opts.fab === false ? '' : `<button class="fab" data-action="add" aria-label="${t('task.add')}">${icon('plus')}</button>`}
  <nav class="nav" aria-label="Main"><div class="nav-inner">
    ${TABS.map(([r, ic, k]) => `<a href="#/${r}" ${opts.tab === r ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(k)}</span></a>`).join('')}
  </div></nav>
  <div class="scrim" data-action="drawer-close"></div>
  <aside class="drawer" aria-label="${t('menu')}">
    <a class="me" href="#/profile" style="color:inherit;text-decoration:none">${avatar()}<div style="min-width:0"><b>${esc(u?.name || 'Remind Myself')}</b><div class="small muted">${t('nav.profile')}</div></div></a>
    <a href="#/categories">${icon('tag')}${t('menu.categories')}</a>
    <a href="#/theme">${icon('palette')}${t('menu.theme')}</a>
    <a href="#/birthdays">${icon('cake')}${t('menu.birthdays')}</a>
    <button class="link" data-action="share-app">${icon('share')}${t('menu.share')}</button>
    <a href="#/feedback">${icon('chat')}${t('menu.feedback')}</a>
    <a href="#/settings">${icon('gear')}${t('menu.settings')}</a>
  </aside>`;
}

/** One task row. */
export function taskItem(task, { highlight = '' } = {}) {
  const c = catOf(task.category); const today = todayISO();
  const late = !task.done && (task.date < today || (task.date === today && task.time && taskDateTime(task) < new Date()));
  const hl = s => {
    if (!highlight) return esc(s);
    const re = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return String(s).split(re).map((part, i) => i % 2 ? `<mark>${esc(part)}</mark>` : esc(part)).join('');
  };
  const dateLabel = task.date === today ? t('today') : fmtD(task.date);
  return `<li class="task ${task.done ? 'done' : ''}" style="--cat:${esc(c.color)}" data-id="${esc(task.id)}">
    <button class="check" data-action="toggle" aria-label="${task.done ? t('task.markPending') : t('task.markDone')}" aria-pressed="${task.done}">${icon('check')}</button>
    <div class="task-body" data-action="open">
      <div class="task-title">${task.priority === 'high' ? '<span title="High priority">❗</span> ' : ''}${hl(task.title)}</div>
      <div class="task-meta">
        <span>${esc(c.emoji)} ${esc(catName(c))}</span>
        <span class="${late ? 'late' : ''}">${dateLabel}${task.time ? ' · ' + fmtTime(task.time, lang()) : ''}${late ? ' · ' + t('task.overdue') : ''}</span>
        ${task.reminder != null && task.reminder >= 0 && !task.done ? `<span>${icon('bell')}</span>` : ''}
        ${task.repeat && task.repeat !== 'none' ? `<span>${icon('repeat')} ${t('repeat.' + task.repeat)}</span>` : ''}
        ${task.notes && highlight ? `<span>${hl(task.notes.slice(0, 60))}</span>` : ''}
      </div>
    </div>
  </li>`;
}

export function taskList(tasks, opts) {
  if (!tasks.length) return `<div class="empty"><div class="big">🌿</div>${esc(opts?.empty || t('task.none'))}</div>`;
  return `<ul class="task-list">${tasks.map(x => taskItem(x, opts)).join('')}</ul>`;
}

export function sortTasks(list) {
  return [...list].sort((a, b) => (a.done - b.done) || a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99') || (b.priority === 'high') - (a.priority === 'high'));
}

/** Handle the toggle checkbox on any task row. */
export function toggleFromUI(id) {
  const res = store.toggleTask(id); if (!res) return;
  if (res.task.done) {
    playTone(store.settings().tone);
    toast(res.next ? t('task.doneNext', { date: fmtD(res.next.date) }) : t('task.doneToast'));
  }
}

export function ring(pct, size = 84) {
  const r = 36; const c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 84 84" width="${size}" height="${size}" role="img" aria-label="${pct}%">
    <circle class="bg" cx="42" cy="42" r="${r}"/><circle class="fg" cx="42" cy="42" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/>
    <text x="42" y="48" text-anchor="middle">${pct}%</text></svg>`;
}

/** Share text using the phone's share sheet, or copy it. */
export async function shareText(title, text, url) {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n')); toast(t('copied')); }
  catch { toast(t('share.failed')); }
}
