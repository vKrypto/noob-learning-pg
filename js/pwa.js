// Service worker registration, install prompt, and "check for updates".
import { toast, confirmBox } from './util.js';
import { t } from './i18n.js';

export const VERSION = '1.0.0'; // keep in sync with CACHE in sw.js

let reg = null;

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    reg = await navigator.serviceWorker.register('sw.js');
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) offerReload();
      });
    });
  } catch (e) { console.warn('Service worker not registered', e); }

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__installPrompt = e; });
  // Reload only when an update replaced an existing worker (not on first install).
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloading) { reloading = true; location.reload(); }
  });
}

async function offerReload() {
  if (await confirmBox(t('update.ready'), t('update.reload'), t('update.later'))) {
    reg?.waiting?.postMessage('skipWaiting');
  }
}

export async function checkForUpdate(manual = false) {
  if (!reg) { if (manual) toast(t('update.unavailable')); return; }
  try {
    await reg.update();
    if (reg.waiting) offerReload();
    else if (manual) toast(t('update.latest'));
  } catch { if (manual) toast(t('update.offline')); }
}
