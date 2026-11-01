// Tiny promise wrapper around IndexedDB, the browser's built-in database.
//
// Database "daynest", object stores:
//   users     { id, name, email, salt, hash, createdAt }   unique index: email
//   userdata  { userId, value }   one record per user: tasks, categories, birthdays, profile, settings…
//   meta      { key, value }      small app-wide values, e.g. the current session

const DB_NAME = 'daynest';
const DB_VERSION = 1;
let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB is not available in this browser'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' }).createIndex('email', 'email', { unique: true });
      }
      if (!db.objectStoreNames.contains('userdata')) db.createObjectStore('userdata', { keyPath: 'userId' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close(); // let a newer version in another tab upgrade
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn('DayNest database upgrade is waiting for other tabs to close');
  });
  return dbPromise;
}

/** Run one request in a transaction and resolve when the transaction commits. */
async function run(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    let result;
    if (req) req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

export const get = (store, key) => run(store, 'readonly', s => s.get(key));
export const getAll = store => run(store, 'readonly', s => s.getAll());
export const getByIndex = (store, index, key) => run(store, 'readonly', s => s.index(index).get(key));
export const put = (store, value) => run(store, 'readwrite', s => s.put(value));
export const del = (store, key) => run(store, 'readwrite', s => s.delete(key));

/** Ask the browser not to clear our data when the device is low on space. */
export async function requestPersistence() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch {}
}
