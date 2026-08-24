// Copiar/mezclar este endpoint en el Code.gs del proyecto Mini Cierre.
// La versión completa generada en esta conversación es Code_TRES_PESTANAS_PWA_NIVELES.gs.

// Requiere en CFG:
// TERRAIN_HISTORY_SHEET: 'LecturasTerreno'
//
// Y en ensureSheets_:
// [CFG.TERRAIN_HISTORY_SHEET, ['Fecha/Hora','Lote ID','Fecha teléfono','Usuario','Estanque','Nivel terreno cm','Nivel %','Factor L/cm','Litros estimados','Origen']]

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function terrainLotExists_(ss, lotId) {
  const sh = ss.getSheetByName(CFG.TERRAIN_HISTORY_SHEET);
  if (!sh || sh.getLastRow() <= 1) return false;
  return !!sh.getRange(2,2,sh.getLastRow()-1,1)
    .createTextFinder(String(lotId))
    .matchEntireCell(true)
    .findNext();
}

function processTerrainLot_(lote) {
  return withLock_(() => {
    if (!lote || String(lote.modulo || '') !== 'NIVELES_TANQUES') {
      throw new Error('Lote de niveles inválido.');
    }

    const lotId = String(lote.id || '').trim();
    if (!lotId) throw new Error('El lote no tiene identificador.');
    if (!Array.isArray(lote.datos) || !lote.datos.length) {
      throw new Error('El lote no contiene mediciones.');
    }

    const ss = getSpreadsheet_();
    ensureSheets_(ss);
    ensureBaseRows_(ss);

    if (terrainLotExists_(ss, lotId)) {
      return {ok:true,duplicate:true,loteId:lotId,updated:0};
    }

    const allowedTags = ['D62','D64','D66','D68','D70','D74','D76','D84','D86'];
    const seen = {};
    const prepared = lote.datos.map(m => {
      const tag = String(m && m.estanque || '').trim().toUpperCase();
      if (!allowedTags.includes(tag)) throw new Error('Estanque no permitido: '+tag);
      if (seen[tag]) throw new Error('El lote contiene el estanque '+tag+' más de una vez.');
      seen[tag] = true;

      const cm = Number(m.cm);
      if (!Number.isInteger(cm) || cm < 0 || cm > 740) {
        throw new Error('Nivel terreno inválido para '+tag+'. Debe ser entero entre 0 y 740 cm.');
      }

      const row = findTankRow_(ss, tag);
      if (row < 0) throw new Error('No se encontró el estanque '+tag+' en Mini Cierre.');

      const factor = (m.factorLitrosCm === null || m.factorLitrosCm === undefined || m.factorLitrosCm === '')
        ? null : Number(m.factorLitrosCm);
      const pct = Number((cm / 740 * 100).toFixed(2));
      const liters = factor !== null && Number.isFinite(factor) ? Math.round(cm * factor) : null;
      return {tag,cm,row,factor,pct,liters};
    });

    const dataSheet = ss.getSheetByName(CFG.DATA_SHEET);
    const histSheet = ss.getSheetByName(CFG.TERRAIN_HISTORY_SHEET);
    const user = getUser_() || 'PWA Terreno';
    const now = new Date();
    const phoneDate = String(lote.fechaTelefono || '');
    const historyRows = [];

    prepared.forEach(m => {
      const cell = dataSheet.getRange(m.row, TANK_FIELDS.fieldCm);
      const oldValue = Number(cell.getValue() || 0);
      cell.setValue(m.cm);
      audit_(ss,'PWA_NIVEL_TERRENO',m.tag,'fieldCm',oldValue,m.cm);
      historyRows.push([
        now, lotId, phoneDate, user, m.tag, m.cm, m.pct,
        m.factor === null ? '' : m.factor,
        m.liters === null ? '' : m.liters,
        'PWA Integradores / Niveles'
      ]);
    });

    if (historyRows.length) {
      histSheet.getRange(histSheet.getLastRow()+1,1,historyRows.length,10).setValues(historyRows);
    }

    return {
      ok:true,
      duplicate:false,
      loteId:lotId,
      updated:prepared.length,
      tanks:prepared.map(m=>({tag:m.tag,fieldCm:m.cm,percent:m.pct,liters:m.liters}))
    };
  });
}
