# Flashcard Coach

Make flashcards, study them with **spaced repetition**, and quiz yourself.
A small, beginner-friendly web app: plain HTML, CSS and JavaScript — no frameworks, no build step.

**Live:** https://vkrypto.github.io/noob-learning-pg/flashcards/

## Features

- **Decks** with a name, icon and color; a sample "World Capitals" deck to start
- **Cards** with a front (question) and back (answer); add, edit, delete, search
- **Study mode** — tap to flip, then *Got it* or *Again* (keyboard: Space, 1, 2)
- **Spaced repetition** — cards you know come back after 1, 2, 4, 7, then 14 days; missed cards come back today and tomorrow
- **Quiz mode** — 10 multiple-choice questions, score, and your best score per deck (keyboard: 1–4, Enter)
- **Progress** — cards due today, daily study streak 🔥, cards mastered
- **Share decks** — export a deck as a file and import it on another phone or send it to a friend
- Works **offline**, installs on your phone's home screen, follows light/dark mode

## Files — read them in this order

| File | What it teaches |
|---|---|
| `index.html` | The page shell: one empty `#app` box that JavaScript fills in |
| `style.css` | Layout, colors as CSS variables, dark mode, the 3D card flip |
| `db.js` | Saving data in the browser's built-in database (IndexedDB) with Promises |
| `app.js` | Everything else, in numbered sections: helpers → data → spaced repetition → screens → router → start |
| `sw.js` | A service worker that keeps a copy of the files so the app opens offline |
| `manifest.webmanifest` | The name and icons used when installing on a phone |

## How spaced repetition works here

Every card sits in a **box** from 0 (new) to 5 (mastered):

```
new → box 1 → box 2 → box 3 → box 4 → box 5 (mastered)
       1 day   2 days  4 days  7 days  14 days      ← wait before showing it again
```

- **Got it** moves the card up one box, so you see it less often.
- **Again** sends it back to box 1, and it repeats at the end of the current session.

So your time goes to the cards you find hard. The whole rule is the `grade()`
function in `app.js` — try changing `GAP_DAYS` and see what happens.

## Ideas to try next (good practice)

1. Add a **"Hard"** button that keeps the card in the same box.
2. Show a **timer** in quiz mode.
3. Add **images** on cards (hint: store them as data URLs like Remind Myself's profile photo).
4. Sync decks across devices using the Firebase approach from `../SETUP-FIREBASE.md`.

## Run it locally

From the repo root:

```bash
python3 -m http.server 8000
# open http://localhost:8000/flashcards/
```
