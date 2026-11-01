// Remind Myself — app entry: routing, global actions, startup.
import * as store from './store.js';
import { t, lang } from './i18n.js';
import { toggleFromUI, shareText } from './ui.js';
import * as reminders from './reminders.js';
import { registerSW, checkForUpdate } from './pwa.js';
import * as sync from './sync.js';
import { createBackend } from './cloud.js';

import home from './views/home.js';
import tasks from './views/tasks.js';
import taskForm from './views/taskForm.js';
import calendar from './views/calendar.js';
import reports from './views/reports.js';
import profile from './views/profile.js';
import birthdays from './views/birthdays.js';
import { categories, theme, feedback, settingsPage } from './views/menu.js';

const ROUTES = [
  [/^home$/, home], [/^tasks$/, tasks], [/^task\/([\w-]+)$/, taskForm, ['id']],
  [/^calendar(?:\/([\d-]+))?$/, calendar, ['date']], [/^reports$/, reports], [/^profile$/, profile],
  [/^categories(?:\/([\w-]+))?$/, categories, ['id']], [/^theme$/, theme],
  [/^birthdays(?:\/([\w-]+))?$/, birthdays, ['id']], [/^feedback$/, feedback], [/^settings$/, settingsPage],
];

let current = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) };
}

function resolve() {
  const { path, query } = parseHash();
  if (!path) { history.replaceState(null, '', '#/home'); return { view: home, params: {}, query: {} }; }
  for (const [re, view, names = []] of ROUTES) {
    const m = path.match(re);
    if (m) return { view, params: Object.fromEntries(names.map((n, i) => [n, m[i + 1] && decodeURIComponent(m[i + 1])])), query };
  }
  history.replaceState(null, '', '#/home');
  return { view: home, params: {}, query: {} };
}

export function render({ keepScroll = false } = {}) {
  if (!store.data()) return;   // still opening the database; startup will render
  const { view, params, query } = resolve();
  const scroll = keepScroll ? window.scrollY : 0;
  const focused = document.activeElement?.id && document.activeElement.matches('input,textarea') ? document.activeElement : null;
  const caret = focused ? [focused.id, focused.selectionStart, focused.selectionEnd] : null;
  const page = view(params, query);
  // A fresh root each time so old event listeners are dropped.
  const root = document.createElement('div'); root.id = 'app';
  root.innerHTML = page.html;
  document.getElementById('app').replaceWith(root);
  document.title = page.title === 'Remind Myself' ? page.title : `${page.title} · Remind Myself`;
  document.documentElement.lang = lang();
  current = page;
  bindGlobal(root);
  page.mount?.(root, () => render({ keepScroll: true }));
  window.scrollTo(0, scroll);
  if (caret) { const el = document.getElementById(caret[0]); if (el) { el.focus(); try { el.setSelectionRange(caret[1], caret[2]); } catch {} } }
}

function bindGlobal(root) {
  root.addEventListener('click', async e => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const a = el.dataset.action;
    const id = el.closest('[data-id]')?.dataset.id;
    if (a === 'drawer') document.body.classList.add('drawer-open');
    if (a === 'drawer-close') document.body.classList.remove('drawer-open');
    if (a === 'add') location.hash = '#/task/new';
    if (a === 'toggle' && id) { e.stopPropagation(); toggleFromUI(id); }
    if (a === 'open' && id) location.hash = `#/task/${id}`;
    if (a === 'share-app') {
      document.body.classList.remove('drawer-open');
      shareText('Remind Myself', t('share.appText'), location.origin + location.pathname);
    }
  });
}

window.addEventListener('hashchange', () => {
  document.body.classList.remove('drawer-open');
  render();
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('drawer-open'); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && current?.live && !document.querySelector('dialog[open]')) render({ keepScroll: true });
});
store.onChange(() => { if (current?.live && !document.querySelector('dialog[open]')) render({ keepScroll: true }); });
sync.onStatus(() => { if (current?.syncAware && !document.querySelector('dialog[open]')) render({ keepScroll: true }); });

// Notification click (from the service worker) → open the app on Home.
navigator.serviceWorker?.addEventListener('message', e => { if (e.data?.type === 'open') location.hash = e.data.hash || '#/home'; });

/* ---------- start ---------- */
try {
  await store.init();   // load accounts and data from IndexedDB
} catch (e) {
  console.error(e);
  document.getElementById('app').innerHTML = '<div class="auth"><div class="card"><h2>Storage unavailable</h2><p class="muted">Remind Myself needs the browser database (IndexedDB). It may be blocked in private browsing — please open Remind Myself in a normal window.</p></div></div>';
  throw e;
}
if (!location.hash) history.replaceState(null, '', '#/home');
render();
reminders.start();
sync.start(createBackend);   // optional cloud sync (does nothing until Firebase is set up)
registerSW().then(() => setTimeout(() => checkForUpdate(false), 4000));
