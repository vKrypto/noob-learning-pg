// Sync engine: keeps this device's tasks and the cloud copy the same.
//
// The big idea — "what changed since we last agreed?"
//   After every successful sync we remember a BASELINE: a snapshot of what this
//   device and the cloud both had. Later, comparing the current data with the
//   baseline tells us exactly what changed here (to upload) and what changed in
//   the cloud (to download), even after days offline.
//
// Conflicts (the same task changed on two devices before they talked):
//   the edit with the newest timestamp wins. If one device deleted a task while
//   the other edited it, the edit wins — losing work is worse than an extra task.
//
// The app works the same signed in or not: screens only ever read/write the
// local copy (store.js); this file copies changes in both directions.

import * as store from './store.js';
import * as db from './db.js';

const DOC_FIELDS = ['categories', 'birthdays', 'profile', 'settings', 'feedback'];
const clean = v => JSON.parse(JSON.stringify(v));          // drops undefined values Firestore rejects
const json = v => (v === undefined || v === null ? undefined : JSON.stringify(v));
const docOf = d => clean(Object.fromEntries(DOC_FIELDS.map(k => [k, d[k]])));
const stripDoc = d => { const { updatedAt, ...rest } = d; return clean(Object.fromEntries(DOC_FIELDS.map(k => [k, rest[k]]))); };
const stamp = t => t.updatedAt || t.completedAt || t.createdAt || 0;
const RETRY_MS = 20000;

let backend = null;       // cloud.js connector (or null when sync isn't set up)
let user = null;          // { uid, email, name } when signed in
let base = null;          // baseline: { uid, tasks: { id: json }, doc: json }
let unsubscribe = null;
let applyingRemote = false;
let pushTimer = null, retryTimer = null;
let pushQueue = Promise.resolve();
let lastDocJson = null;
let status = { state: 'loading' };   // loading | unconfigured | signedOut | syncing | synced | offline | error
const statusListeners = new Set();

export function onStatus(fn) { statusListeners.add(fn); return () => statusListeners.delete(fn); }
export function getStatus() { return { ...status, user }; }
function setStatus(s) { status = s; statusListeners.forEach(fn => fn(getStatus())); }

const saveBase = () => db.put('meta', { key: 'syncBase', value: base }).catch(() => {});
const errState = e => ({ state: navigator.onLine === false ? 'offline' : 'error', error: e?.code || e?.message || String(e) });

/* ---------------- start ---------------- */

/** Call once after store.init(). createBackend comes from cloud.js. */
export async function start(createBackend) {
  try { backend = await createBackend(); }
  catch (e) { console.warn('Sync unavailable', e); backend = null; setStatus({ state: 'error', error: 'load' }); return; }
  if (!backend) { setStatus({ state: 'unconfigured' }); return; }

  base = (await db.get('meta', 'syncBase'))?.value || null;
  lastDocJson = json(docOf(store.data()));

  store.onChange(() => {
    const d = store.data(); if (!d) return;
    const dj = json(docOf(d));
    if (dj !== lastDocJson && !applyingRemote) { lastDocJson = dj; d.docUpdatedAt = Date.now(); }
    if (user && !applyingRemote) schedulePush();
  });
  window.addEventListener('online', () => { if (user && status.state !== 'synced') connect(user); });

  setStatus({ state: 'signedOut' });
  backend.onUser(u => { if (u) connect(u); else disconnect(); });
}

/* ---------------- sign in / out ---------------- */

export const signInGoogle = () => backend.signInGoogle();
export const signInEmail = (e, p) => backend.signInEmail(e, p);
export const signUpEmail = (e, p) => backend.signUpEmail(e, p);
export const resetPassword = e => backend.resetPassword(e);
export const isSignedIn = () => !!user;

/** Upload anything pending, sign out, and clear this device (the account keeps everything). */
export async function signOut() {
  clearTimeout(pushTimer);
  try { await Promise.race([push(), new Promise(r => setTimeout(r, 5000))]); } catch {}
  await backend.signOut();
  base = null; await db.del('meta', 'syncBase').catch(() => {});
  await store.resetAll();
  lastDocJson = json(docOf(store.data()));
}

function disconnect() {
  unsubscribe?.(); unsubscribe = null; user = null;
  clearTimeout(retryTimer);
  setStatus({ state: 'signedOut' });
}

/* ---------------- first sync after signing in (or reconnecting) ---------------- */

async function connect(u) {
  user = u; clearTimeout(retryTimer);
  unsubscribe?.(); unsubscribe = null;
  setStatus({ state: 'syncing' });
  try {
    const cloud = await backend.load(u.uid);
    const d = store.data();
    const local = new Map(d.tasks.map(t => [t.id, t]));
    const remote = new Map(cloud.tasks.map(t => [t.id, t]));
    const merged = new Map(); const toUpload = []; const toDelete = [];
    const firstTime = !base || base.uid !== u.uid;

    if (firstTime) {
      // New on this device: combine both sides. Starter example tasks are
      // dropped if the account already has tasks, so they don't pile up.
      if (remote.size) for (const [id, t] of local) if (t.sample) local.delete(id);
      for (const id of new Set([...local.keys(), ...remote.keys()])) {
        const l = local.get(id), r = remote.get(id);
        if (l && r) { const win = stamp(l) >= stamp(r) ? l : r; merged.set(id, win); if (win === l && json(l) !== json(r)) toUpload.push(l); }
        else if (l) { merged.set(id, l); toUpload.push(l); }
        else merged.set(id, r);
      }
    } else {
      // Returning: three-way compare local and cloud against the baseline.
      for (const id of new Set([...local.keys(), ...remote.keys(), ...Object.keys(base.tasks)])) {
        const l = local.get(id), r = remote.get(id), b = base.tasks[id];
        const localChanged = json(l) !== b, cloudChanged = json(r) !== b;
        if (!localChanged) { if (r) merged.set(id, r); continue; }                       // take the cloud's version (or its deletion)
        if (!cloudChanged) { if (l) { merged.set(id, l); toUpload.push(l); } else toDelete.push(id); continue; } // send ours
        if (!l && !r) continue;                                                          // deleted on both
        if (!l) { merged.set(id, r); continue; }                                         // deleted here, edited there → keep edit
        if (!r) { merged.set(id, l); toUpload.push(l); continue; }                       // deleted there, edited here → keep edit
        const win = stamp(l) >= stamp(r) ? l : r; merged.set(id, win); if (win === l) toUpload.push(l);
      }
    }

    // The account document (profile, categories, settings…)
    const localDoc = docOf(d); const cloudDoc = cloud.doc ? stripDoc(cloud.doc) : null;
    let finalDoc = cloudDoc, uploadDoc = false;
    if (!cloudDoc) { finalDoc = localDoc; uploadDoc = true; }
    else if (!firstTime && json(localDoc) !== base.doc &&
      (json(cloudDoc) === base.doc || (d.docUpdatedAt || 0) >= (cloud.doc.updatedAt || 0))) { finalDoc = localDoc; uploadDoc = true; }

    // Apply the merged result here…
    applyingRemote = true;
    d.tasks = [...merged.values()];
    Object.assign(d, clean(finalDoc));
    await store.save();
    applyingRemote = false;
    lastDocJson = json(docOf(d));

    // …and send our side to the cloud.
    await backend.write(u.uid, {
      setTasks: toUpload.map(clean), deleteTaskIds: toDelete,
      doc: uploadDoc ? { ...finalDoc, updatedAt: d.docUpdatedAt || Date.now() } : null,
    });

    base = { uid: u.uid, tasks: Object.fromEntries([...merged].map(([id, t]) => [id, json(t)])), doc: json(finalDoc) };
    await saveBase();
    if (user !== u) return;   // signed out meanwhile
    unsubscribe = backend.subscribe(u.uid, applyRemoteTasks, applyRemoteDoc, e => { setStatus(errState(e)); retryLater(); });
    setStatus({ state: 'synced', at: Date.now() });
    schedulePush();           // anything edited while we were connecting
  } catch (e) {
    applyingRemote = false;
    console.warn('Sync failed', e);
    setStatus(errState(e)); retryLater();
  }
}

function retryLater() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => { if (user) connect(user); }, RETRY_MS);
}

/* ---------------- live updates from other devices ---------------- */

async function applyRemoteTasks(changes) {
  if (!base) return;
  const d = store.data(); let changed = false;
  for (const { type, id, task } of changes) {
    const l = d.tasks.find(t => t.id === id); const b = base.tasks[id];
    const localUnsent = l && json(l) !== b;
    if (type === 'removed') {
      delete base.tasks[id];
      if (l && !localUnsent) { d.tasks = d.tasks.filter(t => t.id !== id); changed = true; }
      continue;
    }
    const rj = json(task);
    if (l && json(l) === rj) { base.tasks[id] = rj; continue; }         // already have it (often our own echo)
    if (rj === b) continue;                                             // nothing new
    if (localUnsent && stamp(l) > stamp(task)) continue;                // our newer edit is about to upload
    if (l) Object.keys(l).forEach(k => delete l[k]);
    l ? Object.assign(l, task) : d.tasks.push(task);
    base.tasks[id] = rj; changed = true;
  }
  if (changed) { applyingRemote = true; await store.save(); applyingRemote = false; }
  saveBase();
  setStatus({ state: 'synced', at: Date.now() });
}

async function applyRemoteDoc(cloudDoc) {
  if (!base) return;
  const d = store.data(); const incoming = stripDoc(cloudDoc); const ij = json(incoming);
  if (ij === base.doc || ij === json(docOf(d))) { base.doc = ij; saveBase(); return; }
  const localUnsent = json(docOf(d)) !== base.doc;
  if (localUnsent && (d.docUpdatedAt || 0) > (cloudDoc.updatedAt || 0)) return;
  applyingRemote = true; Object.assign(d, incoming); await store.save(); applyingRemote = false;
  base.doc = ij; lastDocJson = ij; saveBase();
  setStatus({ state: 'synced', at: Date.now() });
}

/* ---------------- sending local changes ---------------- */

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushQueue = pushQueue.then(push, push); }, 400);
}

async function push() {
  if (!user || !base || base.uid !== user.uid) return;
  const d = store.data();
  const setTasks = []; const deleteTaskIds = []; const nextTasks = { ...base.tasks };
  const ids = new Set(d.tasks.map(t => t.id));
  for (const t of d.tasks) { const j = json(t); if (j !== base.tasks[t.id]) { setTasks.push(clean(t)); nextTasks[t.id] = j; } }
  for (const id of Object.keys(base.tasks)) if (!ids.has(id)) { deleteTaskIds.push(id); delete nextTasks[id]; }
  const docNow = docOf(d); const dj = json(docNow); const docChanged = dj !== base.doc;
  if (!setTasks.length && !deleteTaskIds.length && !docChanged) return;

  setStatus({ state: navigator.onLine === false ? 'offline' : 'syncing' });
  try {
    await backend.write(user.uid, { setTasks, deleteTaskIds, doc: docChanged ? { ...docNow, updatedAt: d.docUpdatedAt || Date.now() } : null });
    base = { ...base, tasks: nextTasks, doc: docChanged ? dj : base.doc };
    await saveBase();
    setStatus({ state: 'synced', at: Date.now() });
  } catch (e) {
    console.warn('Upload failed', e);
    setStatus(errState(e)); retryLater();
  }
}
