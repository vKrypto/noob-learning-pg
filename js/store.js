// Accounts + per-user data, stored in this browser's localStorage.
//
// NOTE: This app runs on GitHub Pages (static hosting), so there is no server.
// Accounts live on the user's device; passwords are never stored, only a
// PBKDF2 hash. To sync across devices, swap the functions in this file for
// calls to a backend (e.g. Firebase Auth + Firestore) — the rest of the app
// only talks to the exported functions below.

import { uid, todayISO, addDays, addMonths } from './util.js';

const USERS_KEY = 'dn.users';
const SESSION_KEY = 'dn.session';
const dataKey = id => `dn.data.${id}`;

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

/* ---------- small storage wrappers ---------- */
function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { console.error('Storage full or unavailable', e); return false; }
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
  const users = read(USERS_KEY, []);
  if (users.some(u => u.email === email)) throw new Error('err.emailTaken');
  const { salt, hash } = await hashPassword(password);
  const user = { id: uid(), name, email, salt, hash, createdAt: Date.now() };
  users.push(user); write(USERS_KEY, users);
  write(dataKey(user.id), freshData(name));
  write(SESSION_KEY, { userId: user.id });
  return publicUser(user);
}

export async function signIn({ email, password }) {
  email = normEmail(email);
  const user = read(USERS_KEY, []).find(u => u.email === email);
  if (!user) throw new Error('err.badLogin');
  const { hash } = await hashPassword(password, user.salt);
  if (hash !== user.hash) throw new Error('err.badLogin');
  write(SESSION_KEY, { userId: user.id });
  return publicUser(user);
}

export async function changePassword(oldPw, newPw) {
  const users = read(USERS_KEY, []); const u = users.find(x => x.id === currentUserId());
  if (!u) throw new Error('err.badLogin');
  if ((await hashPassword(oldPw, u.salt)).hash !== u.hash) throw new Error('err.badLogin');
  if (String(newPw).length < 6) throw new Error('err.passwordShort');
  Object.assign(u, await hashPassword(newPw)); write(USERS_KEY, users);
}

export function signOut() { localStorage.removeItem(SESSION_KEY); cache = null; }

export function deleteAccount() {
  const id = currentUserId(); if (!id) return;
  write(USERS_KEY, read(USERS_KEY, []).filter(u => u.id !== id));
  localStorage.removeItem(dataKey(id)); signOut();
}

export function currentUserId() { return read(SESSION_KEY, null)?.userId || null; }
export function currentUser() {
  const id = currentUserId(); const u = id && read(USERS_KEY, []).find(x => x.id === id);
  return u ? publicUser(u) : null;
}
export function renameUser(name) {
  const users = read(USERS_KEY, []); const u = users.find(x => x.id === currentUserId());
  if (u && name.trim()) { u.name = name.trim(); write(USERS_KEY, users); }
}
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

/* ---------- user data ---------- */
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
    profile: { photo: null, slogan: '' },
    settings: { ...structuredClone(DEFAULT_SETTINGS), language: localStorage.getItem('dn.lang') || 'en' },
    feedback: [],
    notified: {},      // reminder keys already shown
  };
}

let cache = null;
const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function data() {
  const id = currentUserId(); if (!id) return null;
  if (!cache || cache._id !== id) {
    const d = read(dataKey(id), null) || freshData();
    d.settings = { ...structuredClone(DEFAULT_SETTINGS), ...d.settings, widgets: { ...DEFAULT_SETTINGS.widgets, ...(d.settings?.widgets || {}) } };
    d.birthdays ||= []; d.feedback ||= []; d.notified ||= {}; d.profile ||= { photo: null, slogan: '' };
    Object.defineProperty(d, '_id', { value: id, enumerable: false });
    cache = d;
  }
  return cache;
}
export function save() {
  const d = data(); if (!d) return false;
  const ok = write(dataKey(d._id), d);
  listeners.forEach(fn => fn());
  return ok;
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
