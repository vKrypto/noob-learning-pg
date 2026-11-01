// Reminder scheduler.
// While Remind Myself is open (or installed and running in the background tab), it
// checks every 20 seconds for tasks whose reminder time has arrived and shows a
// system notification. Browsers do not allow a static website to wake itself up
// when fully closed; that needs a push server (see README → "Next steps").

import * as store from './store.js';
import { taskDateTime, todayISO, toast } from './util.js';
import { t } from './i18n.js';
import { playTone } from './sound.js';

let timer = null;

export function notificationState() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}
export async function askPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission;
}

async function notify(title, body, tag) {
  const s = store.settings();
  playTone(s.tone === 'none' ? 'none' : 'bell');
  if (s.notifications && notificationState() === 'granted') {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './#/home' } };
      if (reg) return reg.showNotification(title, opts);
      return new Notification(title, opts);
    } catch { /* fall through to toast */ }
  }
  toast(`🔔 ${title}${body ? ' — ' + body : ''}`);
}

export function check() {
  const d = store.data(); if (!d) return;
  const now = Date.now(); let changed = false;

  for (const task of d.tasks) {
    if (task.done || task.reminder == null || task.reminder < 0) continue;
    const fireAt = taskDateTime(task).getTime() - task.reminder * 60000;
    const key = `${task.id}@${fireAt}`;
    // Fire if due within the last 6 hours and not already shown.
    if (now >= fireAt && now - fireAt < 6 * 3600000 && !d.notified[key]) {
      d.notified[key] = now; changed = true;
      const when = task.reminder === 0 ? t('rem.now') : t('rem.inMin', { n: task.reminder });
      notify(task.title, when, task.id);
    }
  }

  // Birthdays: remind once on the day (from 8 AM).
  const today = todayISO(); const md = today.slice(5);
  if (new Date().getHours() >= 8) {
    for (const b of d.birthdays) {
      const key = `bday:${b.id}:${today.slice(0, 4)}`;
      if (b.date.slice(5) === md && !d.notified[key]) {
        d.notified[key] = now; changed = true;
        notify(t('bday.todayTitle', { name: b.name }), t('bday.todayBody'), key);
      }
    }
  }

  // Forget keys older than 30 days so storage stays small.
  for (const [k, v] of Object.entries(d.notified)) if (now - v > 30 * 86400000) { delete d.notified[k]; changed = true; }
  if (changed) store.save();
}

export function start() {
  stop(); check(); timer = setInterval(check, 20000);
  document.addEventListener('visibilitychange', onVisible);
}
export function stop() { clearInterval(timer); timer = null; document.removeEventListener('visibilitychange', onVisible); }
function onVisible() { if (document.visibilityState === 'visible') check(); }
