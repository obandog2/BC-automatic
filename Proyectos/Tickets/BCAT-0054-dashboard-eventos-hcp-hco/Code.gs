/** BCAT-0054 — Dashboard de Eventos HCP/HCO */
const EVENT_CONFIG = Object.freeze({
  SPREADSHEET_ID: '1H3MjtB17RxOY3AZPHJH3LDx79AUwuOQyiZfLRYKCSOQ',
  SHEET_NAME: 'POs HCPs/HCOs 2026',
  HEADER_ROW: 1
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .append('<script>var quickWorkflow=document.querySelector("[data-quick=workflow]");if(quickWorkflow){quickWorkflow.dataset.quick="pending";}</script>')
    .setTitle('Dashboard Eventos HCP/HCO | Roche')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function eventGetDashboardData() {
  const ss = SpreadsheetApp.openById(EVENT_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(EVENT_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('No se encontró la hoja "' + EVENT_CONFIG.SHEET_NAME + '".');
  const lastRow = sheet.getLastRow(), lastColumn = sheet.getLastColumn();
  if (lastRow <= EVENT_CONFIG.HEADER_ROW) return eventEmpty_(ss.getUrl());
  const headers = sheet.getRange(EVENT_CONFIG.HEADER_ROW, 1, 1, lastColumn).getDisplayValues()[0];
  const range = sheet.getRange(EVENT_CONFIG.HEADER_ROW + 1, 1, lastRow - EVENT_CONFIG.HEADER_ROW, lastColumn);
  const raw = range.getValues(), display = range.getDisplayValues(), columns = eventColumns_(headers);
  const records = raw.map(function(row, index) {
    if (display[index].every(function(v) { return !String(v).trim(); })) return null;
    return eventRecord_(row, display[index], columns, EVENT_CONFIG.HEADER_ROW + 1 + index, ss.getUrl(), sheet.getSheetId());
  }).filter(Boolean);
  return {
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), sheetUrl: ss.getUrl(), records: records,
    warnings: eventWarnings_(columns),
    filterOptions: { country: eventDistinct_(records, 'country'), interactionType: eventDistinct_(records, 'interactionType'), category: eventDistinct_(records, 'category'), currency: eventDistinct_(records, 'currency'), costCenter: eventDistinct_(records, 'costCenter'), poSent: eventDistinct_(records, 'poSent'), workflow: eventDistinct_(records, 'workflow') }
  };
}

function eventEmpty_(sheetUrl) { return { generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), sheetUrl: sheetUrl, records: [], warnings: ['La hoja no contiene registros debajo de los encabezados.'], filterOptions: { country: [], interactionType: [], category: [], currency: [], costCenter: [], poSent: [], workflow: [] } }; }
function eventColumns_(headers) {
  const source = headers.map(eventNormalize_);
  const aliases = { country: ['pais'], interaction: ['n interaccion', 'n° interaccion'], eventName: ['nombre del evento'], entity: ['hcp/hco/proveedor'], costCenter: ['centro de costos'], detail: ['detalle'], interactionType: ['tipo de interaccion'], category: ['categoria'], poValue: ['valor po'], taxValue: ['valor con impuestos'], currency: ['moneda'], chfValue: ['valor en chf'], poNumber: ['# po'], poSent: ['po enviada a proveedor'], workflow: ['aprobacion workflow'] };
  const result = {};
  Object.keys(aliases).forEach(function(key) { result[key] = -1; aliases[key].some(function(alias) { const i = source.indexOf(eventNormalize_(alias)); if (i >= 0) { result[key] = i; return true; } return false; }); });
  return result;
}
function eventRecord_(raw, display, c, rowNumber, ssUrl, sheetId) {
  const text = function(key) { return c[key] >= 0 ? String(display[c[key]] || '').trim() : ''; };
  const money = function(key) { return c[key] >= 0 ? eventMoney_(raw[c[key]], display[c[key]]) : null; };
  const poSent = text('poSent') || 'Sin información', workflow = text('workflow') || 'Sin información';
  const sent = /si|yes|enviad|enviado/.test(eventNormalize_(poSent));
  const approved = /aprob|complet|finaliz/.test(eventNormalize_(workflow));
  return { rowNumber: rowNumber, sourceUrl: ssUrl + '#gid=' + sheetId + '&range=A' + rowNumber, country: text('country') || 'Sin información', interaction: text('interaction'), eventName: text('eventName') || 'Sin evento', entity: text('entity') || 'Sin información', costCenter: text('costCenter') || 'Sin información', detail: text('detail'), interactionType: text('interactionType') || 'Sin información', category: text('category') || 'Sin información', poValue: money('poValue'), taxValue: money('taxValue'), currency: text('currency') || 'Sin información', chfValue: money('chfValue'), poNumber: text('poNumber'), poSent: poSent, workflow: workflow, sent: sent, approved: approved, searchText: eventNormalize_([text('interaction'), text('eventName'), text('entity'), text('costCenter'), text('detail'), text('poNumber'), text('country')].join(' ')) };
}
function eventWarnings_(columns) { const required = { eventName: 'Nombre del evento', entity: 'HCP/HCO/PROVEEDOR', country: 'País', chfValue: 'Valor en CHF' }; return Object.keys(required).filter(function(k) { return columns[k] < 0; }).map(function(k) { return 'No se encontró el encabezado: ' + required[k] + '.'; }); }
function eventDistinct_(records, key) { return Array.from(new Set(records.map(function(r) { return r[key]; }).filter(Boolean))).sort(function(a, b) { return String(a).localeCompare(String(b), 'es'); }); }
function eventNormalize_(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
function eventMoney_(raw, display) { if (typeof raw === 'number' && !isNaN(raw)) return raw; const clean = String(display || '').replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); const number = Number(clean); return isNaN(number) ? null : number; }
