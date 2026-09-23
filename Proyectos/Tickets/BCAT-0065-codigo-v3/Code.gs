/**
 * Programado por: Gabriela Obando
 *
 * ¿Qué hace?
 * Crea un expediente por proceso, envía acciones secuenciales por correo y
 * registra respuestas, enlaces de entregables, fechas y estados en un control central.
 *
 * Validaciones para ejecutar generarExpedientesBCAT0065():
 * 1) Columna A (Tool) marcada.
 * 2) Columna B (Tool) con el nombre del nuevo expediente.
 * 3) Columna C (Tool) vacía; evita crear el mismo expediente otra vez.
 * 4) El archivo plantilla y la carpeta destino deben ser accesibles.
 *
 * Validaciones para ejecutar enviarPrimeraAccionBCAT0065():
 * 1) Debe ejecutarse desde un expediente generado por este programa.
 * 2) C9 y E9 (Plan de acción) deben contener acción y correo.
 * 3) La acción no debe haber sido enviada ni finalizada.
 *
 * Requisito previo: habilitar el servicio avanzado Drive API (v2).
 */

const BCAT0065 = (() => {
  const CONFIG = Object.freeze({
    templateId: '1_KGwTYFT3ju7Egjb4rRD-CjvOA1X77_SoUpP9PpylT4',
    folderId: '1v7wWou6gGpT6r9YpeaO-51kAlTOKcSKh',
    toolSheet: 'Tool',
    actionSheet: 'Plan de acción',
    responseSheet: 'Respuestas',
    controlSheet: '_BCAT0065_Control',
    statusPendingSend: 'Pendiente de envío',
    allowedSheets: [
      'Plan de acción', 'Instrucciones', 'Tabla de ponderación',
      'Precio del Contrato anterior y competencia', 'Check list tender'
    ],
    // Después de desplegar como aplicación web, pegue aquí la URL /exec.
    webAppUrl: 'PEGAR_AQUI_LA_URL_DEL_WEB_APP',
    timezone: Session.getScriptTimeZone() || 'America/Lima'
  });

  const CONTROL_HEADERS = [
    'Tipo', 'ID proceso', 'URL proceso', 'Fila Tool', 'Hoja', 'Fila acción',
    'ID de acción', 'Acción', 'Correo asignado', 'Modo', 'Tipo formulario',
    'Depende de fila', 'Estado', 'Enviado', 'Finalizado', 'Token'
  ];

  // C18, C22 y C36 permanecen retenidas hasta que se apruebe su dependencia.
  const ACTIONS = Object.freeze({
    9:  { mode: 'FORM', form: 'rexis', dependency: null },
    10: { mode: 'FORM', form: 'rexis', dependency: 9 },
    11: { mode: 'FORM', form: 'rexis', dependency: 10 },
    12: { mode: 'FORM', form: 'rexis', dependency: 11 },
    13: { mode: 'BUTTON', category: 'Reunión', dependency: 12 },
    14: { mode: 'FORM', form: 'documento', dependency: 13 },
    15: { mode: 'FORM', form: 'documento', dependency: 14 },
    16: { mode: 'BUTTON', category: 'Comunicación', dependency: 15 },
    17: { mode: 'BUTTON', category: 'Comunicación', dependency: 16 },
    18: { mode: 'HOLD', dependency: null },
    19: { mode: 'FORM', form: 'riesgos', dependency: 17 },
    20: { mode: 'FORM', form: 'riesgos', dependency: 19 },
    21: { mode: 'BUTTON', category: 'Comunicación', dependency: 20 },
    22: { mode: 'HOLD', dependency: null },
    23: { mode: 'BUTTON', category: 'Cumplimiento', dependency: 22 },
    24: { mode: 'FORM', form: 'decision', dependency: 23 },
    25: { mode: 'BUTTON', category: 'Aprobación', dependency: 24 },
    26: { mode: 'FORM', form: 'documento', dependency: 25 },
    27: { mode: 'BUTTON', category: 'Cumplimiento', dependency: 26 },
    28: { mode: 'BUTTON', category: 'Reunión', dependency: 27 },
    29: { mode: 'BUTTON', category: 'Reunión', dependency: 28 },
    30: { mode: 'BUTTON', category: 'Cumplimiento', dependency: 29 },
    31: { mode: 'FORM', form: 'documento', dependency: 30 },
    32: { mode: 'BUTTON', category: 'Cumplimiento', dependency: 31 },
    33: { mode: 'FORM', form: 'documento', dependency: 32 },
    34: { mode: 'BUTTON', category: 'Reunión', dependency: 33 },
    35: { mode: 'FORM', form: 'decision', dependency: 34 },
    36: { mode: 'HOLD', dependency: null },
    37: { mode: 'FORM', form: 'revision', dependency: 36 },
    38: { mode: 'FORM', form: 'documento', dependency: 23 },
    39: { mode: 'BUTTON', category: 'Sistema', dependency: 38 },
    40: { mode: 'FORM', form: 'revision', dependency: 39 },
    41: { mode: 'BUTTON', category: 'Corrección', dependency: 40 },
    42: { mode: 'FORM', form: 'documento', dependency: 41 },
    43: { mode: 'BUTTON', category: 'Portal', dependency: 42 }
  });

  const log = (message, detail) => Logger.log('[BCAT-0065] ' + message + (detail ? ' | ' + detail : ''));
  const blank = value => value === '' || value === null || value === undefined;
  const now = () => new Date();
  const dateText = date => Utilities.formatDate(date, CONFIG.timezone, 'dd/MM/yyyy HH:mm:ss');
  const activeFile = () => SpreadsheetApp.getActiveSpreadsheet();
  const isTemplate = ss => ss.getId() === CONFIG.templateId;

  const getControl = () => {
    const ss = SpreadsheetApp.openById(CONFIG.templateId);
    let sheet = ss.getSheetByName(CONFIG.controlSheet);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.controlSheet);
      sheet.getRange(1, 1, 1, CONTROL_HEADERS.length).setValues([CONTROL_HEADERS]);
      sheet.hideSheet();
    }
    return sheet;
  };

  const getResponses = () => {
    const ss = SpreadsheetApp.openById(CONFIG.templateId);
    let sheet = ss.getSheetByName(CONFIG.responseSheet);
    if (!sheet) sheet = ss.insertSheet(CONFIG.responseSheet);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID de acción', 'Proceso', 'Acción', 'Resultado', 'Fecha/hora',
        'Correo asignado', 'Correo respondedor', 'Detalle / entregable'
      ]);
    }
    return sheet;
  };

  const addMenu = () => {
    const ui = SpreadsheetApp.getUi();
    if (isTemplate(activeFile())) {
      ui.createMenu('BCAT-0065')
        .addItem('Configurar formularios y control', 'configurarBCAT0065')
        .addItem('Crear expedientes seleccionados', 'generarExpedientesBCAT0065')
        .addItem('Procesar cola de envíos ahora', 'procesarColaEnviosBCAT0065')
        .addToUi();
    } else {
      ui.createMenu('Acciones BCAT-0065')
        .addItem('Enviar primera acción', 'enviarPrimeraAccionBCAT0065')
        .addItem('Diagnosticar primera acción', 'diagnosticarPrimeraAccionBCAT0065')
        .addToUi();
    }
  };

  const setup = () => {
    if (!isTemplate(activeFile())) throw new Error('La configuración solo se ejecuta en el archivo plantilla.');
    getControl();
    getResponses();
    Object.keys(FORM_DEFINITIONS).forEach(createOrGetForm_);
    ensureQueueTrigger_();
    SpreadsheetApp.getUi().alert('Configuración completada. Los formularios y las hojas de control están listos.');
  };

  const createProcesses = () => {
    const source = activeFile();
    if (!isTemplate(source)) throw new Error('Esta función debe ejecutarse desde la plantilla que contiene la hoja Tool.');
    const tool = source.getSheetByName(CONFIG.toolSheet);
    if (!tool) throw new Error('No existe la hoja "' + CONFIG.toolSheet + '".');
    const values = tool.getDataRange().getValues();
    const candidates = values.slice(1).map((row, i) => ({ row: i + 2, values: row }))
      .filter(item => item.values[0] === true && !blank(item.values[1]) && blank(item.values[2]));
    if (!candidates.length) {
      SpreadsheetApp.getUi().alert('No hay filas válidas: A marcada, B con nombre y C vacía.');
      return;
    }
    const confirmation = SpreadsheetApp.getUi().alert(
      'Crear expedientes', 'Se crearán ' + candidates.length + ' archivo(s) y se registrará su enlace en Tool columna D.',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (confirmation !== SpreadsheetApp.getUi().Button.YES) return;

    const folder = DriveApp.getFolderById(CONFIG.folderId);
    candidates.forEach(item => {
      const name = String(item.values[1]).trim();
      const copy = DriveApp.getFileById(CONFIG.templateId).makeCopy(name, folder);
      const processSs = SpreadsheetApp.openById(copy.getId());
      processSs.getSheets().forEach(sheet => {
        if (CONFIG.allowedSheets.indexOf(sheet.getName()) === -1) processSs.deleteSheet(sheet);
      });
      createActionControl_(processSs, item.row, name);
      tool.getRange(item.row, 3).setValue('Completado');
      tool.getRange(item.row, 4).setValue(processSs.getUrl());
      log('Expediente creado.', 'fila Tool: ' + item.row + ' | archivo: ' + name);
    });
    SpreadsheetApp.getUi().alert('Expedientes creados correctamente.');
  };

  const createActionControl_ = (processSs, toolRow, processName) => {
    const actionSheet = processSs.getSheetByName(CONFIG.actionSheet);
    if (!actionSheet) throw new Error('El expediente no contiene la hoja "Plan de acción".');
    const values = actionSheet.getRange(9, 3, 35, 3).getValues(); // C:E, filas 9 a 43
    const rows = [];
    Object.keys(ACTIONS).forEach(rowNumber => {
      const row = Number(rowNumber);
      const definition = ACTIONS[row];
      const index = row - 9;
      const action = String(values[index][0] || '').trim();
      const email = String(values[index][2] || '').trim();
      const token = Utilities.getUuid() + Utilities.getUuid();
      const actionId = processSs.getId() + ':' + CONFIG.actionSheet + ':' + row;
      rows.push([
        'ACCIÓN', processSs.getId(), processSs.getUrl(), toolRow, CONFIG.actionSheet, row,
        actionId, action, email, definition.mode, definition.form || definition.category || '',
        definition.dependency || '', definition.mode === 'HOLD' ? 'En espera de definición' : '', '', '', token
      ]);
    });
    const control = getControl();
    control.getRange(control.getLastRow() + 1, 1, rows.length, CONTROL_HEADERS.length).setValues(rows);
    log('Acciones registradas.', 'proceso: ' + processName + ' | acciones: ' + rows.length);
  };

  const sendFirst = () => {
    const ss = activeFile();
    log('Inicio solicitado desde el menú.', 'archivo: ' + ss.getName() + ' | ID: ' + ss.getId());
    if (isTemplate(ss)) throw new Error('Abra un expediente generado y vuelva a ejecutar la opción.');
    const firstAction = findAction_(ss.getId(), 9);
    if (!firstAction) throw new Error('No se encontró la acción C9 en el control central.');
    log('Primera acción localizada.', 'fila: ' + firstAction.actionRow + ' | estado: ' + (firstAction.status || 'sin estado') + ' | enviada: ' + Boolean(firstAction.sentAt));
    if (firstAction.sentAt) { log('Solicitud omitida.', 'C9 ya fue enviada: ' + dateText(firstAction.sentAt)); return; }
    updateControl_(firstAction.controlRow, { status: CONFIG.statusPendingSend });
    updateProcessRow_(firstAction, 'H', CONFIG.statusPendingSend);
    log('Solicitud registrada.', 'La plantilla central enviará C9 automáticamente en un máximo de 1 minuto.');
  };

  // Se ejecuta desde la plantilla mediante un disparador cada minuto.
  const processSendQueue = () => {
    const pending = allActions_().filter(record =>
      record.status === CONFIG.statusPendingSend && !record.sentAt && record.mode !== 'HOLD'
    );
    log('Procesando cola central.', 'solicitudes pendientes: ' + pending.length);
    pending.forEach(record => {
      try {
        // La única solicitud manual permitida es C9. Las demás conservan la
        // validación de dependencia en H antes de enviarse.
        sendAction_(record, record.actionRow === 9);
      } catch (error) {
        log('ERROR en cola.', 'fila: ' + record.actionRow + ' | motivo: ' + error.message);
      }
    });
  };

  const ensureQueueTrigger_ = () => {
    const handler = 'procesarColaEnviosBCAT0065';
    const exists = ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === handler);
    if (!exists) {
      ScriptApp.newTrigger(handler).timeBased().everyMinutes(1).create();
      log('Disparador de cola creado.', 'frecuencia: cada 1 minuto');
    } else {
      log('Disparador de cola ya existe.', 'frecuencia: cada 1 minuto');
    }
  };

  // Esta función solo registra información; nunca envía un correo.
  const diagnoseFirst = () => {
    const ss = activeFile();
    log('DIAGNÓSTICO: inicio.', 'archivo: ' + ss.getName() + ' | ID: ' + ss.getId());
    log('DIAGNÓSTICO: tipo de archivo.', isTemplate(ss) ? 'Es la plantilla: debe abrir un expediente nuevo.' : 'Es un expediente generado.');
    log('DIAGNÓSTICO: URL web.', CONFIG.webAppUrl);
    const actionSheet = ss.getSheetByName(CONFIG.actionSheet);
    if (!actionSheet) {
      log('DIAGNÓSTICO: ERROR.', 'No existe la hoja "' + CONFIG.actionSheet + '".');
      return;
    }
    const action = actionSheet.getRange('C9').getDisplayValue();
    const email = actionSheet.getRange('E9').getDisplayValue();
    const sent = actionSheet.getRange('F9').getDisplayValue();
    const completed = actionSheet.getRange('G9').getDisplayValue();
    const status = actionSheet.getRange('H9').getDisplayValue();
    log('DIAGNÓSTICO: valores de C9:H9.', 'acción: ' + action + ' | correo: ' + email + ' | F: ' + sent + ' | G: ' + completed + ' | H: ' + status);
    const record = findAction_(ss.getId(), 9);
    if (!record) {
      log('DIAGNÓSTICO: ERROR.', 'No hay registro de C9 en _BCAT0065_Control. El expediente debe crearse nuevamente desde Tool.');
      return;
    }
    log('DIAGNÓSTICO: control localizado.', 'modo: ' + record.mode + ' | tipo: ' + record.formType + ' | estado: ' + record.status + ' | enviada: ' + record.sentAt + ' | correo: ' + record.email);
    if (!/^https:\/\/script\.google\.com\//.test(CONFIG.webAppUrl)) {
      log('DIAGNÓSTICO: ERROR.', 'webAppUrl no contiene una URL válida de script.google.com terminada en /exec.');
    } else {
      log('DIAGNÓSTICO: resultado.', 'Configuración de primera acción lista para abrir la aplicación web.');
    }
  };

  const sendAction_ = (record, manual) => {
    log('Preparando envío.', 'ID: ' + record.actionId + ' | fila: ' + record.actionRow + ' | modo: ' + record.mode + ' | estado: ' + record.status);
    if (record.status === 'Finalizado') { log('Envío omitido.', 'La acción ya está finalizada.'); return; }
    if (record.mode === 'HOLD') { log('Envío omitido.', 'La acción está retenida por dependencia pendiente.'); return; }
    if (record.sentAt) { log('Envío omitido.', 'La acción ya fue enviada: ' + dateText(record.sentAt)); return; }
    // C9 es la única acción que puede iniciarse manualmente. Las demás se
    // envían solo si la columna H de la acción predecesora dice Finalizado.
    if (!manual && Number(record.dependency)) {
      const dependencyStatus = getDependencyStatus_(record);
      if (dependencyStatus !== 'Finalizado') {
        log('Envío bloqueado por dependencia.', 'fila: ' + record.actionRow + ' | depende de H' + record.dependency + ' = "' + dependencyStatus + '"');
        return;
      }
      log('Dependencia validada.', 'fila: ' + record.actionRow + ' | H' + record.dependency + ' = Finalizado');
    }
    if (blank(record.action) || blank(record.email)) {
      throw new Error('La acción de fila ' + record.actionRow + ' debe tener texto en C y correo en E.');
    }
    const subject = '[BCAT-0065] Acción: ' + record.action;
    const html = record.mode === 'BUTTON' ? buildButtonEmail_(record) : buildFormEmail_(record);
    log('Correo preparado.', 'asunto: ' + subject + ' | destino: ' + record.email);
    GmailApp.sendEmail(record.email, subject, 'Abra este correo en formato HTML.', { htmlBody: html });
    updateControl_(record.controlRow, { sentAt: now(), status: 'En proceso' });
    updateProcessRow_(record, 'F', now());
    updateProcessRow_(record, 'H', 'En proceso');
    log('Acción enviada.', 'fila: ' + record.actionRow + ' | destino: ' + record.email + (manual ? ' | manual' : ' | automática'));
  };

  const buildButtonEmail_ = record => {
    const base = validWebAppUrl_();
    const yes = base + '?token=' + encodeURIComponent(record.token) + '&result=Realizado';
    const no = base + '?token=' + encodeURIComponent(record.token) + '&result=No%20realizado';
    return '<p>Hola,</p><p>Debes realizar la siguiente acción:</p><p><strong>' + escapeHtml_(record.action) + '</strong></p>' +
      '<p>Cuando corresponda, selecciona una opción:</p>' +
      '<p><a style="background:#0b4f63;color:#fff;padding:10px 14px;text-decoration:none;border-radius:5px" href="' + yes + '">Sí, realizado</a> ' +
      '<a style="background:#b3261e;color:#fff;padding:10px 14px;text-decoration:none;border-radius:5px" href="' + no + '">No realizado</a></p>';
  };

  const buildFormEmail_ = record => {
    const form = createOrGetForm_(record.formType);
    const url = prefilledFormUrl_(form, record);
    return '<p>Hola,</p><p>Debes completar la siguiente acción y registrar su entregable:</p><p><strong>' + escapeHtml_(record.action) + '</strong></p>' +
      '<p><a style="background:#0b4f63;color:#fff;padding:10px 14px;text-decoration:none;border-radius:5px" href="' + url + '">Completar acción</a></p>';
  };

  const validWebAppUrl_ = () => {
    if (!/^https:\/\/script\.google\.com\//.test(CONFIG.webAppUrl)) {
      log('ERROR configuración.', 'webAppUrl inválida: ' + CONFIG.webAppUrl);
      throw new Error('Configure CONFIG.webAppUrl con la URL /exec del despliegue web antes de enviar botones.');
    }
    log('URL web validada.', CONFIG.webAppUrl);
    return CONFIG.webAppUrl;
  };

  const FORM_DEFINITIONS = Object.freeze({
    rexis: { title: 'BCAT-0065 | Registro Rexis', extra: ['Número, código o enlace Rexis', 'Evidencia o comentario'] },
    // FormApp no permite crear preguntas de carga de archivos mediante Apps Script.
    // Por eso se solicita el enlace de Drive del entregable.
    documento: { title: 'BCAT-0065 | Entregable documental', extra: ['Enlace de Drive del entregable', 'Descripción del entregable'] },
    riesgos: { title: 'BCAT-0065 | Riesgos', extra: ['Plan o evidencia de mitigación', 'Comentario'] },
    decision: { title: 'BCAT-0065 | Decisión', extra: ['Decisión tomada', 'Justificación'] },
    revision: { title: 'BCAT-0065 | Revisión', extra: ['Resultado de la revisión', 'Evidencia o comentario'] }
  });

  const formPropertyKey_ = type => 'BCAT0065_FORM_' + type;
  const createOrGetForm_ = type => {
    const definition = FORM_DEFINITIONS[type];
    if (!definition) throw new Error('Tipo de formulario no reconocido: ' + type);
    const shared = getSharedForm_(type);
    if (shared) return shared;
    const properties = PropertiesService.getScriptProperties();
    const existingId = properties.getProperty(formPropertyKey_(type));
    if (existingId) {
      try {
        const form = FormApp.openById(existingId);
        registerSharedForm_(type, form);
        return form;
      } catch (error) { properties.deleteProperty(formPropertyKey_(type)); }
    }
    const form = FormApp.create(definition.title);
    form.setDescription('Formulario generado por BCAT-0065. Complete la información y evidencia solicitada.')
      .setCollectEmail(true)
      .setConfirmationMessage('Respuesta registrada. Puede cerrar esta ventana.');
    form.addTextItem().setTitle('ID de acción').setRequired(true);
    form.addTextItem().setTitle('Acción').setRequired(true);
    form.addMultipleChoiceItem().setTitle('Resultado').setChoiceValues(['Realizado', 'No realizado', 'En proceso']).setRequired(true);
    definition.extra.forEach((title, index) => {
      form.addParagraphTextItem().setTitle(title).setRequired(index === 0);
    });
    ScriptApp.newTrigger('onFormSubmitBCAT0065').forForm(form).onFormSubmit().create();
    properties.setProperty(formPropertyKey_(type), form.getId());
    registerSharedForm_(type, form);
    return form;
  };

  const getSharedForm_ = type => {
    const sheet = getControl();
    const values = sheet.getDataRange().getValues();
    const found = values.slice(1).filter(row => row[0] === 'FORM' && row[6] === type)[0];
    if (!found) return null;
    try { return FormApp.openById(found[1]); } catch (error) { return null; }
  };

  const registerSharedForm_ = (type, form) => {
    const sheet = getControl();
    const values = sheet.getDataRange().getValues();
    const alreadyRegistered = values.slice(1).some(row => row[0] === 'FORM' && row[6] === type);
    if (!alreadyRegistered) {
      sheet.appendRow(['FORM', form.getId(), form.getPublishedUrl(), '', '', '', type, form.getTitle(), '', 'FORM', '', '', '', '', '', '']);
    }
  };

  const prefilledFormUrl_ = (form, record) => {
    const items = form.getItems();
    const idItem = items.filter(item => item.getTitle() === 'ID de acción')[0].asTextItem();
    const actionItem = items.filter(item => item.getTitle() === 'Acción')[0].asTextItem();
    return form.createResponse()
      .withItemResponse(idItem.createResponse(record.actionId))
      .withItemResponse(actionItem.createResponse(record.action))
      .toPrefilledUrl();
  };

  const onFormSubmit = event => {
    const answer = {};
    event.response.getItemResponses().forEach(item => { answer[item.getItem().getTitle()] = item.getResponse(); });
    const record = findActionById_(String(answer['ID de acción'] || '').trim());
    if (!record) throw new Error('No se encontró el ID de acción recibido por el formulario.');
    const result = String(answer['Resultado'] || 'En proceso');
    log('Respuesta de formulario recibida.', 'ID: ' + record.actionId + ' | resultado: ' + result);
    const detail = Object.keys(answer).filter(key => key !== 'ID de acción' && key !== 'Acción' && key !== 'Resultado')
      .map(key => key + ': ' + answer[key]).join('\n');
    registerResponse_(record, result, detail, event.response.getRespondentEmail ? event.response.getRespondentEmail() : '');
  };

  const doGet = event => {
    const operation = String(event && event.parameter && event.parameter.operation || '');
    log('Aplicación web invocada.', 'operación: ' + (operation || 'respuesta') + ' | parámetros recibidos: ' + Object.keys(event && event.parameter || {}).join(', '));
    if (operation === 'sendFirst') {
      const processId = String(event && event.parameter && event.parameter.processId || '');
      log('Solicitud de envío inicial.', 'proceso: ' + processId);
      const firstAction = findAction_(processId, 9);
      if (!firstAction) { log('ERROR envío inicial.', 'No existe C9 en el control central.'); return HtmlService.createHtmlOutput('<p>No se encontró la primera acción de este expediente.</p>'); }
      if (firstAction.sentAt) { log('Envío inicial omitido.', 'Ya enviada: ' + dateText(firstAction.sentAt)); return HtmlService.createHtmlOutput('<p>La primera acción ya fue enviada el ' + dateText(firstAction.sentAt) + '.</p>'); }
      try {
        sendAction_(firstAction, true);
        return HtmlService.createHtmlOutput('<p>La primera acción fue enviada correctamente a <strong>' + escapeHtml_(firstAction.email) + '</strong>.</p>');
      } catch (error) {
        log('ERROR envío inicial.', error.message);
        return HtmlService.createHtmlOutput('<p>No se pudo enviar la acción: ' + escapeHtml_(error.message) + '</p>');
      }
    }
    const token = String(event && event.parameter && event.parameter.token || '');
    const result = String(event && event.parameter && event.parameter.result || '');
    const record = findActionByToken_(token);
    if (!record || ['Realizado', 'No realizado'].indexOf(result) === -1) {
      log('ERROR respuesta de botón.', 'Token no encontrado o resultado no permitido.');
      return HtmlService.createHtmlOutput('<p>El enlace no es válido o ya no está disponible.</p>');
    }
    if (record.status === 'Finalizado') {
      return HtmlService.createHtmlOutput('<p>Esta acción ya fue registrada como finalizada.</p>');
    }
    const email = Session.getActiveUser().getEmail() || '';
    registerResponse_(record, result, 'Respuesta registrada desde el botón de correo.', email);
    return HtmlService.createHtmlOutput('<p>Respuesta registrada: <strong>' + escapeHtml_(result) + '</strong>.</p><p>Ya puedes cerrar esta ventana.</p>');
  };

  const registerResponse_ = (record, result, detail, respondent) => {
    const complete = result === 'Realizado';
    log('Registrando respuesta.', 'fila: ' + record.actionRow + ' | resultado: ' + result + ' | finaliza: ' + complete + ' | respondedor: ' + (respondent || 'no disponible'));
    getResponses().appendRow([record.actionId, record.processUrl, record.action, result, now(), record.email, respondent || '', detail || '']);
    if (complete) {
      updateControl_(record.controlRow, { completedAt: now(), status: 'Finalizado' });
      updateProcessRow_(record, 'G', now());
      updateProcessRow_(record, 'H', 'Finalizado');
      log('Acción finalizada.', 'fila: ' + record.actionRow);
      sendDependentActions_(record);
    } else {
      updateControl_(record.controlRow, { status: result === 'No realizado' ? 'No realizado' : 'En proceso' });
      updateProcessRow_(record, 'H', result === 'No realizado' ? 'No realizado' : 'En proceso');
      log('Respuesta registrada sin finalizar.', 'fila: ' + record.actionRow + ' | resultado: ' + result);
    }
  };

  const sendDependentActions_ = record => {
    const dependentActions = allActions_().filter(candidate => candidate.processId === record.processId && Number(candidate.dependency) === Number(record.actionRow));
    log('Buscando acciones dependientes.', 'origen: fila ' + record.actionRow + ' | encontradas: ' + dependentActions.length);
    dependentActions.forEach(candidate => sendAction_(candidate, false));
  };

  const getDependencyStatus_ = record => {
    const ss = SpreadsheetApp.openById(record.processId);
    const sheet = ss.getSheetByName(record.sheetName);
    if (!sheet) throw new Error('No se encontró la hoja "' + record.sheetName + '" para validar la dependencia.');
    return String(sheet.getRange('H' + record.dependency).getDisplayValue() || '').trim();
  };

  const updateProcessRow_ = (record, column, value) => {
    const ss = SpreadsheetApp.openById(record.processId);
    const sheet = ss.getSheetByName(record.sheetName);
    if (!sheet) throw new Error('No se encontró la hoja de acciones del expediente.');
    sheet.getRange(column + record.actionRow).setValue(value);
    if (value instanceof Date) sheet.getRange(column + record.actionRow).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  };

  const updateControl_ = (row, changes) => {
    const sheet = getControl();
    const mapping = { status: 13, sentAt: 14, completedAt: 15 };
    Object.keys(changes).forEach(key => {
      sheet.getRange(row, mapping[key]).setValue(changes[key]);
      if (changes[key] instanceof Date) sheet.getRange(row, mapping[key]).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    });
  };

  const recordFromRow_ = (values, row) => ({
    controlRow: row, processId: String(values[1]), processUrl: String(values[2]), toolRow: values[3],
    sheetName: String(values[4]), actionRow: Number(values[5]), actionId: String(values[6]), action: String(values[7]),
    email: String(values[8]), mode: String(values[9]), formType: String(values[10]), dependency: values[11],
    status: String(values[12]), sentAt: values[13], completedAt: values[14], token: String(values[15])
  });
  const allActions_ = () => {
    const sheet = getControl(); const last = sheet.getLastRow();
    return last < 2 ? [] : sheet.getRange(2, 1, last - 1, CONTROL_HEADERS.length).getValues().map((row, i) => recordFromRow_(row, i + 2));
  };
  const findAction_ = (processId, actionRow) => allActions_().filter(record => record.processId === processId && record.actionRow === Number(actionRow))[0];
  const findActionById_ = actionId => allActions_().filter(record => record.actionId === actionId)[0];
  const findActionByToken_ = token => allActions_().filter(record => record.token === token)[0];
  const escapeHtml_ = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  return { addMenu, setup, createProcesses, sendFirst, diagnoseFirst, processSendQueue, onFormSubmit, doGet };
})();

// Estas funciones quedan fuera del bloque únicamente porque Apps Script las exige como puntos de entrada.
function onOpen() { BCAT0065.addMenu(); }
function configurarBCAT0065() { BCAT0065.setup(); }
function generarExpedientesBCAT0065() { BCAT0065.createProcesses(); }
function enviarPrimeraAccionBCAT0065() { BCAT0065.sendFirst(); }
function diagnosticarPrimeraAccionBCAT0065() { BCAT0065.diagnoseFirst(); }
function procesarColaEnviosBCAT0065() { BCAT0065.processSendQueue(); }
function onFormSubmitBCAT0065(e) { BCAT0065.onFormSubmit(e); }
function doGet(e) { return BCAT0065.doGet(e); }
