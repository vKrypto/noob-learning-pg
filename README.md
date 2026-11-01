# Remind Myself — Daily Task Organizer

A daily task and reminder app for people who keep forgetting their plans but want an organized routine.
It's a Progressive Web App (PWA): it runs in any browser, can be installed on a phone's home screen, and works offline.

**Live:** deployed automatically to GitHub Pages on every push to `main` (see `.github/workflows/pages.yml`).

## Features

| Area | What's included |
|---|---|
| Start | No sign-in — the app opens straight to Home. Your name and photo are set on the Profile screen |
| Tasks | Add, edit, delete, mark done; date, time, notes, high priority; repeat daily / weekly / monthly / yearly |
| Search | Search titles, notes and categories, with status, day and category filters |
| Reminders | Notifications before a task (at time, 5 min … 1 day before) plus a sound; birthday reminders on the day |
| Overview | Today's progress ring, overdue list, completed vs pending |
| Categories | Personal, Professional, Shopping, Health routine, Study, Birthdays, Special — plus your own, with color and icon |
| Voice input | Speak a task: "call mom tomorrow at 6 pm" fills title, date and time |
| Motivation | A time-management quote each day |
| Reports | Weekly and monthly progress charts, completion by category, day streak |
| Sharing | Share a task via the phone's share sheet (WhatsApp etc.) or share the app |
| Calendar | Month calendar; add a task to Google Calendar or export `.ics` for any calendar app |
| Profile | Photo, name, time-management slogan, today's completion, pending tasks |
| Menu | Categories, Theme (light/dark/system + accent color), Birthday countdown, Share, Feedback, Settings |
| Settings | Date format, week start day, completion tone, Home widgets (week list / month list), check for updates, backup & restore, erase all data |

## Run it locally

No build step and no dependencies. Serve the folder over HTTP:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Project layout

```
index.html              app shell
manifest.webmanifest    install info (name, icons)
sw.js                   service worker: offline cache, notification clicks
css/app.css             all styles (colors are CSS variables)
js/app.js               router + startup
js/db.js                IndexedDB wrapper (the browser's built-in database)
js/store.js             your tasks and settings, saved in IndexedDB ← swap for a backend here
js/i18n.js              all the app's text (English)
js/reminders.js         reminder scheduler
js/voice.js             speech input + "tomorrow at 6 pm" parsing
js/ics.js               calendar export
js/views/*.js           one file per screen
```

## Good to know

- **Data lives in the browser's built-in database (IndexedDB)**, in a database named `daynest` (the app's original working name, kept so existing data isn't lost). There's no sign-in: each device keeps one personal set of tasks. Devices that had an account in earlier versions keep that account's tasks and name automatically. Inspect it in DevTools → Application → IndexedDB. Use *Settings → Back up data* to move to another device.
- **Reminders** fire while the app is open or running in the background. A website can't wake itself when the browser is fully closed — that needs a push server.

## Next steps

1. Sync across devices: replace the functions in `js/store.js` with Firebase + Firestore (or Supabase).
2. Reminders when the app is closed: add Web Push with a small server or Firebase Cloud Messaging.
3. Native Android/iOS home-screen widgets: wrap the app with Capacitor.
