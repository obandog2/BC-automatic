const CONFIG = Object.freeze({
  spreadsheetProperty: 'FORM_SPREADSHEET_ID',
  uploadFolderProperty: 'FORM_UPLOAD_FOLDER_ID',
  alertEmailProperty: 'FORM_ALERT_EMAIL',
  dashboardUrlProperty: 'FORM_DASHBOARD_URL',
  sheetName: 'Respostas',
  chaptersSheetName: 'Chapters',
  maxFiles: 3,
  maxFileBytes: 5 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
});

const HEADERS = Object.freeze([
  'Data e hora',
  'Protocolo',
  'Nome',
  'E-mail',
  'Chapter',
  'Fontes',
  'Descrição da situação',
  'Requer ação imediata',
  'Ações necessárias',
  'Possível causa',
  'Afetou a saúde de um paciente',
  'Poderia colocar em risco a saúde de um paciente',
  'Resultou em descumprimento de legislação local',
  'Poderia resultar em descumprimento de legislação local',
  'Afetou a qualidade de produtos no mercado',
  'Poderia afetar a qualidade de produtos no mercado',
  'Indicador de triagem',
  'Anexos',
  'Receber cópia',
  'Status',
  'Origem'
]);

const DEFAULT_CHAPTERS = Object.freeze([
  'Business Dev & Healthcare Transformation',
  'CX and Business Continuity - Customer Engagement',
  'CX and Business Continuity - Professional Services',
  'CX and Business Continuity - Supply',
  'Finance Sustainability and Operations',
  'Legal and Compliance',
  'Medical',
  'Quality and Regulatory',
  'Strategy and Transformation'
]);

/**
 * Cria a planilha e a pasta de anexos. Execute uma única vez antes de publicar.
 * @return {{spreadsheetUrl: string, folderUrl: string}}
 */
function setupProject() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(CONFIG.spreadsheetProperty);
  let folderId = properties.getProperty(CONFIG.uploadFolderProperty);

  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.create('Base - Gerenciamento de Melhoria e Resolução');

  if (!spreadsheetId) {
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(CONFIG.spreadsheetProperty, spreadsheetId);
  }

  configureResponsesSheet_(spreadsheet);
  configureChaptersSheet_(spreadsheet);

  const folder = folderId
    ? DriveApp.getFolderById(folderId)
    : DriveApp.createFolder('Anexos - Gerenciamento de Melhoria e Resolução');

  if (!folderId) {
    folderId = folder.getId();
    properties.setProperty(CONFIG.uploadFolderProperty, folderId);
  }

  console.log('Planilha: ' + spreadsheet.getUrl());
  console.log('Pasta de anexos: ' + folder.getUrl());
  return { spreadsheetUrl: spreadsheet.getUrl(), folderUrl: folder.getUrl() };
}

function setup() {
  return setupProject();
}

/**
 * Define o destinatário das notificações internas. Deixe vazio para desativar.
 * @param {string} email
 */
function setAlertEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (normalized && !isValidEmail_(normalized)) {
    throw new Error('Informe um e-mail válido.');
  }
  PropertiesService.getScriptProperties().setProperty(CONFIG.alertEmailProperty, normalized);
}

function setDashboardUrl(url) {
  PropertiesService.getScriptProperties().setProperty(
    CONFIG.dashboardUrlProperty,
    String(url || '').trim()
  );
}

function doGet(event) {
  const page = String((event && event.parameter && event.parameter.page) || 'portal').toLowerCase();
  const files = { portal: 'Portal', form: 'Index', tracking: 'Tracking' };
  const titles = {
    portal: 'Portal de Qualidade',
    form: 'Gerenciamento de Melhoria e Resolução',
    tracking: 'Monitorar solicitação'
  };
  const template = HtmlService.createTemplateFromFile(files[page] || files.portal);
  template.appUrl = ScriptApp.getService().getUrl();
  template.requestId = String((event && event.parameter && event.parameter.id) || '');
  return template.evaluate()
    .setTitle(titles[page] || titles.portal)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getInitialData() {
  const spreadsheet = ensureProject_();
  const sheet = spreadsheet.getSheetByName(CONFIG.chaptersSheetName);
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  const chapters = (rowCount ? sheet.getRange(2, 1, rowCount, 1).getDisplayValues() : [])
    .flat()
    .map(function (value) { return value.trim(); })
    .filter(Boolean);

  return {
    chapters: chapters.length ? chapters : DEFAULT_CHAPTERS.slice(),
    email: getCurrentUserEmail_()
  };
}

function getPortalData() {
  return {
    appUrl: ScriptApp.getService().getUrl(),
    dashboardUrl: PropertiesService.getScriptProperties().getProperty(CONFIG.dashboardUrlProperty) || ''
  };
}

/**
 * Valida e grava uma resposta. Os dados chegam por google.script.run.
 * @param {Object} payload
 * @return {{ok: boolean, protocol: string}}
 */
function submitForm(payload) {
  ensureProject_();
  payload.email = getCurrentUserEmail_() || String(payload.email || '').trim();
  validatePayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  let uploadedFiles = [];
  let protocol = '';
  let triage = '';
  try {
    protocol = createProtocol_();
    uploadedFiles = saveAttachments_(payload.attachments || [], protocol);
    triage = calculateTriage_(payload);
    const row = buildRow_(payload, protocol, triage, uploadedFiles);
    const sheet = getSpreadsheet_().getSheetByName(CONFIG.sheetName);
    sheet.appendRow(row);
    const rowNumber = sheet.getLastRow();
    sheet.getRange(rowNumber, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');

  } catch (error) {
    uploadedFiles.forEach(function (file) {
      try { DriveApp.getFileById(file.id).setTrashed(true); } catch (ignored) {}
    });
    console.error(error);
    throw new Error('Não foi possível registrar a resposta. Tente novamente mais tarde.');
  } finally {
    lock.releaseLock();
  }

  // A resposta já foi gravada. Falhas de e-mail não devem gerar duplicidade.
  try {
    sendEmails_(payload, protocol, triage, uploadedFiles);
  } catch (emailError) {
    console.error('Resposta ' + protocol + ' gravada, mas o e-mail falhou: ' + emailError);
  }
  return { ok: true, protocol: protocol };
}

function configureResponsesSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    const firstSheet = spreadsheet.getSheets()[0];
    sheet = firstSheet.getName() === 'Sheet1' || firstSheet.getName() === 'Página1'
      ? firstSheet.setName(CONFIG.sheetName)
      : spreadsheet.insertSheet(CONFIG.sheetName);
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground('#0b3d91')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setWrap(true);
  sheet.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm:ss');
  sheet.autoResizeColumns(1, HEADERS.length);
}

function configureChaptersSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.chaptersSheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.chaptersSheetName);
  }

  if (sheet.getLastRow() < 2) {
    sheet.clear();
    sheet.getRange(1, 1).setValue('Chapter');
    sheet.getRange(2, 1, DEFAULT_CHAPTERS.length, 1)
      .setValues(DEFAULT_CHAPTERS.map(function (chapter) { return [chapter]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1).setBackground('#0b3d91').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumn(1);
  }
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetProperty);
  if (!id) {
    throw new Error('Execute setupProject() antes de publicar a aplicação.');
  }
  return SpreadsheetApp.openById(id);
}

function ensureProject_() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty(CONFIG.spreadsheetProperty) ||
      !properties.getProperty(CONFIG.uploadFolderProperty)) {
    setupProject();
  }
  const spreadsheet = getSpreadsheet_();
  configureResponsesSheet_(spreadsheet);
  configureChaptersSheet_(spreadsheet);
  return spreadsheet;
}

function getCurrentUserEmail_() {
  return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
}

function validatePayload_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta inválida.');
  }
  if (payload.website) {
    throw new Error('Envio rejeitado.');
  }
  if (!payload.startedAt || Date.now() - Number(payload.startedAt) < 2500) {
    throw new Error('Envio rápido demais. Revise as respostas.');
  }

  requireText_(payload.email, 'E-mail', 180);
  if (!isValidEmail_(payload.email)) throw new Error('Informe um e-mail válido.');
  requireText_(payload.chapter, 'Chapter', 180);

  const validChapters = getInitialData().chapters;
  if (validChapters.indexOf(String(payload.chapter).trim()) === -1) {
    throw new Error('Selecione um Chapter válido.');
  }

  if (!Array.isArray(payload.sources) || payload.sources.length === 0) {
    throw new Error('Selecione ao menos uma fonte da situação.');
  }
  const validSources = [
    'Desvio de Processo',
    'Reclamação de Cliente (e outras atividades pós-venda)',
    'Auditorias',
    'Revisão Gerencial',
    'Análise de Tendência (Monitoramento de Dados)',
    'Atividades de Melhoria Contínua'
  ];
  payload.sources.forEach(function (source) {
    if (validSources.indexOf(source) === -1) throw new Error('Fonte inválida.');
  });

  requireText_(payload.situation, 'Descrição da situação', 5000);
  validateChoice_(payload.requiresAction, ['Sim', 'Não'], 'Ação imediata');
  if (payload.requiresAction === 'Sim') {
    requireText_(payload.actions, 'Ações necessárias', 3000);
  }
  if (payload.actions) requireText_(payload.actions, 'Ações necessárias', 3000);
  if (payload.cause) requireText_(payload.cause, 'Possível causa', 3000);

  const riskChoices = ['Sim', 'Não', 'Não tenho esta informação'];
  [
    ['affectedPatient', 'Impacto na saúde'],
    ['patientRisk', 'Risco para a saúde'],
    ['brokeLaw', 'Descumprimento legal'],
    ['lawRisk', 'Risco de descumprimento legal'],
    ['affectedQuality', 'Impacto na qualidade'],
    ['qualityRisk', 'Risco para a qualidade']
  ].forEach(function (item) {
    validateChoice_(payload[item[0]], riskChoices, item[1]);
  });

  if (payload.attachments && !Array.isArray(payload.attachments)) {
    throw new Error('Anexos inválidos.');
  }
  if ((payload.attachments || []).length > CONFIG.maxFiles) {
    throw new Error('Envie no máximo ' + CONFIG.maxFiles + ' arquivos.');
  }
}

function requireText_(value, label, maxLength) {
  const text = String(value || '').trim();
  if (!text) throw new Error('O campo "' + label + '" é obrigatório.');
  if (text.length > maxLength) throw new Error('O campo "' + label + '" excede o limite permitido.');
}

function validateChoice_(value, allowed, label) {
  if (allowed.indexOf(value) === -1) {
    throw new Error('Selecione uma opção válida em "' + label + '".');
  }
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function saveAttachments_(attachments, protocol) {
  if (!attachments.length) return [];
  const folderId = PropertiesService.getScriptProperties().getProperty(CONFIG.uploadFolderProperty);
  if (!folderId) throw new Error('A pasta de anexos não foi configurada.');
  const folder = DriveApp.getFolderById(folderId);

  return attachments.map(function (attachment, index) {
    const mimeType = String(attachment.mimeType || '');
    if (CONFIG.allowedMimeTypes.indexOf(mimeType) === -1) {
      throw new Error('Tipo de arquivo não permitido.');
    }
    const bytes = Utilities.base64Decode(String(attachment.base64 || ''));
    if (bytes.length > CONFIG.maxFileBytes) {
      throw new Error('Cada arquivo deve ter no máximo 5 MB.');
    }
    const safeName = sanitizeFileName_(attachment.name || ('arquivo-' + (index + 1)));
    const blob = Utilities.newBlob(bytes, mimeType, protocol + ' - ' + safeName);
    const file = folder.createFile(blob);
    return { id: file.getId(), name: file.getName(), url: file.getUrl() };
  });
}

function sanitizeFileName_(name) {
  return String(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 140);
}

function createProtocol_() {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  const suffix = Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  return 'GMR-' + date + '-' + suffix;
}

function calculateTriage_(payload) {
  const answers = [
    payload.affectedPatient,
    payload.patientRisk,
    payload.brokeLaw,
    payload.lawRisk,
    payload.affectedQuality,
    payload.qualityRisk
  ];
  if (answers.indexOf('Sim') !== -1) return 'Revisão prioritária';
  if (answers.indexOf('Não tenho esta informação') !== -1) return 'Informação pendente';
  return 'Sem sinalização inicial';
}

function buildRow_(payload, protocol, triage, files) {
  return [
    new Date(),
    protocol,
    '',
    safeCell_(String(payload.email).toLowerCase()),
    safeCell_(payload.chapter),
    safeCell_(payload.sources.join(' | ')),
    safeCell_(payload.situation),
    payload.requiresAction,
    safeCell_(payload.requiresAction === 'Sim' ? payload.actions : (payload.actions || 'N/A')),
    safeCell_(payload.cause || 'N/A'),
    payload.affectedPatient,
    payload.patientRisk,
    payload.brokeLaw,
    payload.lawRisk,
    payload.affectedQuality,
    payload.qualityRisk,
    triage,
    safeCell_(files.map(function (file) { return file.url; }).join('\n')),
    payload.sendCopy ? 'Sim' : 'Não',
    'Novo',
    'Web App pública'
  ];
}

function safeCell_(value) {
  const text = String(value == null ? '' : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function sendEmails_(payload, protocol, triage, files) {
  const alertEmail = PropertiesService.getScriptProperties().getProperty(CONFIG.alertEmailProperty);
  const fileList = files.length
    ? '<ul>' + files.map(function (file) {
        return '<li><a href="' + escapeHtml_(file.url) + '">' + escapeHtml_(file.name) + '</a></li>';
      }).join('') + '</ul>'
    : '<p>Sem anexos.</p>';

  if (alertEmail) {
    MailApp.sendEmail({
      to: alertEmail,
      subject: '[' + triage + '] Nova resposta ' + protocol,
      htmlBody:
        '<h2>Nova situação registrada</h2>' +
        '<p><strong>Protocolo:</strong> ' + escapeHtml_(protocol) + '</p>' +
        '<p><strong>E-mail:</strong> ' + escapeHtml_(payload.email) + '</p>' +
        '<p><strong>Chapter:</strong> ' + escapeHtml_(payload.chapter) + '</p>' +
        '<p><strong>Triagem:</strong> ' + escapeHtml_(triage) + '</p>' +
        '<p><strong>Descrição:</strong><br>' + escapeHtml_(payload.situation).replace(/\n/g, '<br>') + '</p>' +
        fileList,
      name: 'Gerenciamento de Melhoria e Resolução'
    });
  }

  if (payload.sendCopy) {
    MailApp.sendEmail({
      to: String(payload.email).trim(),
      subject: 'Recebemos sua resposta - ' + protocol,
      htmlBody:
        '<h2>Resposta recebida</h2>' +
        '<p>Olá.</p>' +
        '<p>Registramos sua situação com o protocolo <strong>' + escapeHtml_(protocol) + '</strong>.</p>' +
        '<p>Guarde este número para futuras consultas.</p>',
      name: 'Gerenciamento de Melhoria e Resolução'
    });
  }
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function lookupRequest(protocol) {
  const normalized = String(protocol || '').trim().toUpperCase();
  if (!/^GMR-\d{8}-[A-F0-9]{8}$/.test(normalized)) {
    throw new Error('Informe um protocolo válido, por exemplo GMR-20260911-A1B2C3D4.');
  }

  const sheet = ensureProject_().getSheetByName(CONFIG.sheetName);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return null;

  const headers = values[0];
  const protocolIndex = headers.indexOf('Protocolo');
  const row = values.slice(1).find(function (item) {
    return String(item[protocolIndex]).trim().toUpperCase() === normalized;
  });
  if (!row) return null;

  function value(header) {
    const index = headers.indexOf(header);
    return index >= 0 ? row[index] : '';
  }

  return {
    protocol: normalized,
    createdAt: value('Data e hora'),
    chapter: value('Chapter'),
    triage: value('Indicador de triagem'),
    status: value('Status') || 'Novo'
  };
}
