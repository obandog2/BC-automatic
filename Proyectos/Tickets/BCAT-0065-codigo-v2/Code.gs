/**
 * BCAT-0065 - Versión 2 vinculada al archivo Tool.
 */

const CONFIG = Object.freeze({
  TOOL_SPREADSHEET_ID: '1_KGwTYFT3ju7Egjb4rRD-CjvOA1X77_SoUpP9PpylT4',
  TEMPLATE_SPREADSHEET_ID: '1sKBd5hdDkEkZMCRh1e6xGhRphsfg0OZkhKHFtN4AzAw',
  TOOL_SHEET: 'Tool',
  TEMPLATE_SHEET: 'Plan de acción',
  CONTROL_SHEET: '_Control',
  RESPONSE_SHEET: 'Respuestas HPV',
  TOOL_FIRST_ROW: 2,
  ACTION_FIRST_ROW: 9,
  FORM_TITLE: 'Respuesta de acción HPV',
  NOTIFICATION_EMAIL: 'gabriela.obando_angulo@external.roche.com',
  FORM_PROPERTY: 'HPV_V2_FORM_ID',
  ALLOWED_DOMAINS: Object.freeze([
    'roche.com',
    'contractors.roche.com',
    'business.roche.com',
    'external.roche.com'
  ]),
  FORM_FIELDS: Object.freeze({
    TRACKING: 'Código de seguimiento',
    COMPLETED: 'Acción completada',
    DELIVERABLE: 'Entregable o enlace',
    COMMENT: 'Comentario'
  })
});

const CONTROL_HEADERS = Object.freeze([
  'Tipo', 'ID proceso', 'Hoja', 'Fila Tool', 'Fila acción', 'Secuencia',
  'ID acción', 'Tarea', 'Correo responsable', 'Fecha límite', 'Estado',
  'Fecha envío', 'Fecha respuesta', 'Correo respuesta', 'Resultado'
]);

const RESPONSE_HEADERS = Object.freeze([
  'Fecha y hora', 'ID proceso', 'ID acción', 'Hoja', 'Correo responsable',
  'Correo respondiente', 'Acción completada', 'Entregable', 'Comentario',
  'Resultado técnico', 'Aplicada a la hoja'
]);

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('HPV')
    .addItem('Configurar sistema', 'setupSistema')
    .addSeparator()
    .addItem('Generar hojas', 'generarHojas')
    .addItem('Envío de acción', 'envioDeAccion')
    .addToUi();
}

function setupSistema() {
  log_('SETUP_INICIO', 'Iniciando configuración del sistema.');
  const spreadsheet = getToolSpreadsheet_();
  validateBoundProject_(spreadsheet);
  const toolSheet = spreadsheet.getSheetByName(CONFIG.TOOL_SHEET);
  if (!toolSheet) throw new Error('No existe la pestaña "' + CONFIG.TOOL_SHEET + '".');

  configureControlSheet_(spreadsheet);
  configureResponseSheet_(spreadsheet);
  const form = getOrCreateForm_();
  installFormTrigger_(form);

  const result = {
    archivoTool: spreadsheet.getUrl(),
    formularioEdicion: form.getEditUrl(),
    formularioRespuesta: form.getPublishedUrl()
  };
  log_('SETUP_FIN', 'Configuración lista. Ahora usa HPV > Generar hojas.', {
    formulario: form.getPublishedUrl()
  });
  return result;
}

function generarHojas() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const spreadsheet = getToolSpreadsheet_();
    const toolSheet = spreadsheet.getSheetByName(CONFIG.TOOL_SHEET);
    const lastRow = toolSheet.getLastRow();
    log_('GENERAR_LECTURA', 'Revisando las filas de Tool.', { ultimaFila: lastRow });
    if (lastRow < CONFIG.TOOL_FIRST_ROW) return;

    const rows = toolSheet.getRange(
      CONFIG.TOOL_FIRST_ROW, 1, lastRow - CONFIG.TOOL_FIRST_ROW + 1, 3
    ).getValues();
    const eligible = [];
    rows.forEach(function(row, index) {
      const rowNumber = CONFIG.TOOL_FIRST_ROW + index;
      const checked = row[0] === true;
      const name = String(row[1] || '').trim();
      const status = String(row[2] || '').trim();
      if (checked && name && !status) eligible.push({ rowNumber: rowNumber, name: name });
    });

    log_('GENERAR_ELEGIBLES', 'Filas listas para crear.', { cantidad: eligible.length });
    if (!eligible.length) {
      log_('GENERAR_SIN_DATOS', 'No se creó ninguna pestaña: no hay filas con A marcada, B llena y C vacía.');
      return;
    }

    const ui = SpreadsheetApp.getUi();
    const answer = ui.alert(
      'Confirmación',
      'Se procesarán ' + eligible.length + ' fila(s). ¿Está seguro de proceder?',
      ui.ButtonSet.YES_NO
    );
    if (answer !== ui.Button.YES) {
      log_('GENERAR_CANCELADO', 'Proceso cancelado. No se creó ninguna pestaña.');
      return;
    }

    const templateSpreadsheet = SpreadsheetApp.openById(CONFIG.TEMPLATE_SPREADSHEET_ID);
    const templateSheet = getSheetByNormalizedName_(templateSpreadsheet, CONFIG.TEMPLATE_SHEET);
    const controlSheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
    const results = { created: 0, failed: 0 };

    eligible.forEach(function(item) {
      try {
        log_('GENERAR_FILA_INICIO', 'Creando la pestaña solicitada.', {
          fila: item.rowNumber, nombre: item.name
        });
        validateNewSheetName_(spreadsheet, item.name);
        const processId = getNextProcessId_(controlSheet);
        const copiedSheet = templateSheet.copyTo(spreadsheet).setName(item.name);
        controlSheet.appendRow([
          'PROCESO', processId, copiedSheet.getName(), item.rowNumber, '', '', '', '', '', '',
          'CREADO', '', '', '', ''
        ]);
        toolSheet.getRange(item.rowNumber, 3).setValue('Completado');
        results.created++;
        log_('GENERAR_FILA_FIN', 'CREADO: se creó la pestaña y se marcó la fila como Completado.', {
          nombre: copiedSheet.getName(), id: processId, filaTool: item.rowNumber
        });
      } catch (error) {
        results.failed++;
        log_('GENERAR_FILA_ERROR', 'NO CREADO: ocurrió un error al crear la pestaña.', {
          nombre: item.name, filaTool: item.rowNumber, motivo: error.message
        });
        appendControlError_(controlSheet, item.rowNumber, item.name, error.message);
      }
    });
    SpreadsheetApp.flush();
    log_('GENERAR_RESUMEN', 'Resultado final de creación.', {
      creadas: results.created, conError: results.failed
    });
    ui.alert(
      'Proceso terminado',
      'Hojas creadas: ' + results.created + '. Filas con error: ' + results.failed + '.',
      ui.ButtonSet.OK
    );
  } finally {
    lock.releaseLock();
  }
}

function envioDeAccion() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const spreadsheet = getToolSpreadsheet_();
    const controlSheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
    const processes = findControlRows_(controlSheet, 'PROCESO').filter(function(record) {
      return ['CREADO', 'INICIADO', 'SIN_ACCION_INICIAL', 'SIN_CORREO', 'DOMINIO_NO_PERMITIDO']
        .indexOf(record.values[10]) !== -1;
    });
    log_('ENVIO_LOTE_INICIO', 'Procesos pendientes de primer envío.', { cantidad: processes.length });
    if (!processes.length) return;

    const summary = { sent: 0, skipped: 0, errors: 0 };
    processes.forEach(function(processRecord) {
      try {
        const processId = processRecord.values[1];
        const sheetName = processRecord.values[2];
        log_('ENVIO_PROCESO_INICIO', 'Validando proceso.', {
          idProceso: processId, hoja: sheetName
        });
        const processSheet = spreadsheet.getSheetByName(sheetName);
        if (!processSheet) throw new Error('No existe la hoja del proceso.');

        const firstTask = String(processSheet.getRange(CONFIG.ACTION_FIRST_ROW, 3).getDisplayValue()).trim();
        const firstEmail = normalizeEmail_(
          processSheet.getRange(CONFIG.ACTION_FIRST_ROW, 5).getDisplayValue()
        );
        log_('ENVIO_VALIDACION_C9_E9', 'Resultado de validación inicial.', {
          idProceso: processId, tareaC9: firstTask, correoE9: firstEmail
        });

        if (!firstTask) {
          setControlStatus_(controlSheet, processRecord.rowNumber, 'SIN_ACCION_INICIAL');
          summary.skipped++;
          return;
        }
        if (!firstEmail) {
          setControlStatus_(controlSheet, processRecord.rowNumber, 'SIN_CORREO');
          summary.skipped++;
          return;
        }
        if (!isAllowedRocheEmail_(firstEmail)) {
          setControlStatus_(controlSheet, processRecord.rowNumber, 'DOMINIO_NO_PERMITIDO');
          summary.skipped++;
          return;
        }

        initializeActions_(processRecord);
        const result = sendNextAction_(processId);
        if (result.sent) {
          setControlStatus_(controlSheet, processRecord.rowNumber, 'INICIADO');
          summary.sent++;
        } else {
          summary.skipped++;
        }
        log_('ENVIO_PROCESO_FIN', result.message, { idProceso: processId });
      } catch (error) {
        summary.errors++;
        log_('ENVIO_PROCESO_ERROR', 'Fallo al iniciar proceso.', {
          idProceso: processRecord.values[1], error: error.message
        });
      }
    });
    SpreadsheetApp.flush();
    log_('ENVIO_LOTE_FIN', 'Finalizó el envío inicial en lote.', summary);
    SpreadsheetApp.getUi().alert(
      'Envío de acción',
      'Correos enviados: ' + summary.sent + '. Omitidos: ' + summary.skipped +
        '. Errores: ' + summary.errors + '.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } finally {
    lock.releaseLock();
  }
}

function initializeActions_(processRecord) {
  const spreadsheet = getToolSpreadsheet_();
  const controlSheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
  const processId = processRecord.values[1];
  if (findControlRows_(controlSheet, 'ACCION', processId).length) {
    log_('ACCIONES_EXISTENTES', 'Las acciones ya estaban registradas.', { idProceso: processId });
    return;
  }

  const sheet = spreadsheet.getSheetByName(processRecord.values[2]);
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(
    CONFIG.ACTION_FIRST_ROW, 3, lastRow - CONFIG.ACTION_FIRST_ROW + 1, 9
  ).getValues();
  const rows = [];
  let sequence = 0;
  values.forEach(function(row, index) {
    const task = String(row[0] || '').trim();
    if (!task) return;
    sequence++;
    rows.push([
      'ACCION', processId, sheet.getName(), processRecord.values[3],
      CONFIG.ACTION_FIRST_ROW + index, sequence,
      processId + '-A' + String(sequence).padStart(2, '0'),
      task, normalizeEmail_(row[2]), row[4] || '', 'PENDIENTE', '', '', '', ''
    ]);
  });
  if (!rows.length) throw new Error('No se encontraron acciones desde la fila 9.');
  controlSheet.getRange(controlSheet.getLastRow() + 1, 1, rows.length, CONTROL_HEADERS.length)
    .setValues(rows);
  log_('ACCIONES_CREADAS', 'Acciones registradas en _Control.', {
    idProceso: processId, cantidad: rows.length
  });
}

function sendNextAction_(processId) {
  const spreadsheet = getToolSpreadsheet_();
  const controlSheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
  const actions = findControlRows_(controlSheet, 'ACCION', processId)
    .sort(function(a, b) { return Number(a.values[5]) - Number(b.values[5]); });
  const active = actions.find(function(record) { return record.values[10] === 'ENVIADA'; });
  if (active) return { sent: false, message: active.values[6] + ' ya espera respuesta.' };

  const next = actions.find(function(record) {
    return ['PENDIENTE', 'SIN_CORREO', 'DOMINIO_NO_PERMITIDO'].indexOf(record.values[10]) !== -1;
  });
  if (!next) {
    if (actions.length && actions.every(function(record) { return record.values[10] === 'FINALIZADA'; })) {
      finishProcess_(processId);
      return { sent: false, message: processId + ' finalizado.' };
    }
    return { sent: false, message: 'No existe una acción disponible.' };
  }

  const processSheet = spreadsheet.getSheetByName(next.values[2]);
  const email = normalizeEmail_(processSheet.getRange(Number(next.values[4]), 5).getDisplayValue());
  controlSheet.getRange(next.rowNumber, 9).setValue(email);
  if (!email) {
    setControlStatus_(controlSheet, next.rowNumber, 'SIN_CORREO');
    log_('ACCION_SIN_CORREO', 'La secuencia se detuvo.', { idAccion: next.values[6] });
    return { sent: false, message: next.values[6] + ' no tiene correo.' };
  }
  if (!isAllowedRocheEmail_(email)) {
    setControlStatus_(controlSheet, next.rowNumber, 'DOMINIO_NO_PERMITIDO');
    log_('ACCION_DOMINIO_INVALIDO', 'La secuencia se detuvo.', {
      idAccion: next.values[6], correo: email
    });
    return { sent: false, message: next.values[6] + ' tiene un dominio no permitido.' };
  }

  sendActionEmail_(next, email);
  return { sent: true, message: 'Se envió ' + next.values[6] + ' a ' + email + '.' };
}

function sendActionEmail_(record, email) {
  const values = record.values;
  const processId = values[1];
  const actionId = values[6];
  const task = values[7];
  const deadline = formatDate_(values[9]);
  const formUrl = createPrefilledUrl_(actionId);
  const subject = '[' + processId + '] Acción A' + String(values[5]).padStart(2, '0') + ' - ' + task;
  log_('CORREO_INICIO', 'Enviando correo.', {
    idProceso: processId, idAccion: actionId, destinatario: email, asunto: subject
  });
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: 'Acción: ' + task + '\nFecha límite: ' + deadline + '\nResponder: ' + formUrl,
    htmlBody: buildEmailHtml_(processId, task, deadline, formUrl),
    name: 'Planes de acción HPV'
  });
  const controlSheet = getToolSpreadsheet_().getSheetByName(CONFIG.CONTROL_SHEET);
  controlSheet.getRange(record.rowNumber, 11, 1, 2)
    .setValues([['ENVIADA', new Date()]]);
  controlSheet.getRange(record.rowNumber, 12).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  log_('CORREO_FIN', 'Correo enviado y registrado.', { idAccion: actionId });
}

function alEnviarFormulario(event) {
  if (!event || !event.response) throw new Error('Esta función solo se ejecuta mediante el trigger.');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    processFormResponse_(event.response);
  } catch (error) {
    log_('FORM_ERROR', 'Error al procesar respuesta.', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function processFormResponse_(response) {
  const timestamp = response.getTimestamp() || new Date();
  const respondent = normalizeEmail_(response.getRespondentEmail());
  const answers = getAnswers_(response);
  const actionId = String(answers[CONFIG.FORM_FIELDS.TRACKING] || '').trim().toUpperCase();
  const completed = String(answers[CONFIG.FORM_FIELDS.COMPLETED] || '').trim();
  const deliverable = String(answers[CONFIG.FORM_FIELDS.DELIVERABLE] || '').trim();
  const comment = String(answers[CONFIG.FORM_FIELDS.COMMENT] || '').trim();
  const parsed = parseActionId_(actionId);
  const spreadsheet = getToolSpreadsheet_();
  const controlSheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
  const record = actionId ? findAction_(controlSheet, actionId) : null;
  let result = 'ACEPTADA';
  let applied = 'No';
  let notifyNotCompleted = false;

  log_('FORM_RECIBIDO', 'Respuesta recibida.', {
    idAccion: actionId, correo: respondent, completada: completed
  });
  if (!parsed) result = 'CODIGO_INVALIDO';
  else if (!isAllowedRocheEmail_(respondent)) result = 'DOMINIO_NO_PERMITIDO';
  else if (!record) result = 'ACCION_NO_ENCONTRADA';
  else if (record.values[10] === 'FINALIZADA') result = 'DUPLICADA';
  else if (record.values[10] !== 'ENVIADA') result = 'ACCION_NO_ACTIVA';
  else if (normalizeText_(completed) !== 'si') {
    result = 'NO_COMPLETADA';
    controlSheet.getRange(record.rowNumber, 13, 1, 3)
      .setValues([[timestamp, respondent, 'No']]);
    notifyNotCompleted = true;
  } else {
    applyCompleted_(record, timestamp, respondent, deliverable, comment);
    result = 'COMPLETADA';
    applied = 'Sí';
  }

  appendResponse_([
    timestamp, parsed ? parsed.processId : '', actionId,
    record ? record.values[2] : '', record ? record.values[8] : '', respondent,
    completed, deliverable, comment, result, applied
  ]);
  log_('FORM_RESULTADO', 'Respuesta clasificada.', {
    idAccion: actionId, resultado: result, aplicada: applied
  });
  if (notifyNotCompleted) {
    try {
      notifyNotCompleted_(parsed.processId, actionId, respondent, comment);
    } catch (notificationError) {
      log_('NOTIFICACION_ERROR', 'La respuesta quedó guardada, pero falló la notificación.', {
        idAccion: actionId, error: notificationError.message
      });
    }
  }
  if (result === 'COMPLETADA') sendNextAction_(parsed.processId);
}

function applyCompleted_(record, timestamp, respondent, deliverable, comment) {
  const spreadsheet = getToolSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(record.values[2]);
  const row = Number(record.values[4]);
  sheet.getRange(row, 8, 1, 4).setValues([[
    timestamp, 'Finalizado', safeCell_(deliverable), safeCell_(comment)
  ]]);
  sheet.getRange(row, 8).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  const controlSheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
  controlSheet.getRange(record.rowNumber, 11).setValue('FINALIZADA');
  controlSheet.getRange(record.rowNumber, 13, 1, 3)
    .setValues([[timestamp, respondent, 'Sí']]);
  log_('HOJA_ACTUALIZADA', 'Se actualizaron H:K.', {
    hoja: sheet.getName(), fila: row, idAccion: record.values[6]
  });
}

function finishProcess_(processId) {
  const controlSheet = getToolSpreadsheet_().getSheetByName(CONFIG.CONTROL_SHEET);
  const process = findProcess_(controlSheet, processId);
  if (!process || process.values[10] === 'FINALIZADO') return;
  setControlStatus_(controlSheet, process.rowNumber, 'FINALIZADO');
  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: '[' + processId + '] Plan de acción finalizado',
    body: 'El plan ' + processId + ' completó todas sus acciones.',
    name: 'Planes de acción HPV'
  });
  log_('PROCESO_FINALIZADO', 'Se envió la notificación final.', { idProceso: processId });
}

function notifyNotCompleted_(processId, actionId, email, comment) {
  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: '[' + processId + '] Acción no completada - ' + actionId,
    body: 'Respondió: ' + email + '\nComentario: ' + (comment || 'Sin comentario') +
      '\nLa secuencia no avanzó.',
    name: 'Planes de acción HPV'
  });
  log_('ACCION_NO_COMPLETADA', 'Se notificó y la secuencia no avanzó.', { idAccion: actionId });
}

function configureControlSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.CONTROL_SHEET);
    log_('SETUP_CONTROL', 'Se creó _Control.');
  }
  sheet.getRange(1, 1, 1, CONTROL_HEADERS.length).setValues([CONTROL_HEADERS]);
  formatHeader_(sheet, CONTROL_HEADERS.length);
  sheet.setFrozenRows(1);
  if (!sheet.isSheetHidden()) sheet.hideSheet();
}

function configureResponseSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.RESPONSE_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.RESPONSE_SHEET);
    log_('SETUP_RESPUESTAS', 'Se creó Respuestas HPV.');
  }
  sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
  formatHeader_(sheet, RESPONSE_HEADERS.length);
  sheet.setFrozenRows(1);
}

function getOrCreateForm_() {
  const properties = PropertiesService.getScriptProperties();
  const id = properties.getProperty(CONFIG.FORM_PROPERTY);
  if (id) {
    try {
      const existing = FormApp.openById(id);
      log_('SETUP_FORM_REUSADO', 'Se reutilizó el formulario.', { formId: id });
      return existing;
    } catch (error) {
      log_('SETUP_FORM_NO_ENCONTRADO', 'Se creará un formulario nuevo.', { error: error.message });
    }
  }
  const form = FormApp.create(CONFIG.FORM_TITLE)
    .setDescription('Registro de resultados de acciones HPV.')
    .setCollectEmail(true)
    .setLimitOneResponsePerUser(false)
    .setAcceptingResponses(true)
    .setConfirmationMessage('La respuesta fue registrada.');
  form.addTextItem().setTitle(CONFIG.FORM_FIELDS.TRACKING).setRequired(true);
  form.addMultipleChoiceItem().setTitle(CONFIG.FORM_FIELDS.COMPLETED)
    .setChoiceValues(['Sí', 'No']).setRequired(true);
  form.addTextItem().setTitle(CONFIG.FORM_FIELDS.DELIVERABLE);
  form.addParagraphTextItem().setTitle(CONFIG.FORM_FIELDS.COMMENT);
  properties.setProperty(CONFIG.FORM_PROPERTY, form.getId());
  log_('SETUP_FORM_CREADO', 'Se creó el formulario.', { formId: form.getId() });
  return form;
}

function installFormTrigger_(form) {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'alEnviarFormulario') ScriptApp.deleteTrigger(trigger);
  });
  const trigger = ScriptApp.newTrigger('alEnviarFormulario').forForm(form).onFormSubmit().create();
  log_('SETUP_TRIGGER', 'Se instaló el trigger del formulario.', { triggerId: trigger.getUniqueId() });
}

function createPrefilledUrl_(actionId) {
  const form = getForm_();
  const item = form.getItems(FormApp.ItemType.TEXT).map(function(value) {
    return value.asTextItem();
  }).find(function(value) {
    return value.getTitle() === CONFIG.FORM_FIELDS.TRACKING;
  });
  if (!item) throw new Error('No existe el campo Código de seguimiento.');
  return form.createResponse().withItemResponse(item.createResponse(actionId)).toPrefilledUrl();
}

function buildEmailHtml_(processId, task, deadline, url) {
  return '<div style="font-family:Arial,sans-serif;max-width:620px;color:#17252d">' +
    '<h2 style="color:#0066cc">Acción pendiente</h2>' +
    '<p>Plan: <strong>' + escapeHtml_(processId) + '</strong></p>' +
    '<p>Acción: ' + escapeHtml_(task) + '</p>' +
    '<p>Fecha límite: ' + escapeHtml_(deadline) + '</p>' +
    '<p><a href="' + escapeHtml_(url) + '" style="display:inline-block;background:#0066cc;' +
    'color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold">' +
    'Responder acción</a></p></div>';
}

function getToolSpreadsheet_() {
  return SpreadsheetApp.openById(CONFIG.TOOL_SPREADSHEET_ID);
}

function validateBoundProject_(spreadsheet) {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active || active.getId() !== CONFIG.TOOL_SPREADSHEET_ID) {
    throw new Error('Abre el archivo Tool y crea el proyecto desde Extensiones > Apps Script.');
  }
  log_('SETUP_ARCHIVO_VALIDADO', 'El proyecto está vinculado al archivo Tool.', {
    spreadsheetId: spreadsheet.getId()
  });
}

function getForm_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.FORM_PROPERTY);
  if (!id) throw new Error('Ejecuta setupSistema() antes de enviar acciones.');
  return FormApp.openById(id);
}

function getSheetByNormalizedName_(spreadsheet, name) {
  const target = normalizeText_(name);
  const sheet = spreadsheet.getSheets().find(function(value) {
    return normalizeText_(value.getName()) === target;
  });
  if (!sheet) throw new Error('No existe la pestaña "' + name + '" en la plantilla.');
  return sheet;
}

function validateNewSheetName_(spreadsheet, name) {
  if (!name || name.length > 100 || /[\\/?*\[\]:]/.test(name)) {
    throw new Error('El nombre no es válido para una pestaña de Google Sheets.');
  }
  if (spreadsheet.getSheetByName(name)) throw new Error('Ya existe una pestaña con ese nombre.');
}

function getNextProcessId_(controlSheet) {
  const records = findControlRows_(controlSheet, 'PROCESO');
  let max = 0;
  records.forEach(function(record) {
    const match = String(record.values[1]).match(/^HPV-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return 'HPV-' + String(max + 1).padStart(2, '0');
}

function findControlRows_(sheet, type, processId) {
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, CONTROL_HEADERS.length).getValues()
    .map(function(values, index) { return { rowNumber: index + 2, values: values }; })
    .filter(function(record) {
      return record.values[0] === type && (!processId || record.values[1] === processId);
    });
}

function findAction_(sheet, actionId) {
  return findControlRows_(sheet, 'ACCION').find(function(record) {
    return record.values[6] === actionId;
  }) || null;
}

function findProcess_(sheet, processId) {
  return findControlRows_(sheet, 'PROCESO', processId)[0] || null;
}

function appendControlError_(sheet, toolRow, sheetName, message) {
  sheet.appendRow([
    'ERROR', '', sheetName, toolRow, '', '', '', '', '', '', 'ERROR_CREACION', '', '', '', message
  ]);
}

function appendResponse_(row) {
  const sheet = getToolSpreadsheet_().getSheetByName(CONFIG.RESPONSE_SHEET);
  sheet.appendRow(row.map(safeCell_));
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function setControlStatus_(sheet, row, status) {
  sheet.getRange(row, 11).setValue(status);
  log_('CONTROL_ESTADO', 'Estado actualizado.', { filaControl: row, estado: status });
}

function getAnswers_(response) {
  const answers = {};
  response.getItemResponses().forEach(function(item) {
    answers[item.getItem().getTitle()] = item.getResponse();
  });
  return answers;
}

function parseActionId_(value) {
  const match = String(value || '').trim().toUpperCase().match(/^(HPV-\d+)-A(\d+)$/);
  return match ? { processId: match[1], sequence: Number(match[2]) } : null;
}

function isAllowedRocheEmail_(email) {
  const normalized = normalizeEmail_(email);
  const domain = normalized.split('@')[1] || '';
  return CONFIG.ALLOWED_DOMAINS.indexOf(domain) !== -1;
}

function normalizeEmail_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function normalizeText_(value) {
  return String(value == null ? '' : value).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function safeCell_(value) {
  if (value instanceof Date) return value;
  const text = String(value == null ? '' : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatDate_(value) {
  return value instanceof Date && !isNaN(value.getTime())
    ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy')
    : String(value || 'No indicada');
}

function formatHeader_(sheet, columns) {
  sheet.getRange(1, 1, 1, columns).setBackground('#0b3d91')
    .setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
}

function log_(step, message, data) {
  const details = data && typeof data === 'object'
    ? Object.keys(data).map(function(key) {
        const value = data[key] === '' || data[key] == null ? '(vacío)' : data[key];
        return key + ': ' + String(value);
      }).join(' | ')
    : '';
  Logger.log('[HPV] ' + message + (details ? ' | ' + details : ''));
}
