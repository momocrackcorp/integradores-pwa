// Endpoint de lectura para PWA Integradores.
// Agregar/mezclar en el Apps Script histórico de Integradores.
// NO reemplaza el doGet existente: solo agrega la rama accion=ultimos.

const INTEGRADORES_SPREADSHEET_ID = '1DOOwWI_3RpcgcWqeShX9kiV7mJCE4pzKJnE8IaWAMgQ';
const INTEGRADORES_SOURCE_SHEET = 'Fuente Online';

function ultimosIntegradoresOutput_() {
  try {
    const ss = SpreadsheetApp.openById(INTEGRADORES_SPREADSHEET_ID);
    const sh = ss.getSheetByName(INTEGRADORES_SOURCE_SHEET);
    if (!sh) throw new Error('No existe la hoja Fuente Online.');

    const lastRow = sh.getLastRow();
    if (lastRow < 5) {
      return jsonIntegradores_({ok:true,row:null,valores:{}});
    }

    // A:E = Resina, Secuestrante, F900, Emulsion 2 Quimtec, Emulsion Quimtec
    // Buscamos desde abajo la última fila que tenga al menos un dato útil.
    const startRow = Math.max(5, lastRow - 500);
    const values = sh.getRange(startRow,1,lastRow-startRow+1,5).getDisplayValues();
    let found = null;
    let foundRow = null;

    for (let i=values.length-1; i>=0; i--) {
      const row = values[i];
      if (row.some(v => String(v).trim() !== '')) {
        found = row;
        foundRow = startRow + i;
        break;
      }
    }

    if (!found) return jsonIntegradores_({ok:true,row:null,valores:{}});

    const clean = v => {
      const s = String(v == null ? '' : v).trim();
      if (!s) return null;
      // La Fuente Online usa lecturas enteras para estos integradores.
      const n = Number(s.replace(/\./g,'').replace(',','.'));
      return Number.isFinite(n) ? n : null;
    };

    return jsonIntegradores_({
      ok:true,
      row:foundRow,
      sheet:INTEGRADORES_SOURCE_SHEET,
      valores:{
        resina:clean(found[0]),
        secuestrante:clean(found[1]),
        f900:clean(found[2]),
        emulsion2:clean(found[3]),
        emulsion1:clean(found[4])
      },
      serverTime:new Date().toISOString()
    });
  } catch (err) {
    return jsonIntegradores_({ok:false,error:String(err && err.message || err)});
  }
}

function jsonIntegradores_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/*
INTEGRACIÓN EN EL doGet EXISTENTE
---------------------------------
Al inicio de tu doGet(e), antes de procesar lote, agregar:

  if (String(e && e.parameter && e.parameter.accion || '').toLowerCase() === 'ultimos') {
    return ultimosIntegradoresOutput_();
  }

Después dejar todo el procesamiento histórico exactamente como está.
*/
