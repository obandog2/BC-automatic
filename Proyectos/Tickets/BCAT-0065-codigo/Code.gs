/**
 * BCAT-0065 - Flujo secuencial HPV
 * Proyecto de Apps Script vinculado al archivo histórico de procesos.
 */

const CONFIG = Object.freeze({
  TEMPLATE_SPREADSHEET_ID: '1sKBd5hdDkEkZMCRh1e6xGhRphsfg0OZkhKHFtN4AzAw',
  ROOT_FOLDER_NAME: 'HPV - Planes de acción',
  MASTER_FILE_NAME: 'Histórico de procesos HPV',
  RESPONSE_FILE_NAME: 'Histórico de respuestas HPV',
  FORM_TITLE: 'Respuesta de acción HPV',
  PROCESS_SHEET: 'Procesos',
  CONTROL_SHEET: '_Control',
  RESPONSE_SHEET: 'Respuestas',
  PLAN_SHEET: 'Plan de acción',
  START_ROW: 9,
  NOTIFICATION_EMAIL: 'gabriela.obando_angulo@external.roche.com',
  PROCESS_PREFIX: 'HPV-',
  PROCESS_DIGITS: 2,
  ALLOWED_DOMAINS: Object.freeze([
    'roche.com',
    'contractors.roche.com',
    'business.roche.com'
  ]),
  FORM_FIELDS: Object.freeze({
    TRACKING: 'Código de seguimiento',
    COMPLETED: 'Acción completada',
    DELIVERABLE: 'Entregable o enlace',
    COMMENT: 'Comentario'
  }),
  PROPERTIES: Object.freeze({
    MASTER_ID: 'HPV_MASTER_SPREADSHEET_ID',
    ROOT_FOLDER_ID: 'HPV_ROOT_FOLDER_ID',
    RESPONSE_ID: 'HPV_RESPONSE_SPREADSHEET_ID',
    FORM_ID: 'HPV_FORM_ID'
  })
});

const CONTROL_HEADERS = Object.freeze([
  'Tipo', 'ID proceso', 'ID acción', 'ID archivo', 'Fila', 'Secuencia',
  'Tarea', 'Correo responsable', 'Fecha límite', 'Estado', 'Fecha envío',
  'Fecha respuesta', 'Correo respuesta', 'Resultado', 'ID carpeta', 'Creado el'
]);

const RESPONSE_HEADERS = Object.freeze([
  'Fecha y hora', 'ID proceso', 'ID acción', 'Correo responsable',
  'Correo respondiente', 'Acción completada', 'Entregable', 'Comentario',
  'Resultado técnico', 'Aplicada a la hoja'
]);

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('HPV')
    .addItem('Configurar sistema', 'setupSistema')
    .addSeparator()
    .addItem('Crear proceso', 'crearProceso')
    .addItem('Iniciar proceso seleccionado', 'iniciarProceso')
    .addToUi();
}

/**
 * Ejecutar una vez desde el editor de Apps Script.
 */
function setupSistema() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const properties = PropertiesService.getScriptProperties();
    const master = SpreadsheetApp.getActiveSpreadsheet();
    if (!master) {
      throw new Error('Este proyecto debe estar vinculado a una hoja de cálculo vacía.');
    }

    master.rename(CONFIG.MASTER_FILE_NAME);
    properties.setProperty(CONFIG.PROPERTIES.MASTER_ID, master.getId());

    const rootFolder = getOrCreateRootFolder_();
    moveFileToFolder_(master.getId(), rootFolder);
    configureMaster_(master);

    const responseSpreadsheet = getOrCreateResponseSpreadsheet_(rootFolder);
    configureResponseSpreadsheet_(responseSpreadsheet);

    const form = getOrCreateForm_(rootFolder);
    installFormTrigger_(form);

    SpreadsheetApp.flush();
    const result = {
      historicoProcesos: master.getUrl(),
      historicoRespuestas: responseSpreadsheet.getUrl(),
      formularioEdicion: form.getEditUrl(),
      formularioRespuesta: form.getPublishedUrl(),
      carpeta: rootFolder.getUrl()
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Genera el siguiente HPV, crea su carpeta y copia la plantilla.
 */
function crearProceso() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const master = getMasterSpreadsheet_();
    const processSheet = master.getSheetByName(CONFIG.PROCESS_SHEET);
    const controlSheet = master.getSheetByName(CONFIG.CONTROL_SHEET);
    const rootFolder = getRootFolder_();

    const processId = getNextProcessId_(processSheet);
    const processFolder = rootFolder.createFolder(processId);
    const copyFile = DriveApp.getFileById(CONFIG.TEMPLATE_SPREADSHEET_ID)
      .makeCopy(processId, processFolder);
    const processSpreadsheet = SpreadsheetApp.openById(copyFile.getId());
    getPlanSheet_(processSpreadsheet);

    processSheet.appendRow([processId, processSpreadsheet.getUrl()]);
    controlSheet.appendRow([
      'PROCESO', processId, '', processSpreadsheet.getId(), '', '', '', '', '',
      'CREADO', '', '', '', '', processFolder.getId(), new Date()
    ]);
    formatLastDate_(controlSheet, 16);
    SpreadsheetApp.flush();

    SpreadsheetApp.getUi().alert(
      'Proceso creado',
      'Se creó ' + processId + '. Puedes abrirlo desde la columna B del histórico.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return { id: processId, url: processSpreadsheet.getUrl() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inicia el proceso de la fila seleccionada en la hoja Procesos.
 */
function iniciarProceso() {
  const master = getMasterSpreadsheet_();
  const activeSheet = master.getActiveSheet();
  if (activeSheet.getName() !== CONFIG.PROCESS_SHEET) {
    throw new Error('Selecciona una fila en la hoja "' + CONFIG.PROCESS_SHEET + '".');
  }

  const selectedRow = activeSheet.getActiveRange().getRow();
  if (selectedRow < 2) {
    throw new Error('Selecciona una fila que contenga un proceso.');
  }

  const processId = String(activeSheet.getRange(selectedRow, 1).getDisplayValue()).trim();
  const processUrl = String(activeSheet.getRange(selectedRow, 2).getValue()).trim();
  if (!processId || !processUrl) {
    throw new Error('La fila seleccionada no contiene un proceso válido.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    initializeProcessActions_(processId, extractGoogleId_(processUrl));
    const result = sendNextAction_(processId);
    SpreadsheetApp.getUi().alert(
      'Resultado',
      result.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return result;
  } finally {
    lock.releaseLock();
  }
}

function initializeProcessActions_(processId, spreadsheetId) {
  const master = getMasterSpreadsheet_();
  const controlSheet = master.getSheetByName(CONFIG.CONTROL_SHEET);
  const existing = findControlRows_(controlSheet, 'ACCION', processId);
  if (existing.length) return;

  const processSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const planSheet = getPlanSheet_(processSpreadsheet);
  const lastRow = planSheet.getLastRow();
  if (lastRow < CONFIG.START_ROW) {
    throw new Error('La hoja no contiene acciones desde la fila ' + CONFIG.START_ROW + '.');
  }

  const values = planSheet.getRange(
    CONFIG.START_ROW,
    3,
    lastRow - CONFIG.START_ROW + 1,
    9
  ).getValues();

  const rows = [];
  let sequence = 0;
  values.forEach(function(row, index) {
    const task = String(row[0] || '').trim();
    if (!task) return;

    sequence++;
    const actionId = processId + '-A' + String(sequence).padStart(2, '0');
    const responsibleEmail = normalizeEmail_(row[2]);
    const deadline = row[4] || '';
    rows.push([
      'ACCION', processId, actionId, spreadsheetId, CONFIG.START_ROW + index,
      sequence, task, responsibleEmail, deadline, 'PENDIENTE', '', '', '', '', '', new Date()
    ]);
  });

  if (!rows.length) {
    throw new Error('No se encontraron tareas en la columna C.');
  }

  controlSheet.getRange(controlSheet.getLastRow() + 1, 1, rows.length, CONTROL_HEADERS.length)
    .setValues(rows);
  updateProcessStatus_(controlSheet, processId, 'INICIADO');
  SpreadsheetApp.flush();
}

function sendNextAction_(processId) {
  const master = getMasterSpreadsheet_();
  const controlSheet = master.getSheetByName(CONFIG.CONTROL_SHEET);
  const actions = findControlRows_(controlSheet, 'ACCION', processId)
    .sort(function(a, b) { return Number(a.values[5]) - Number(b.values[5]); });

  if (!actions.length) {
    return { sent: false, message: 'El proceso no tiene acciones inicializadas.' };
  }

  const active = actions.find(function(item) {
    return item.values[9] === 'ENVIADA';
  });
  if (active) {
    return {
      sent: false,
      message: 'La acción ' + active.values[2] + ' ya está esperando respuesta.'
    };
  }

  const next = actions.find(function(item) {
    return ['PENDIENTE', 'SIN_CORREO', 'DOMINIO_NO_PERMITIDO'].indexOf(item.values[9]) !== -1;
  });
  if (!next) {
    const allCompleted = actions.every(function(item) {
      return item.values[9] === 'FINALIZADA';
    });
    if (allCompleted) {
      finishProcess_(processId);
      return { sent: false, message: 'El proceso ya está finalizado.' };
    }
    return { sent: false, message: 'No existe una acción pendiente que pueda enviarse.' };
  }

  const email = refreshResponsibleEmail_(next);
  if (!email) {
    controlSheet.getRange(next.rowNumber, 10).setValue('SIN_CORREO');
    return {
      sent: false,
      message: 'La acción ' + next.values[2] + ' no tiene correo en la columna E. No se envió ningún mensaje.'
    };
  }
  if (!isAllowedRocheEmail_(email)) {
    controlSheet.getRange(next.rowNumber, 10).setValue('DOMINIO_NO_PERMITIDO');
    return {
      sent: false,
      message: 'El correo de ' + next.values[2] + ' no pertenece a un dominio Roche permitido. No se envió ningún mensaje.'
    };
  }

  sendAction_(next, email);
  return {
    sent: true,
    message: 'Se envió la acción ' + next.values[2] + ' a ' + email + '.'
  };
}

function refreshResponsibleEmail_(controlRecord) {
  const spreadsheet = SpreadsheetApp.openById(controlRecord.values[3]);
  const planSheet = getPlanSheet_(spreadsheet);
  const email = normalizeEmail_(planSheet.getRange(Number(controlRecord.values[4]), 5).getDisplayValue());
  const controlSheet = getMasterSpreadsheet_().getSheetByName(CONFIG.CONTROL_SHEET);
  controlSheet.getRange(controlRecord.rowNumber, 8).setValue(email);
  controlRecord.values[7] = email;
  return email;
}

function sendAction_(controlRecord, email) {
  const values = controlRecord.values;
  const processId = values[1];
  const actionId = values[2];
  const task = values[6];
  const deadline = formatDateForEmail_(values[8]);
  const formUrl = createPrefilledUrl_(actionId);
  const subject = '[' + processId + '] Acción A' + String(values[5]).padStart(2, '0') + ' - ' + task;
  const htmlBody = buildActionEmail_(processId, task, deadline, formUrl);
  const plainBody =
    'Hola,\n\n' +
    'Tienes una acción pendiente dentro del plan ' + processId + '.\n\n' +
    'Acción: ' + task + '\n' +
    'Fecha límite: ' + deadline + '\n\n' +
    'Responder acción: ' + formUrl;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: 'Planes de acción HPV'
  });

  const controlSheet = getMasterSpreadsheet_().getSheetByName(CONFIG.CONTROL_SHEET);
  controlSheet.getRange(controlRecord.rowNumber, 10, 1, 2)
    .setValues([['ENVIADA', new Date()]])
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function buildActionEmail_(processId, task, deadline, formUrl) {
  return '<div style="font-family:Arial,sans-serif;max-width:620px;color:#17252d;line-height:1.55">' +
    '<div style="border-top:5px solid #0066cc;background:#f4f8fb;padding:24px;border-radius:8px">' +
    '<h2 style="margin:0 0 14px;color:#0066cc">Acción pendiente</h2>' +
    '<p>Hola,</p>' +
    '<p>Tienes una acción pendiente dentro del plan <strong>' + escapeHtml_(processId) + '</strong>.</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:18px 0">' +
    '<tr><td style="padding:8px;border-bottom:1px solid #d7e2e7"><strong>Acción</strong></td>' +
    '<td style="padding:8px;border-bottom:1px solid #d7e2e7">' + escapeHtml_(task) + '</td></tr>' +
    '<tr><td style="padding:8px;border-bottom:1px solid #d7e2e7"><strong>Fecha límite</strong></td>' +
    '<td style="padding:8px;border-bottom:1px solid #d7e2e7">' + escapeHtml_(deadline) + '</td></tr>' +
    '</table>' +
    '<p style="margin:24px 0"><a href="' + escapeHtml_(formUrl) + '" ' +
    'style="display:inline-block;background:#0066cc;color:#fff;text-decoration:none;padding:12px 20px;border-radius:7px;font-weight:bold">' +
    'Responder acción</a></p>' +
    '<p style="font-size:12px;color:#647681">La siguiente acción se habilitará únicamente cuando esta se registre como completada.</p>' +
    '</div></div>';
}

function createPrefilledUrl_(actionId) {
  const form = getForm_();
  const trackingItem = form.getItems(FormApp.ItemType.TEXT).map(function(item) {
    return item.asTextItem();
  }).find(function(item) {
    return item.getTitle() === CONFIG.FORM_FIELDS.TRACKING;
  });

  if (!trackingItem) {
    throw new Error('No existe el campo de seguimiento en el formulario.');
  }

  return form.createResponse()
    .withItemResponse(trackingItem.createResponse(actionId))
    .toPrefilledUrl();
}

/**
 * Trigger instalable del Google Form. No ejecutar manualmente.
 */
function alEnviarFormulario(event) {
  if (!event || !event.response) {
    throw new Error('Esta función solo puede ejecutarse desde el trigger del formulario.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    processFormResponse_(event.response);
  } finally {
    lock.releaseLock();
  }
}

function processFormResponse_(formResponse) {
  const submittedAt = formResponse.getTimestamp() || new Date();
  const respondentEmail = normalizeEmail_(formResponse.getRespondentEmail());
  const answers = getAnswersByTitle_(formResponse);
  const actionId = String(answers[CONFIG.FORM_FIELDS.TRACKING] || '').trim().toUpperCase();
  const completedAnswer = String(answers[CONFIG.FORM_FIELDS.COMPLETED] || '').trim();
  const deliverable = String(answers[CONFIG.FORM_FIELDS.DELIVERABLE] || '').trim();
  const comment = String(answers[CONFIG.FORM_FIELDS.COMMENT] || '').trim();
  const parsed = parseActionId_(actionId);

  const master = getMasterSpreadsheet_();
  const controlSheet = master.getSheetByName(CONFIG.CONTROL_SHEET);
  const controlRecord = actionId ? findActionById_(controlSheet, actionId) : null;
  const responsibleEmail = controlRecord ? String(controlRecord.values[7] || '') : '';

  let technicalResult = 'ACEPTADA';
  let applied = 'No';

  if (!parsed) {
    technicalResult = 'CODIGO_INVALIDO';
  } else if (!isAllowedRocheEmail_(respondentEmail)) {
    technicalResult = 'DOMINIO_NO_PERMITIDO';
  } else if (!controlRecord) {
    technicalResult = 'ACCION_NO_ENCONTRADA';
  } else if (controlRecord.values[9] === 'FINALIZADA') {
    technicalResult = 'DUPLICADA';
  } else if (controlRecord.values[9] !== 'ENVIADA') {
    technicalResult = 'ACCION_NO_ACTIVA';
  } else if (normalizeText_(completedAnswer) !== 'si') {
    technicalResult = 'NO_COMPLETADA';
    controlSheet.getRange(controlRecord.rowNumber, 12, 1, 3)
      .setValues([[submittedAt, respondentEmail, 'No']]);
    controlSheet.getRange(controlRecord.rowNumber, 12).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  } else {
    applyCompletedResponse_(controlRecord, submittedAt, respondentEmail, deliverable, comment);
    technicalResult = 'COMPLETADA';
    applied = 'Sí';
  }

  appendResponseHistory_([
    submittedAt,
    parsed ? parsed.processId : '',
    actionId,
    responsibleEmail,
    respondentEmail,
    completedAnswer,
    deliverable,
    comment,
    technicalResult,
    applied
  ]);

  if (technicalResult === 'COMPLETADA') {
    sendNextAction_(parsed.processId);
  } else if (technicalResult === 'NO_COMPLETADA') {
    notifyNotCompleted_(parsed.processId, actionId, respondentEmail, comment);
  }
}

function applyCompletedResponse_(controlRecord, timestamp, respondentEmail, deliverable, comment) {
  const values = controlRecord.values;
  const processSpreadsheet = SpreadsheetApp.openById(values[3]);
  const planSheet = getPlanSheet_(processSpreadsheet);
  const targetRow = Number(values[4]);

  planSheet.getRange(targetRow, 8, 1, 4).setValues([[
    timestamp,
    'Finalizado',
    safeCell_(deliverable),
    safeCell_(comment)
  ]]);
  planSheet.getRange(targetRow, 8).setNumberFormat('dd/MM/yyyy HH:mm:ss');

  const controlSheet = getMasterSpreadsheet_().getSheetByName(CONFIG.CONTROL_SHEET);
  controlSheet.getRange(controlRecord.rowNumber, 10).setValue('FINALIZADA');
  controlSheet.getRange(controlRecord.rowNumber, 12, 1, 3)
    .setValues([[timestamp, respondentEmail, 'Sí']]);
  controlSheet.getRange(controlRecord.rowNumber, 12).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  SpreadsheetApp.flush();
}

function finishProcess_(processId) {
  const master = getMasterSpreadsheet_();
  const controlSheet = master.getSheetByName(CONFIG.CONTROL_SHEET);
  const processRecord = findProcessRecord_(controlSheet, processId);
  if (!processRecord || processRecord.values[9] === 'FINALIZADO') return;

  controlSheet.getRange(processRecord.rowNumber, 10).setValue('FINALIZADO');
  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: '[' + processId + '] Plan de acción finalizado',
    body: 'El plan de acción ' + processId + ' completó todas sus acciones.',
    htmlBody: '<p>El plan de acción <strong>' + escapeHtml_(processId) + '</strong> completó todas sus acciones.</p>',
    name: 'Planes de acción HPV'
  });
}

function notifyNotCompleted_(processId, actionId, respondentEmail, comment) {
  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: '[' + processId + '] Acción no completada - ' + actionId,
    body:
      'La acción ' + actionId + ' fue respondida como No.\n' +
      'Respondió: ' + respondentEmail + '\n' +
      'Comentario: ' + (comment || 'Sin comentario') + '\n\n' +
      'La secuencia no avanzó.',
    name: 'Planes de acción HPV'
  });
}

function appendResponseHistory_(row) {
  const responseSpreadsheet = getResponseSpreadsheet_();
  const sheet = responseSpreadsheet.getSheetByName(CONFIG.RESPONSE_SHEET);
  sheet.appendRow(row.map(safeCell_));
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function getAnswersByTitle_(formResponse) {
  const answers = {};
  formResponse.getItemResponses().forEach(function(itemResponse) {
    answers[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
  });
  return answers;
}

function configureMaster_(spreadsheet) {
  let processSheet = spreadsheet.getSheetByName(CONFIG.PROCESS_SHEET);
  if (!processSheet) {
    const firstSheet = spreadsheet.getSheets()[0];
    processSheet = firstSheet.setName(CONFIG.PROCESS_SHEET);
  }
  processSheet.getRange(1, 1, 1, 2).setValues([['ID', 'Enlace del archivo']]);
  formatHeader_(processSheet, 2);
  processSheet.setFrozenRows(1);
  processSheet.setColumnWidth(1, 120);
  processSheet.setColumnWidth(2, 420);

  let controlSheet = spreadsheet.getSheetByName(CONFIG.CONTROL_SHEET);
  if (!controlSheet) controlSheet = spreadsheet.insertSheet(CONFIG.CONTROL_SHEET);
  if (controlSheet.getLastRow() === 0) {
    controlSheet.getRange(1, 1, 1, CONTROL_HEADERS.length).setValues([CONTROL_HEADERS]);
  }
  formatHeader_(controlSheet, CONTROL_HEADERS.length);
  controlSheet.setFrozenRows(1);
  if (!controlSheet.isSheetHidden()) controlSheet.hideSheet();
}

function configureResponseSpreadsheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.RESPONSE_SHEET);
  if (!sheet) sheet = spreadsheet.getSheets()[0].setName(CONFIG.RESPONSE_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
  }
  formatHeader_(sheet, RESPONSE_HEADERS.length);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, RESPONSE_HEADERS.length);
}

function getOrCreateForm_(folder) {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(CONFIG.PROPERTIES.FORM_ID);
  if (existingId) {
    try {
      return FormApp.openById(existingId);
    } catch (ignored) {}
  }

  const form = FormApp.create(CONFIG.FORM_TITLE)
    .setDescription('Formulario para registrar el resultado de una acción del plan HPV.')
    .setCollectEmail(true)
    .setLimitOneResponsePerUser(false)
    .setAcceptingResponses(true)
    .setConfirmationMessage('La respuesta fue registrada.');

  form.addTextItem()
    .setTitle(CONFIG.FORM_FIELDS.TRACKING)
    .setHelpText('Este código identifica el proceso y la acción. No lo modifiques.')
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle(CONFIG.FORM_FIELDS.COMPLETED)
    .setChoiceValues(['Sí', 'No'])
    .setRequired(true);
  form.addTextItem()
    .setTitle(CONFIG.FORM_FIELDS.DELIVERABLE)
    .setRequired(false);
  form.addParagraphTextItem()
    .setTitle(CONFIG.FORM_FIELDS.COMMENT)
    .setRequired(false);

  moveFileToFolder_(form.getId(), folder);
  properties.setProperty(CONFIG.PROPERTIES.FORM_ID, form.getId());
  return form;
}

function installFormTrigger_(form) {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'alEnviarFormulario') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('alEnviarFormulario')
    .forForm(form)
    .onFormSubmit()
    .create();
}

function getOrCreateRootFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(CONFIG.PROPERTIES.ROOT_FOLDER_ID);
  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (ignored) {}
  }
  const folder = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
  properties.setProperty(CONFIG.PROPERTIES.ROOT_FOLDER_ID, folder.getId());
  return folder;
}

function getOrCreateResponseSpreadsheet_(folder) {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(CONFIG.PROPERTIES.RESPONSE_ID);
  if (existingId) {
    try {
      return SpreadsheetApp.openById(existingId);
    } catch (ignored) {}
  }
  const spreadsheet = SpreadsheetApp.create(CONFIG.RESPONSE_FILE_NAME);
  moveFileToFolder_(spreadsheet.getId(), folder);
  properties.setProperty(CONFIG.PROPERTIES.RESPONSE_ID, spreadsheet.getId());
  return spreadsheet;
}

function getMasterSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.MASTER_ID);
  if (!id) throw new Error('Ejecuta setupSistema() antes de continuar.');
  return SpreadsheetApp.openById(id);
}

function getResponseSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.RESPONSE_ID);
  if (!id) throw new Error('El histórico de respuestas no está configurado.');
  return SpreadsheetApp.openById(id);
}

function getRootFolder_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.ROOT_FOLDER_ID);
  if (!id) throw new Error('La carpeta raíz no está configurada.');
  return DriveApp.getFolderById(id);
}

function getForm_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.FORM_ID);
  if (!id) throw new Error('El formulario no está configurado.');
  return FormApp.openById(id);
}

function getPlanSheet_(spreadsheet) {
  const exact = spreadsheet.getSheetByName(CONFIG.PLAN_SHEET);
  if (exact) return exact;
  const normalizedTarget = normalizeText_(CONFIG.PLAN_SHEET);
  const sheet = spreadsheet.getSheets().find(function(item) {
    return normalizeText_(item.getName()) === normalizedTarget;
  });
  if (!sheet) throw new Error('No existe la hoja "' + CONFIG.PLAN_SHEET + '".');
  return sheet;
}

function getNextProcessId_(processSheet) {
  const lastRow = processSheet.getLastRow();
  const ids = lastRow > 1
    ? processSheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat()
    : [];
  let max = 0;
  ids.forEach(function(id) {
    const match = String(id).trim().toUpperCase().match(/^HPV-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return CONFIG.PROCESS_PREFIX + String(max + 1).padStart(CONFIG.PROCESS_DIGITS, '0');
}

function findControlRows_(sheet, type, processId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, CONTROL_HEADERS.length).getValues()
    .map(function(values, index) {
      return { rowNumber: index + 2, values: values };
    })
    .filter(function(record) {
      return record.values[0] === type && record.values[1] === processId;
    });
}

function findActionById_(sheet, actionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, CONTROL_HEADERS.length).getValues();
  for (let index = 0; index < values.length; index++) {
    if (values[index][0] === 'ACCION' && values[index][2] === actionId) {
      return { rowNumber: index + 2, values: values[index] };
    }
  }
  return null;
}

function findProcessRecord_(sheet, processId) {
  const records = findControlRows_(sheet, 'PROCESO', processId);
  return records.length ? records[0] : null;
}

function updateProcessStatus_(sheet, processId, status) {
  const record = findProcessRecord_(sheet, processId);
  if (record) sheet.getRange(record.rowNumber, 10).setValue(status);
}

function parseActionId_(actionId) {
  const match = String(actionId || '').trim().toUpperCase().match(/^(HPV-\d+)-A(\d+)$/);
  if (!match) return null;
  return { processId: match[1], sequence: Number(match[2]) };
}

function isAllowedRocheEmail_(email) {
  const normalized = normalizeEmail_(email);
  const at = normalized.lastIndexOf('@');
  if (at < 1) return false;
  const domain = normalized.slice(at + 1);
  return CONFIG.ALLOWED_DOMAINS.indexOf(domain) !== -1;
}

function normalizeEmail_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function normalizeText_(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractGoogleId_(urlOrId) {
  const text = String(urlOrId || '').trim();
  const match = text.match(/[-\w]{25,}/);
  if (!match) throw new Error('No fue posible identificar el ID del archivo.');
  return match[0];
}

function safeCell_(value) {
  if (value instanceof Date) return value;
  const text = String(value == null ? '' : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateForEmail_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return String(value || 'No indicada');
}

function formatHeader_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount)
    .setBackground('#0b3d91')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setWrap(true);
}

function formatLastDate_(sheet, column) {
  sheet.getRange(sheet.getLastRow(), column).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function moveFileToFolder_(fileId, folder) {
  DriveApp.getFileById(fileId).moveTo(folder);
}
