// DayNest — app entry: routing, global actions, startup.
import * as store from './store.js';
import { t, lang } from './i18n.js';
import { toast, confirmBox } from './util.js';
import { toggleFromUI, shareText } from './ui.js';
import * as reminders from './reminders.js';
import { registerSW, checkForUpdate } from './pwa.js';

import { signin, signup } from './views/auth.js';
import home from './views/home.js';
import tasks from './views/tasks.js';
import taskForm from './views/taskForm.js';
import calendar from './views/calendar.js';
import reports from './views/reports.js';
import profile from './views/profile.js';
import birthdays from './views/birthdays.js';
import { categories, theme, feedback, settingsPage } from './views/menu.js';

const PUBLIC = { signin, signup };
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
  const loggedIn = !!store.currentUser();
  if (!loggedIn) {
    if (!PUBLIC[path]) history.replaceState(null, '', '#/signin');
    return { view: PUBLIC[path] || signin, params: {}, query };
  }
  if (PUBLIC[path] || !path) { history.replaceState(null, '', '#/home'); return { view: home, params: {}, query: {} }; }
  for (const [re, view, names = []] of ROUTES) {
    const m = path.match(re);
    if (m) return { view, params: Object.fromEntries(names.map((n, i) => [n, m[i + 1] && decodeURIComponent(m[i + 1])])), query };
  }
  history.replaceState(null, '', '#/home');
  return { view: home, params: {}, query: {} };
}

export function render({ keepScroll = false } = {}) {
  const { view, params, query } = resolve();
  const scroll = keepScroll ? window.scrollY : 0;
  const page = view(params, query);
  // A fresh root each time so old event listeners are dropped.
  const root = document.createElement('div'); root.id = 'app';
  root.innerHTML = page.html;
  document.getElementById('app').replaceWith(root);
  document.title = `${page.title} · DayNest`;
  document.documentElement.lang = lang();
  current = page;
  bindGlobal(root);
  page.mount?.(root, () => render({ keepScroll: true }));
  window.scrollTo(0, scroll);
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
      shareText('DayNest', t('share.appText'), location.origin + location.pathname);
    }
    if (a === 'logout') {
      document.body.classList.remove('drawer-open');
      if (await confirmBox(t('menu.logoutConfirm'), t('menu.logout'), t('cancel'))) {
        reminders.stop(); store.signOut(); location.hash = '#/signin';
      }
    }
  });
}

window.addEventListener('hashchange', () => {
  document.body.classList.remove('drawer-open');
  if (store.currentUser()) reminders.start(); else reminders.stop();
  render();
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('drawer-open'); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && current?.live && !document.querySelector('dialog[open]')) render({ keepScroll: true });
});
store.onChange(() => { if (current?.live && !document.querySelector('dialog[open]')) render({ keepScroll: true }); });

// Notification click (from the service worker) → open the app on Home.
navigator.serviceWorker?.addEventListener('message', e => { if (e.data?.type === 'open') location.hash = e.data.hash || '#/home'; });

/* ---------- start ---------- */
try {
  await store.init();   // load accounts and data from IndexedDB
} catch (e) {
  console.error(e);
  document.getElementById('app').innerHTML = '<div class="auth"><div class="card"><h2>Storage unavailable</h2><p class="muted">DayNest needs the browser database (IndexedDB). It may be blocked in private browsing — please open DayNest in a normal window.</p></div></div>';
  throw e;
}
if (!location.hash) history.replaceState(null, '', store.currentUser() ? '#/home' : '#/signin');
render();
if (store.currentUser()) reminders.start();
registerSW().then(() => setTimeout(() => checkForUpdate(false), 4000));
if (!window.isSecureContext) toast('Open over https:// for sign-in to work.');
