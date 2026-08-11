# Integradores MASISA

Aplicación de registro de consumos desarrollada para facilitar el ingreso de datos operacionales desde teléfonos, tablets y PC, con sincronización hacia Google Sheets.

El proyecto nació como una interfaz simple para reducir errores de digitación en terreno y terminó evolucionando a una solución instalable en Android, con PWA, cola local de datos, sincronización automática y compilación de APK mediante GitHub Actions.

## Objetivo

Permitir que los operadores registren consumos de forma rápida y ordenada, manteniendo intacta la estructura histórica de la planilla utilizada por MASISA.

La aplicación trabaja con los siguientes campos:

- Resina
- Secuestrante
- F900
- Emulsión 1 Quimtec
- Emulsión 2 Quimtec

La disposición visual fue diseñada pensando en el orden natural de ingreso de los operadores, mientras que la escritura en Google Sheets conserva las columnas históricas originales.

## Arquitectura general

La solución actual utiliza esta ruta de comunicación:

```text
Aplicación / PWA
      ↓
Cloudflare Worker
      ↓
Google Apps Script
      ↓
Google Sheets
```

El Worker se incorporó para evitar problemas asociados a sesiones de Google abiertas en ciertos navegadores y dispositivos.

## Google Sheets

La aplicación escribe en la hoja:

```text
Consumo de resinas
```

Los nuevos registros comienzan desde la fila 11331 y cada dato busca la primera celda disponible en su columna correspondiente.

El mapeo histórico de columnas se mantiene sin modificaciones:

| Campo | Columna | Nº |
|---|---:|---:|
| Resina | I | 9 |
| Secuestrante | J | 10 |
| F900 | K | 11 |
| Emulsión 2 | L | 12 |
| Emulsión 1 | M | 13 |

> Importante: el orden visual de Emulsión 1 y Emulsión 2 no corresponde al orden físico de las columnas en la planilla. Esto es intencional.

## Funciones principales

- Interfaz optimizada para uso en terreno.
- Campos grandes para ingreso desde pantallas táctiles.
- Diseño inspirado en la identidad visual de MASISA.
- Registro independiente por columna.
- Bloqueo de escritura para evitar conflictos cuando varios usuarios guardan al mismo tiempo.
- Validación de valores antes de escribir en la planilla.
- Cola local de registros pendientes.
- Sincronización automática al recuperar conexión.
- Indicador de estado online/offline.
- Contador de registros pendientes.
- Botón de reset para limpiar únicamente la cola local del dispositivo.
- Protección contra duplicados mediante identificadores únicos de lote.
- Aplicación instalable como PWA.
- APK Android compilado automáticamente desde GitHub Actions.

## Funcionamiento offline

Antes de intentar enviar un registro, la PWA guarda el lote localmente en el dispositivo.

Si existe conexión, intenta sincronizar de inmediato.

Si no existe conexión, el registro permanece pendiente y vuelve a intentarlo cuando la red regresa.

El botón de reset borra únicamente los registros pendientes almacenados localmente. No elimina registros que ya fueron enviados a Google Sheets.

## Protección contra duplicados

Cada lote generado por la aplicación recibe un identificador único.

Apps Script mantiene un registro interno de los lotes ya procesados para evitar que una retransmisión del mismo lote genere datos duplicados.

## Cloudflare Worker

Durante las pruebas se detectó que el acceso directo desde la PWA hacia Apps Script podía fallar cuando el navegador tenía una cuenta Google iniciada, aunque funcionaba correctamente en modo incógnito.

Para eliminar esa dependencia se añadió un Cloudflare Worker como intermediario.

El Worker recibe la solicitud de la aplicación, la envía a Apps Script y devuelve la respuesta a la PWA.

## Aplicación Android

Además de la PWA, existe un proyecto Android dentro de:

```text
/android
```

La aplicación Android abre la interfaz de Integradores como una aplicación independiente y permite distribuirla mediante un archivo APK.

## Compilación automática del APK

El repositorio incluye un workflow de GitHub Actions:

```text
.github/workflows/build-android-apk.yml
```

Este workflow:

1. Descarga el proyecto.
2. Configura Java y Android SDK.
3. Genera los iconos launcher Android.
4. Compila el proyecto con Gradle.
5. Genera el APK.
6. Publica el resultado como artifact de GitHub Actions.

Para compilar manualmente:

```text
GitHub → Actions → Build Android APK → Run workflow
```

Cuando termina correctamente, el APK aparece en la sección `Artifacts` bajo el nombre:

```text
Integradores-APK
```

## Distribución del APK

Para pruebas internas, el APK puede publicarse en GitHub Releases.

La idea es mantener un archivo con nombre simple, por ejemplo:

```text
integradores.apk
```

De esta forma puede compartirse un enlace directo de descarga sin necesidad de entregar el ZIP generado por Actions.

## Archivos principales

```text
index.html                 Interfaz principal de la PWA
manifest.json              Configuración de instalación PWA
sw.js                      Service Worker y caché offline
reset.html                 Herramienta de limpieza de cola local
icon.svg                   Icono PWA
android-icon-source.svg    Fuente del icono Android
logo-masisa.png            Logo utilizado en la interfaz
android/                   Proyecto Android
.github/workflows/         Automatización de compilación APK
```

## Estado del proyecto

Actualmente el proyecto se encuentra en etapa de pruebas en distintos navegadores y dispositivos.

Se han probado principalmente:

- Navegadores de escritorio.
- Navegadores Android.
- Modo incógnito.
- Navegadores con sesión Google iniciada.
- Instalación como PWA.
- Instalación mediante APK.
- Envío de registros con y sin conexión.

## Consideraciones

La estructura de columnas de Google Sheets no debe modificarse, ya que contiene varios años de información histórica y la aplicación depende de ese mapeo fijo.

Antes de publicar una versión definitiva conviene validar nuevamente:

- ingreso de cada uno de los cinco tipos de consumo;
- funcionamiento offline;
- recuperación automática de pendientes;
- prevención de duplicados;
- funcionamiento en varios teléfonos simultáneamente;
- icono y nombre final de la aplicación;
- distribución del APK mediante GitHub Releases.

## Tecnologías utilizadas

- HTML
- CSS
- JavaScript
- Progressive Web App (PWA)
- Service Worker
- LocalStorage
- Google Apps Script
- Google Sheets
- Cloudflare Workers
- Android
- Gradle
- GitHub Actions

## Autoría

Proyecto desarrollado como solución práctica para registro operacional de consumos en terreno.

Repositorio mantenido por `momocrackcorp`.
