# Turn on "Sync across devices" (Firebase)

Remind Myself works on its own, saving tasks on each device. To keep the same
tasks on several phones and computers it needs a **backend** — a server and a
database on the internet. We use **Firebase** (by Google): it gives you a
database, sign-in and hosting for those, with a free plan that is plenty for
this app. No credit card is needed.

This takes about **10 minutes**. You need a Google account.

---

## Step 1 — Create a Firebase project

1. Open **https://console.firebase.google.com** and sign in with your Google account.
2. Click **Create a project** (or **Add project**).
3. Name it `remind-myself` and continue.
4. Google Analytics: you can switch it **off** — the app doesn't use it.
5. Click **Create project**, wait, then **Continue**.

## Step 2 — Turn on sign-in

1. In the left menu: **Build → Authentication → Get started**.
2. Open the **Sign-in method** tab.
3. Click **Email/Password** → switch on the first toggle (**Email/Password**) → **Save**.
4. Click **Add new provider → Google** → switch it on → pick your email as the
   "support email" → **Save**.
5. Open the **Settings** tab → **Authorized domains** → **Add domain** →
   type `vkrypto.github.io` → **Add**.
   *(Without this, "Continue with Google" won't work on your live site.)*

## Step 3 — Create the database

1. Left menu: **Build → Firestore Database → Create database**.
2. Location: pick **asia-south1 (Mumbai)** — closest to India. *(This can't be changed later.)*
3. Choose **Start in production mode** → **Create**.

## Step 4 — Add the security rules (important!)

These rules are the real "lock" on the data: each person can only read and
write their own tasks. Without them, the database would refuse everything
(production mode) — or worse, allow everyone.

1. In Firestore, open the **Rules** tab.
2. Delete everything there and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Each signed-in person can only touch users/<their own id>/...
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

3. Click **Publish**.

## Step 5 — Get your app's settings

1. Click the **gear icon ⚙ (top left) → Project settings**.
2. Scroll to **Your apps** → click the **web icon `</>`**.
3. App nickname: `Remind Myself` → **Register app** (skip "Firebase Hosting").
4. You'll see a block of code with `const firebaseConfig = { apiKey: ..., ... }`.
   **Copy just the part between `{` and `}`**.

## Step 6 — Put the settings in the app

Either **send the copied settings to Claude** in the chat, or do it yourself:

1. Open `js/firebase-config.js` in this repo (on GitHub: click the file → ✏️ edit).
2. Replace `export const firebaseConfig = null;` with your settings:

```js
export const firebaseConfig = {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…",
};
```

3. Commit to `main`. GitHub Pages updates the site in about a minute.

> **Is it safe to put these in a public repo?** Yes. These values only tell the
> app *which* Firebase project to talk to; every Firebase website sends them to
> the browser anyway. The security rules from Step 4 are what protect the data.

## Step 7 — Try it

1. Open the app → **Menu → Settings → Sync across devices**.
2. Sign in with Google (or email + password).
3. On a second phone, open the app and sign in with the **same** account.
4. Add a task on one phone — it appears on the other within a second or two.

You can watch the data arrive in the Firebase console: **Firestore Database → Data → users**.

---

## How the sync works (the backend, explained)

```
 Phone A ─┐                                  ┌─ users/<your id>               (profile, categories, settings…)
          ├─→ Firebase Auth ─→ Firestore ────┤
 Phone B ─┘   "who are you?"   "your data"   └─ users/<your id>/tasks/<id>    (one document per task)
```

| Piece | File | What it does |
|---|---|---|
| Local database | `js/store.js`, `js/db.js` | Every screen reads and writes the copy on the device (IndexedDB), so the app is fast and works offline |
| Sync engine | `js/sync.js` | Notices changes and copies them up and down |
| Backend connector | `js/cloud.js` | The only file that talks to Firebase (sign-in, read, write, live updates) |
| Settings | `js/firebase-config.js` | Which Firebase project to use |
| Firebase library | `js/vendor/firebase.js` | Google's official code, bundled by `tools/build-firebase.sh` |

**What happens when you add a task on Phone A**

1. The task is saved on Phone A first (works even offline).
2. `sync.js` notices the change and asks `cloud.js` to write it to
   `users/<your id>/tasks/<task id>`.
3. Firebase checks the security rules: *is this request signed in as `<your id>`?*
4. Phone B is "subscribed" to that folder, so Firestore pushes the new task to it
   straight away, and Phone B saves it locally and redraws the screen.

**Offline and conflicts.** After each sync the app remembers a *baseline* — what
both sides agreed on. When a device comes back online it compares its data and
the cloud's against that baseline to see what changed on each side. If the same
task was edited on two devices, the newest edit wins. If one device deleted a
task while another edited it, the edit is kept, so no work is lost.

**Using a different backend later.** Only `js/cloud.js` knows about Firebase. To
learn more you could write your own server (for example Node.js + Express +
PostgreSQL) that offers the same functions — `load`, `write`, `subscribe`,
sign-in — and swap it in without touching the rest of the app.
