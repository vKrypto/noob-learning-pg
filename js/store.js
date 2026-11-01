// Your data, stored in the browser's built-in database (IndexedDB).
//
// There is no sign-in: the app keeps one personal profile on this device.
// This app runs on GitHub Pages (static hosting), so there is no server.
// To sync across devices later, swap the functions in this file for calls to a
// backend (e.g. Firebase + Firestore) — the rest of the app only talks to the
// exported functions below.
//
// How it works: init() loads the data from IndexedDB into memory once at
// startup, so screens can read synchronously. Every change is written back to
// IndexedDB straight away.

import { uid, todayISO, addDays, addMonths } from './util.js';
import * as db from './db.js';

export const DEFAULT_CATEGORIES = [
  { id: 'personal', color: '#4c7bd9', emoji: '🙂' },
  { id: 'professional', color: '#7a5bc7', emoji: '💼' },
  { id: 'shopping', color: '#d9822b', emoji: '🛒' },
  { id: 'health', color: '#3e9a62', emoji: '💪' },
  { id: 'study', color: '#2b8fb3', emoji: '📚' },
  { id: 'birthdays', color: '#d14d7a', emoji: '🎂' },
  { id: 'special', color: '#c9a227', emoji: '⭐' },
].map(c => ({ ...c, builtin: true, name: null }));

export const DEFAULT_SETTINGS = {
  dateFormat: 'DD/MM/YYYY',
  weekStart: 1,             // 0 Sunday, 1 Monday
  tone: 'chime',            // chime | bell | pop | none
  widgets: { week: true, month: false },
  defaultReminder: 10,      // minutes before; -1 = no reminder
  notifications: true,
};

const LOCAL_ID = 'me';      // record key for a brand-new device
let profileId = null;       // which userdata record this device uses
let cache = null;           // that record's data, in memory

const logErr = e => { console.error('Remind Myself database error', e); return false; };

/** Load everything needed to start. Call once before the first render. */
export async function init() {
  await migrateFromLocalStorage();
  profileId = (await db.get('meta', 'profileId'))?.value || null;
  let oldUser = null;
  if (!profileId) {
    // Earlier versions had sign-in. Keep using whoever was signed in last
    // (or the first account), so nobody loses their tasks.
    const users = await db.getAll('users');
    const sessionId = (await db.get('meta', 'session'))?.value;
    oldUser = users.find(u => u.id === sessionId) || users[0] || null;
    profileId = oldUser?.id || LOCAL_ID;
    await db.put('meta', { key: 'profileId', value: profileId });
  }
  await loadData(profileId, oldUser?.name);
  db.requestPersistence();
  try { localStorage.removeItem('dn.lang'); } catch {}
}

async function loadData(id, fallbackName = '') {
  const rec = await db.get('userdata', id);
  const d = rec?.value || freshData();
  d.settings = { ...structuredClone(DEFAULT_SETTINGS), ...d.settings, widgets: { ...DEFAULT_SETTINGS.widgets, ...(d.settings?.widgets || {}) } };
  delete d.settings.language;   // the app is English-only now
  d.birthdays ||= []; d.feedback ||= []; d.notified ||= {};
  d.profile = { photo: null, slogan: '', name: '', ...(d.profile || {}) };
  if (!d.profile.name && fallbackName) d.profile.name = fallbackName;
  Object.defineProperty(d, '_id', { value: id, enumerable: false });
  cache = d;
  if (!rec || fallbackName) await db.put('userdata', { userId: id, value: d });
}

/** Version 1.0.0 kept data in localStorage. Move it into IndexedDB once, then remove it. */
async function migrateFromLocalStorage() {
  let old;
  try { old = JSON.parse(localStorage.getItem('dn.users') || 'null'); } catch { old = null; }
  if (!Array.isArray(old)) return;
  for (const u of old) {
    if (!(await db.getByIndex('users', 'email', u.email))) await db.put('users', u);
    const raw = localStorage.getItem(`dn.data.${u.id}`);
    if (raw && !(await db.get('userdata', u.id))) await db.put('userdata', { userId: u.id, value: JSON.parse(raw) });
    localStorage.removeItem(`dn.data.${u.id}`);
  }
  try {
    const s = JSON.parse(localStorage.getItem('dn.session') || 'null');
    if (s?.userId) await db.put('meta', { key: 'session', value: s.userId });
  } catch {}
  localStorage.removeItem('dn.users'); localStorage.removeItem('dn.session');
}

/* ---------- profile ---------- */
/** The person using the app on this device. */
export function currentUser() {
  return cache ? { id: cache._id, name: cache.profile.name || '' } : null;
}
export function renameUser(name) {
  if (!cache) return;
  cache.profile.name = String(name || '').trim().slice(0, 60); save();
}

/** Erase every task and setting on this device and start fresh. */
export async function resetAll() {
  const fresh = freshData();
  Object.defineProperty(fresh, '_id', { value: profileId, enumerable: false });
  cache = fresh;
  await db.put('userdata', { userId: profileId, value: fresh }).catch(logErr);
  listeners.forEach(fn => fn());
}

/* ---------- data ---------- */
function freshData() {
  const today = todayISO();
  const sample = (title, category, time, repeat = 'none') => ({
    id: uid(), title, notes: '', category, date: today, time, reminder: 10, repeat,
    done: false, completedAt: null, createdAt: Date.now(),
  });
  return {
    version: 1,
    tasks: [
      sample('Read for 20 minutes', 'study', '07:30', 'daily'),
      sample('Cook dinner', 'personal', '19:30', 'daily'),
      sample('Clean the room', 'health', '10:00', 'weekly'),
    ],
    categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
    birthdays: [],
    profile: { photo: null, slogan: '', name: '' },
    settings: structuredClone(DEFAULT_SETTINGS),
    feedback: [],
    notified: {},      // reminder keys already shown
  };
}

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function data() { return cache; }

/** Write the data to IndexedDB. Resolves true when saved. */
export function save() {
  const d = cache; if (!d) return Promise.resolve(false);
  const done = db.put('userdata', { userId: d._id, value: d }).then(() => true, logErr);
  listeners.forEach(fn => fn());
  return done;
}
export const settings = () => cache?.settings || DEFAULT_SETTINGS;



/* ---------- tasks ---------- */
export function getTask(id) { return data().tasks.find(t => t.id === id); }

export function saveTask(input) {
  const d = data();
  const clean = {
    title: String(input.title || '').trim().slice(0, 200),
    notes: String(input.notes || '').trim().slice(0, 2000),
    category: input.category || 'personal',
    date: input.date || todayISO(),
    time: input.time || null,
    reminder: input.reminder === '' || input.reminder == null ? null : Number(input.reminder),
    repeat: input.repeat || 'none',
    priority: input.priority || 'normal',
  };
  if (!clean.title) throw new Error('err.title');
  if (input.id) {
    const t = getTask(input.id); if (!t) throw new Error('err.notFound');
    Object.assign(t, clean, { updatedAt: Date.now() });
  } else {
    d.tasks.push({ id: uid(), ...clean, done: false, completedAt: null, createdAt: Date.now() });
  }
  save();
}

export function deleteTask(id) {
  const d = data(); d.tasks = d.tasks.filter(t => t.id !== id); save();
}

/** Toggle done. Completing a repeating task schedules the next one. */
export function toggleTask(id) {
  const t = getTask(id); if (!t) return null;
  t.done = !t.done; t.completedAt = t.done ? Date.now() : null;
  let next = null;
  if (t.done && t.repeat && t.repeat !== 'none' && !t.spawnedNext) {
    const step = { daily: d => addDays(d, 1), weekly: d => addDays(d, 7), monthly: d => addMonths(d, 1), yearly: d => addMonths(d, 12) }[t.repeat];
    if (step) {
      let date = step(t.date);
      while (date < todayISO()) date = step(date);   // skip missed days
      next = { ...t, id: uid(), date, done: false, completedAt: null, createdAt: Date.now(), spawnedNext: false };
      data().tasks.push(next); t.spawnedNext = true;
    }
  }
  save();
  return { task: t, next };
}

/* ---------- categories ---------- */
export function saveCategory({ id, name, color, emoji }) {
  const d = data();
  if (id) { const c = d.categories.find(x => x.id === id); if (c) Object.assign(c, { name: name || c.name, color, emoji }); }
  else d.categories.push({ id: uid(), name: String(name).trim().slice(0, 40), color, emoji: emoji || '🏷️', builtin: false });
  save();
}
export function deleteCategory(id) {
  const d = data();
  d.categories = d.categories.filter(c => c.id !== id);
  d.tasks.forEach(t => { if (t.category === id) t.category = 'personal'; });
  save();
}

/* ---------- birthdays ---------- */
export function saveBirthday({ id, name, date }) {
  const d = data(); name = String(name || '').trim().slice(0, 60);
  if (!name || !date) throw new Error('err.required');
  if (id) Object.assign(d.birthdays.find(b => b.id === id) || {}, { name, date });
  else d.birthdays.push({ id: uid(), name, date });
  save();
}
export function deleteBirthday(id) { const d = data(); d.birthdays = d.birthdays.filter(b => b.id !== id); save(); }

/* ---------- backup ---------- */
export function exportData() {
  const d = data(); return JSON.stringify({ app: 'Remind Myself', exportedAt: new Date().toISOString(), ...d }, null, 2);
}
export function importData(json) {
  const parsed = JSON.parse(json);
  if (!parsed || !['DayNest', 'Remind Myself'].includes(parsed.app) || !Array.isArray(parsed.tasks)) throw new Error('err.badBackup');
  const d = data();
  for (const k of ['tasks', 'categories', 'birthdays', 'profile', 'settings', 'feedback']) if (parsed[k]) d[k] = parsed[k];
  d.profile = { photo: null, slogan: '', name: '', ...d.profile };
  delete d.settings.language;
  save();
}

/* ---------- theme (device-wide, applied before login) ---------- */
export function getTheme() { return read('dn.theme', { mode: 'system', accent: '#2f6f5e' }); }
export function setTheme(t) {
  write('dn.theme', t);
  const root = document.documentElement;
  if (t.mode === 'system') delete root.dataset.theme; else root.dataset.theme = t.mode;
  root.style.setProperty('--accent', t.accent);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.accent);
}
