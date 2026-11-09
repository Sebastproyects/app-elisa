import { B } from 'backend';
import {
  PRODUCTS, MODES, LEVELS, OWNERS, ROLES, ROLE_OWNER, SECTIONS, PREP, PREP_OF,
} from './catalog.js';

/* ============================== utilidades ============================== */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TZ = 'America/Lima';
const dayKey = (ms = Date.now()) => new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ });
const hhmm = (ms) => new Date(ms).toLocaleTimeString('es-PE', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const dayDiff = (ms) => Math.round((Date.parse(dayKey()) - Date.parse(dayKey(ms))) / 86400000);
const ago = (ms) => {
  if (!ms) return '';
  const d = dayDiff(ms);
  if (d <= 0) return 'hoy ' + hhmm(ms);
  if (d === 1) return 'ayer';
  return `hace ${d} días`;
};
const FR = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
const fracText = (n) => {
  const w = Math.floor(n); const r = Math.round((n - w) * 100) / 100;
  if (!r) return String(w);
  return (w ? String(w) : '') + (FR[r] || r);
};
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
};


/* ============================== iconos ============================== */
const ICONS = {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  calcheck: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  basket: '<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/>',
  chef: '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  half: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="m7.5 4.27 9 5.15"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  share: '<path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
};
const ico = (n, size = 22) => `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
// Logo: un toldo de puesto en los colores de la app.
const LOGO = `<svg class="logo" viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="24" fill="#2F6F6B"/>
  <g><path d="M18 30h60l5 16H13z" fill="#FBF6EC"/><path d="M28 30h10l-2 16H21zM48 30h10l2 16H46zM68 30h10l5 16H72z" fill="#E9A860"/>
  <path d="M13 46q5.5 8 11 0q5.5 8 11 0q5.5 8 11 0q5.5 8 11 0q5.5 8 11 0q5.5 8 11 0" fill="#FBF6EC"/>
  <rect x="21" y="52" width="4" height="18" rx="2" fill="#FBF6EC"/><rect x="71" y="52" width="4" height="18" rx="2" fill="#FBF6EC"/>
  <rect x="17" y="66" width="62" height="7" rx="3.5" fill="#FBF6EC"/><path d="M36 66a12 12 0 0 1 24 0z" fill="#E9A860"/></g></svg>`;

/* ================================ estado ================================ */
const S = {
  user: null, me: null, loading: true,
  products: {}, status: {}, users: {}, reports: {}, counts: {}, config: {},
  tab: null, sub: null,
  q: '', only: false, ownerFilter: 'all', prepFilter: 'all',
  sheet: null, loaded: {},
  font: store.get('font', 1), sound: store.get('sound', true), theme: store.get('theme', 'auto'),
  push: 'unknown', deferredInstall: null, countOwner: 'p1', open: {}, cntOpen: {},
};
let unsubs = [];
let prevStatus = null;
let seeding = false;

const role = () => (S.me ? S.me.role : null);
const isAdmin = () => role() === 'admin';
const myOwner = () => ROLE_OWNER[role()] || null;
const prodList = () => Object.entries(S.products)
  .map(([id, p]) => ({ ...p, id }))
  .filter((p) => p.active !== false)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
const getSt = (id) => S.status[id] || { state: 'ok' };
const stateOf = (id) => getSt(id).state || 'ok';
const unitOf = (p, mode) => (p.units && p.units[mode]) || (MODES[mode] && MODES[mode].unit) || '';

const STATES = {
  out: { label: 'Falta' },
  low: { label: 'Hay poco' },
  ok: { label: 'Sí hay' },
};
const stIcon = (k) => ico(k === 'out' ? 'x' : k === 'low' ? 'half' : 'check', 26);

function fmtQty(p, st) {
  if (st.qty === null || st.qty === undefined || st.qty === '') return '';
  const mode = st.mode || p.modes[0];
  const m = MODES[mode];
  if (!m) return '';
  if (m.kind === 'num') return `${fracText(+st.qty)} ${unitOf(p, mode)}`;
  if (m.kind === 'bar') return `${fracText(+st.qty)} ${unitOf(p, mode) || ''}${m.max > 1 ? ` de ${m.max}` : ''}`.trim();
  if (m.kind === 'yn') return +st.qty ? 'Hay' : 'No hay';
  if (m.kind === 'lvl') return LEVELS[+st.qty] || '';
  return '';
}
function detailLine(p, st, withNote = true) {
  const bits = [];
  const q = fmtQty(p, st); if (q) bits.push(q);
  if (st.note && withNote) bits.push('“' + esc(st.note) + '”');
  if (st.byName && st.at) bits.push(`${esc(st.byName.split(' ')[0])}, ${ago(st.at)}`);
  return bits.join(' · ');
}
const avgInterval = (st) => {
  const d = (st.buyDates || []).slice(-6);
  if (d.length < 2) return null;
  let sum = 0; for (let i = 1; i < d.length; i++) sum += d[i] - d[i - 1];
  return Math.max(1, Math.round(sum / (d.length - 1) / 86400000));
};
const isBought = (st) => !!(st.boughtAt && (!st.since || st.boughtAt >= st.since));
// Producción marcó "Ya envié" después de que el producto quedó en poco/falta.
const isSent = (st) => !!(st.sentAt && (!st.since || st.sentAt >= st.since));
const day0 = (d = dayKey()) => Date.parse(d + 'T00:00:00-05:00'); // medianoche de Lima
const weekday = (d) => new Date(d + 'T12:00:00-05:00').getUTCDay(); // 0 = domingo
// Cantidad que llega normalmente ese día (lv, sab, dom) o un número fijo.
function expectedFor(p, date) {
  const e = p.expected;
  if (e === null || e === undefined || e === '') return null;
  if (typeof e === 'number') return e;
  const w = weekday(date);
  const v = w === 0 ? e.dom : w === 6 ? e.sab : e.lv;
  return v === undefined || v === null || v === '' ? null : +v;
}
const deadlineMin = () => {
  const [h, m] = String(S.config.sendDeadline || '07:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const PROD_START_MIN = 4 * 60 + 30; // Producción empieza 4:30
const needsSend = (p) => p.owner !== 'prod' && (p.camino === 'A' || p.camino === 'B') && stateOf(p.id) !== 'ok';
// Lo que se pidió antes de que empiece Producción y a la hora límite todavía no se envió.
function overdueItems() {
  const now = Date.now(); const d0 = day0();
  if (now < d0 + deadlineMin() * 60000) return [];
  return prodList().filter((p) => needsSend(p) && !isSent(getSt(p.id))
    && (getSt(p.id).since || 0) < d0 + PROD_START_MIN * 60000);
}
const sentToday = () => prodList().filter((p) => needsSend(p) && isSent(getSt(p.id)) && getSt(p.id).sentAt >= day0());
const noteBlock = (st) => (st.note ? `<div class="cmt">${ico('note', 20)}<span>${esc(st.note)}</span></div>` : '');

/* ============================== arranque ============================== */
async function boot() {
  applyFont(); applyTheme();
  await B.init();
  B.onAuth(async (u) => {
    stopWatchers();
    S.user = u; S.me = null; S.loading = false; S.loaded = {};
    if (!u) { render(); return; }
    S.loading = true; render();
    try { S.me = await B.ensureUser(u); } catch (e) { console.error(e); S.err = 'No se pudo abrir tu cuenta. Revisa tu internet.'; }
    S.loading = false;
    if (S.me) startWatchers();
    S.tab = null; render();
    refreshPush(false);
  });
  B.onForeground((d) => { toast(d.title ? `${d.title}: ${d.body || ''}` : 'Nuevo aviso', true); beep(); });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.deferredInstall = e; render(); });
  if ('serviceWorker' in navigator && B.mode === 'firebase') {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('sw', e));
  }
  render();
}

function restartWatchers() { stopWatchers(); S.loaded = {}; startWatchers(); render(); }
function stopWatchers() { unsubs.forEach((u) => u && u()); unsubs = []; prevStatus = null; }
function startWatchers() {
  const uid = S.user.uid;
  const mark = (k) => (v, fromCache) => { S.loaded[k] = true; return v; };
  unsubs.push(B.watch('users/' + uid, (me) => {
    if (me === null && S.me) { // borraron la cuenta
      S.me = null; B.signOut(); return;
    }
    if (me) {
      const was = S.watchedRole; S.me = me;
      if (was && was !== me.role && (was === 'pending' || me.role === 'pending' || was === 'admin' || me.role === 'admin')) {
        S.watchedRole = me.role; S.tab = null; restartWatchers(); return;
      }
      S.watchedRole = me.role;
      render();
    }
  }));
  S.watchedRole = S.me.role;
  if (S.me.role === 'pending') return;
  unsubs.push(B.watch('products', (m, fc) => {
    S.products = m; S.loaded.products = true;
    if (isAdmin() && !Object.keys(m).length && !fc) seedCatalog();
    render();
  }));
  unsubs.push(B.watch('status', (m) => {
    if (prevStatus) detectAlerts(prevStatus, m);
    prevStatus = JSON.parse(JSON.stringify(m));
    S.status = m; S.loaded.status = true; render();
  }));
  unsubs.push(B.watch('config/app', (c) => { S.config = c || {}; render(); }));
  unsubs.push(B.watch('reports', (m) => { S.reports = m; render(); }, { last: 30 }));
  unsubs.push(B.watch('counts', (m) => { S.counts = m; render(); }, { last: 14 }));
  if (S.me.role === 'admin') unsubs.push(B.watch('users', (m) => { S.users = m; render(); }));
}

async function seedCatalog() {
  if (seeding) return; seeding = true;
  try {
    let i = 0;
    for (const p of PRODUCTS) {
      const { id, ...rest } = p;
      await B.set('products/' + id, { ...rest, order: i++, active: true });
    }
    toast('Catálogo inicial cargado');
  } catch (e) { console.error(e); seeding = false; }
}

/* ============================ avisos en la app ============================ */
function detectAlerts(prev, now) {
  const mine = isAdmin() ? null : myOwner();
  for (const id of Object.keys(now)) {
    const a = (prev[id] || {}).state || 'ok'; const n = now[id].state || 'ok';
    const p = S.products[id];
    if (!p || n === a || now[id].by === S.user.uid) continue;
    const relevant = isAdmin() || (role() === 'produccion' && (p.camino === 'A' || p.camino === 'B') && p.owner !== 'prod');
    if (!relevant && !mine) continue;
    if (n === 'out' || (n === 'low' && p.early)) {
      toast(`${n === 'out' ? 'FALTA' : 'Poco'}: ${p.name} (${OWNERS[p.owner]})`, true); beep();
    }
  }
}
let actx; let voz;
// Suena la voz que susurra “secretos”; si el celular no la deja reproducir, un pitido.
function beep(force) {
  if (!S.sound && !force) return;
  try {
    voz = voz || new Audio('secretos.mp3');
    voz.currentTime = 0; voz.volume = 1;
    const pr = voz.play();
    if (pr && pr.catch) pr.catch(() => pitido(force));
    return;
  } catch (e) { /* sigue con el pitido */ }
  pitido(force);
}
function pitido(force) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.22].forEach((t) => {
      const o = actx.createOscillator(); const g = actx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(force ? 0.8 : 0.25, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + t + 0.18);
      o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.2);
    });
  } catch (e) { /* sin audio */ }
}
let toastTimer;
function toast(msg, sticky = false, action) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="toast-action">${esc(action.label)}</button>` : ''}`;
  t.classList.add('show');
  toast.action = action;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), sticky ? 9000 : 3500);
}

/* =========================== escritura de datos =========================== */
function alertFor(p, newState, prevState, st) {
  if (newState === prevState) return;
  if (!(newState === 'out' || (newState === 'low' && p.early))) return;
  const to = ['admin'];
  if ((p.camino === 'A' && p.owner !== 'prod') || p.camino === 'B') to.push('produccion');
  B.add('alerts', {
    productId: p.id, name: p.name, owner: p.owner, camino: p.camino, state: newState, to,
    qty: fmtQty(p, st), note: st.note || '', by: S.user.uid, byName: S.me.name || '',
    createdAt: B.now(), sent: false,
  }).catch((e) => console.warn('alerta', e));
}

async function saveStatus(p, patch) {
  const cur = getSt(p.id); const prev = cur.state || 'ok'; const now = B.now();
  const state = patch.state || prev;
  const d = {
    state, by: S.user.uid, byName: S.me.name || '', at: now,
    mode: patch.mode !== undefined ? patch.mode : (cur.mode ?? null),
    qty: patch.qty !== undefined ? patch.qty : (cur.qty ?? null),
    note: patch.note !== undefined ? patch.note : (cur.note || ''),
  };
  if (state === 'ok' && patch.qty === undefined) { d.qty = null; d.mode = null; }
  if (state === 'ok' && patch.note === undefined) d.note = '';
  if (state !== prev) d.since = state === 'ok' ? null : now;
  else if (!cur.since && state !== 'ok') d.since = now;
  // actualiza la pantalla al instante y manda al servidor
  S.status[p.id] = { ...cur, ...d };
  render();
  try {
    await B.set('status/' + p.id, d);
    alertFor(p, state, prev, d);
  } catch (e) { toast('No se pudo guardar. Se reintenta al volver el internet.'); }
}

/* ================================== vistas ================================== */
const root = () => $('#app');

function render() {
  const app = root(); if (!app) return;
  const ae = document.activeElement; const focusId = ae && ae.id; const sel = ae && ae.selectionStart;
  if (S.loading) { app.innerHTML = splash('Cargando…'); return; }
  if (!S.user) { app.innerHTML = loginView(); return; }
  if (!S.me) { app.innerHTML = splash(S.err || 'Abriendo tu cuenta…', true); return; }
  if (S.me.role === 'pending') { app.innerHTML = pendingView(); return; }
  const tabs = tabsFor();
  if (!S.tab || !tabs.find((t) => t.id === S.tab)) S.tab = tabs[0].id;
  app.innerHTML = `
    ${headerView()}
    <main>${banners()}${currentView()}</main>
    <nav class="tabbar" style="--n:${tabs.length}">
      ${tabs.map((t) => `<button class="tab ${t.id === S.tab ? 'on' : ''}" data-act="tab" data-tab="${t.id}">
        <span class="ti">${t.icon}</span><span>${t.label}</span>${t.badge ? `<b class="badge">${t.badge}</b>` : ''}</button>`).join('')}
    </nav>`;
  const hd = $('header'); if (hd) document.documentElement.style.setProperty('--hh', hd.offsetHeight + 'px');
  if (focusId) { const f = document.getElementById(focusId); if (f) { f.focus(); try { f.setSelectionRange(sel, sel); } catch (e) { /* */ } } }
}

const splash = (msg, withOut) => `<div class="center">${LOGO}<p class="big">${esc(msg)}</p>
  ${withOut ? '<button class="btn ghost" data-act="signout">Salir</button>' : ''}</div>`;

const loginView = () => `<div class="center">
  ${LOGO}
  <h1>Los Secretos de Elisa</h1>
  <p class="muted">Avisa lo que falta, prepara lo que toca y compra a tiempo.</p>
  <button class="btn primary xl" data-act="signin">Entrar con Google</button>
  <p class="muted small">Usa tu cuenta de Gmail. La primera vez, la señora Elisa tiene que aprobarte.</p>
</div>`;

const pendingView = () => `<div class="center">
  ${LOGO}
  <h1>Esperando aprobación</h1>
  <p class="big">Hola ${esc((S.me.name || '').split(' ')[0])}. Ya entraste con <b>${esc(S.me.email)}</b>.</p>
  <p class="muted">La señora Elisa tiene que aprobar tu cuenta y elegir tu perfil. Esta pantalla se abre sola cuando lo haga.</p>
  <button class="btn ghost" data-act="signout">Salir</button>
</div>`;

function tabsFor() {
  const r = role();
  if (r === 'admin') {
    const buy = buyItems().todo.length; const pend = Object.values(S.users).filter((u) => u.role === 'pending').length;
    return [
      { id: 'comprar', label: 'Comprar', icon: ico('cart'), badge: buy },
      { id: 'preparar', label: 'Preparar', icon: ico('chef'), badge: prepItems().length },
      { id: 'conteo', label: 'Llegadas', icon: ico('truck') },
      { id: 'avisos', label: 'Avisos', icon: ico('bell'), badge: overdueItems().length },
      { id: 'ajustes', label: 'Más', icon: ico('sliders'), badge: pend },
    ];
  }
  if (r === 'produccion') {
    return [
      { id: 'hoy', label: 'Para hoy', icon: ico('calcheck'), badge: todayItems().length },
      { id: 'reporte', label: 'Mi materia prima', icon: ico('basket') },
      { id: 'ajustes', label: 'Más', icon: ico('sliders') },
    ];
  }
  return [
    { id: 'reporte', label: 'Reporte', icon: ico('clipboard') },
    { id: 'conteo', label: 'Llegadas', icon: ico('truck') },
    { id: 'avisos', label: 'Avisos', icon: ico('bell'), badge: overdueItems().length },
    { id: 'ajustes', label: 'Más', icon: ico('sliders') },
  ];
}

function headerView() {
  const titles = {
    admin: 'Adquisición', puesto1: 'Puesto 1', puesto2: 'Puesto 2', produccion: 'Producción',
  };
  const call = !isAdmin()
    ? `<button class="call" data-act="call">${ico('phone', 18)} <span>Llamar a Elisa</span></button>` : '';
  return `<header><div class="hc"><div class="hl">${LOGO.replace('class="logo"','class="hlogo"')}</div><div class="ht"><div class="hn">${titles[role()]}</div>
    <div class="hs">${esc((S.me.name || '').split(' ')[0])}</div></div>${call}</div></header>`;
}

function banners() {
  let out = '';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (B.mode === 'firebase') {
    if (ios && !standalone) {
      out += `<div class="banner">${ico('share', 22)}<span>Para recibir avisos en el iPhone: toca <b>Compartir</b> y luego <b>Agregar a pantalla de inicio</b>. Abre la app desde ese ícono.</span></div>`;
    } else if (S.push === 'default') {
      out += `<div class="banner">${ico('bell', 22)}<span>Activa los avisos para enterarte al instante.</span><button class="btn small primary" data-act="push">Activar avisos</button></div>`;
    }
  }
  return out;
}

function currentView() {
  switch (S.tab) {
    case 'reporte': return reporteView(role() === 'produccion' ? 'prod' : myOwner());
    case 'conteo': return conteoView();
    case 'hoy': return hoyView();
    case 'comprar': return comprarView();
    case 'preparar': return prepararView();
    case 'avisos': return avisosView();
    case 'ajustes':
      if (S.sub === 'catalogo' && isAdmin()) return catalogoView();
      if (S.sub === 'personas' && isAdmin()) return personasView();
      return ajustesView();
    default: return '';
  }
}

/* ---------- Reporte (estados) ---------- */
function filterBar(ph = 'Buscar producto') {
  return `<div class="filters">
    <input id="q" type="search" placeholder="${ph}" value="${esc(S.q)}" data-field="q" autocomplete="off">
    <label class="chk"><input type="checkbox" data-field="only" ${S.only ? 'checked' : ''}> Solo lo que no está en verde</label>
  </div>`;
}
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function itemRow(p) {
  const st = getSt(p.id); const s = st.state || 'ok';
  const det = detailLine(p, st);
  const sent = s !== 'ok' && needsSend(p) && isSent(st)
    ? `<div class="sentb">${ico('box', 16)} Producción envió a las ${hhmm(st.sentAt)}. Marca “Sí hay” cuando llegue.</div>` : '';
  return `<div class="item s-${s}" data-id="${p.id}">
    <div class="im" data-act="open" data-id="${p.id}">
      <div class="nm">${esc(p.name)}</div>
      <div class="sb">${det || '<span class="hint">toca para anotar cantidad o comentario</span>'}</div>${sent}
    </div>
    <div class="sts">${['out', 'low', 'ok'].map((k) =>
      `<button class="st ${k} ${s === k ? 'on' : ''}" data-act="state" data-id="${p.id}" data-s="${k}" aria-label="${STATES[k].label}">
        <i>${stIcon(k)}</i><span>${STATES[k].label}</span></button>`).join('')}</div>
  </div>`;
}

function reporteView(owner) {
  if (!S.loaded.products) return '<p class="muted pad">Cargando productos…</p>';
  const mine = prodList().filter((p) => p.owner === owner && !p.noReport);
  if (!mine.length) {
    return `<p class="muted pad">Todavía no hay productos para ${esc(OWNERS[owner] || 'este perfil')}. La señora Elisa los agrega desde Más → Catálogo.</p>`;
  }
  const filters = false; // ningún perfil usa buscador ni filtro
  let list = mine;
  const q = filters ? norm(S.q.trim()) : '';
  const only = filters && S.only;
  if (q) list = list.filter((p) => norm(p.name).includes(q) || norm(p.section).includes(q));
  if (only) list = list.filter((p) => stateOf(p.id) !== 'ok');
  const today = dayKey();
  const rep = Object.values(S.reports).filter((r) => r.owner === owner && r.date === today)
    .sort((a, b) => b.at - a.at)[0];
  const bySec = {};
  list.forEach((p) => { (bySec[p.section] = bySec[p.section] || []).push(p); });
  const secs = SECTIONS.filter((s) => bySec[s]);
  Object.keys(bySec).forEach((s) => { if (!secs.includes(s)) secs.push(s); });
  const notOk = mine.filter((p) => stateOf(p.id) !== 'ok').length;
  const forceOpen = !!q || only;
  const accordion = secs.map((s) => {
    const items = bySec[s];
    const out = items.filter((p) => stateOf(p.id) === 'out').length;
    const low = items.filter((p) => stateOf(p.id) === 'low').length;
    const open = forceOpen || S.open[s];
    return `<section class="sw ${open ? 'open' : ''}"><button class="acc ${open ? 'on' : ''}" data-act="sec" data-sec="${esc(s)}">
      <span class="at">${esc(s)}</span>
      <span class="ac">${out ? `<b class="dot out">${out}</b>` : ''}${low ? `<b class="dot low">${low}</b>` : ''}<em>${items.length}</em></span>
      <span class="car">${ico('down', 20)}</span></button>${open ? `<div class="accb">${items.map(itemRow).join('')}
      ${forceOpen ? '' : `<button class="accclose" data-act="sec" data-sec="${esc(s)}">${ico('up', 18)} Cerrar ${esc(s)}</button>`}</div>` : ''}</section>`;
  }).join('');
  return `${rep ? `<div class="done">${ico('check', 18)} Reporte enviado hoy a las ${hhmm(rep.at)} por ${esc((rep.byName || '').split(' ')[0])}</div>` : ''}
    ${filters ? filterBar() : ''}
    <div class="hint pad-s">${notOk ? `${notOk} producto(s) sin estar en verde` : 'Todo en verde'}. Abre una sección y toca solo lo que no está bien.</div>
    ${accordion || '<p class="muted pad">No hay resultados.</p>'}
    <div class="finish"><button class="btn primary xl" data-act="finish" data-owner="${owner}">${ico('check', 22)} Terminé mi reporte</button>
    <p class="muted small">Lo que dejaste en verde queda confirmado como “Sí hay” por hoy.</p></div>`;
}

/* ---------- Hoja de detalle (cantidad + comentario) ---------- */
function openSheet(id) {
  const p = S.products[id]; if (!p) return;
  const prod = { ...p, id }; const st = getSt(id);
  S.sheet = {
    id, p: prod, state: st.state || 'ok', mode: st.mode || prod.modes[0],
    qty: st.qty ?? null, note: st.note || '',
  };
  renderSheet();
}
function closeSheet() { S.sheet = null; const sh = $('#sheet'); sh.classList.remove('open'); sh.innerHTML = ''; }

function qtyWidget(p, mode, qty) {
  const m = MODES[mode]; const u = esc(unitOf(p, mode));
  if (m.kind === 'num') {
    return `<div class="stepper"><button data-act="qstep" data-d="-1">−</button>
      <input id="qin" inputmode="decimal" data-field="qin" placeholder="—" value="${qty ?? ''}">
      <button data-act="qstep" data-d="1">+</button><span class="u">${u}</span></div>`;
  }
  if (m.kind === 'bar') {
    const v = qty ?? 0;
    return `<div class="bar"><div class="bt">${qty === null ? '<span class="hint">mueve la barra</span>' : `<b>${fracText(+v)}</b> ${u}${m.max > 1 ? ` (de ${m.max})` : ''}`}</div>
      <input type="range" id="qrange" min="0" max="${m.max}" step="${m.step}" value="${v}" data-field="qrange" ${qty === null ? 'class="untouched"' : ''}>
      <div class="ticks"><span>0</span><span>${m.max === 1 ? '½' : fracText(m.max / 2)}</span><span>${m.max === 1 ? 'lleno' : m.max}</span></div>
      ${qty !== null ? '<button class="link" data-act="qclear">quitar cantidad</button>' : ''}</div>`;
  }
  if (m.kind === 'yn') {
    return `<div class="seg"><button class="${qty === 1 ? 'on' : ''}" data-act="qset" data-v="1">Hay</button>
      <button class="${qty === 0 ? 'on' : ''}" data-act="qset" data-v="0">No hay</button></div>`;
  }
  return `<div class="seg">${LEVELS.map((l, i) =>
    `<button class="${qty === i ? 'on' : ''}" data-act="qset" data-v="${i}">${l}</button>`).join('')}</div>`;
}

function renderLeftSheet() {
  const sh = $('#sheet'); const z = S.sheet; const p = z.p;
  const chips = p.modes.length > 1
    ? `<div class="modes">${p.modes.map((m, i) =>
      `<button class="mode ${m === z.mode ? 'on' : ''} ${i === 0 ? 'main' : 'alt'}" data-act="mode" data-m="${m}">${esc(i === 0 ? unitName(p, m) : 'o en ' + unitName(p, m))}</button>`).join('')}</div>` : '';
  sh.innerHTML = `<div class="scrim" data-act="sheet-close"></div>
    <div class="panel"><div class="grab"></div>
      <h3>${esc(p.name)}</h3>
      <div class="lbl">¿Cuánto sobró? <span class="muted">(aproximado)</span></div>
      ${chips}
      <div id="qwrap">${qtyWidget(p, z.mode, z.qty)}</div>
      <div class="row"><button class="btn ghost" data-act="sheet-close">Cancelar</button>
      <button class="btn primary" data-act="sheet-save">Guardar</button></div>
    </div>`;
  sh.classList.add('open');
}

function renderSheet() {
  const sh = $('#sheet'); const z = S.sheet; if (!z) return;
  if (z.left) { renderLeftSheet(); return; }
  const p = z.p;
  const chips = p.modes.length > 1
    ? `<div class="modes">${p.modes.map((m, i) =>
      `<button class="mode ${m === z.mode ? 'on' : ''} ${i === 0 ? 'main' : 'alt'}" data-act="mode" data-m="${m}">${esc(i === 0 ? unitName(p, m) : 'o en ' + unitName(p, m))}</button>`).join('')}</div>` : '';
  sh.innerHTML = `<div class="scrim" data-act="sheet-close"></div>
    <div class="panel"><div class="grab"></div>
      <h3>${esc(p.name)}</h3>
      <div class="sts big">${['out', 'low', 'ok'].map((k) =>
        `<button class="st ${k} ${z.state === k ? 'on' : ''}" data-act="sstate" data-s="${k}"><i>${stIcon(k)}</i><span>${STATES[k].label}</span></button>`).join('')}</div>
      <div class="lbl">Cantidad <span class="muted">(opcional)</span></div>
      ${chips}
      <div id="qwrap">${qtyWidget(p, z.mode, z.qty)}</div>
      <div class="lbl">Comentario <span class="muted">(opcional)</span></div>
      <textarea id="note" rows="2" placeholder="Ej.: se acaba para el almuerzo" data-field="note">${esc(z.note)}</textarea>
      <div class="row"><button class="btn ghost" data-act="sheet-close">Cancelar</button>
      <button class="btn primary" data-act="sheet-save">Guardar</button></div>
    </div>`;
  sh.classList.add('open');
}
const unitName = (p, m) => {
  const mm = MODES[m];
  if (mm.kind === 'bar') { const u = (p.units && p.units[m]) || 'cantidad'; return `barra ${/^de /.test(u) ? u : 'de ' + u}`; }
  if (mm.kind === 'yn') return 'hay / no hay';
  if (mm.kind === 'lvl') return 'poco / regular / sí hay';
  return unitOf(p, m);
};
function suggestState(mode, qty, cur) {
  const m = MODES[mode]; if (qty === null || !m) return cur;
  let s = null;
  if (m.kind === 'bar') s = qty === 0 ? 'out' : qty <= (m.max === 1 ? 0.5 : 1) ? 'low' : null;
  else if (m.kind === 'yn') s = qty === 0 ? 'out' : null;
  else if (m.kind === 'lvl') s = qty === 0 ? 'low' : null;
  else s = qty === 0 ? 'out' : null;
  if (s === 'out' && cur !== 'out') return 'out';
  if (s === 'low' && cur === 'ok') return 'low';
  return cur;
}
function setQty(v) {
  const z = S.sheet; z.qty = v;
  z.state = suggestState(z.mode, v, z.state);
  renderSheet();
}

/* ---------- Producción: Para hoy ---------- */
const sevRank = (s) => (s === 'out' ? 0 : s === 'low' ? 1 : 2);
const bySeverity = (a, b) => sevRank(stateOf(a.id)) - sevRank(stateOf(b.id)) || (getSt(a.id).since || 0) - (getSt(b.id).since || 0);
function todayItems() {
  return prodList().filter((p) => needsSend(p) && !isSent(getSt(p.id))).sort(bySeverity);
}
function prepBlock(p) {
  const pr = PREP[PREP_OF[p.id]]; if (!pr) return '';
  return `<div class="prep"><b>${esc(pr.verb)}</b>${pr.items.length ? `<div class="chips">${pr.items.map((i) => `<span>${esc(i)}</span>`).join('')}</div>` : ''}</div>`;
}
function tagOf(p) { return `<span class="tag">${esc(OWNERS[p.owner] || p.owner)}</span>`; }

// Último sobrante anotado de cada producto que solo se cuenta al final (quinua, aguas).
function latestLeftovers() {
  const out = [];
  const keys = Object.keys(S.counts).filter((k) => k.endsWith('_p1')).sort().reverse();
  prodList().filter((p) => p.leftOnly).forEach((p) => {
    for (const k of keys) {
      const it = (S.counts[k].items || {})[p.id];
      if (it && it.left !== null && it.left !== undefined) { out.push({ p, it, date: S.counts[k].date }); break; }
    }
  });
  return out;
}
const dateAgo = (d) => { const n = Math.round((Date.parse(dayKey()) - Date.parse(d)) / 86400000); return n <= 0 ? 'hoy' : n === 1 ? 'ayer' : `hace ${n} días`; };

function hoyView() {
  if (!S.loaded.status) return '<p class="muted pad">Cargando…</p>';
  const items = todayItems(); const sent = sentToday();
  const okCount = prodList().filter((p) => p.owner !== 'prod' && (p.camino === 'A' || p.camino === 'B')).length - items.length - sent.length;
  const left = latestLeftovers();
  return `${items.length
    ? `<div class="lead"><b>${items.length}</b><span>${items.length === 1 ? 'cosa' : 'cosas'} para preparar y enviar</span></div>`
    : `<div class="lead ok"><b>${ico('check', 24)}</b><span><strong>Todo al día</strong><small>Nada que preparar por ahora</small></span></div>`}
    ${items.map((p) => {
    const st = getSt(p.id); const s = st.state;
    return `<div class="card s-${s}"><div class="ct"><div class="nm">${esc(p.name)}</div>${tagOf(p)}
      <span class="pill ${s}">${STATES[s].label}</span></div>
      ${noteBlock(st)}
      <div class="sb">${detailLine(p, st, false)}${st.since ? ` · desde ${ago(st.since)}` : ''}</div>
      ${p.camino === 'B' ? '<div class="note-b">Lo prepara la señora Elisa. Tú lo envías ya hecho.</div>' : ''}
      ${prepBlock(p)}
      <button class="btn done-btn" data-act="sent" data-id="${p.id}">${ico('box', 22)} Ya envié</button></div>`;
  }).join('')}
    ${sent.length ? `<h2 class="sec">Ya enviado hoy</h2>${sent.map((p) => {
    const st = getSt(p.id);
    return `<div class="card slim bought"><div class="ct"><div class="nm">${esc(p.name)}</div>${tagOf(p)}
      <span class="pill ok">${ico('box', 14)} ${hhmm(st.sentAt)}</span></div>
      <button class="link" data-act="unsent" data-id="${p.id}">No lo envié (deshacer)</button></div>`;
  }).join('')}` : ''}
    ${left.length ? `<h2 class="sec">Lo que sobró en el puesto (aprox.)</h2><div class="card slim">${left.map(({ p, it, date }) =>
    `<div class="lrow"><span>${esc(p.name)}</span><b>${esc(fmtQty(p, { mode: it.leftMode, qty: it.left }))}</b><small>${dateAgo(date)}</small></div>`).join('')}</div>` : ''}
    <p class="muted small pad">${Math.max(okCount, 0)} producto(s) del puesto están en verde.</p>`;
}

/* ---------- Avisos (Puesto y Adquisición) ---------- */
function avisosView() {
  if (!S.loaded.status) return '<p class="muted pad">Cargando…</p>';
  const od = overdueItems(); const sent = sentToday();
  const dl = String(S.config.sendDeadline || '07:00');
  return `<div class="lead"><b>${od.length}</b> ${od.length === 1 ? 'cosa sin enviar' : 'cosas sin enviar'}</div>
    <div class="hint pad-s">Lo que se pidió ayer y Producción no envió a las ${esc(dl)}.</div>
    ${od.map((p) => {
    const st = getSt(p.id);
    return `<div class="card s-out"><div class="ct"><div class="nm">${esc(p.name)}</div>${tagOf(p)}
      <span class="pill out">${ico('alert', 14)} Sin enviar</span></div>
      ${noteBlock(st)}
      <div class="sb">${detailLine(p, st, false)}${st.since ? ` · pedido ${ago(st.since)}` : ''}</div></div>`;
  }).join('') || '<p class="muted pad">Nada pendiente. Todo lo pedido se envió o todavía está a tiempo.</p>'}
    ${sent.length ? `<h2 class="sec">Producción ya envió hoy</h2>${sent.map((p) => {
    const st = getSt(p.id);
    return `<div class="card slim bought"><div class="ct"><div class="nm">${esc(p.name)}</div>${tagOf(p)}
      <span class="pill ok">${ico('box', 14)} ${hhmm(st.sentAt)}</span></div>
      ${!isAdmin() ? '<div class="hint">Confírmalo en Reporte con “Sí hay” cuando llegue.</div>' : ''}</div>`;
  }).join('')}` : ''}`;
}

/* ---------- Adquisición: Por comprar / Por preparar ---------- */
function buyItems() {
  const all = prodList().filter((p) => stateOf(p.id) !== 'ok');
  const mine = all.filter((p) => p.owner === 'prod' || ['C', 'D', 'E'].includes(p.camino));
  const sort = (a, b) => sevRank(stateOf(a.id)) - sevRank(stateOf(b.id)) || (getSt(a.id).since || 0) - (getSt(b.id).since || 0);
  const flt = (p) => S.ownerFilter === 'all' || p.owner === S.ownerFilter;
  return {
    todo: mine.filter((p) => !isBought(getSt(p.id))).filter(flt).sort(sort),
    done: mine.filter((p) => isBought(getSt(p.id))).filter(flt),
    info: all.filter((p) => p.owner !== 'prod' && p.camino === 'A').filter(flt).sort(sort),
  };
}
function prepItems() {
  return prodList().filter((p) => p.camino === 'B' && p.owner !== 'prod' && stateOf(p.id) !== 'ok' && !isBought(getSt(p.id)));
}
function buyCard(p, label) {
  const st = getSt(p.id); const s = st.state; const iv = avgInterval(st);
  const last = (st.buyDates || []).slice(-1)[0];
  return `<div class="card s-${s}"><div class="ct"><div class="nm">${esc(p.name)}</div>${tagOf(p)}
    <span class="pill ${s}">${STATES[s].label}</span></div>
    ${noteBlock(st)}
    <div class="sb">${detailLine(p, st, false) || ''}</div>
    <div class="meta">${st.since ? `En ${s === 'out' ? 'falta' : 'poco'} ${ago(st.since)}.` : ''}
      ${last ? ` Última ${label === 'Comprado' ? 'compra' : 'vez'}: ${ago(last)}.` : ''}${iv ? ` Suele ser cada ~${iv} días.` : ''}</div>
    <button class="btn done-btn" data-act="bought" data-id="${p.id}">✔ ${label}</button></div>`;
}
function ownerChips() {
  const opts = [['all', 'Todos'], ['p1', 'Puesto 1'], ['p2', 'Puesto 2'], ['prod', 'Producción']];
  return `<div class="chipsrow">${opts.map(([k, l]) =>
    `<button class="fchip ${S.ownerFilter === k ? 'on' : ''}" data-act="ofilter" data-o="${k}">${l}</button>`).join('')}</div>`;
}
function reportsLine() {
  const today = dayKey();
  const bits = ['p1', 'p2'].map((o) => {
    const r = Object.values(S.reports).filter((x) => x.owner === o && x.date === today).sort((a, b) => b.at - a.at)[0];
    return r ? `${OWNERS[o]}: reportó a las ${hhmm(r.at)}` : null;
  }).filter(Boolean);
  return bits.length ? `<div class="done">${ico('check', 18)} ${bits.join(' · ')}</div>` : '<div class="hint pad-s">Hoy todavía nadie terminó su reporte.</div>';
}
function comprarView() {
  if (!S.loaded.status) return '<p class="muted pad">Cargando…</p>';
  const { todo, done, info } = buyItems();
  return `${reportsLine()}${ownerChips()}
    <div class="lead"><b>${todo.length}</b> por comprar</div>
    ${todo.map((p) => buyCard(p, 'Comprado')).join('') || '<p class="muted pad">Nada por comprar.</p>'}
    ${info.length ? `<h2 class="sec">Lo prepara Producción (solo aviso)</h2>${info.map((p) => {
    const st = getSt(p.id);
    return `<div class="card slim s-${st.state}"><div class="ct"><div class="nm">${esc(p.name)}</div>${tagOf(p)}<span class="pill ${st.state}">${STATES[st.state].label}</span></div>${noteBlock(st)}<div class="sb">${detailLine(p, st, false)}</div></div>`;
  }).join('')}` : ''}
    ${done.length ? `<h2 class="sec">Comprado, esperando que lo confirmen</h2>${done.map((p) => {
    const st = getSt(p.id);
    return `<div class="card slim bought"><div class="ct"><div class="nm">${esc(p.name)}</div>${tagOf(p)}<span class="pill ok">✔ ${ago(st.boughtAt)}</span></div></div>`;
  }).join('')}` : ''}`;
}
function prepararView() {
  const items = prepItems();
  return `<div class="lead"><b>${items.length}</b> por preparar</div>
    ${items.map((p) => {
    const pr = PREP[PREP_OF[p.id]];
    return `${buyCard(p, 'Preparado')}${p.id === 'pollo' ? `<div class="prep standalone"><b>Para el pollo:</b>
      <div class="chips">${['Pechugas', 'Kion', 'Sal'].map((i) => `<span>${i}</span>`).join('')}</div>
      <div class="hint">Si falta alguno, anótalo en “Comprar” desde Producción o cómpralo directo.</div></div>` : (pr ? '' : '')}`;
  }).join('') || '<p class="muted pad">Nada por preparar.</p>'}`;
}

/* ---------- Llegadas: conteo de empanadas, pan y sobrantes ---------- */
function countsDoc(owner, date) { return S.counts[`${date}_${owner}`] || { items: {} }; }
function stepperCnt(pid, field, val, owner, cls = '') {
  return `<div class="stepper mini ${cls}"><button data-act="cnt" data-pid="${pid}" data-f="${field}" data-d="-1" data-o="${owner}" aria-label="menos">−</button>
    <input inputmode="numeric" data-field="cnt" data-pid="${pid}" data-f="${field}" data-o="${owner}" placeholder="—" value="${val ?? ''}">
    <button data-act="cnt" data-pid="${pid}" data-f="${field}" data-d="1" data-o="${owner}" aria-label="más">+</button></div>`;
}
const shortName = (n) => n.replace(/^Empanada (de )?/i, '').replace(/^./, (c) => c.toUpperCase());
const COUNT_TITLES = { Empanadas: 'Empanadas, salteñas y papa rellena', 'Sándwiches': 'Pan' };

function countRow(p, owner, doc, today) {
  const it = (doc.items || {})[p.id] || {};
  const exp = expectedFor(p, today); const open = !!S.cntOpen[p.id];
  let llego;
  if (exp !== null) {
    const diff = it.arrived !== null && it.arrived !== undefined && it.arrived !== exp;
    llego = `<div class="llw">${it.arrived === null || it.arrived === undefined
      ? `<button class="ll" data-act="arrive-ok" data-pid="${p.id}" data-o="${owner}">${ico('check', 16)} Llegó</button>`
      : `<button class="ll on ${diff ? 'diff' : ''}" data-act="arrive-edit" data-pid="${p.id}">${it.arrived}${diff ? `<small>/${exp}</small>` : ''}</button>`}
      <button class="ex ${open ? 'on' : ''}" data-act="arrive-edit" data-pid="${p.id}" aria-label="Ajustar cantidad">${ico('down', 18)}</button></div>`;
  } else {
    llego = stepperCnt(p.id, 'arrived', it.arrived, owner);
  }
  const who = it.at ? `<div class="who">${esc((it.byName || '').split(' ')[0])}, ${hhmm(it.at)}</div>` : '';
  return `<div class="crow2"><div class="cn"><b>${esc(shortName(p.name))}</b>${exp !== null ? `<small>llegan ${exp}</small>` : ''}</div>
    ${llego}${stepperCnt(p.id, 'left', it.left, owner, 'orange')}</div>
    ${open && exp !== null ? `<div class="cadj"><span>Llegaron:</span>${stepperCnt(p.id, 'arrived', it.arrived ?? exp, owner)}
      <button class="link" data-act="arrive-reset" data-pid="${p.id}" data-o="${owner}">Quitar</button></div>` : ''}${who}`;
}

function conteoView() {
  if (!S.loaded.products) return '<p class="muted pad">Cargando…</p>';
  const owner = isAdmin() ? S.countOwner : myOwner();
  const today = dayKey(); const doc = countsDoc(owner, today);
  const all = prodList().filter((p) => p.owner === owner);
  const counted = all.filter((p) => p.count);
  const groups = {};
  counted.forEach((p) => { (groups[p.section] = groups[p.section] || []).push(p); });
  const leftOnly = all.filter((p) => p.leftOnly);
  const pendingAll = counted.filter((p) => {
    const it = (doc.items || {})[p.id] || {};
    return expectedFor(p, today) !== null && (it.arrived === null || it.arrived === undefined);
  });
  const table = (title, items) => `<h2 class="sec">${esc(title)}</h2>
    <div class="ctable"><div class="chead"><span>Producto</span><span>Llegó</span><span class="o">Sobró</span></div>
    ${items.map((p) => countRow(p, owner, doc, today)).join('')}</div>`;
  const leftTable = leftOnly.length ? `<h2 class="sec">Desayuno y aguas: lo que sobró <span class="muted">(aprox.)</span></h2>
    <div class="ctable">${leftOnly.map((p) => {
    const it = (doc.items || {})[p.id] || {};
    const v = it.left !== null && it.left !== undefined ? fmtQty(p, { mode: it.leftMode, qty: it.left }) : '';
    return `<div class="crow2 one"><div class="cn"><b>${esc(p.name)}</b></div>
      <button class="sob ${v ? 'on' : ''}" data-act="left-open" data-pid="${p.id}" data-o="${owner}">${v ? esc(v) : 'Anotar sobrante'}</button></div>`;
  }).join('')}</div>` : '';
  const days = [...new Set(Object.keys(S.counts).map((k) => k.split('_')[0]))].sort().reverse().slice(0, 7);
  const hist = isAdmin() ? `<h2 class="sec">Días anteriores</h2>${days.filter((d) => d !== today).map((d) => {
    const dd = countsDoc(owner, d);
    const its = Object.entries(dd.items || {}).filter(([, v]) => (v.arrived !== null && v.arrived !== undefined) || (v.left !== null && v.left !== undefined));
    if (!its.length) return '';
    return `<div class="card slim"><div class="ct"><div class="nm">${d}</div></div><div class="sb">${its.map(([pid, v]) => {
      const pr = S.products[pid] || {}; const e = expectedFor({ ...pr }, d);
      const left = v.left !== null && v.left !== undefined ? (pr.leftOnly ? fmtQty({ ...pr, id: pid }, { mode: v.leftMode, qty: v.left }) : v.left) : '—';
      return `${esc(pr.name || pid)}: ${pr.leftOnly ? '' : `llegó ${v.arrived ?? '—'}${e !== null && v.arrived !== e && v.arrived !== undefined && v.arrived !== null ? ` (esperado ${e})` : ''}, `}sobró ${left}`;
    }).join('<br>')}</div></div>`;
  }).join('') || '<p class="muted pad">Todavía no hay días anteriores.</p>'}` : '';
  return `${isAdmin() ? `<div class="chipsrow">${['p1', 'p2'].map((o) =>
    `<button class="fchip ${S.countOwner === o ? 'on' : ''}" data-act="cowner" data-o="${o}">${OWNERS[o]}</button>`).join('')}</div>` : ''}
    <div class="lead">Hoy, ${today}</div>
    ${pendingAll.length ? `<div class="pad-s"><button class="btn primary xl" data-act="arrive-all" data-o="${owner}">${ico('check', 22)} Llegó todo lo de hoy</button>
      <p class="hint">Si algo llegó de menos o de más, toca la flecha de ese producto.</p></div>` : ''}
    ${Object.keys(groups).map((g) => table(COUNT_TITLES[g] || g, groups[g])).join('') || '<p class="muted pad">No hay productos con conteo.</p>'}
    ${leftTable}
    ${hist}`;
}
// Guarda cambios del conteo de hoy: patches = { productId: { campo: valor } }
async function saveCountMany(owner, patches) {
  const date = dayKey(); const id = `${date}_${owner}`;
  const cur = S.counts[id] || { date, owner, items: {} };
  const items = { ...cur.items }; const sent = {};
  const meta = { by: S.user.uid, byName: S.me.name || '', at: B.now() };
  Object.entries(patches).forEach(([pid, patch]) => {
    items[pid] = { ...(items[pid] || {}), ...patch, ...meta };
    sent[pid] = { ...patch, ...meta };
  });
  S.counts[id] = { ...cur, date, owner, items };
  render();
  try { await B.set('counts/' + id, { date, owner, items: sent }); } catch (e) { toast('No se pudo guardar el conteo.'); }
}
const saveCountItem = (owner, pid, patch) => saveCountMany(owner, { [pid]: patch });

/* ---------- Personas ---------- */
function personasView() {
  const us = Object.entries(S.users).map(([uid, u]) => ({ ...u, uid }))
    .sort((a, b) => (a.role === 'pending' ? -1 : 1) - (b.role === 'pending' ? -1 : 1) || (a.name || '').localeCompare(b.name || ''));
  const opt = (sel) => ['puesto1', 'puesto2', 'produccion'].map((r) =>
    `<option value="${r}" ${sel === r ? 'selected' : ''}>${ROLES[r]}</option>`).join('');
  return `<button class="btn ghost small" data-act="catalogo-back">← Volver</button>
  <div class="lead"><b>${us.filter((u) => u.role === 'pending').length}</b> esperando aprobación</div>
  ${us.map((u) => u.role === 'pending'
    ? `<div class="card pend"><div class="ct"><div class="nm">${esc(u.name)}</div></div><div class="sb">${esc(u.email)}</div>
      <select id="role-${u.uid}" class="sel">${opt('puesto1')}</select>
      <div class="row"><button class="btn danger" data-act="deluser" data-uid="${u.uid}">Rechazar</button>
      <button class="btn primary" data-act="approve" data-uid="${u.uid}">Aprobar</button></div></div>`
    : `<div class="card slim"><div class="ct"><div class="nm">${esc(u.name)}${u.uid === S.user.uid ? ' (tú)' : ''}</div></div>
      <div class="sb">${esc(u.email)}</div>
      ${u.role === 'admin' ? `<div class="tag">${ROLES.admin}</div>` : `<select class="sel" data-field="role" data-uid="${u.uid}">${opt(u.role)}</select>
      <button class="btn danger small" data-act="deluser" data-uid="${u.uid}">Borrar cuenta</button>`}</div>`).join('')}`;
}

/* ---------- Más: ajustes ---------- */
function ajustesView() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const pushTxt = { granted: '✅ Avisos activados en este celular', denied: '🚫 Bloqueados. Actívalos en los ajustes del celular para esta app.', default: 'Todavía no activados', unsupported: ios ? 'En iPhone solo funcionan desde la app agregada a la pantalla de inicio (iOS 16.4 o más).' : 'Este navegador no permite avisos.', unknown: '…' }[S.push];
  return `<div class="card slim"><div class="nm">${esc(S.me.name)}</div><div class="sb">${esc(S.me.email)} · ${esc(ROLES[S.me.role])}</div></div>
  <h2 class="sec">Letra</h2>
  <div class="seg">${[['Normal', 0], ['Grande', 1], ['Muy grande', 2]].map(([l, v]) =>
    `<button class="${S.font === v ? 'on' : ''}" data-act="font" data-v="${v}">${l}</button>`).join('')}</div>
  <h2 class="sec">Tema</h2>
  <div class="seg">${[['Automático', 'auto'], ['Claro', 'light'], ['Oscuro', 'dark']].map(([l, v]) =>
    `<button class="${S.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}">${l}</button>`).join('')}</div>
  <h2 class="sec">Avisos</h2>
  <div class="card slim"><div class="sb">${pushTxt}</div>
    ${S.push === 'default' ? '<button class="btn primary" data-act="push">Activar avisos</button>' : ''}
    <button class="btn ghost" data-act="testalarm">${ico('bell', 20)} Probar aviso</button>
    <label class="chk"><input type="checkbox" data-field="sound" ${S.sound ? 'checked' : ''}> Sonido dentro de la app</label></div>
  ${S.deferredInstall ? '<h2 class="sec">Instalar</h2><button class="btn primary" data-act="install">Instalar la app en este celular</button>' : ''}
  ${isAdmin() ? `<h2 class="sec">Administración</h2>
    <div class="card slim"><label class="lbl">Teléfono de la señora Elisa (para el botón “Llamar”)</label>
      <input id="phone" type="tel" inputmode="tel" class="inp" value="${esc(S.config.adminPhone || '')}" placeholder="9XXXXXXXX">
      <button class="btn small primary" data-act="savephone">Guardar teléfono</button></div>
    <div class="card slim"><label class="lbl">Hora límite para que Producción envíe (si no, sale en Avisos)</label>
      <input id="deadline" type="time" class="inp" value="${esc(S.config.sendDeadline || '07:00')}">
      <button class="btn small primary" data-act="savedeadline">Guardar hora</button></div>
    <button class="btn ghost" data-act="personas">${ico('users', 20)} Personas${Object.values(S.users).filter((u) => u.role === 'pending').length ? ` (${Object.values(S.users).filter((u) => u.role === 'pending').length} por aprobar)` : ''}</button>
    <button class="btn ghost" data-act="catalogo">Catálogo de productos</button>` : ''}
  <div class="pad"><button class="btn ghost" data-act="signout">Cerrar sesión</button></div>
  <p class="muted small pad">Versión 1</p>`;
}

/* ---------- Catálogo (solo Elisa) ---------- */
function catalogoView() {
  const all = Object.entries(S.products).map(([id, p]) => ({ ...p, id }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const groups = {};
  all.forEach((p) => { const k = `${OWNERS[p.owner] || p.owner} · ${p.section}`; (groups[k] = groups[k] || []).push(p); });
  return `<button class="btn ghost small" data-act="catalogo-back">← Volver</button>
  <div class="lead">Catálogo</div>
  <button class="btn primary" data-act="pnew">+ Agregar producto</button>
  ${Object.keys(groups).map((g) => `<h2 class="sec">${esc(g)}</h2>${groups[g].map((p) =>
    `<div class="card slim ${p.active === false ? 'off' : ''}" data-act="pedit" data-id="${p.id}"><div class="ct"><div class="nm">${esc(p.name)}</div>
      <span class="tag">Camino ${esc(p.camino)}</span>${p.early ? '<span class="tag">aviso temprano</span>' : ''}${p.active === false ? '<span class="tag">oculto</span>' : ''}</div></div>`).join('')}`).join('')}`;
}
const expVal = (p, k) => {
  const e = p.expected; if (e === null || e === undefined) return '';
  return typeof e === 'number' ? e : (e[k] ?? '');
};
function openProductForm(id) {
  const p = id ? { ...S.products[id], id } : { id: '', name: '', section: 'Sándwiches', owner: 'p1', camino: 'C', modes: ['un'], units: {}, early: false, active: true };
  S.sheet = { form: true, p };
  const sh = $('#sheet');
  const sel = (arr, cur) => arr.map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const secs = [...new Set([...SECTIONS, ...Object.values(S.products).map((x) => x.section)])];
  sh.innerHTML = `<div class="scrim" data-act="sheet-close"></div><div class="panel"><div class="grab"></div>
    <h3>${id ? 'Editar producto' : 'Nuevo producto'}</h3>
    <label class="lbl">Nombre</label><input id="f-name" class="inp" value="${esc(p.name)}">
    <label class="lbl">Dueño</label><select id="f-owner" class="sel">${sel(Object.entries(OWNERS), p.owner)}</select>
    <label class="lbl">Sección</label><select id="f-section" class="sel">${sel(secs.map((s) => [s, s]), p.section)}</select>
    <label class="lbl">Camino</label><select id="f-camino" class="sel">${sel([['A', 'A · Lo prepara Producción'], ['B', 'B · Lo prepara Elisa, Producción lo envía'], ['C', 'C · Elisa se encarga de todo'], ['D', 'D · Proveedor'], ['E', 'E · Lo recogen los trabajadores']], p.camino)}</select>
    <label class="lbl">Forma principal de medir</label><select id="f-mode" class="sel">${sel(Object.entries(MODES).map(([k, m]) => [k, m.name]), p.modes[0])}</select>
    <label class="lbl">Texto de la unidad <span class="muted">(opcional, ej. latas)</span></label><input id="f-unit" class="inp" value="${esc((p.units || {})[p.modes[0]] || '')}">
    <label class="lbl">Cantidad que llega cada día <span class="muted">(opcional, para Llegadas)</span></label>
    <div class="exp3"><label>Lun a vie<input id="f-elv" type="number" inputmode="numeric" class="inp" value="${esc(expVal(p, 'lv'))}"></label>
      <label>Sábado<input id="f-esab" type="number" inputmode="numeric" class="inp" value="${esc(expVal(p, 'sab'))}"></label>
      <label>Domingo<input id="f-edom" type="number" inputmode="numeric" class="inp" value="${esc(expVal(p, 'dom'))}"></label></div>
    <label class="chk"><input type="checkbox" id="f-count" ${p.count ? 'checked' : ''}> Se cuenta en Llegadas (llegó / sobró)</label>
    <label class="chk"><input type="checkbox" id="f-inrep" ${p.noReport ? '' : 'checked'}> Aparece en Reporte (Falta / Hay poco / Sí hay)</label>
    <label class="chk"><input type="checkbox" id="f-early" ${p.early ? 'checked' : ''}> Aviso temprano (avisa también cuando hay poco)</label>
    <label class="chk"><input type="checkbox" id="f-active" ${p.active !== false ? 'checked' : ''}> Visible</label>
    <div class="row"><button class="btn ghost" data-act="sheet-close">Cancelar</button><button class="btn primary" data-act="psave" data-id="${esc(id)}">Guardar</button></div></div>`;
  sh.classList.add('open');
}
function readExpected() {
  const g = (i) => { const v = $(i).value.trim(); return v === '' ? null : Math.max(0, parseInt(v, 10) || 0); };
  const e = { lv: g('#f-elv'), sab: g('#f-esab'), dom: g('#f-edom') };
  if (e.lv === null && e.sab === null && e.dom === null) return null;
  Object.keys(e).forEach((k) => { if (e[k] === null) delete e[k]; });
  return e;
}
async function saveProductForm(id) {
  const name = $('#f-name').value.trim(); if (!name) { toast('Escribe el nombre'); return; }
  const mode = $('#f-mode').value; const unit = $('#f-unit').value.trim();
  const old = id ? S.products[id] : null;
  const modes = [mode, ...((old && old.modes) || []).filter((m) => m !== mode)];
  const units = { ...((old && old.units) || {}) }; if (unit) units[mode] = unit; else delete units[mode];
  const pid = id || ('x' + Date.now().toString(36));
  const maxOrder = Math.max(0, ...Object.values(S.products).map((x) => x.order ?? 0));
  const data = {
    name, owner: $('#f-owner').value, section: $('#f-section').value, camino: $('#f-camino').value,
    modes, units, early: $('#f-early').checked, active: $('#f-active').checked,
    count: $('#f-count').checked, noReport: !$('#f-inrep').checked, expected: readExpected(),
    order: old ? (old.order ?? maxOrder + 1) : maxOrder + 1,
  };
  closeSheet();
  try { await B.set('products/' + pid, data); toast('Producto guardado'); } catch (e) { toast('No se pudo guardar.'); }
}

/* ============================== notificaciones ============================== */
async function refreshPush(silent = true) {
  S.push = await B.pushStatus();
  if (S.push === 'granted' && S.me && S.me.role !== 'pending') await registerToken();
  render();
}
async function registerToken() {
  try {
    const t = await B.enablePush();
    if (t && !['unsupported', 'denied', 'default', 'error'].includes(t)) {
      const cur = (S.me.tokens || []).filter((x) => x !== t);
      if (!(S.me.tokens || []).includes(t)) await B.set('users/' + S.user.uid, { tokens: [...cur, t].slice(-5) });
    }
  } catch (e) { console.warn('token', e); }
}
async function turnOnPush() {
  const t = await B.enablePush();
  S.push = await B.pushStatus();
  if (t && !['unsupported', 'denied', 'default', 'error'].includes(t)) {
    const cur = (S.me.tokens || []).filter((x) => x !== t);
    await B.set('users/' + S.user.uid, { tokens: [...cur, t].slice(-5) });
    toast('Avisos activados');
  } else if (t === 'denied') toast('Los avisos quedaron bloqueados.');
  render();
}

/* ================================== tema ================================== */
const mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function applyTheme() {
  const dark = S.theme === 'dark' || (S.theme === 'auto' && mqDark && mqDark.matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', dark ? '#14181A' : '#F6F3EE');
}
if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', () => { if (S.theme === 'auto') applyTheme(); });

/* ============================ probar el aviso ============================ */
async function testAlarm() {
  beep(true);
  try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) { /* sin vibración */ }
  if (!('Notification' in window)) { toast('Este navegador no permite avisos del sistema.'); return; }
  if (Notification.permission === 'default') await turnOnPush();
  if (Notification.permission !== 'granted') { toast('Los avisos están bloqueados. Actívalos en los ajustes del celular.'); return; }
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Aviso de prueba', {
      body: 'Así suena y vibra un aviso. Si no lo escuchaste, sube el volumen de notificaciones del celular.',
      icon: 'icon-192.png', badge: 'icon-192.png', tag: 'prueba', renotify: true,
      vibrate: [300, 150, 300, 150, 300], data: { url: './' },
    });
    toast('Aviso enviado. Mira la barra de notificaciones.');
  } catch (e) { toast('No se pudo mostrar el aviso de prueba.'); }
}

/* ================================== letra ================================== */
function applyFont() {
  document.documentElement.style.setProperty('--fs', ['16px', '19px', '22px'][S.font] || '19px');
}

/* ================================== eventos ================================== */
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act;
  switch (a) {
    case 'signin': B.signIn(); break;
    case 'signout': S.tab = null; S.sub = null; await B.signOut(); break;
    case 'tab': S.tab = t.dataset.tab; S.sub = null; window.scrollTo(0, 0); render(); break;
    case 'call': {
      const n = (S.config.adminPhone || '').replace(/[^\d+]/g, '');
      if (n) location.href = 'tel:' + n; else toast('Falta el teléfono de la señora Elisa (ella lo guarda en Más).');
      break;
    }
    case 'state': {
      const p = S.products[t.dataset.id]; if (!p) break;
      const s = t.dataset.s; const cur = stateOf(t.dataset.id);
      await saveStatus({ ...p, id: t.dataset.id }, { state: s });
      if (s !== 'ok' && cur === 'ok') toast('Anotado. Toca el nombre si quieres agregar cantidad o comentario.');
      break;
    }
    case 'open': openSheet(t.dataset.id); break;
    case 'sheet-close': closeSheet(); break;
    case 'sstate': S.sheet.state = t.dataset.s; renderSheet(); break;
    case 'mode': S.sheet.mode = t.dataset.m; S.sheet.qty = null; renderSheet(); break;
    case 'qstep': {
      const z = S.sheet; const m = MODES[z.mode];
      const step = m.step || 1; const cur = z.qty === null ? 0 : +z.qty;
      setQty(Math.max(0, Math.round((cur + step * +t.dataset.d) * 100) / 100)); break;
    }
    case 'qset': setQty(+t.dataset.v === S.sheet.qty ? null : +t.dataset.v); break;
    case 'qclear': setQty(null); break;
    case 'sheet-save': {
      const z = S.sheet;
      if (z.left) {
        const { owner, id, qty, mode } = z; closeSheet();
        await saveCountItem(owner, id, { left: qty, leftMode: qty === null ? null : mode }); break;
      }
      z.note = ($('#note') || { value: z.note }).value.trim();
      const patch = { state: z.state, mode: z.qty === null ? null : z.mode, qty: z.qty, note: z.note };
      closeSheet(); await saveStatus(z.p, patch); break;
    }
    case 'finish': {
      const owner = t.dataset.owner; const now = B.now();
      const id = `${dayKey()}_${owner}_${now}`;
      S.reports[id] = { owner, date: dayKey(), at: now, by: S.user.uid, byName: S.me.name || '' };
      render(); toast('Reporte enviado. ¡Gracias!');
      B.set('reports/' + id, S.reports[id]).catch(() => toast('No se pudo enviar. Se reintenta al volver el internet.'));
      break;
    }
    case 'ofilter': S.ownerFilter = t.dataset.o; render(); break;
    case 'cowner': S.countOwner = t.dataset.o; render(); break;
    case 'bought': {
      const id = t.dataset.id; const st = getSt(id); const prev = { boughtAt: st.boughtAt || null, buyDates: st.buyDates || [] };
      const now = B.now();
      const d = { boughtAt: now, buyDates: [...prev.buyDates, now].slice(-12) };
      S.status[id] = { ...st, ...d }; render();
      B.set('status/' + id, d).catch(() => toast('No se pudo guardar.'));
      toast('Marcado ✔', false, { label: 'Deshacer', fn: () => { S.status[id] = { ...S.status[id], ...prev }; render(); B.set('status/' + id, prev); } });
      break;
    }
    case 'toast-action': if (toast.action) toast.action.fn(); $('#toast').classList.remove('show'); break;
    case 'cnt': {
      const { pid, f, o } = t.dataset; const it = ((countsDoc(o, dayKey()).items || {})[pid]) || {};
      const exp = expectedFor(S.products[pid] || {}, dayKey());
      const cur = it[f] != null ? +it[f] : (f === 'arrived' && exp !== null ? exp : 0);
      saveCountItem(o, pid, { [f]: Math.max(0, cur + +t.dataset.d) }); break;
    }
    case 'arrive-ok': {
      const exp = expectedFor(S.products[t.dataset.pid] || {}, dayKey());
      if (exp !== null) saveCountItem(t.dataset.o, t.dataset.pid, { arrived: exp });
      break;
    }
    case 'arrive-edit': S.cntOpen[t.dataset.pid] = !S.cntOpen[t.dataset.pid]; render(); break;
    case 'arrive-reset': saveCountItem(t.dataset.o, t.dataset.pid, { arrived: null }); break;
    case 'arrive-all': {
      const o = t.dataset.o; const today = dayKey(); const doc = countsDoc(o, today); const patches = {};
      prodList().filter((p) => p.owner === o && p.count).forEach((p) => {
        const exp = expectedFor(p, today); const it = (doc.items || {})[p.id] || {};
        if (exp !== null && (it.arrived === null || it.arrived === undefined)) patches[p.id] = { arrived: exp };
      });
      if (Object.keys(patches).length) { await saveCountMany(o, patches); toast('Anotado: llegó todo lo esperado ✓'); }
      break;
    }
    case 'left-open': {
      const p = S.products[t.dataset.pid]; if (!p) break;
      const it = ((countsDoc(t.dataset.o, dayKey()).items || {})[t.dataset.pid]) || {};
      S.sheet = { left: true, owner: t.dataset.o, id: t.dataset.pid, p: { ...p, id: t.dataset.pid },
        mode: it.leftMode || p.modes[0], qty: it.left ?? null, state: 'ok' };
      renderSheet(); break;
    }
    case 'sec': S.open[t.dataset.sec] = !S.open[t.dataset.sec]; render(); break;
    case 'sent': {
      const id = t.dataset.id; const st = getSt(id); const now = B.now();
      const prev = { sentAt: st.sentAt || null, sentBy: st.sentBy || null, sentByName: st.sentByName || null };
      const d = { sentAt: now, sentBy: S.user.uid, sentByName: S.me.name || '' };
      S.status[id] = { ...st, ...d }; render();
      B.set('status/' + id, d).catch(() => toast('No se pudo guardar.'));
      toast('Enviado ✓', false, { label: 'Deshacer', fn: () => { S.status[id] = { ...S.status[id], ...prev }; render(); B.set('status/' + id, prev); } });
      break;
    }
    case 'unsent': {
      const id = t.dataset.id; const prev = { sentAt: null, sentBy: null, sentByName: null };
      S.status[id] = { ...getSt(id), ...prev }; render(); B.set('status/' + id, prev); break;
    }
    case 'personas': S.sub = 'personas'; render(); break;
    case 'savedeadline': await B.set('config/app', { sendDeadline: $('#deadline').value || '07:00' }); toast('Hora guardada'); break;
    case 'approve': {
      const uid = t.dataset.uid; const r = document.getElementById('role-' + uid).value;
      await B.set('users/' + uid, { role: r, approvedAt: B.now() }); toast('Cuenta aprobada'); break;
    }
    case 'deluser':
      if (confirm('¿Borrar esta cuenta? Perderá el acceso al instante.')) { await B.del('users/' + t.dataset.uid); toast('Cuenta borrada'); }
      break;
    case 'font': S.font = +t.dataset.v; store.set('font', S.font); applyFont(); render(); break;
    case 'theme': S.theme = t.dataset.v; store.set('theme', S.theme); applyTheme(); render(); break;
    case 'testalarm': await testAlarm(); break;
    case 'push': await turnOnPush(); break;
    case 'install': S.deferredInstall.prompt(); S.deferredInstall = null; render(); break;
    case 'savephone': await B.set('config/app', { adminPhone: $('#phone').value.trim() }); toast('Teléfono guardado'); break;
    case 'catalogo': S.sub = 'catalogo'; render(); break;
    case 'catalogo-back': S.sub = null; render(); break;
    case 'pedit': openProductForm(t.dataset.id); break;
    case 'pnew': openProductForm(''); break;
    case 'psave': await saveProductForm(t.dataset.id); break;
    default: break;
  }
});

document.addEventListener('input', (e) => {
  const t = e.target; const f = t.dataset && t.dataset.field; if (!f) return;
  if (f === 'q') { S.q = t.value; render(); }
  else if (f === 'note' && S.sheet) S.sheet.note = t.value;
  else if (f === 'qrange' && S.sheet) {
    const v = +t.value; S.sheet.qty = v;
    S.sheet.state = suggestState(S.sheet.mode, v, S.sheet.state);
    t.classList.remove('untouched');
    const bt = $('.bt'); const p = S.sheet.p; const m = MODES[S.sheet.mode];
    if (bt) bt.innerHTML = `<b>${fracText(v)}</b> ${esc(unitOf(p, S.sheet.mode))}${m.max > 1 ? ` (de ${m.max})` : ''}`;
    $$sts();
  }
});
function $$sts() { // refresca solo los botones de estado de la hoja mientras se mueve la barra
  const z = S.sheet; if (!z || z.form) return;
  document.querySelectorAll('.panel .sts .st').forEach((b) => b.classList.toggle('on', b.dataset.s === z.state));
}
document.addEventListener('change', async (e) => {
  const t = e.target; const f = t.dataset && t.dataset.field; if (!f) return;
  if (f === 'only') { S.only = t.checked; render(); }
  else if (f === 'sound') { S.sound = t.checked; store.set('sound', S.sound); }
  else if (f === 'qin' && S.sheet) {
    const v = t.value.trim().replace(',', '.'); const n = v === '' ? null : Math.max(0, parseFloat(v));
    setQty(Number.isNaN(n) ? null : n);
  } else if (f === 'cnt') {
    const v = t.value.trim(); if (v === '') return;
    saveCountItem(t.dataset.o, t.dataset.pid, { [t.dataset.f]: Math.max(0, parseInt(v, 10) || 0) });
  } else if (f === 'role') {
    await B.set('users/' + t.dataset.uid, { role: t.value }); toast('Perfil cambiado');
  }
});

// Sin menú de "copiar" al mantener presionado (salvo en los campos de texto).
document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input,textarea')) e.preventDefault(); });
// Sin zoom: ni al tocar rápido ni al pellizcar.
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));

boot();
