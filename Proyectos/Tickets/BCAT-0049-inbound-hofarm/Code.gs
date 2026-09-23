/**
 * BCAT-0049
 * Procesa Excel adjuntos de Gmail usando el Inbound del asunto y completa
 * la hoja "Liberaciones 2026 - HOFARM".
 *
 * Requisito: habilitar el servicio avanzado "Drive API" en Apps Script.
 */
function procesarInboundBCAT0049() {
  const CONFIG = {
    spreadsheetId: '1lxG6rhYINu-5cPO5Tmnggnyiu758XdWVxl_oUz9k9k8',
    sheetName: 'Liberaciones 2026 - HOFARM',
    firstDataRow: 2,
    processedLabelName: 'Procesado',
    controlSheetName: '_BCAT0049_Control'
  };

  /* ================================================================
     FUNCIONES INTERNAS
     Se mantienen dentro de esta función para poder minimizar un único bloque.
     ================================================================ */

  const normalizeText = function(value) {
    return String(value === null || value === undefined ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[:;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normalizeKey = function(value) {
    return normalizeText(value)
      .replace(/\s+/g, '')
      .replace(/\.0+$/, '');
  };

  const safeText = function(value) {
    return String(value === null || value === undefined ? '' : value).trim();
  };

  const safeValue = function(rawValue, displayValue) {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return safeText(displayValue);
    }
    return rawValue;
  };

  const isExcel = function(attachment) {
    const name = String(attachment.getName() || '').toLowerCase();
    const mimeType = String(attachment.getContentType() || '').toLowerCase();

    return /\.(xlsx|xls)$/i.test(name) ||
      mimeType.indexOf('spreadsheetml') !== -1 ||
      mimeType.indexOf('ms-excel') !== -1;
  };

  const getTemperatureType = function(temperatureText) {
    const match = String(temperatureText || '')
      .replace(',', '.')
      .match(/-?\d+(?:\.\d+)?/);

    if (!match) return '';

    const value = Number(match[0]);

    if (value >= 2 && value <= 8) return 'RF (2 to 8°C)';
    if (value > 8) return 'RT (15 to 25°C)';

    return '';
  };

  const findValueNextToLabel = function(values, labels) {
    for (let row = 0; row < values.length; row++) {
      for (let col = 0; col < values[row].length; col++) {
        const cell = normalizeText(values[row][col]);
        const labelFound = labels.some(function(label) {
          return cell.indexOf(normalizeText(label)) !== -1;
        });

        if (!labelFound) continue;

        for (let nextCol = col + 1; nextCol < values[row].length; nextCol++) {
          const nextValue = safeText(values[row][nextCol]);
          if (nextValue) return nextValue;
        }
      }
    }

    return '';
  };

  const findProductHeaders = function(values) {
    for (let row = 0; row < values.length; row++) {
      const columns = {};

      for (let col = 0; col < values[row].length; col++) {
        const header = normalizeText(values[row][col]);

        if (!header) continue;

        if (header === 'CODIGO' || header.indexOf('CODIGO ') === 0) {
          columns.code = col;
        } else if (header.indexOf('PRODUCTO') !== -1) {
          columns.product = col;
        } else if (header.indexOf('REGISTRO SANITARIO') !== -1) {
          columns.registration = col;
        } else if (header === 'LOTE' || header.indexOf('LOTE ') === 0) {
          columns.lot = col;
        } else if (header.indexOf('FECHA DE VENCIMIENTO') !== -1) {
          columns.expiration = col;
        } else if (header.indexOf('CANTIDAD SOLICITADA') !== -1) {
          columns.quantity = col;
        }
      }

      const required = [
        'code', 'product', 'registration', 'lot', 'expiration', 'quantity'
      ];

      if (required.every(function(key) { return columns[key] !== undefined; })) {
        return { row: row, columns: columns };
      }
    }

    return null;
  };

  const extractSheetData = function(sourceSheet) {
    const range = sourceSheet.getDataRange();
    const displayValues = range.getDisplayValues();
    const rawValues = range.getValues();

    const inbound = findValueNextToLabel(displayValues, [
      'INBOUND DELIVERY', 'INBOUND'
    ]);
    const airWaybill = findValueNextToLabel(displayValues, [
      'GUIA AEREA', 'GUIA AEREA N'
    ]);
    const temperature = findValueNextToLabel(displayValues, [
      'TEMPERATURA EN EL MOMENTO DE LA RECEPCION', 'TEMPERATURA'
    ]);
    const headerInfo = findProductHeaders(displayValues);

    if (!inbound || !headerInfo) {
      return { inbound: '', airWaybill: '', temperature: '', products: [] };
    }

    const products = [];

    for (let row = headerInfo.row + 1; row < displayValues.length; row++) {
      const code = safeText(displayValues[row][headerInfo.columns.code]);
      if (!code) continue;

      const product = safeText(displayValues[row][headerInfo.columns.product]);
      const quantity = safeValue(
        rawValues[row][headerInfo.columns.quantity],
        displayValues[row][headerInfo.columns.quantity]
      );
      const lot = safeText(displayValues[row][headerInfo.columns.lot]);
      const expiration = safeValue(
        rawValues[row][headerInfo.columns.expiration],
        displayValues[row][headerInfo.columns.expiration]
      );
      const registration = safeText(
        displayValues[row][headerInfo.columns.registration]
      );

      if (!product && !lot && !registration && quantity === '') continue;

      products.push({
        code: code,
        product: product,
        quantity: quantity,
        lot: lot,
        expiration: expiration,
        registration: registration
      });
    }

    return {
      inbound: inbound,
      airWaybill: airWaybill,
      temperature: temperature,
      products: products
    };
  };

  const readExcelAttachment = function(attachment) {
    const temporaryName =
      'TEMP_BCAT0049_' + new Date().getTime() + '_' + attachment.getName();
    let originalFileId = '';
    let convertedFileId = '';

    try {
      const originalFile = DriveApp.createFile(
        attachment.copyBlob().setName(temporaryName)
      );
      originalFileId = originalFile.getId();

      const convertedFile = Drive.Files.copy(
        {
          title: temporaryName,
          mimeType: MimeType.GOOGLE_SHEETS
        },
        originalFileId
      );
      convertedFileId = convertedFile.id;

      const temporarySpreadsheet = SpreadsheetApp.openById(convertedFileId);
      const sourceSheets = temporarySpreadsheet.getSheets();

      for (let i = 0; i < sourceSheets.length; i++) {
        const extracted = extractSheetData(sourceSheets[i]);
        if (extracted.inbound && extracted.products.length) return extracted;
      }

      throw new Error('No se encontró un Inbound y productos válidos en el Excel.');

    } finally {
      if (originalFileId) DriveApp.getFileById(originalFileId).setTrashed(true);
      if (convertedFileId) DriveApp.getFileById(convertedFileId).setTrashed(true);
    }
  };

  const getInboundRows = function(targetSheet, inbound) {
    const lastRow = targetSheet.getLastRow();
    if (lastRow < CONFIG.firstDataRow) return [];

    const inboundValues = targetSheet
      .getRange(CONFIG.firstDataRow, 7, lastRow - CONFIG.firstDataRow + 1, 1)
      .getDisplayValues();
    const rows = [];

    inboundValues.forEach(function(row, index) {
      if (normalizeKey(row[0]) === inbound) rows.push(CONFIG.firstDataRow + index);
    });

    return rows;
  };

  const getExistingCodes = function(targetSheet, rows) {
    const codes = new Set();

    rows.forEach(function(row) {
      const code = normalizeKey(targetSheet.getRange(row, 10).getDisplayValue());
      if (code) codes.add(code);
    });

    return codes;
  };

  const writeProducts = function(targetSheet, extracted) {
    const inbound = normalizeKey(extracted.inbound);
    const temperatureType = getTemperatureType(extracted.temperature);

    if (!temperatureType) {
      throw new Error(
        'Temperatura no válida: "' + extracted.temperature + '". '
        + 'Debe estar entre 2 y 8 °C, o ser mayor a 8 °C.'
      );
    }

    const inboundRows = getInboundRows(targetSheet, inbound);
    if (!inboundRows.length) {
      throw new Error(
        'No se encontró el Inbound ' + extracted.inbound + ' en la columna G.'
      );
    }

    const existingCodes = getExistingCodes(targetSheet, inboundRows);
    const newProducts = extracted.products.filter(function(product) {
      const code = normalizeKey(product.code);
      if (!code || existingCodes.has(code)) return false;
      existingCodes.add(code);
      return true;
    });

    const duplicates = extracted.products.length - newProducts.length;
    if (!newProducts.length) return { added: 0, duplicated: duplicates };

    const baseRow = inboundRows[0];
    const baseValues = targetSheet.getRange(baseRow, 1, 1, 15).getValues()[0];
    const maxColumns = Math.max(15, targetSheet.getLastColumn());
    let lastInboundRow = Math.max.apply(null, inboundRows);
    let useOriginalRow = safeText(targetSheet.getRange(baseRow, 10).getDisplayValue()) === '';

    newProducts.forEach(function(product) {
      let targetRow;

      if (useOriginalRow) {
        targetRow = baseRow;
        useOriginalRow = false;
      } else {
        targetSheet.insertRowAfter(lastInboundRow);
        targetRow = lastInboundRow + 1;
        lastInboundRow = targetRow;

        targetSheet.getRange(baseRow, 1, 1, maxColumns).copyTo(
          targetSheet.getRange(targetRow, 1, 1, maxColumns),
          SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
          false
        );

        const newRowValues = new Array(15).fill('');
        newRowValues[1] = baseValues[1]; // B
        newRowValues[2] = baseValues[2]; // C
        newRowValues[3] = baseValues[3]; // D
        newRowValues[4] = baseValues[4]; // E
        newRowValues[6] = extracted.inbound; // G
        targetSheet.getRange(targetRow, 1, 1, 15).setValues([newRowValues]);
      }

      targetSheet.getRange(targetRow, 6).setValue(extracted.airWaybill); // F
      targetSheet.getRange(targetRow, 8).setValue(temperatureType); // H
      targetSheet.getRange(targetRow, 10).setValue(product.code); // J
      targetSheet.getRange(targetRow, 11).setValue(product.product); // K
      targetSheet.getRange(targetRow, 12).setValue(product.quantity); // L
      targetSheet.getRange(targetRow, 13).setValue(product.lot); // M
      targetSheet.getRange(targetRow, 14).setValue(product.expiration); // N
      targetSheet.getRange(targetRow, 15).setValue(product.registration); // O
    });

    return { added: newProducts.length, duplicated: duplicates };
  };

  const getControlSheet = function(spreadsheet) {
    let controlSheet = spreadsheet.getSheetByName(CONFIG.controlSheetName);

    if (!controlSheet) {
      controlSheet = spreadsheet.insertSheet(CONFIG.controlSheetName);
      controlSheet.getRange(1, 1, 1, 7).setValues([[
        'Message ID',
        'Fecha procesamiento',
        'Inbound',
        'Asunto',
        'Adjuntos Excel',
        'Productos agregados',
        'Duplicados omitidos'
      ]]);
      controlSheet.hideSheet();
      Logger.log('[BCAT-0049] Hoja de control creada.');
    }

    return controlSheet;
  };

  const getProcessedMessageIds = function(controlSheet) {
    const processed = new Set();
    const lastRow = controlSheet.getLastRow();
    if (lastRow < 2) return processed;

    controlSheet.getRange(2, 1, lastRow - 1, 1).getValues()
      .forEach(function(row) {
        const messageId = safeText(row[0]);
        if (messageId) processed.add(messageId);
      });

    return processed;
  };

  const registerProcessedMessage = function(controlSheet, message, inbound, summary) {
    const excelCount = message.getAttachments().filter(isExcel).length;

    controlSheet.appendRow([
      message.getId(),
      new Date(),
      inbound,
      message.getSubject(),
      excelCount,
      summary.added,
      summary.duplicated
    ]);
  };

  /* ================================================================
     PROCESO PRINCIPAL
     ================================================================ */

  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error('Hay otra ejecución en curso. Intenta nuevamente en un minuto.');
  }

  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const targetSheet = spreadsheet.getSheetByName(CONFIG.sheetName);

    if (!targetSheet) {
      throw new Error('No se encontró la hoja destino: ' + CONFIG.sheetName);
    }

    const controlSheet = getControlSheet(spreadsheet);
    const processedMessageIds = getProcessedMessageIds(controlSheet);
    const processedLabel = GmailApp.getUserLabelByName(CONFIG.processedLabelName) ||
      GmailApp.createLabel(CONFIG.processedLabelName);

    const lastRow = targetSheet.getLastRow();
    if (lastRow < CONFIG.firstDataRow) {
      Logger.log('[BCAT-0049] No hay Inbounds para revisar.');
      return;
    }

    const inbounds = targetSheet
      .getRange(CONFIG.firstDataRow, 7, lastRow - CONFIG.firstDataRow + 1, 1)
      .getDisplayValues()
      .map(function(row) { return normalizeKey(row[0]); })
      .filter(function(inbound) { return inbound !== ''; });

    const uniqueInbounds = Array.from(new Set(inbounds));
    let processedMessages = 0;
    let processedFiles = 0;
    let addedProducts = 0;
    let skippedDuplicates = 0;
    let errors = 0;

    Logger.log('[BCAT-0049] Inicio. | Inbounds: ' + uniqueInbounds.length);

    uniqueInbounds.forEach(function(inbound) {
      const threads = GmailApp.search(
        'in:inbox has:attachment subject:"' + inbound + '"'
      );

      threads.forEach(function(thread) {
        thread.getMessages().forEach(function(message) {
          if (processedMessageIds.has(message.getId())) return;
          if (normalizeKey(message.getSubject()).indexOf(inbound) === -1) return;

          const excelAttachments = message.getAttachments().filter(isExcel);
          if (!excelAttachments.length) return;

          let messageOk = true;
          let attachmentProcessed = false;
          const summary = { added: 0, duplicated: 0 };

          excelAttachments.forEach(function(attachment) {
            try {
              const extracted = readExcelAttachment(attachment);

              if (normalizeKey(extracted.inbound) !== inbound) {
                throw new Error(
                  'Inbound del Excel (' + extracted.inbound +
                  ') distinto al Inbound del asunto (' + inbound + ').'
                );
              }

              const result = writeProducts(targetSheet, extracted);
              summary.added += result.added;
              summary.duplicated += result.duplicated;
              processedFiles++;
              attachmentProcessed = true;

              Logger.log(
                '[BCAT-0049] Excel procesado. | inbound: ' + inbound +
                ' | archivo: ' + attachment.getName() +
                ' | agregados: ' + result.added +
                ' | duplicados: ' + result.duplicated
              );

            } catch (error) {
              messageOk = false;
              errors++;
              Logger.log(
                '[BCAT-0049] Error en Excel. | inbound: ' + inbound +
                ' | archivo: ' + attachment.getName() +
                ' | motivo: ' + error.message
              );
            }
          });

          if (messageOk && attachmentProcessed) {
            registerProcessedMessage(controlSheet, message, inbound, summary);
            processedMessageIds.add(message.getId());
            thread.addLabel(processedLabel);

            processedMessages++;
            addedProducts += summary.added;
            skippedDuplicates += summary.duplicated;

            Logger.log(
              '[BCAT-0049] Correo marcado Procesado. | inbound: ' + inbound +
              ' | asunto: ' + message.getSubject()
            );
          }
        });
      });
    });

    SpreadsheetApp.flush();

    Logger.log(
      '[BCAT-0049] Fin. | mensajes: ' + processedMessages +
      ' | Excel: ' + processedFiles +
      ' | productos agregados: ' + addedProducts +
      ' | duplicados omitidos: ' + skippedDuplicates +
      ' | errores: ' + errors
    );

  } finally {
    lock.releaseLock();
  }
}
