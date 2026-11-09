// Actualiza el catálogo ya cargado en Firestore cuando sube CATALOG_VERSION (src/catalog.js).
// Lo corre GitHub Actions después de publicar. Solo toca los campos de patchFields;
// no pisa otros cambios que haga Elisa (aviso temprano, visible, orden…).
import admin from 'firebase-admin';
import { PRODUCTS, CATALOG_VERSION, MIGRATION_DELETE, patchFields } from '../src/catalog.js';

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.project_id) { console.log('Todavía no está el secreto FIREBASE_SERVICE_ACCOUNT.'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const cfgRef = db.collection('config').doc('app');
const cfg = (await cfgRef.get()).data() || {};
const have = cfg.catalogVersion || 0;
const existing = await db.collection('products').get();
console.log(`Catálogo en Firestore: versión ${have}, ${existing.size} productos. Versión del código: ${CATALOG_VERSION}`);

if (existing.empty) {
  const batch = db.batch();
  PRODUCTS.forEach((p, i) => { const { id, ...rest } = p; batch.set(db.collection('products').doc(id), { ...rest, order: i, active: true }); });
  await batch.commit();
  console.log('Catálogo inicial cargado:', PRODUCTS.length);
} else if (have < CATALOG_VERSION) {
  const ids = new Set(existing.docs.map((d) => d.id));
  const batch = db.batch();
  let n = 0;
  PRODUCTS.forEach((p, i) => {
    const ref = db.collection('products').doc(p.id);
    if (ids.has(p.id)) { batch.set(ref, patchFields(p), { merge: true }); }
    else { const { id, ...rest } = p; batch.set(ref, { ...rest, order: i, active: true }); }
    n++;
  });
  MIGRATION_DELETE.forEach((id) => { if (ids.has(id)) batch.delete(db.collection('products').doc(id)); });
  await batch.commit();
  console.log('Catálogo actualizado:', n, 'productos');
}
if (have !== CATALOG_VERSION) await cfgRef.set({ catalogVersion: CATALOG_VERSION }, { merge: true });
console.log('Listo.');
