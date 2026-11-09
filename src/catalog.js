// Catálogo inicial. Se carga una sola vez a Firestore (colección "products")
// y después Elisa lo puede editar desde la app.
//
// owner:  p1 = Puesto 1, p2 = Puesto 2, prod = materia prima de Producción
// camino: A prepara Producción · B prepara Elisa y envía Producción
//         C Elisa se encarga de todo · D proveedor · E panadería (lo recogen)
// modes:  formas de anotar la cantidad; la primera es la principal.
// units:  texto de la unidad por modo (si no, se usa el del modo).

export const MODES = {
  kg:   { kind: 'num', step: 0.5, unit: 'kg',        name: 'kg' },
  un:   { kind: 'num', step: 1,   unit: 'unidades',  name: 'unidades' },
  half: { kind: 'num', step: 0.5, unit: 'unidades',  name: 'unidades (con mitades)' },
  pack: { kind: 'num', step: 1,   unit: 'paquetes',  name: 'paquetes' },
  lt:   { kind: 'num', step: 0.5, unit: 'litros',    name: 'litros' },
  bar:  { kind: 'bar', max: 1, step: 0.25,           name: 'barra 0 a 1' },
  bar5: { kind: 'bar', max: 5, step: 0.5,            name: 'barra 0 a 5' },
  yn:   { kind: 'yn',                                name: 'hay / no hay' },
  lvl:  { kind: 'lvl',                               name: 'poco / regular / sí hay' },
};

export const LEVELS = ['Muy poco', 'Regular', 'Sí hay'];

export const OWNERS = { p1: 'Puesto 1', p2: 'Puesto 2', prod: 'Producción' };

export const ROLES = {
  admin: 'Adquisición (Elisa)',
  puesto1: 'Puesto 1',
  puesto2: 'Puesto 2',
  produccion: 'Producción',
  pending: 'Esperando aprobación',
};
export const ROLE_OWNER = { puesto1: 'p1', puesto2: 'p2', produccion: 'prod' };

export const SECTIONS = [
  'Sándwiches', 'Jugos', 'Gelatinas', 'Gaseosas', 'Plásticos y bolsas', 'Desayuno y aguas', 'Empanadas',
  'Carnes y verduras crudas', 'Aderezos', 'Frutas',
];

// Versión del catálogo. Al subirla, el script scheduler/migrate.mjs actualiza los productos
// ya cargados en Firestore (solo los campos de patchFields) y borra los de MIGRATION_DELETE.
export const CATALOG_VERSION = 2;
export const MIGRATION_DELETE = ['chis_sand', 'chis_emp', 'chis_gel', 'chis_des'];
export const patchFields = (p) => {
  const o = {};
  ['name', 'section', 'modes', 'units', 'count', 'noReport', 'leftOnly', 'expected'].forEach((k) => {
    if (p[k] !== undefined) o[k] = p[k];
  });
  return o;
};

// Lo que lleva cada preparación (se muestra chico en la pantalla de Producción).
export const PREP = {
  pollo:      { verb: 'Hacer cocer las pechugas (lo cocina Elisa, Producción lo envía)', items: ['Pechugas', 'Kion', 'Sal'] },
  cabeza:     { verb: 'Picar, lavar y aderezar la cabeza de chancho', items: ['Cabeza de chancho', 'Sal', 'Pimienta', 'Ajo', 'Aceite', 'Ajinomoto', 'Limón', 'Vinagre'] },
  lechuga:    { verb: 'Lavar', items: ['Lechuga'] },
  tomate:     { verb: 'Mandar', items: ['Tomate'] },
  cebolla:    { verb: 'Picar y lavar', items: ['Cebolla'] },
  mayonesa:   { verb: 'Licuar', items: ['Sal', 'Pimienta', 'Ajo', 'Aceite', 'Ajinomoto', 'Limón', 'Huevo'] },
  aji:        { verb: 'Licuar', items: ['Sal', 'Pimienta', 'Ajo', 'Aceite', 'Ajinomoto', 'Limón', 'Huevo', 'Rocoto'] },
  limon:      { verb: 'Mandar', items: ['Limón'] },
  quinua:     { verb: 'Preparar', items: ['Quinua', 'Canela', 'Clavo', 'Refresco de piña', 'Refresco de naranja', 'Limón', 'Harina', 'Azúcar', 'Manzana', 'Maca', 'Color'] },
  agua_pina:  { verb: 'Preparar', items: ['Refresco de piña', 'Canela', 'Clavo', 'Azúcar', 'Piña', 'Limón', 'Gotas de piña'] },
  agua_mara:  { verb: 'Preparar', items: ['Refresco de naranja', 'Azúcar', 'Maracuyá', 'Limón', 'Gotas de naranja'] },
  agua_manz:  { verb: 'Hervir', items: ['Manzana'] },
  agua_herv:  { verb: 'Hervir y enviar', items: [] },
  gel_fresa:  { verb: 'Lo prepara Elisa, Producción lo envía', items: [] },
  gel_pina:   { verb: 'Lo prepara Elisa, Producción lo envía', items: [] },
};

// [id, nombre, sección, dueño, camino, modos, extras]
const P = (id, name, section, owner, camino, modes, extra = {}) =>
  ({ id, name, section, owner, camino, modes, ...extra });

// Cantidad que llega cada día: lv = lunes a viernes, sab = sábado, dom = domingo.
const PAN_ESPERADO = { lv: 36, sab: 60, dom: 84 };

const FRUTA_UN = ['un', 'kg', 'lvl'];
const FRUTA_KG = ['kg', 'un', 'lvl'];
const VERDURA = ['kg', 'lvl', 'un'];

export const PRODUCTS = [
  // ---------- PUESTO 1 · Sándwiches ----------
  P('pan3', 'Pan de tres puntas', 'Sándwiches', 'p1', 'E', ['un'], { units: { un: 'panes' }, count: true, expected: PAN_ESPERADO }),
  P('panR', 'Pan redondo', 'Sándwiches', 'p1', 'E', ['un'], { units: { un: 'panes' }, count: true }),
  P('pollo', 'Pollo cocido', 'Sándwiches', 'p1', 'B', ['kg'], { early: true }),
  P('cabeza', 'Cabeza de chancho preparada', 'Sándwiches', 'p1', 'A', ['kg']),
  P('lechon', 'Lechón', 'Sándwiches', 'p1', 'C', ['bar', 'kg'], { early: true, units: { bar: 'pierna' } }),
  P('lechuga', 'Lechuga', 'Sándwiches', 'p1', 'A', ['bar', 'un'], { units: { bar: 'lechuga', un: 'lechugas' } }),
  P('tomate', 'Tomate', 'Sándwiches', 'p1', 'A', VERDURA),
  P('cebolla', 'Cebolla', 'Sándwiches', 'p1', 'A', VERDURA),
  P('limon', 'Limón', 'Sándwiches', 'p1', 'A', VERDURA),
  P('mayonesa', 'Mayonesa', 'Sándwiches', 'p1', 'A', ['bar'], { units: { bar: 'pote' } }),
  P('aji', 'Ají', 'Sándwiches', 'p1', 'A', ['bar'], { units: { bar: 'pote' } }),
  P('mostaza', 'Mostaza', 'Sándwiches', 'p1', 'C', ['bar'], { units: { bar: 'pote' } }),
  P('ketchup', 'Ketchup', 'Sándwiches', 'p1', 'C', ['bar'], { units: { bar: 'pote' } }),
  P('sal_prep', 'Sal preparada', 'Sándwiches', 'p1', 'C', ['yn']),
  P('encurtido', 'Encurtido', 'Sándwiches', 'p1', 'C', ['bar'], { units: { bar: 'frasco' } }),
  P('vinagreta', 'Vinagreta', 'Sándwiches', 'p1', 'C', ['bar'], { units: { bar: 'frasco' } }),
  P('papita', 'Papitas al hilo', 'Sándwiches', 'p1', 'C', ['kg']),
  P('sanguchera', 'Sanguchera', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('chismosa', 'Bolsa chismosa', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('b8x12', 'Bolsa 8x12', 'Plásticos y bolsas', 'p1', 'C', ['pack']),

  // ---------- PUESTO 1 · Empanadas (proveedor) ----------
  P('emp_queso', 'Empanada de queso', 'Empanadas', 'p1', 'D', ['un'], { count: true, noReport: true }),
  P('emp_pizza', 'Empanada de pizza', 'Empanadas', 'p1', 'D', ['un'], { count: true, noReport: true }),
  P('emp_pollo', 'Empanada de pollo', 'Empanadas', 'p1', 'D', ['un'], { count: true, noReport: true }),
  P('emp_mixta', 'Empanada mixta', 'Empanadas', 'p1', 'D', ['un'], { count: true, noReport: true }),
  P('emp_arabe', 'Empanada árabe', 'Empanadas', 'p1', 'D', ['un'], { count: true, noReport: true }),
  P('saltena', 'Salteña', 'Empanadas', 'p1', 'D', ['un'], { count: true, noReport: true }),
  P('papa_rell', 'Papa rellena', 'Empanadas', 'p1', 'D', ['un'], { count: true, noReport: true }),
  P('bp1', 'Bolsa de papel 1', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('bp2', 'Bolsa de papel 2', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('bp3', 'Bolsa de papel 3', 'Plásticos y bolsas', 'p1', 'C', ['pack']),

  // ---------- PUESTO 1 · Gelatinas ----------
  P('gel_fresa', 'Gelatina de fresa', 'Gelatinas', 'p1', 'B', ['kg']),
  P('gel_pina', 'Gelatina de piña', 'Gelatinas', 'p1', 'B', ['un']),
  P('vaso_peq', 'Vaso pequeño (vaso de gelatina)', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('cucharilla', 'Cucharilla', 'Plásticos y bolsas', 'p1', 'C', ['pack']),

  // ---------- PUESTO 1 · Desayuno y aguas ----------
  P('quinua', 'Desayuno de quinua', 'Desayuno y aguas', 'p1', 'A', ['lt', 'bar'], { units: { bar: 'de lo preparado' }, leftOnly: true, noReport: true }),
  P('agua_pina', 'Agua de piña', 'Desayuno y aguas', 'p1', 'A', ['lt', 'bar'], { units: { bar: 'de lo preparado' }, leftOnly: true, noReport: true }),
  P('agua_mara', 'Agua de maracuyá', 'Desayuno y aguas', 'p1', 'A', ['lt', 'bar'], { units: { bar: 'de lo preparado' }, leftOnly: true, noReport: true }),
  P('agua_manz', 'Agua de manzana', 'Desayuno y aguas', 'p1', 'A', ['lt', 'bar'], { units: { bar: 'de lo preparado' }, leftOnly: true, noReport: true }),
  P('agua_herv', 'Agua hervida', 'Desayuno y aguas', 'p1', 'A', ['lt', 'un'], { units: { un: 'porciones de 500 ml' } }),
  P('bolsa1', 'Bolsa de 1 porción', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('bolsa2', 'Bolsa de 2 porciones', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('bolsa3', 'Bolsa de 3 porciones', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('bot_peq', 'Botella pequeña', 'Plásticos y bolsas', 'p1', 'C', ['un', 'bar'], { units: { un: 'botellas', bar: 'paquete' } }),
  P('bot_gra', 'Botella grande', 'Plásticos y bolsas', 'p1', 'C', ['un', 'bar'], { units: { un: 'botellas', bar: 'paquete' } }),

  // ---------- PUESTO 1 · Jugos ----------
  P('j_fresa', 'Fresa', 'Jugos', 'p1', 'C', FRUTA_KG),
  P('j_platano', 'Plátano', 'Jugos', 'p1', 'C', FRUTA_UN),
  P('j_pina', 'Piña', 'Jugos', 'p1', 'C', FRUTA_UN),
  P('j_arandano', 'Arándano', 'Jugos', 'p1', 'C', FRUTA_KG),
  P('j_guayaba', 'Guayaba', 'Jugos', 'p1', 'C', FRUTA_UN),
  P('j_manzana', 'Manzana', 'Jugos', 'p1', 'C', FRUTA_UN),
  P('j_papaya', 'Papaya', 'Jugos', 'p1', 'C', FRUTA_UN),
  P('j_mango', 'Mango', 'Jugos', 'p1', 'C', FRUTA_UN),
  P('j_melon', 'Melón', 'Jugos', 'p1', 'C', FRUTA_UN),
  P('pepino', 'Pepino', 'Jugos', 'p1', 'C', ['un', 'lvl']),
  P('perejil', 'Perejil', 'Jugos', 'p1', 'C', ['bar'], { units: { bar: 'mazo' } }),
  P('espinaca', 'Espinaca', 'Jugos', 'p1', 'C', ['bar'], { units: { bar: 'kg' } }),
  P('azucar', 'Azúcar', 'Jugos', 'p1', 'C', ['kg', 'bar'], { units: { bar: 'bolsa' } }),
  P('leche', 'Leche', 'Jugos', 'p1', 'C', ['un'], { units: { un: 'latas' } }),
  P('cerveza', 'Cerveza negra', 'Jugos', 'p1', 'C', ['un'], { units: { un: 'botellas' } }),
  P('vainilla', 'Vainilla', 'Jugos', 'p1', 'C', ['bar', 'un'], { units: { bar: 'frasco', un: 'frascos' } }),
  P('canela', 'Canela', 'Jugos', 'p1', 'C', ['bar', 'un'], { units: { bar: 'frasco', un: 'frascos' } }),
  P('miel', 'Miel', 'Jugos', 'p1', 'C', ['bar', 'un'], { units: { bar: 'frasco', un: 'frascos' } }),
  P('algarrobina', 'Algarrobina', 'Jugos', 'p1', 'C', ['bar', 'un'], { units: { bar: 'frasco', un: 'frascos' } }),
  P('huevo', 'Huevo', 'Jugos', 'p1', 'C', ['un'], { units: { un: 'huevos' } }),
  P('vaso_llevar', 'Vasos de plástico para llevar', 'Plásticos y bolsas', 'p1', 'C', ['pack']),
  P('sorbetes', 'Sorbetes', 'Plásticos y bolsas', 'p1', 'C', ['pack']),

  // ---------- PUESTO 1 · Gaseosas ----------
  P('coca', 'Coca Cola', 'Gaseosas', 'p1', 'C', ['un']),
  P('inca', 'Inca Kola', 'Gaseosas', 'p1', 'C', ['un']),
  P('black', 'Black', 'Gaseosas', 'p1', 'C', ['un']),
  P('fanta', 'Fanta', 'Gaseosas', 'p1', 'C', ['un']),

  // ---------- PRODUCCIÓN · materia prima ----------
  P('r_cabeza', 'Cabeza de chancho cruda', 'Carnes y verduras crudas', 'prod', 'C', ['half'], { units: { half: 'cabezas' } }),
  P('r_lechuga', 'Lechuga', 'Carnes y verduras crudas', 'prod', 'C', ['bar5', 'un'], { units: { bar5: 'lechugas', un: 'lechugas' } }),
  P('r_tomate', 'Tomate', 'Carnes y verduras crudas', 'prod', 'C', ['kg', 'un', 'lvl']),
  P('r_cebolla', 'Cebolla', 'Carnes y verduras crudas', 'prod', 'C', ['kg', 'un', 'lvl']),
  P('r_limon', 'Limón', 'Carnes y verduras crudas', 'prod', 'C', ['kg', 'un', 'lvl']),
  P('r_rocoto', 'Rocoto', 'Carnes y verduras crudas', 'prod', 'C', ['kg', 'un', 'lvl']),

  P('r_sal', 'Sal', 'Aderezos', 'prod', 'C', ['kg', 'lvl']),
  P('r_pimienta', 'Pimienta', 'Aderezos', 'prod', 'C', ['lvl', 'kg']),
  P('r_ajo', 'Ajo', 'Aderezos', 'prod', 'C', ['kg', 'lvl']),
  P('r_aceite', 'Aceite', 'Aderezos', 'prod', 'C', ['lt', 'lvl']),
  P('r_ajino', 'Ajinomoto', 'Aderezos', 'prod', 'C', ['kg', 'lvl']),
  P('r_vinagre', 'Vinagre', 'Aderezos', 'prod', 'C', ['lt', 'lvl']),
  P('r_huevo', 'Huevo', 'Aderezos', 'prod', 'C', ['un'], { units: { un: 'huevos' } }),

  P('r_quinua', 'Quinua', 'Desayuno y aguas', 'prod', 'C', ['kg', 'lvl']),
  P('r_harina', 'Harina', 'Desayuno y aguas', 'prod', 'C', ['kg', 'lvl']),
  P('r_azucar', 'Azúcar', 'Desayuno y aguas', 'prod', 'C', ['kg', 'bar'], { units: { bar: 'saco' } }),
  P('r_maca', 'Maca', 'Desayuno y aguas', 'prod', 'C', ['kg', 'un']),
  P('r_color', 'Color', 'Desayuno y aguas', 'prod', 'C', ['yn']),
  P('r_canela', 'Canela', 'Desayuno y aguas', 'prod', 'C', ['bar'], { units: { bar: 'pote' } }),
  P('r_clavo', 'Clavo', 'Desayuno y aguas', 'prod', 'C', ['bar'], { units: { bar: 'pote' } }),
  P('r_ref_pina', 'Refresco de piña', 'Desayuno y aguas', 'prod', 'C', ['pack', 'un']),
  P('r_ref_nar', 'Refresco de naranja', 'Desayuno y aguas', 'prod', 'C', ['pack', 'un']),
  P('r_got_pina', 'Gotas de piña', 'Desayuno y aguas', 'prod', 'C', ['un'], { units: { un: 'frascos' } }),
  P('r_got_nar', 'Gotas de naranja', 'Desayuno y aguas', 'prod', 'C', ['un'], { units: { un: 'frascos' } }),

  P('r_pina', 'Piña', 'Frutas', 'prod', 'C', ['un', 'kg']),
  P('r_maracuya', 'Maracuyá', 'Frutas', 'prod', 'C', ['kg', 'un']),
  P('r_manzana', 'Manzana', 'Frutas', 'prod', 'C', ['kg', 'un']),
];

// Para cada producto: id de PREP que le corresponde (si lo tiene).
export const PREP_OF = {
  pollo: 'pollo', cabeza: 'cabeza', lechuga: 'lechuga', tomate: 'tomate', cebolla: 'cebolla',
  mayonesa: 'mayonesa', aji: 'aji', limon: 'limon', quinua: 'quinua', agua_pina: 'agua_pina',
  agua_mara: 'agua_mara', agua_manz: 'agua_manz', agua_herv: 'agua_herv',
  gel_fresa: 'gel_fresa', gel_pina: 'gel_pina',
};
