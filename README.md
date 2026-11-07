# Puesto Elisa

App instalable (PWA) para coordinar el puesto, Producción y las compras de la señora Elisa.

- **Perfiles:** Puesto 1 / Puesto 2, Producción y Adquisición (administra Elisa).
- **Nube:** Firebase (cuentas con Google, base de datos Firestore, avisos push).
- **Publicación:** al subir cambios a `main`, GitHub Actions arma la app y la publica en Firebase Hosting.
- **Avisos:** otro flujo de GitHub Actions revisa cada ~5 minutos la cola de avisos y manda los resúmenes
  de horario fijo (4:15, 6:00, 12:00, 12:30, 13:00 y 17:00, hora de Lima).

## Carpetas

| Carpeta | Qué hay |
|---|---|
| `src/` | La app (pantallas, catálogo de productos, estilos, service worker, íconos) |
| `scheduler/` | Programa que manda los avisos |
| `firestore.rules` | Reglas de seguridad de la base de datos |
| `.github/workflows/` | `deploy.yml` (publicar) y `avisos.yml` (avisos programados) |

## Secretos

El único secreto es `FIREBASE_SERVICE_ACCOUNT` (JSON de la cuenta de servicio), guardado en
*Settings → Secrets and variables → Actions*. **Nunca** va en el código. El correo y el teléfono de Elisa
tampoco están en el código: viven en el documento `config/app` de Firestore.

## Desarrollo

```
npm install
npm run build        # genera public/ para Firebase Hosting
npm run build:test   # versión de prueba sin Firebase (public-test/)
```
