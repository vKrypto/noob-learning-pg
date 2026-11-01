// Accounts + per-user data, stored in the browser's built-in database (IndexedDB).
//
// NOTE: This app runs on GitHub Pages (static hosting), so there is no server.
// Accounts live on the user's device; passwords are never stored, only a
// PBKDF2 hash. To sync across devices, swap the functions in this file for
// calls to a backend (e.g. Firebase Auth + Firestore) — the rest of the app
// only talks to the exported functions below.
//
// How it works: init() loads the users and the signed-in user's data from
// IndexedDB into memory once at startup, so screens can read synchronously.
// Every change is written back to IndexedDB straight away.

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
  language: 'en',
  defaultReminder: 10,      // minutes before; -1 = no reminder
  notifications: true,
};

/* ---------- in-memory copies of what's in IndexedDB ---------- */
let users = [];          // all accounts on this device
let sessionId = null;    // signed-in user id
let cache = null;        // signed-in user's data

const logErr = e => { console.error('DayNest database error', e); return false; };
const putUser = u => db.put('users', u).then(() => true, logErr);
const putSession = id => db.put('meta', { key: 'session', value: id }).then(() => true, logErr);

/** Load everything needed to start. Call once before the first render. */
export async function init() {
  await migrateFromLocalStorage();
  users = await db.getAll('users');
  sessionId = (await db.get('meta', 'session'))?.value || null;
  if (sessionId && !users.some(u => u.id === sessionId)) sessionId = null;
  if (sessionId) await loadData(sessionId);
  db.requestPersistence();
}

async function loadData(id) {
  const rec = await db.get('userdata', id);
  const d = rec?.value || freshData();
  d.settings = { ...structuredClone(DEFAULT_SETTINGS), ...d.settings, widgets: { ...DEFAULT_SETTINGS.widgets, ...(d.settings?.widgets || {}) } };
  d.birthdays ||= []; d.feedback ||= []; d.notified ||= {}; d.profile ||= { photo: null, slogan: '' };
  Object.defineProperty(d, '_id', { value: id, enumerable: false });
  cache = d;
  if (!rec) await db.put('userdata', { userId: id, value: d });
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

/* ---------- password hashing (PBKDF2, Web Crypto) ---------- */
const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function hashPassword(password, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
  return { salt: toHex(salt), hash: toHex(bits) };
}

/* ---------- auth ---------- */
const normEmail = e => String(e || '').trim().toLowerCase();

export async function signUp({ name, email, password }) {
  name = String(name || '').trim(); email = normEmail(email);
  if (!name) throw new Error('err.name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('err.email');
  if (String(password).length < 6) throw new Error('err.passwordShort');
  if (await db.getByIndex('users', 'email', email)) throw new Error('err.emailTaken');
  const { salt, hash } = await hashPassword(password);
  const user = { id: uid(), name, email, salt, hash, createdAt: Date.now() };
  await db.put('users', user);            // unique email index guards against duplicates
  users.push(user);
  await loadData(user.id);                // creates the starter data
  sessionId = user.id; await putSession(user.id);
  return publicUser(user);
}

export async function signIn({ email, password }) {
  email = normEmail(email);
  const user = await db.getByIndex('users', 'email', email);
  if (!user) throw new Error('err.badLogin');
  const { hash } = await hashPassword(password, user.salt);
  if (hash !== user.hash) throw new Error('err.badLogin');
  if (!users.some(u => u.id === user.id)) users.push(user);
  await loadData(user.id);
  sessionId = user.id; await putSession(user.id);
  return publicUser(user);
}

export async function changePassword(oldPw, newPw) {
  const u = users.find(x => x.id === sessionId);
  if (!u) throw new Error('err.badLogin');
  if ((await hashPassword(oldPw, u.salt)).hash !== u.hash) throw new Error('err.badLogin');
  if (String(newPw).length < 6) throw new Error('err.passwordShort');
  Object.assign(u, await hashPassword(newPw)); await putUser(u);
}

export function signOut() { sessionId = null; cache = null; db.del('meta', 'session').catch(logErr); }

export async function deleteAccount() {
  const id = sessionId; if (!id) return;
  users = users.filter(u => u.id !== id);
  signOut();
  await Promise.all([db.del('users', id), db.del('userdata', id)]).catch(logErr);
}

export function currentUserId() { return sessionId; }
export function currentUser() {
  const u = sessionId && users.find(x => x.id === sessionId);
  return u ? publicUser(u) : null;
}
export function renameUser(name) {
  const u = users.find(x => x.id === sessionId);
  if (u && name.trim()) { u.name = name.trim(); putUser(u); }
}
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

/* ---------- user data ---------- */
function freshData() {
  const today = todayISO();
  const sample = (title, category, time, repeat = 'none') => ({
    id: uid(), title, notes: '', category, date: today, time, reminder: 10, repeat,
    done: false, completedAt: null, createdAt: Date.now(),
  });
  let language = 'en';
  try { language = localStorage.getItem('dn.lang') || 'en'; } catch {}
  return {
    version: 1,
    tasks: [
      sample('Read for 20 minutes', 'study', '07:30', 'daily'),
      sample('Cook dinner', 'personal', '19:30', 'daily'),
      sample('Clean the room', 'health', '10:00', 'weekly'),
    ],
    categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
    birthdays: [],
    profile: { photo: null, slogan: '' },
    settings: { ...structuredClone(DEFAULT_SETTINGS), language },
    feedback: [],
    notified: {},      // reminder keys already shown
  };
}

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function data() { return sessionId && cache?._id === sessionId ? cache : null; }

/** Write the current user's data to IndexedDB. Resolves true when saved. */
export function save() {
  const d = data(); if (!d) return Promise.resolve(false);
  const done = db.put('userdata', { userId: d._id, value: d }).then(() => true, logErr);
  listeners.forEach(fn => fn());
  return done;
}
export const settings = () => data()?.settings || DEFAULT_SETTINGS;


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
  const d = data(); return JSON.stringify({ app: 'DayNest', exportedAt: new Date().toISOString(), ...d }, null, 2);
}
export function importData(json) {
  const parsed = JSON.parse(json);
  if (!parsed || parsed.app !== 'DayNest' || !Array.isArray(parsed.tasks)) throw new Error('err.badBackup');
  const d = data();
  for (const k of ['tasks', 'categories', 'birthdays', 'profile', 'settings', 'feedback']) if (parsed[k]) d[k] = parsed[k];
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
