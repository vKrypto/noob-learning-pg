// Only the Firebase functions Remind Myself uses. Bundled into js/vendor/firebase.js
// by tools/build-firebase.sh so the app needs no build step and works offline.
export { initializeApp } from 'firebase/app';
export {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut,
} from 'firebase/auth';
export {
  getFirestore, collection, doc, getDocsFromServer, getDocFromServer, onSnapshot, writeBatch,
} from 'firebase/firestore';
