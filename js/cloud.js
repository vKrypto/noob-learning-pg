// The backend connector: everything that talks to Firebase lives in this file.
//
// Where the data goes in Firestore (Firebase's cloud database):
//   users/{uid}                 one document: categories, birthdays, profile, settings, feedback
//   users/{uid}/tasks/{taskId}  one document per task
// {uid} is the signed-in person's Firebase account id, and the security rules
// only allow that person to read or write under users/{uid}.
//
// sync.js only uses the functions returned below, so another backend (Supabase,
// your own Node server…) could replace this file without touching the rest.

import { firebaseConfig } from './firebase-config.js';

const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch

export async function createBackend() {
  if (!firebaseConfig) return null;          // sync not set up yet
  const fb = await import('./vendor/firebase.js');
  const app = fb.initializeApp(firebaseConfig);
  const auth = fb.getAuth(app);
  const store = fb.getFirestore(app);
  const tasksCol = uid => fb.collection(store, 'users', uid, 'tasks');
  const userDoc = uid => fb.doc(store, 'users', uid);

  return {
    /** Calls cb with { uid, email, name } when someone signs in, or null when they sign out. */
    onUser: cb => fb.onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, email: u.email, name: u.displayName || '' } : null)),

    signInGoogle: () => fb.signInWithPopup(auth, new fb.GoogleAuthProvider()),
    signInEmail: (email, pw) => fb.signInWithEmailAndPassword(auth, email, pw),
    signUpEmail: (email, pw) => fb.createUserWithEmailAndPassword(auth, email, pw),
    resetPassword: email => fb.sendPasswordResetEmail(auth, email),
    signOut: () => fb.signOut(auth),

    /** Read everything for this account straight from the server. */
    async load(uid) {
      const [tasks, profile] = await Promise.all([fb.getDocsFromServer(tasksCol(uid)), fb.getDocFromServer(userDoc(uid))]);
      return { tasks: tasks.docs.map(d => d.data()), doc: profile.exists() ? profile.data() : null };
    },

    /** Save changed tasks, delete removed ones, and update the account document — all-or-nothing per batch. */
    async write(uid, { setTasks = [], deleteTaskIds = [], doc = null }) {
      const ops = [
        ...setTasks.map(t => b => b.set(fb.doc(tasksCol(uid), t.id), t)),
        ...deleteTaskIds.map(id => b => b.delete(fb.doc(tasksCol(uid), id))),
      ];
      if (doc) ops.push(b => b.set(userDoc(uid), doc));
      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = fb.writeBatch(store);
        ops.slice(i, i + BATCH_LIMIT).forEach(op => op(batch));
        await batch.commit();
      }
    },

    /**
     * Live updates: Firestore pushes changes made on other devices.
     * Our own unsent writes (hasPendingWrites) are skipped — we already have them.
     */
    subscribe(uid, onTasks, onDoc, onError) {
      const stopTasks = fb.onSnapshot(tasksCol(uid), snap => {
        const changes = snap.docChanges()
          .filter(c => !c.doc.metadata.hasPendingWrites)
          .map(c => ({ type: c.type, id: c.doc.id, task: c.doc.data() }));
        if (changes.length) onTasks(changes);
      }, onError);
      const stopDoc = fb.onSnapshot(userDoc(uid), snap => {
        if (!snap.metadata.hasPendingWrites && snap.exists()) onDoc(snap.data());
      }, onError);
      return () => { stopTasks(); stopDoc(); };
    },
  };
}
