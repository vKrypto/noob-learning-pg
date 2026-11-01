// db.js — saves decks and cards in the browser's built-in database (IndexedDB).
//
// Database "flashcard-coach" has three tables ("object stores"):
//   decks  { id, name, emoji, color, best, createdAt }
//   cards  { id, deckId, front, back, box, due, reviews, createdAt }   — indexed by deckId
//   meta   { key, value }   — small values like the study streak
//
// IndexedDB's own API uses callbacks; these helpers wrap it in Promises so the
// rest of the app can simply write:  const decks = await db.all('decks');

const NAME = 'flashcard-coach';
const VERSION = 1;
let opening = null;

function open() {
  opening ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, VERSION);
    // Runs only the first time (or when VERSION goes up): create the tables.
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('decks', { keyPath: 'id' });
      d.createObjectStore('cards', { keyPath: 'id' }).createIndex('deckId', 'deckId');
      d.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opening;
}

// Run one request inside a transaction; resolve when it's safely written.
async function run(store, mode, makeRequest) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, mode);
    const req = makeRequest(tx.objectStore(store));
    let result;
    if (req) req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export const all = store => run(store, 'readonly', s => s.getAll());
export const get = (store, id) => run(store, 'readonly', s => s.get(id));
export const put = (store, value) => run(store, 'readwrite', s => s.put(value));
export const remove = (store, id) => run(store, 'readwrite', s => s.delete(id));
export const cardsIn = deckId => run('cards', 'readonly', s => s.index('deckId').getAll(deckId));

/** Save many records in ONE transaction (all succeed or none do). */
export async function putMany(store, values) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readwrite');
    values.forEach(v => tx.objectStore(store).put(v));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Delete a deck and all of its cards together. */
export async function removeDeck(deckId) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(['decks', 'cards'], 'readwrite');
    tx.objectStore('decks').delete(deckId);
    const idx = tx.objectStore('cards').index('deckId');
    idx.openKeyCursor(IDBKeyRange.only(deckId)).onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) { tx.objectStore('cards').delete(cursor.primaryKey); cursor.continue(); }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
