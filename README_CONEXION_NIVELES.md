# Conexión PWA Niveles → Mini Cierre

La rama `niveles-estanques-minicierre` conserva una sola URL de Worker en la PWA.
El Worker enruta por `lote.modulo`:

- `INTEGRADORES` y lotes antiguos sin `modulo` → Apps Script histórico de Integradores.
- `NIVELES_TANQUES` → Apps Script de Mini Cierre.

## Mini Cierre

Usar la versión `Code_TRES_PESTANAS_PWA_NIVELES.gs` preparada para el proyecto de Mini Cierre y ejecutar `setupDashboard()` una vez.
Esto agrega la hoja `LecturasTerreno` sin borrar datos existentes.

El endpoint de Mini Cierre:
- solo acepta `NIVELES_TANQUES`;
- valida D62,D64,D66,D68,D70,D74,D76,D84,D86;
- acepta cm enteros 0–740;
- actualiza solo `fieldCm` / Nivel terreno cm;
- no modifica HMI;
- registra Auditoría;
- registra historial en `LecturasTerreno`;
- detecta `lote.id` repetido para evitar duplicados.

## Cloudflare Worker

Usar `cloudflare-worker-router.js` y configurar estas variables de entorno:

- `INTEGRADORES_APPS_SCRIPT_URL`: URL `/exec` que ya utiliza el backend histórico de Integradores.
- `MINICIERRE_APPS_SCRIPT_URL`: URL `/exec` de la implementación web de Mini Cierre.

La URL del Worker para la PWA no cambia.

## Factores de aforo

D62–D70 usan 93 L/cm como patrón de aforo físico. D74/D76/D84/D86 siguen con factor pendiente hasta confirmar su aforo. La edición de factores debe quedar fuera de la interfaz de operador y validada por backend/configuración protegida.
