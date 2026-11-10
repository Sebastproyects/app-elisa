// Conexión real con Firebase: cuentas de Google, datos en tiempo real y avisos push.
import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, browserLocalPersistence, setPersistence,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, setDoc, deleteDoc, addDoc, getDoc,
  query, where, documentId,
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from './firebase-config.js';

let app, auth, db;

export const B = {
  mode: 'firebase',

  async init() {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence).catch(() => {});
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    // Termina el ingreso con Google si volvemos de la pantalla de Google.
    try { await getRedirectResult(auth); } catch (e) { B.lastAuthError = e; }
  },

  onAuth(cb) {
    return onAuthStateChanged(auth, (u) =>
      cb(u ? { uid: u.uid, email: u.email, name: u.displayName || u.email, photo: u.photoURL || '' } : null));
  },
  async signIn() {
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, p);
  },
  async signOut() { await signOut(auth); },

  // Lee o crea el documento de la persona. La primera vez entra como "pending";
  // si el correo es el de la administradora, las reglas dejan crearlo como "admin".
  async ensureUser(u) {
    const ref = doc(db, 'users', u.uid);
    let snap;
    try { snap = await getDoc(ref); } catch (e) { snap = null; }
    if (snap && snap.exists()) return snap.data();
    const base = { email: u.email, name: u.name, photo: u.photo, createdAt: Date.now(), tokens: [] };
    try {
      await setDoc(ref, { ...base, role: 'admin' });
      return { ...base, role: 'admin' };
    } catch (e) {
      await setDoc(ref, { ...base, role: 'pending' });
      return { ...base, role: 'pending' };
    }
  },

  // Colección → {id: datos}. Documento → datos o null.
  watch(path, cb, opts = {}) {
    const parts = path.split('/');
    const onErr = (e) => { console.warn('watch', path, e.code || e); if (B.onError) B.onError(path, e); };
    if (parts.length % 2 === 0) {
      return onSnapshot(doc(db, path), (s) => cb(s.exists() ? s.data() : null, s.metadata.fromCache), onErr);
    }
    let q = collection(db, path);
    if (opts.days) { // solo los últimos N días (los ids empiezan con la fecha): no necesita índice
      const since = new Date(Date.now() - opts.days * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      q = query(q, where(documentId(), '>=', since));
    }
    return onSnapshot(q, (snap) => {
      const m = {};
      snap.forEach((d) => { m[d.id] = d.data(); });
      cb(m, snap.metadata.fromCache);
    }, onErr);
  },

  async set(path, data) { await setDoc(doc(db, path), data, { merge: true }); },
  async del(path) { await deleteDoc(doc(db, path)); },
  async add(coll, data) { await addDoc(collection(db, coll), data); },
  now() { return Date.now(); },

  // Avisos push. Debe llamarse desde un toque del usuario (lo exige el iPhone).
  async pushStatus() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
    try { if (!(await isSupported())) return 'unsupported'; } catch (e) { return 'unsupported'; }
    return Notification.permission; // default | granted | denied
  },
  async enablePush() {
    const st = await B.pushStatus();
    if (st === 'unsupported') return 'unsupported';
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return perm;
    const reg = await navigator.serviceWorker.ready;
    const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    return token || 'error';
  },
  onForeground(cb) {
    isSupported().then((ok) => { if (ok) onMessage(getMessaging(app), (m) => cb(m.data || {})); }).catch(() => {});
  },
};
