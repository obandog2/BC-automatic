/**
 * BACKEND - DASHBOARD DE OPERACIONES (Business Center)
 *
 * Antes de ejecutar, reemplaza los tres valores que empiezan con REEMPLAZAR_.
 * Para convertir archivos Excel también debes activar el servicio avanzado Drive API.
 */

const CONFIG = Object.freeze({
  FOLDER_ID: 'REEMPLAZAR_FOLDER_ID',
  CONTROL_SPREADSHEET_ID: 'REEMPLAZAR_CONTROL_SPREADSHEET_ID',
  SAVINGS_SPREADSHEET_ID: 'REEMPLAZAR_HISTORICO_SPREADSHEET_ID',
  CONTROL_SHEET_NAME: 'update',
  CONTROL_CELL: 'B2',
  CONTROL_VALUE: 'update',
  CACHE_NAME: 'BC_DASHBOARD_CACHE.json',
  CACHE_VERSION: 2,
  FILES: Object.freeze([
    Object.freeze({ searchKey: 'automatizaciones_bc', type: 'Automatizaciones' }),
    Object.freeze({ searchKey: 'eventos_bc', type: 'Eventos Internos' }),
    Object.freeze({ searchKey: 'ordenes_compra_bc', type: 'Órdenes de Compra' })
  ])
});

function validarConArchivoControl() {
  try {
    validateConfiguration_();
    const sheet = SpreadsheetApp.openById(CONFIG.CONTROL_SPREADSHEET_ID)
      .getSheetByName(CONFIG.CONTROL_SHEET_NAME);
    if (!sheet) return false;
    const value = sheet.getRange(CONFIG.CONTROL_CELL).getDisplayValue();
    return normalizeText_(value) === normalizeText_(CONFIG.CONTROL_VALUE);
  } catch (error) {
    console.error('No se pudo validar el archivo de control: ' + error.message);
    return false;
  }
}

function doGet() {
  if (!validarConArchivoControl()) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:Arial,sans-serif;max-width:640px;margin:80px auto;padding:32px;text-align:center;color:#17252d">' +
      '<h2>Acceso temporalmente suspendido</h2>' +
      '<p>El dashboard se encuentra en mantenimiento. Intenta nuevamente más tarde.</p>' +
      '</div>'
    ).setTitle('Dashboard en mantenimiento');
  }

  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Operations Dashboard | Business Center')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function fetchDashboardDataFromCache() {
  if (!validarConArchivoControl()) {
    return JSON.stringify({ error: 'Dashboard bloqueado por mantenimiento.' });
  }

  try {
    validateConfiguration_();
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const files = folder.getFilesByName(CONFIG.CACHE_NAME);
    if (!files.hasNext()) {
      return JSON.stringify({
        error: 'El caché no existe. Ejecuta updateDashboardData() una vez desde Apps Script.'
      });
    }
    return files.next().getBlob().getDataAsString('UTF-8');
  } catch (error) {
    return JSON.stringify({ error: 'No fue posible leer el caché: ' + error.message });
  }
}

function updateDashboardData() {
  if (!validarConArchivoControl()) {
    return JSON.stringify({ error: 'Dashboard bloqueado por mantenimiento.' });
  }

  validateConfiguration_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return JSON.stringify({ error: 'Ya existe una actualización en curso. Intenta nuevamente en unos segundos.' });
  }

  try {
    const savingsData = getSavingsData_();
    const payload = {
      cacheVersion: CONFIG.CACHE_VERSION,
      general: [],
      automatizaciones: [],
      eventos: [],
      ordenes: [],
      totalAhorroDirectoAuto: savingsData.totalBrutoAuto,
      areaSavingsAuto: savingsData.areaSavingsAuto,
      savingsAudit: savingsData.savingsAudit,
      filtros: {
        paises: new Set(),
        areas: new Set(),
        estados: new Set(),
        anios: new Set(),
        meses: new Set()
      },
      erroresCarga: [],
      lastUpdate: Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        'dd/MM/yyyy HH:mm'
      )
    };

    CONFIG.FILES.forEach(function(fileDefinition) {
      try {
        const rows = parseExcelFromDrive_(
          fileDefinition.searchKey,
          fileDefinition.type,
          savingsData.savingsMap
        );

        rows.forEach(function(row) {
          payload.general.push(row);
          if (fileDefinition.type === 'Automatizaciones') payload.automatizaciones.push(row);
          if (fileDefinition.type === 'Eventos Internos') payload.eventos.push(row);
          if (fileDefinition.type === 'Órdenes de Compra') payload.ordenes.push(row);

          if (row.pais && row.pais !== 'N/A') payload.filtros.paises.add(row.pais);
          if (row.area && row.area !== 'N/A') payload.filtros.areas.add(row.area);
          if (row.estado && row.estado !== 'N/A') payload.filtros.estados.add(row.estado);
          if (row.anio) payload.filtros.anios.add(row.anio);
          if (row.mes) payload.filtros.meses.add(row.mes);
        });
      } catch (error) {
        payload.erroresCarga.push({
          fuente: fileDefinition.type,
          mensaje: error.message
        });
        console.error('Error procesando ' + fileDefinition.type + ': ' + error.message);
      }
    });

    payload.filtros.paises = Array.from(payload.filtros.paises).sort();
    payload.filtros.areas = Array.from(payload.filtros.areas).sort();
    payload.filtros.estados = Array.from(payload.filtros.estados).sort();
    payload.filtros.anios = Array.from(payload.filtros.anios).sort(function(a, b) {
      return Number(b) - Number(a);
    });
    payload.filtros.meses = Array.from(payload.filtros.meses).sort(function(a, b) {
      return Number(a) - Number(b);
    });

    const json = JSON.stringify(payload);
    writeCache_(json);
    return json;
  } finally {
    lock.releaseLock();
  }
}

function writeCache_(content) {
  const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  const files = folder.getFilesByName(CONFIG.CACHE_NAME);
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(CONFIG.CACHE_NAME, content, MimeType.PLAIN_TEXT);
  }
}

function getTargetFile(searchKey) {
  const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  const files = folder.getFiles();
  const normalizedKey = normalizeText_(searchKey);
  let bestFile = null;
  let lastUpdated = 0;

  while (files.hasNext()) {
    const file = files.next();
    if (file.isTrashed()) continue;
    const fileName = normalizeText_(file.getName());
    if (fileName.includes(normalizedKey) && !fileName.includes('temp')) {
      const fileTime = file.getLastUpdated().getTime();
      if (fileTime > lastUpdated) {
        bestFile = file;
        lastUpdated = fileTime;
      }
    }
  }
  return bestFile;
}

function getSpreadsheetData(file) {
  let spreadsheet = null;
  let tempId = null;

  try {
    spreadsheet = SpreadsheetApp.openById(file.getId());
  } catch (openError) {
    try {
      const blob = file.getBlob();
      let tempFile;
      try {
        tempFile = Drive.Files.insert(
          { title: 'TEMP_BC_Dashboard', mimeType: MimeType.GOOGLE_SHEETS },
          blob
        );
      } catch (legacyError) {
        tempFile = Drive.Files.create(
          { name: 'TEMP_BC_Dashboard', mimeType: MimeType.GOOGLE_SHEETS },
          blob
        );
      }
      tempId = tempFile.id;
      spreadsheet = SpreadsheetApp.openById(tempId);
    } catch (conversionError) {
      console.error('No fue posible convertir ' + file.getName() + ': ' + conversionError.message);
    }
  }

  return { ss: spreadsheet, tempId: tempId };
}

function getSavingsData_() {
  const savingsMap = {};
  const precision = 1000000;
  let totalAutoUnits = 0;
  const areaUnits = {};
  const audit = {
    automatizaciones: {
      filasConValor: 0,
      filasLeidas: 0,
      filasInvalidas: 0,
      filasNegativas: 0,
      idsDuplicados: 0,
      totalFuente: 0,
      cuadra: false,
      muestrasInvalidas: []
    }
  };

  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SAVINGS_SPREADSHEET_ID);

    spreadsheet.getSheets().forEach(function(sheet) {
      const sheetName = normalizeText_(sheet.getName());
      const isAutomation = sheetName === 'automatizacion';
      const isOrder = sheetName === 'ordenes de compra';
      const isEvent = sheetName === 'eventos internos';
      if (!isAutomation && !isOrder && !isEvent) return;

      const range = sheet.getDataRange();
      const values = range.getValues();
      const displayValues = range.getDisplayValues();
      if (values.length < 2) return;

      const columns = isAutomation
        ? { id: 0, year: 2, month: 3, country: 6, area: 8, savings: 15 }
        : isOrder
          ? { id: 3, year: 0, month: 1, country: 2, area: 5, savings: 6 }
          : { id: 3, year: 0, month: 1, country: 2, area: 6, savings: 12 };

      for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex];
        const displayRow = displayValues[rowIndex];
        const rawValue = row[columns.savings];
        const displayValue = displayRow[columns.savings];
        const hasValue = rawValue !== '' && rawValue !== null &&
          String(displayValue == null ? '' : displayValue).trim() !== '';
        const hours = parseHoursValue_(rawValue, displayValue);
        const rawId = String(row[columns.id] || '')
          .trim()
          .toLowerCase()
          .replace(/\.0$/, '');

        if (isAutomation && hasValue) {
          audit.automatizaciones.filasConValor++;

          if (hours === null) {
            audit.automatizaciones.filasInvalidas++;
            if (audit.automatizaciones.muestrasInvalidas.length < 8) {
              audit.automatizaciones.muestrasInvalidas.push({
                fila: rowIndex + 1,
                valor: String(displayValue || rawValue)
              });
            }
          } else {
            audit.automatizaciones.filasLeidas++;
            if (hours < 0) audit.automatizaciones.filasNegativas++;

            const units = Math.round(hours * precision);
            totalAutoUnits += units;

            let area = String(row[columns.area] || '').trim();
            if (!area || area === '0') area = 'Sin Especificar';
            areaUnits[area] = (areaUnits[area] || 0) + units;
          }
        }

        if (rawId && hours !== null && hours !== 0) {
          if (isAutomation && savingsMap[rawId]) {
            audit.automatizaciones.idsDuplicados++;
          }
          savingsMap[rawId] = {
            value: hours,
            area: String(row[columns.area] || '').trim(),
            year: String(row[columns.year] || '').trim(),
            month: normalizeMonth_(row[columns.month]),
            pais: String(row[columns.country] || '').trim()
          };
        }
      }
    });
  } catch (error) {
    audit.error = error.message;
    console.error('Error leyendo los datos históricos: ' + error.message);
  }

  const areaSavingsAuto = {};
  Object.keys(areaUnits).forEach(function(area) {
    areaSavingsAuto[area] = areaUnits[area] / precision;
  });

  const totalBrutoAuto = totalAutoUnits / precision;
  audit.automatizaciones.totalFuente = totalBrutoAuto;
  audit.automatizaciones.cuadra = audit.automatizaciones.filasInvalidas === 0 && !audit.error;

  return {
    savingsMap: savingsMap,
    totalBrutoAuto: totalBrutoAuto,
    areaSavingsAuto: areaSavingsAuto,
    savingsAudit: audit
  };
}

function parseHoursValue_(rawValue, displayValue) {
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  let text = String(displayValue == null ? rawValue : displayValue).trim();
  if (!text) return null;
  text = text.replace(/\s/g, '').replace(/[^0-9,.\-+]/g, '');
  if (!text || !/[0-9]/.test(text)) return null;

  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    if (comma > dot) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (comma >= 0) {
    text = text.replace(',', '.');
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function parseExcelFromDrive_(searchKey, type, savingsMap) {
  const targetFile = getTargetFile(searchKey);
  if (!targetFile) {
    throw new Error('No se encontró un archivo cuyo nombre contenga "' + searchKey + '".');
  }

  const conversion = getSpreadsheetData(targetFile);
  if (!conversion.ss) {
    throw new Error('No fue posible abrir o convertir el archivo ' + targetFile.getName() + '.');
  }

  try {
    const rawData = conversion.ss.getSheets()[0].getDataRange().getValues();
    return processMondayFormat_(rawData, type, savingsMap);
  } finally {
    if (conversion.tempId) {
      try {
        DriveApp.getFileById(conversion.tempId).setTrashed(true);
      } catch (cleanupError) {
        console.error('No fue posible eliminar el archivo temporal: ' + cleanupError.message);
      }
    }
  }
}

function processMondayFormat_(data, type, savingsMap) {
  const results = [];
  let currentGroup = 'Sin Grupo';
  let headersFound = false;
  const columns = {
    name: -1,
    orderType: -1,
    country: -1,
    area: -1,
    status: -1,
    id: -1,
    date: -1,
    owner: -1
  };

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const rowText = normalizeText_(row.join(' '));

    if (!headersFound && (rowText.includes('id de elemento') || rowText.includes('item id'))) {
      columns.name = findColumn_(row, function(value) {
        return value === 'name' || value.includes('nombre');
      });
      columns.orderType = findColumn_(row, function(value) {
        return value.includes('tipo de orden de compra');
      });
      columns.country = findColumn_(row, function(value) {
        return value.includes('pais');
      });
      columns.area = findColumn_(row, function(value) {
        return value.includes('area solicitante') || value === 'area';
      });
      columns.status = findColumn_(row, function(value) {
        return value === 'estado' || value.includes('estado solicitud') ||
          value.includes('estado de po') || value === 'status';
      });
      columns.id = findColumn_(row, function(value) {
        return value.includes('id de elemento') || value.includes('item id') || value === 'id';
      });
      columns.date = findColumn_(row, function(value) {
        return value.includes('fecha de sol') || value.includes('registro de crea');
      });
      columns.owner = findColumn_(row, function(value) {
        return value === 'owner' || value === 'responsable' || value === 'propietario';
      });
      headersFound = true;
      continue;
    }

    const groupCandidate = firstNonEmptyCell_(row);
    if (groupCandidate && !rowText.includes('id de elemento') && !rowText.includes('item id')) {
      const idCheck = columns.id >= 0 ? String(row[columns.id] || '').trim() : '';
      const normalizedGroup = normalizeText_(groupCandidate);
      const isMainTitle = (normalizedGroup.includes('solicitud') || normalizedGroup.includes('dashboard')) &&
        (normalizedGroup.includes('orden') || normalizedGroup.includes('evento') ||
          normalizedGroup.includes('automat'));

      if (!idCheck && normalizedGroup !== 'name' &&
          !normalizedGroup.includes('subitems') && !isMainTitle) {
        currentGroup = groupCandidate;
      }
    }

    if (!headersFound || columns.id < 0) continue;

    const id = String(row[columns.id] || '').trim().replace(/\.0$/, '');
    const normalizedId = normalizeText_(id);
    if (!id || normalizedId.includes('id de elemento') || normalizedId.includes('item id') ||
        normalizedId.startsWith('estado')) continue;

    let name = '';
    if (type === 'Órdenes de Compra' && columns.orderType >= 0) {
      name = String(row[columns.orderType] || '').trim();
    } else if (columns.name >= 0) {
      name = String(row[columns.name] || '').trim();
    } else {
      name = String(row[0] || '').trim();
    }

    let country = columns.country >= 0 ? String(row[columns.country] || '').trim() : '';
    let area = columns.area >= 0 ? String(row[columns.area] || '').trim() : '';
    const status = columns.status >= 0 ? String(row[columns.status] || '').trim() : '';
    const applicant = extractApplicant_(row, type);
    const dateResult = parseRequestDate_(columns.date >= 0 ? row[columns.date] : null);
    const cleanStatus = cleanStatus_(status || currentGroup);

    let savings = 0;
    const savingsRecord = savingsMap[id.toLowerCase()];
    if (savingsRecord) {
      savings = Number(savingsRecord.value) || 0;
      if (savingsRecord.area) area = savingsRecord.area;
      if (savingsRecord.pais) country = savingsRecord.pais;
      if (savingsRecord.year) dateResult.year = savingsRecord.year;
      if (savingsRecord.month) dateResult.month = savingsRecord.month;
    }

    const rawOwner = columns.owner >= 0 ? String(row[columns.owner] || '').trim() : '';
    const owner = getResponsible_(type, rawOwner);

    results.push({
      tipo: type,
      nombre: name,
      grupo: currentGroup,
      pais: country || 'N/A',
      area: area || 'N/A',
      estado: cleanStatus,
      id: id,
      solicitante: applicant,
      fecha: dateResult.formatted || 'N/A',
      anio: String(dateResult.year || ''),
      mes: normalizeMonth_(dateResult.month),
      cerrada: cleanStatus === 'Procesada',
      ahorro: savings,
      responsable: owner
    });
  }

  return results;
}

function findColumn_(row, predicate) {
  return row.findIndex(function(header) {
    return predicate(normalizeText_(header));
  });
}

function firstNonEmptyCell_(row) {
  for (let index = 0; index < row.length; index++) {
    const value = String(row[index] == null ? '' : row[index]).trim();
    if (value) return value;
  }
  return '';
}

function extractApplicant_(row, type) {
  let preferredColumn = -1;
  if (type === 'Automatizaciones') preferredColumn = 2;
  if (type === 'Órdenes de Compra') preferredColumn = 9;
  if (type === 'Eventos Internos') preferredColumn = 8;

  let applicant = preferredColumn >= 0 && row[preferredColumn] !== undefined
    ? String(row[preferredColumn] || '').trim()
    : '';

  if (!applicant.includes('@')) {
    applicant = '';
    for (let index = 0; index < row.length; index++) {
      const candidate = String(row[index] || '').trim();
      if (candidate.includes('@') && !normalizeText_(candidate).includes('incoming form answer')) {
        applicant = candidate;
        break;
      }
    }
  }

  return applicant || '-';
}

function parseRequestDate_(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return { formatted: '', year: '', month: '' };
  }
  return {
    formatted: Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0')
  };
}

function cleanStatus_(value) {
  const status = normalizeText_(value);
  if (status.includes('recibida') || status.includes('nueva')) return 'Nueva';
  if (status.includes('cancelad') || status.includes('rechazad')) return 'Cancelada';
  if (status.includes('piloto')) return 'Piloto';
  if (status.includes('waiting')) return 'Waiting for user';
  if (status.includes('procesada') || status.includes('procesado') ||
      status.includes('cerrad') || status.includes('finalizad') ||
      status.includes('aprobad') || status.includes('terminad')) {
    return 'Procesada';
  }
  return 'En Proceso';
}

function getResponsible_(type, rawOwner) {
  if (type === 'Automatizaciones') return 'Gabriela Obando';
  if (type === 'Órdenes de Compra') return 'Nicole Mejia';
  if (type === 'Eventos Internos') {
    return rawOwner && normalizeText_(rawOwner) !== 'sin asignar'
      ? rawOwner
      : 'William Diaz / Daniela Rodriguez';
  }
  return rawOwner || 'Sin Asignar';
}

function normalizeMonth_(value) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return '';
  const number = Number(text);
  if (Number.isFinite(number) && number >= 1 && number <= 12) {
    return String(Math.trunc(number)).padStart(2, '0');
  }

  const monthNames = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  return monthNames[normalizeText_(text)] || text;
}

function normalizeText_(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function validateConfiguration_() {
  const required = [
    ['FOLDER_ID', CONFIG.FOLDER_ID],
    ['CONTROL_SPREADSHEET_ID', CONFIG.CONTROL_SPREADSHEET_ID],
    ['SAVINGS_SPREADSHEET_ID', CONFIG.SAVINGS_SPREADSHEET_ID]
  ];
  const missing = required.filter(function(item) {
    return !item[1] || String(item[1]).startsWith('REEMPLAZAR_');
  }).map(function(item) {
    return item[0];
  });

  if (missing.length) {
    throw new Error('Debes configurar: ' + missing.join(', ') + '.');
  }
}

function testSavingsParser_() {
  const cases = [
    [43.41, '43,41', 43.41],
    ['', '43,41 hrs', 43.41],
    ['', '1.234,56', 1234.56],
    ['', '1,234.56', 1234.56],
    ['', '-0,75', -0.75]
  ];

  cases.forEach(function(item) {
    const result = parseHoursValue_(item[0], item[1]);
    if (result === null || Math.abs(result - item[2]) > 0.000001) {
      throw new Error('Fallo del analizador para ' + item[1] + ': ' + result);
    }
  });
  console.log('Analizador de horas validado correctamente.');
}
