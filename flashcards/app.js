// Flashcard Coach — app.js
// Read this file top to bottom: helpers → data → spaced repetition → screens → router → start.
import * as db from './db.js';

/* =====================================================================
   1. Small helpers
   ===================================================================== */

// ALWAYS escape text the user typed before putting it into HTML,
// otherwise a card like "<img onerror=...>" could run code.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const $ = (sel, root = document) => root.querySelector(sel);

// Dates are stored as "YYYY-MM-DD" text in local time, which compares correctly as strings.
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoDate(new Date());
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return isoDate(new Date(y, m - 1, d + n)); };

/** Fisher–Yates shuffle: returns a new array in random order. */
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/** A yes/no popup that returns a Promise<boolean>. */
function confirmBox(message, yes = 'Delete') {
  return new Promise(resolve => {
    const dlg = document.createElement('dialog');
    dlg.innerHTML = `<div class="card stack" style="border:0;box-shadow:none"><p style="margin:0">${esc(message)}</p>
      <div class="row"><span class="spacer"></span><button class="btn" value="no">Cancel</button><button class="btn bad" value="yes">${esc(yes)}</button></div></div>`;
    document.body.append(dlg);
    dlg.addEventListener('click', e => { const v = e.target.closest('button')?.value; if (v || e.target === dlg) { dlg.close(); dlg.remove(); resolve(v === 'yes'); } });
    dlg.addEventListener('cancel', () => { dlg.remove(); resolve(false); });
    dlg.showModal();
  });
}

/* =====================================================================
   2. Data: everything is loaded into memory at start, and every change
      is written to IndexedDB straight away (see db.js).
   ===================================================================== */
let decks = [];       // [{ id, name, emoji, color, best, createdAt }]
let cards = [];       // [{ id, deckId, front, back, box, due, reviews, createdAt }]
let streak = { count: 0, last: null };

const deckById = id => decks.find(d => d.id === id);
const cardsOf = deckId => cards.filter(c => c.deckId === deckId);
const dueCards = deckId => cardsOf(deckId).filter(c => c.due <= today());
const mastered = list => list.filter(c => c.box >= MAX_BOX).length;

async function loadAll() {
  [decks, cards] = await Promise.all([db.all('decks'), db.all('cards')]);
  streak = (await db.get('meta', 'streak'))?.value || streak;
  if (!decks.length && !(await db.get('meta', 'seeded'))) await addSampleDeck();
  decks.sort((a, b) => a.createdAt - b.createdAt);
}

async function saveDeck(deck) { if (!decks.includes(deck)) decks.push(deck); await db.put('decks', deck); }
async function saveCard(card) { if (!cards.includes(card)) cards.push(card); await db.put('cards', card); }
async function deleteCard(id) { cards = cards.filter(c => c.id !== id); await db.remove('cards', id); }
async function deleteDeck(id) { decks = decks.filter(d => d.id !== id); cards = cards.filter(c => c.deckId !== id); await db.removeDeck(id); }

function newCard(deckId, front, back) {
  return { id: uid(), deckId, front: front.trim(), back: back.trim(), box: 0, due: today(), reviews: 0, createdAt: Date.now() };
}

async function addSampleDeck() {
  const deck = { id: uid(), name: 'World Capitals', emoji: '🌍', color: '#2f8fd8', best: 0, createdAt: Date.now() };
  const pairs = [['India', 'New Delhi'], ['Japan', 'Tokyo'], ['France', 'Paris'], ['Australia', 'Canberra'], ['Canada', 'Ottawa'],
    ['Brazil', 'Brasília'], ['Egypt', 'Cairo'], ['Germany', 'Berlin'], ['Kenya', 'Nairobi'], ['South Korea', 'Seoul'],
    ['Italy', 'Rome'], ['Argentina', 'Buenos Aires']];
  await saveDeck(deck);
  const list = pairs.map(([country, capital]) => newCard(deck.id, `Capital of ${country}?`, capital));
  cards.push(...list); await db.putMany('cards', list);
  await db.put('meta', { key: 'seeded', value: true });
}

/* =====================================================================
   3. Spaced repetition (the "Leitner box" method)
      Every card sits in a box from 0 (new) to 5 (mastered).
      Got it  → move up one box; it comes back after a longer gap.
      Again   → back to box 1; you'll see it again in this session and tomorrow.
      So easy cards fade into the background and hard ones keep coming back.
   ===================================================================== */
const MAX_BOX = 5;
const GAP_DAYS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };   // box → days until next review

function grade(card, knewIt) {
  card.reviews += 1;
  if (knewIt) { card.box = Math.min(MAX_BOX, card.box + 1); card.due = addDays(today(), GAP_DAYS[card.box]); }
  else { card.box = 1; card.due = addDays(today(), 1); }
}

async function markStudiedToday() {
  const t = today();
  if (streak.last === t) return;
  streak = { count: streak.last === addDays(t, -1) ? streak.count + 1 : 1, last: t };
  await db.put('meta', { key: 'streak', value: streak });
}
const currentStreak = () => (streak.last === today() || streak.last === addDays(today(), -1) ? streak.count : 0);

/* =====================================================================
   4. Screens. Each returns { html, bind(root) }.
   ===================================================================== */
const COLORS = ['#5b4bd6', '#2f8fd8', '#1f9d68', '#e0a21b', '#e36a2e', '#d64579', '#7a5bc7', '#475569'];
const EMOJIS = ['📘', '🌍', '🧪', '🧮', '🗣️', '🎵', '💻', '🏛️', '🧠', '🌱', '⚽', '🎨', '💊', '✈️', '📜', '⭐'];

function top(title, backHref, extra = '') {
  return `<header class="top">${backHref ? `<a class="icon-btn" href="${backHref}" aria-label="Back">←</a>` : ''}<h1>${title}</h1>${extra}</header>`;
}

// ---------- Home: all decks ----------
function homeScreen() {
  const totalDue = decks.reduce((n, d) => n + dueCards(d.id).length, 0);
  const html = `<div class="page">
    ${top('🧠 Flashcard Coach', '', `<button class="icon-btn" data-act="import" aria-label="Import a deck">⤓</button>`)}
    <div class="hero">
      <div class="stat"><b>${totalDue}</b><span>due today</span></div>
      <div class="stat"><b>${currentStreak()}🔥</b><span>day streak</span></div>
      <div class="stat"><b>${mastered(cards)}</b><span>mastered</span></div>
    </div>
    <div class="section"><h2>Your decks</h2><button class="btn sm primary" data-act="new-deck">+ New deck</button></div>
    ${decks.length ? `<div class="decks">${decks.map(d => {
      const list = cardsOf(d.id); const due = dueCards(d.id).length;
      const pct = list.length ? Math.round(mastered(list) / list.length * 100) : 0;
      return `<a class="deck" href="#/deck/${d.id}" style="--c:${esc(d.color)}">
        <span class="emoji">${esc(d.emoji)}</span>
        <span class="info"><b>${esc(d.name)}</b>
          <span class="small muted">${list.length} card${list.length === 1 ? '' : 's'} · ${pct}% mastered</span>
          <span class="bar"><i style="width:${pct}%"></i></span></span>
        ${due ? `<span class="pill due">${due} due</span>` : `<span class="pill">✓</span>`}
      </a>`;
    }).join('')}</div>`
    : `<div class="empty"><div class="big">🗂️</div>No decks yet. Make your first one!</div>`}
    <p class="small muted" style="text-align:center;margin-top:28px">Tip: study a little every day — spaced repetition does the rest.</p>
    <input type="file" id="import-file" accept=".json,application/json" hidden>
  </div>`;
  return {
    html,
    bind(root) {
      root.addEventListener('click', e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'new-deck') deckDialog();
        if (act === 'import') $('#import-file', root).click();
      });
      $('#import-file', root).addEventListener('change', e => importDeck(e.target.files[0]));
    },
  };
}

// ---------- One deck: its cards ----------
let search = '';
function deckScreen({ id }) {
  const deck = deckById(id); if (!deck) return notFound();
  const list = cardsOf(id); const due = dueCards(id).length;
  const q = search.trim().toLowerCase();
  const shown = q ? list.filter(c => (c.front + ' ' + c.back).toLowerCase().includes(q)) : list;
  const html = `<div class="page">
    ${top(`${esc(deck.emoji)} ${esc(deck.name)}`, '#/', `<button class="icon-btn" data-act="edit-deck" aria-label="Edit deck">✎</button>`)}
    <div class="card stack">
      <div class="row"><span class="muted">${list.length} cards · ${mastered(list)} mastered</span><span class="spacer"></span>${due ? `<span class="pill due">${due} due today</span>` : ''}</div>
      <a class="btn primary block" href="#/study/${id}" ${list.length ? '' : 'aria-disabled="true" style="pointer-events:none;opacity:.5"'}>📖 ${due ? `Study ${due} due card${due === 1 ? '' : 's'}` : 'Practice all cards'}</a>
      <a class="btn block" href="#/quiz/${id}" ${list.length >= 4 ? '' : 'aria-disabled="true" style="pointer-events:none;opacity:.5"'}>🎯 Quiz${deck.best ? ` · best ${deck.best}/10` : ''}</a>
      ${list.length < 4 ? `<p class="small muted" style="margin:0">Add at least 4 cards to unlock the quiz.</p>` : ''}
    </div>
    <div class="section"><h2>Cards</h2><a class="btn sm primary" href="#/card/${id}/new">+ Add card</a></div>
    ${list.length > 5 ? `<input class="input" id="search" type="search" placeholder="Search cards…" value="${esc(search)}" style="margin-bottom:10px" autocomplete="off">` : ''}
    <div id="cards">${cardList(shown, id)}</div>
    <div class="row wrap" style="margin-top:24px">
      <button class="btn sm" data-act="export">⤒ Export deck</button><span class="spacer"></span>
      <button class="btn sm ghost" data-act="delete-deck" style="color:var(--bad)">Delete deck</button>
    </div>
  </div>`;
  return {
    html,
    bind(root) {
      $('#search', root)?.addEventListener('input', e => {
        search = e.target.value; const s = search.trim().toLowerCase();
        $('#cards', root).innerHTML = cardList(s ? list.filter(c => (c.front + ' ' + c.back).toLowerCase().includes(s)) : list, id);
      });
      root.addEventListener('click', async e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'edit-deck') deckDialog(deck);
        if (act === 'export') exportDeck(deck);
        if (act === 'delete-deck' && await confirmBox(`Delete "${deck.name}" and its ${list.length} cards?`)) {
          await deleteDeck(id); toast('Deck deleted'); location.hash = '#/';
        }
      });
    },
  };
}

function cardList(list, deckId) {
  if (!list.length) return `<div class="empty"><div class="big">🃏</div>${search ? 'No matching cards.' : `No cards yet. <a href="#/card/${deckId}/new">Add one</a>.`}</div>`;
  return `<ul class="list">${list.map(c => `<li><a class="item" href="#/card/${deckId}/${c.id}">
    <div style="flex:1;min-width:0"><div class="q">${esc(c.front)}</div><div class="a">${esc(c.back)}</div>
    <div class="boxes" title="Box ${c.box} of ${MAX_BOX}">${Array.from({ length: MAX_BOX }, (_, i) => `<i class="${i < c.box ? 'on' : ''}"></i>`).join('')}</div></div>
    <span class="small muted" style="white-space:nowrap">${c.due <= today() ? 'due' : c.due.slice(5).split('-').reverse().join('/')}</span>
  </a></li>`).join('')}</ul>`;
}

// ---------- Add / edit a card ----------
function cardScreen({ deckId, cardId }) {
  const deck = deckById(deckId); if (!deck) return notFound();
  const card = cardId === 'new' ? null : cards.find(c => c.id === cardId);
  if (cardId !== 'new' && !card) return notFound();
  const html = `<div class="page">
    ${top(card ? 'Edit card' : 'New card', `#/deck/${deckId}`)}
    <form class="card stack" id="cf" novalidate>
      <label class="field"><span>Front — the question</span><textarea class="input" name="front" maxlength="500" placeholder="e.g. What is H₂O?">${esc(card?.front)}</textarea></label>
      <label class="field"><span>Back — the answer</span><textarea class="input" name="back" maxlength="500" placeholder="e.g. Water">${esc(card?.back)}</textarea></label>
      <p class="error" role="alert"></p>
      <button class="btn primary block" value="save">${card ? 'Save' : 'Save card'}</button>
      ${card ? '' : `<button class="btn block" value="more">Save & add another</button>`}
    </form>
    ${card ? `<div class="row" style="margin-top:16px"><span class="small muted">Reviewed ${card.reviews} time${card.reviews === 1 ? '' : 's'} · box ${card.box}/${MAX_BOX}</span><span class="spacer"></span>
      <button class="btn sm ghost" data-act="delete" style="color:var(--bad)">Delete card</button></div>` : ''}
  </div>`;
  return {
    html,
    bind(root) {
      const f = $('#cf', root); f.front.focus();
      f.addEventListener('submit', async e => {
        e.preventDefault();
        const front = f.front.value.trim(), back = f.back.value.trim();
        if (!front || !back) { $('.error', root).textContent = 'Please fill in both sides.'; return; }
        if (card) { Object.assign(card, { front, back }); await saveCard(card); }
        else await saveCard(newCard(deckId, front, back));
        if (e.submitter?.value === 'more') { f.reset(); f.front.focus(); $('.error', root).textContent = ''; toast('Card added ✓'); }
        else { toast(card ? 'Saved' : 'Card added ✓'); location.hash = `#/deck/${deckId}`; }
      });
      root.addEventListener('click', async e => {
        if (e.target.closest('[data-act="delete"]') && await confirmBox('Delete this card?')) {
          await deleteCard(card.id); toast('Card deleted'); location.hash = `#/deck/${deckId}`;
        }
      });
    },
  };
}

// ---------- Study: flip cards, grade yourself ----------
let session = null;   // { deckId, queue, done, right, wrong, flipped, practice }

function startStudy(deckId) {
  const due = dueCards(deckId);
  const practice = due.length === 0;                      // nothing due → practice everything (no rescheduling)
  session = { deckId, queue: shuffle(practice ? cardsOf(deckId) : due).slice(0, 25), done: 0, right: 0, wrong: 0, flipped: false, practice };
  session.total = session.queue.length;
}

function studyScreen({ id }) {
  const deck = deckById(id); if (!deck) return notFound();
  if (!session || session.deckId !== id) startStudy(id);
  if (!session.queue.length) return studyDone(deck);
  const card = session.queue[0];
  const pct = Math.round(session.done / session.total * 100);
  const html = `<div class="page">
    ${top(`${esc(deck.emoji)} ${session.practice ? 'Practice' : 'Study'}`, `#/deck/${id}`)}
    <div class="progress"><span class="bar"><i style="width:${pct}%"></i></span><span class="small muted">${session.done}/${session.total}</span></div>
    <button class="flip ${session.flipped ? 'flipped' : ''}" id="flip" aria-label="${session.flipped ? 'Answer shown' : 'Tap to show the answer'}">
      <div class="inner">
        <div class="face front"><span class="label">Question</span><div class="text">${esc(card.front)}</div><span class="hint">Tap to flip · Space</span></div>
        <div class="face back"><span class="label">Answer</span><div class="text">${esc(card.back)}</div><span class="hint">Did you know it?</span></div>
      </div>
    </button>
    <div class="answer-btns" style="visibility:${session.flipped ? 'visible' : 'hidden'}">
      <button class="btn bad" data-grade="0">✗ Again <span class="small" style="opacity:.8">(1)</span></button>
      <button class="btn good" data-grade="1">✓ Got it <span class="small" style="opacity:.8">(2)</span></button>
    </div>
  </div>`;
  return {
    html,
    bind(root) {
      const flip = () => { session.flipped = true; $('#flip', root).classList.add('flipped'); $('.answer-btns', root).style.visibility = 'visible'; };
      $('#flip', root).addEventListener('click', () => (session.flipped ? null : flip()));
      root.addEventListener('click', e => { const g = e.target.closest('[data-grade]'); if (g) answer(g.dataset.grade === '1'); });
      onKey = e => {
        if (!session.flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip(); }
        else if (session.flipped && e.key === '1') answer(false);
        else if (session.flipped && e.key === '2') answer(true);
      };
    },
  };
}

function answer(knewIt) {
  if (!session?.flipped) return;           // ignore extra taps until the next card is showing
  const card = session.queue.shift();
  if (!session.practice) { grade(card, knewIt); saveCard(card); }   // saves in the background
  if (knewIt) { session.right++; session.done++; }
  else { session.wrong++; session.queue.push(card); }   // missed cards come back at the end of this session
  session.flipped = false;
  markStudiedToday();
  render();                                 // show the next card straight away
}

function studyDone(deck) {
  const s = session; const left = dueCards(deck.id).length;
  const html = `<div class="page">
    ${top(`${esc(deck.emoji)} ${esc(deck.name)}`, `#/deck/${deck.id}`)}
    <div class="card result">
      <div class="big">${s.total ? '🎉' : '😴'}</div>
      <h2>${s.total ? 'Session complete!' : 'No cards to study'}</h2>
      ${s.total ? `<p class="muted">${s.total} card${s.total === 1 ? '' : 's'} reviewed · ${s.wrong} retr${s.wrong === 1 ? 'y' : 'ies'}</p>
        <p class="muted">Streak: <b>${currentStreak()} day${currentStreak() === 1 ? '' : 's'} 🔥</b></p>
        ${s.practice ? '<p class="small muted">Practice mode — your review schedule was not changed.</p>' : '<p class="small muted">Cards you knew will come back in a few days.</p>'}` : ''}
      <div class="stack" style="margin-top:18px">
        ${left ? `<button class="btn primary block" data-act="again">Study ${left} more due</button>` : `<button class="btn primary block" data-act="practice">Practice all cards</button>`}
        <a class="btn block" href="#/deck/${deck.id}">Back to deck</a>
      </div>
    </div>
  </div>`;
  return {
    html,
    bind(root) {
      root.addEventListener('click', e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'again') { startStudy(deck.id); render(); }
        if (act === 'practice') {
          session = { deckId: deck.id, queue: shuffle(cardsOf(deck.id)).slice(0, 25), done: 0, right: 0, wrong: 0, flipped: false, practice: true };
          session.total = session.queue.length; render();
        }
      });
    },
  };
}

// ---------- Quiz: 10 multiple-choice questions ----------
let quiz = null;  // { deckId, questions: [{ card, options }], index, score, picked }

function startQuiz(deckId) {
  const list = cardsOf(deckId);
  const questions = shuffle(list).slice(0, 10).map(card => {
    // 3 wrong answers taken from other cards' backs (no duplicates of the right one)
    const others = shuffle([...new Set(list.filter(c => c.id !== card.id).map(c => c.back))].filter(b => b !== card.back)).slice(0, 3);
    return { card, options: shuffle([card.back, ...others]) };
  });
  quiz = { deckId, questions, index: 0, score: 0, picked: null };
}

function quizScreen({ id }) {
  const deck = deckById(id); if (!deck) return notFound();
  if (cardsOf(id).length < 4) { location.hash = `#/deck/${id}`; return { html: '' }; }
  if (!quiz || quiz.deckId !== id) startQuiz(id);
  if (quiz.index >= quiz.questions.length) return quizDone(deck);
  const { card, options } = quiz.questions[quiz.index];
  const answered = quiz.picked !== null;
  const html = `<div class="page">
    ${top(`${esc(deck.emoji)} Quiz`, `#/deck/${id}`, `<span class="pill">Score ${quiz.score}</span>`)}
    <div class="progress"><span class="bar"><i style="width:${quiz.index / quiz.questions.length * 100}%"></i></span><span class="small muted">${quiz.index + 1}/${quiz.questions.length}</span></div>
    <div class="card question"><div class="text">${esc(card.front)}</div></div>
    <div class="options">${options.map((o, i) => {
      const cls = !answered ? '' : o === card.back ? 'right' : i === quiz.picked ? 'wrong' : '';
      return `<button class="btn option ${cls}" data-pick="${i}" ${answered ? 'disabled' : ''}><b style="opacity:.6;margin-right:6px">${i + 1}</b>${esc(o)}</button>`;
    }).join('')}</div>
    ${answered ? `<button class="btn primary block" data-act="next" style="margin-top:16px">${quiz.index + 1 < quiz.questions.length ? 'Next →' : 'See result'}</button>` : ''}
  </div>`;
  return {
    html,
    bind(root) {
      const pick = i => {
        if (quiz.picked !== null || !options[i]) return;
        quiz.picked = i; if (options[i] === card.back) quiz.score++;
        render();
      };
      const next = () => { quiz.index++; quiz.picked = null; render(); };
      root.addEventListener('click', e => {
        const p = e.target.closest('[data-pick]'); if (p) pick(Number(p.dataset.pick));
        if (e.target.closest('[data-act="next"]')) next();
      });
      onKey = e => {
        if (quiz.picked === null && /^[1-4]$/.test(e.key)) pick(Number(e.key) - 1);
        else if (quiz.picked !== null && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
      };
    },
  };
}

function quizDone(deck) {
  const total = quiz.questions.length; const score = quiz.score;
  const newBest = score > (deck.best || 0);
  if (newBest) { deck.best = score; saveDeck(deck); }
  if (!quiz.counted) { quiz.counted = true; markStudiedToday(); }
  const emoji = score === total ? '🏆' : score >= total * 0.7 ? '🎉' : score >= total * 0.4 ? '👍' : '💪';
  const html = `<div class="page">
    ${top(`${esc(deck.emoji)} Quiz`, `#/deck/${deck.id}`)}
    <div class="card result">
      <div class="big">${emoji}</div>
      <div class="score">${score}/${total}</div>
      <p class="muted">${newBest ? 'New best score!' : `Best: ${deck.best}/${total}`}</p>
      <div class="stack" style="margin-top:18px">
        <button class="btn primary block" data-act="retry">Try again</button>
        <a class="btn block" href="#/study/${deck.id}">Study the cards</a>
        <a class="btn block" href="#/deck/${deck.id}">Back to deck</a>
      </div>
    </div>
  </div>`;
  return { html, bind(root) { root.addEventListener('click', e => { if (e.target.closest('[data-act="retry"]')) { startQuiz(deck.id); render(); } }); } };
}

function notFound() {
  return { html: `<div class="page">${top('Not found', '#/')}<div class="empty"><div class="big">🔍</div>That deck or card doesn't exist.<p><a class="btn" href="#/">Home</a></p></div></div>` };
}

/* =====================================================================
   5. Deck dialog, import & export
   ===================================================================== */
function deckDialog(deck = null) {
  const pick = { emoji: deck?.emoji || '📘', color: deck?.color || COLORS[0] };
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<form class="card stack" style="border:0;box-shadow:none" novalidate>
    <h2>${deck ? 'Edit deck' : 'New deck'}</h2>
    <label class="field"><span>Name</span><input class="input" name="name" maxlength="60" value="${esc(deck?.name)}" placeholder="e.g. Science words" required></label>
    <div><span class="small muted" style="font-weight:650">Icon</span><div class="emojis" style="margin-top:6px">${EMOJIS.map(e => `<button type="button" data-emoji="${e}" aria-pressed="${e === pick.emoji}">${e}</button>`).join('')}</div></div>
    <div><span class="small muted" style="font-weight:650">Color</span><div class="swatches" style="margin-top:6px">${COLORS.map(c => `<button type="button" class="swatch" style="background:${c}" data-color="${c}" aria-label="${c}" aria-pressed="${c === pick.color}"></button>`).join('')}</div></div>
    <p class="error" role="alert"></p>
    <div class="row"><span class="spacer"></span><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${deck ? 'Save' : 'Create'}</button></div>
  </form>`;
  document.body.append(dlg); dlg.showModal();
  const f = $('form', dlg); f.name.focus();
  const close = () => { dlg.close(); dlg.remove(); };
  dlg.addEventListener('cancel', () => dlg.remove());
  dlg.addEventListener('click', e => {
    const em = e.target.closest('[data-emoji]'), co = e.target.closest('[data-color]');
    if (em) { pick.emoji = em.dataset.emoji; dlg.querySelectorAll('[data-emoji]').forEach(b => b.setAttribute('aria-pressed', b === em)); }
    if (co) { pick.color = co.dataset.color; dlg.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', b === co)); }
    if (e.target.closest('[data-close]')) close();
  });
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const name = f.name.value.trim();
    if (!name) { $('.error', dlg).textContent = 'Please give the deck a name.'; return; }
    const d = deck || { id: uid(), best: 0, createdAt: Date.now() };
    Object.assign(d, { name, emoji: pick.emoji, color: pick.color });
    await saveDeck(d); close();
    if (deck) { toast('Saved'); render(); } else { toast('Deck created'); location.hash = `#/deck/${d.id}`; }
  });
}

function exportDeck(deck) {
  const data = { app: 'Flashcard Coach', version: 1, deck: { name: deck.name, emoji: deck.emoji, color: deck.color },
    cards: cardsOf(deck.id).map(c => ({ front: c.front, back: c.back })) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${deck.name.replace(/[^\w\- ]+/g, '').trim() || 'deck'}.json` });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Deck exported — share the file with friends');
}

async function importDeck(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'Flashcard Coach' || !Array.isArray(data.cards)) throw new Error('not a deck');
    const deck = { id: uid(), name: String(data.deck?.name || 'Imported deck').slice(0, 60), emoji: String(data.deck?.emoji || '📘').slice(0, 4),
      color: /^#[0-9a-f]{6}$/i.test(data.deck?.color) ? data.deck.color : COLORS[0], best: 0, createdAt: Date.now() };
    const list = data.cards.filter(c => c && c.front && c.back).slice(0, 2000)
      .map(c => newCard(deck.id, String(c.front).slice(0, 500), String(c.back).slice(0, 500)));
    await saveDeck(deck); cards.push(...list); await db.putMany('cards', list);
    toast(`Imported ${list.length} cards`); location.hash = `#/deck/${deck.id}`;
  } catch { toast("That file isn't a Flashcard Coach deck"); }
}

/* =====================================================================
   6. Router: the part after # in the address decides the screen.
   ===================================================================== */
const ROUTES = [
  [/^$/, homeScreen, []],
  [/^deck\/(\w+)$/, deckScreen, ['id']],
  [/^card\/(\w+)\/(\w+)$/, cardScreen, ['deckId', 'cardId']],
  [/^study\/(\w+)$/, studyScreen, ['id']],
  [/^quiz\/(\w+)$/, quizScreen, ['id']],
];
let onKey = null;     // the current screen's keyboard shortcuts
let lastPath = null;

function render() {
  const path = location.hash.replace(/^#\/?/, '');
  // Opening a screen (not just redrawing it) starts a fresh study/quiz session.
  if (path !== lastPath) {
    session = null; quiz = null;
    if (!path.startsWith('deck/') && !path.startsWith('card/')) search = '';   // keep search while editing cards
    window.scrollTo(0, 0);
  }
  lastPath = path;
  onKey = null;
  let screen = notFound(), params = {};
  for (const [re, fn, names] of ROUTES) {
    const m = path.match(re);
    if (m) { names.forEach((n, i) => { params[n] = m[i + 1]; }); screen = fn(params); break; }
  }
  const root = document.createElement('div'); root.id = 'app';   // fresh element = no leftover click handlers
  root.innerHTML = screen.html;
  $('#app').replaceWith(root);
  screen.bind?.(root);
}

window.addEventListener('hashchange', render);
window.addEventListener('keydown', e => { if (!e.target.matches('input, textarea') && !document.querySelector('dialog[open]')) onKey?.(e); });

/* =====================================================================
   7. Start
   ===================================================================== */
try {
  await loadAll();
  render();
} catch (e) {
  console.error(e);
  $('#app').innerHTML = `<div class="page"><div class="empty"><div class="big">⚠️</div>Flashcard Coach couldn't open its storage.<br>Private browsing can block it — try a normal window.</div></div>`;
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
