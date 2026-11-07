// Backend de prueba (solo para el build de pruebas): guarda todo en localStorage
// y simula varias personas con ?as=elisa|prod|p1|nueva. No se publica.
const KEY = 'mockdb-v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const write = (d) => localStorage.setItem(KEY, JSON.stringify(d));
const subs = new Set();
const merge = (a, b) => {
  const o = { ...(a || {}) };
  for (const k of Object.keys(b)) {
    o[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(o[k], b[k]) : b[k];
  }
  return o;
};
const fire = () => subs.forEach((f) => f());
window.addEventListener('storage', (e) => { if (e.key === KEY) fire(); });

const PEOPLE = {
  elisa: { uid: 'u-elisa', email: 'elisa@test', name: 'Elisa', photo: '' },
  prod: { uid: 'u-prod', email: 'prod@test', name: 'Sebastián', photo: '' },
  p1: { uid: 'u-p1', email: 'p1@test', name: 'Rosa', photo: '' },
  nueva: { uid: 'u-nueva', email: 'nueva@test', name: 'Persona Nueva', photo: '' },
};
let authCb = null;
const who = () => sessionStorage.getItem('mock-user');

export const B = {
  mode: 'mock',
  async init() {
    const as = new URLSearchParams(location.search).get('as');
    if (as && PEOPLE[as]) sessionStorage.setItem('mock-user', as);
  },
  onAuth(cb) {
    authCb = cb;
    setTimeout(() => cb(who() ? PEOPLE[who()] : null), 0);
    return () => {};
  },
  async signIn() { sessionStorage.setItem('mock-user', 'p1'); authCb && authCb(PEOPLE.p1); },
  async signOut() { sessionStorage.removeItem('mock-user'); authCb && authCb(null); },
  async ensureUser(u) {
    const d = read();
    d.users = d.users || {};
    if (d.users[u.uid]) return d.users[u.uid];
    const adminEmail = d.config && d.config.app && d.config.app.adminEmail;
    const role = adminEmail && adminEmail === u.email ? 'admin' : 'pending';
    d.users[u.uid] = { email: u.email, name: u.name, photo: '', role, createdAt: Date.now(), tokens: [] };
    write(d); fire();
    return d.users[u.uid];
  },
  watch(path, cb, opts = {}) {
    const parts = path.split('/');
    const run = () => {
      const d = read();
      if (parts.length % 2 === 0) { cb(((d[parts[0]] || {})[parts[1]]) || null); return; }
      let m = d[parts[0]] || {};
      if (opts.last) {
        const ks = Object.keys(m).sort().reverse().slice(0, opts.last);
        m = Object.fromEntries(ks.map((k) => [k, m[k]]));
      }
      cb(JSON.parse(JSON.stringify(m)));
    };
    subs.add(run); setTimeout(run, 0);
    return () => subs.delete(run);
  },
  async set(path, data) {
    const [c, id] = path.split('/');
    const d = read(); d[c] = d[c] || {};
    d[c][id] = merge(d[c][id], data); write(d); fire();
  },
  async del(path) {
    const [c, id] = path.split('/');
    const d = read(); if (d[c]) delete d[c][id]; write(d); fire();
  },
  async add(coll, data) {
    const d = read(); d[coll] = d[coll] || {};
    d[coll]['a' + Date.now() + Math.random().toString(36).slice(2, 6)] = data; write(d); fire();
  },
  now() { return Date.now(); },
  async pushStatus() { return 'default'; },
  async enablePush() { return 'mock-token-' + who(); },
  onForeground() {},
};
