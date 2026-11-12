// Programador de avisos: lo ejecuta GitHub Actions cada ~5 minutos.
//  1) Manda los avisos inmediatos que los celulares dejaron en la cola "alerts".
//  2) Manda los resúmenes y recordatorios de horario fijo (hora de Lima).
// Necesita el secreto FIREBASE_SERVICE_ACCOUNT (JSON de la cuenta de servicio).
import admin from 'firebase-admin';

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.project_id) { console.log('Todavía no está el secreto FIREBASE_SERVICE_ACCOUNT: no hay nada que hacer.'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const fcm = admin.messaging();

const TZ = 'America/Lima';
const OWNERS = { p1: 'Puesto 1', p2: 'Puesto 2', prod: 'Producción' };
const dayKey = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ });
const nowMs = Date.now();
const today = dayKey(nowMs);
const lima = new Date(new Date(nowMs).toLocaleString('en-US', { timeZone: TZ }));
const minutesNow = lima.getHours() * 60 + lima.getMinutes();
console.log(`Hora en Lima: ${today} ${String(lima.getHours()).padStart(2, '0')}:${String(lima.getMinutes()).padStart(2, '0')}`);

/* ----------------------------- envío ----------------------------- */
async function send(roles, payload, { exceptUid } = {}) {
  // Si un mismo celular quedó guardado en dos cuentas (se usó para probar dos perfiles), el aviso va solo a la última que entró.
  const snap = await db.collection('users').get();
  const owner = new Map();
  snap.forEach((d) => {
    const at = d.data().tokensAt || 0;
    (d.data().tokens || []).forEach((t) => { const cur = owner.get(t); if (!cur || at > cur.at) owner.set(t, { uid: d.id, at }); });
  });
  const entries = [];
  snap.forEach((d) => {
    if (d.id === exceptUid || !roles.includes(d.data().role)) return;
    (d.data().tokens || []).forEach((t) => { if (owner.get(t).uid === d.id) entries.push({ uid: d.id, token: t }); });
  });
  if (!entries.length) { console.log('  (nadie con avisos activados en', roles.join('+'), ')'); return 0; }
  const data = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v ?? '')]));
  const res = await fcm.sendEachForMulticast({
    tokens: entries.map((e) => e.token),
    data,
    webpush: { headers: { Urgency: 'high', TTL: '7200' } },
  });
  // Borra los tokens que ya no sirven.
  const dead = {};
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = (r.error && r.error.code) || '';
      console.log('  fallo de envío:', code);
      if (/registration-token-not-registered|invalid-argument|invalid-registration-token/.test(code)) {
        (dead[entries[i].uid] = dead[entries[i].uid] || []).push(entries[i].token);
      }
    }
  });
  for (const [uid, toks] of Object.entries(dead)) {
    const ref = db.collection('users').doc(uid);
    const cur = (await ref.get()).data() || {};
    await ref.update({ tokens: (cur.tokens || []).filter((t) => !toks.includes(t)) });
  }
  console.log(`  enviado a ${res.successCount}/${entries.length} celulares (${roles.join('+')})`);
  return res.successCount;
}

/* ------------------------ 1) avisos inmediatos ------------------------ */
async function immediate() {
  const snap = await db.collection('alerts').where('sent', '==', false).limit(50).get();
  for (const doc of snap.docs) {
    const a = doc.data();
    const stale = nowMs - (a.createdAt || nowMs) > 3 * 3600 * 1000;
    if (!stale && a.kind) {
      console.log('Aviso de llegadas:', a.title);
      await send(a.to && a.to.length ? a.to : ['admin'], {
        title: a.title || 'Reporte de llegadas', body: a.body || '', tag: a.kind + '-' + today + '-' + doc.id.slice(0, 6), urgent: a.state === 'out' ? '1' : '0', url: './',
      }, { exceptUid: a.by });
    } else if (!stale) {
      const out = a.state === 'out';
      const bits = [OWNERS[a.owner] || a.owner, a.qty, a.note && `“${a.note}”`, a.byName].filter(Boolean);
      console.log('Aviso inmediato:', a.name, a.state);
      await send(a.to && a.to.length ? a.to : ['admin'], {
        title: `${out ? 'FALTA' : 'Hay poco'}: ${a.name}`,
        body: bits.join(' · '),
        tag: 'alert-' + a.productId,
        urgent: out ? '1' : '0',
        url: './',
      }, { exceptUid: a.by });
    }
    await doc.ref.update({ sent: true, sentAt: nowMs, skipped: stale });
  }
}

/* --------------------- 2) resúmenes de horario fijo --------------------- */
async function loadState() {
  const [ps, ss] = await Promise.all([db.collection('products').get(), db.collection('status').get()]);
  const products = ps.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.active !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const status = Object.fromEntries(ss.docs.map((d) => [d.id, d.data()]));
  return { products, status };
}
const stateOf = (st, id) => (st[id] && st[id].state) || 'ok';
const bought = (s) => !!(s && s.boughtAt && (!s.since || s.boughtAt >= s.since));
const sentOk = (s) => !!(s && s.sentAt && (!s.since || s.sentAt >= s.since));
const day0 = Date.parse(today + 'T00:00:00-05:00');
const names = (arr) => arr.map((p) => p.name).join(', ');
const rank = (st, p) => (stateOf(st, p.id) === 'out' ? 0 : 1);

function buyLists({ products, status }) {
  const notOk = products.filter((p) => stateOf(status, p.id) !== 'ok');
  const buy = notOk.filter((p) => (p.owner === 'prod' || ['C', 'D', 'E'].includes(p.camino)) && !bought(status[p.id]))
    .sort((a, b) => rank(status, a) - rank(status, b));
  const prep = notOk.filter((p) => p.camino === 'B' && p.owner !== 'prod' && !bought(status[p.id]));
  return { buy, prep, out: buy.filter((p) => stateOf(status, p.id) === 'out'), low: buy.filter((p) => stateOf(status, p.id) === 'low') };
}

async function adminSummary(title, state) {
  const { buy, prep, out, low } = buyLists(state);
  if (!buy.length && !prep.length) return null;
  const parts = [];
  if (out.length) parts.push(`Falta: ${names(out)}`);
  if (low.length) parts.push(`Poco: ${names(low)}`);
  if (prep.length) parts.push(`Por preparar: ${names(prep)}`);
  return { title: `${title}: ${buy.length} por comprar${prep.length ? `, ${prep.length} por preparar` : ''}`, body: parts.join(' · ').slice(0, 300), tag: 'resumen', urgent: '0', url: './' };
}
async function prodSummary(state) {
  const { products, status } = state;
  const items = products.filter((p) => p.owner !== 'prod' && (p.camino === 'A' || p.camino === 'B') && stateOf(status, p.id) !== 'ok' && !sentOk(status[p.id]))
    .sort((a, b) => rank(status, a) - rank(status, b));
  if (!items.length) return null;
  return { title: `Para hoy: ${items.length} ${items.length === 1 ? 'cosa' : 'cosas'} por preparar o enviar`, body: names(items).slice(0, 300), tag: 'resumen', urgent: '0', url: './' };
}
async function notSentSummary({ products, status }) {
  const late = products.filter((p) => p.owner !== 'prod' && (p.camino === 'A' || p.camino === 'B')
    && stateOf(status, p.id) !== 'ok' && !sentOk(status[p.id])
    && ((status[p.id] && status[p.id].since) || 0) < day0 + 4.5 * 3600000);
  if (!late.length) return null;
  return { title: `Producción no ha enviado: ${late.length}`, body: names(late).slice(0, 300), tag: 'no-enviado', urgent: '1', url: './' };
}
async function hasReport(owner) {
  const s = await db.collection('reports').where('date', '==', today).where('owner', '==', owner).limit(1).get();
  return !s.empty;
}
const reminder = (text) => ({ title: 'Actualiza la lista del puesto', body: text, tag: 'recordatorio', urgent: '0', url: './' });

const cfg = (await db.collection('config').doc('app').get()).data() || {};
const [dh, dm] = String(cfg.sendDeadline || '07:00').split(':').map(Number);
const DEADLINE = (dh || 0) * 60 + (dm || 0);

const SLOTS = [
  { id: '0415', min: 4 * 60 + 15, run: async (st) => { const p = await prodSummary(st); return p && [{ roles: ['produccion'], payload: p }]; } },
  { id: 'envio', min: DEADLINE, run: async (st) => { const p = await notSentSummary(st); return p && [{ roles: ['admin', 'puesto1', 'puesto2'], payload: p }]; } },
  { id: '0600', min: 6 * 60, run: async (st) => { const p = await adminSummary('Resumen de las 6:00', st); return p && [{ roles: ['admin'], payload: p }]; } },
  { id: '1200', min: 12 * 60, run: async (st) => { const p = await adminSummary('Resumen de las 12:00', st); return p && [{ roles: ['admin'], payload: p }]; } },
  { id: '1230', min: 12 * 60 + 30, run: async () => [{ roles: ['puesto1', 'puesto2'], payload: reminder('Toca lo que falta y al final “Terminé mi reporte”.') }] },
  { id: '1300', min: 13 * 60, run: async () => {
    const out = [];
    for (const [role, owner] of [['puesto1', 'p1'], ['puesto2', 'p2']]) {
      if (!(await hasReport(owner))) out.push({ roles: [role], payload: reminder('Todavía no terminaron el reporte de hoy.') });
    }
    return out;
  } },
  { id: '1700', min: 17 * 60, run: async (st) => { const p = await adminSummary('Resumen final', st); return p && [{ roles: ['admin'], payload: p }]; } },
];

async function scheduled() {
  const ref = db.collection('meta').doc('sent-' + today);
  const done = (await ref.get()).data() || {};
  let state = null;
  for (const s of SLOTS) {
    if (done[s.id] || minutesNow < s.min || minutesNow >= s.min + 45) continue;
    console.log('Horario', s.id);
    await ref.set({ [s.id]: nowMs }, { merge: true }); // se marca antes de enviar: nunca se manda doble
    state = state || (await loadState());
    const msgs = await s.run(state);
    for (const m of msgs || []) await send(m.roles, m.payload);
  }
}

async function cleanup() { // una vez al día borra avisos viejos
  if (minutesNow < 6 * 60 || minutesNow >= 6 * 60 + 45) return;
  const old = await db.collection('alerts').where('createdAt', '<', nowMs - 7 * 86400000).limit(200).get();
  await Promise.all(old.docs.map((d) => d.ref.delete()));
  if (old.size) console.log('Avisos viejos borrados:', old.size);
}

await immediate();
await scheduled();
await cleanup();
console.log('Listo.');
