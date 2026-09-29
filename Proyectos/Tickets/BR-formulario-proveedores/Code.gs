/**
 * Programado por: Gabriela Obando
 *
 * ¿Qué hace?
 * Guarda las NC internas y las NC de proveedores en dos pestañas del mismo
 * archivo, conserva anexos y notifica siempre al reportante y a Calidad.
 *
 * Validaciones para ejecutar setupProject():
 * 1) La cuenta ejecutora debe poder acceder a Base - Gerenciamento de Melhoria e Resolução.
 * 2) La cuenta ejecutora debe poder crear o acceder a la carpeta de anexos.
 * 3) Las pestañas NC Internas, NC Fornecedores, Chapters y Fornecedores deben estar disponibles.
 *
 * Validaciones para ejecutar submitForm():
 * 1) Chapter (NC Internas), fuente, descripción y clasificación inicial son obligatorios.
 * 2) Si requiere acción inmediata (NC Internas), las acciones necesarias deben estar llenas.
 * 3) Los anexos permitidos son PDF, JPG, PNG, DOCX y XLSX; máximo 3 de 5 MB.
 *
 * Validaciones para ejecutar submitSupplierForm():
 * 1) Fornecedor (NC Fornecedores), responsables, fechas, fuente, descripción y riesgo son obligatorios.
 * 2) El proveedor debe existir en la pestaña Fornecedores.
 * 3) Los anexos permitidos son PDF, JPG, PNG, DOCX y XLSX; máximo 3 de 5 MB.
 *
 * Validaciones para ejecutar getDashboardData():
 * 1) Las pestañas NC Internas y NC Fornecedores deben existir en la misma base.
 * 2) Ambas pestañas deben conservar la columna Protocolo y la columna Status.
 * 3) El dashboard es solo de lectura: no modifica registros ni estados.
 */

const BR_NC = (() => {
  const CONFIG = Object.freeze({
    spreadsheetProperty: 'FORM_SPREADSHEET_ID', uploadFolderProperty: 'FORM_UPLOAD_FOLDER_ID',
    alertEmailProperty: 'FORM_ALERT_EMAIL', dashboardUrlProperty: 'FORM_DASHBOARD_URL',
    internalSheetName: 'NC Internas', supplierSheetName: 'NC Fornecedores',
    legacyInternalSheetName: 'Respostas', chaptersSheetName: 'Chapters', suppliersSheetName: 'Fornecedores',
    maxFiles: 3, maxFileBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  });

  const INTERNAL_HEADERS = Object.freeze([
    'Data e hora', 'Protocolo', 'Nome', 'E-mail', 'Chapter', 'Fontes', 'Descrição da situação',
    'Requer ação imediata', 'Ações necessárias', 'Possível causa', 'Afetou a saúde de um paciente',
    'Poderia colocar em risco a saúde de um paciente', 'Resultou em descumprimento de legislação local',
    'Poderia resultar em descumprimento de legislação local', 'Afetou a qualidade de produtos no mercado',
    'Poderia afetar a qualidade de produtos no mercado', 'Indicador de triagem', 'Anexos',
    'Receber cópia', 'Status', 'Origem'
  ]);
  const SUPPLIER_HEADERS = Object.freeze([
    'Data e hora', 'Protocolo', 'E-mail do reportante', 'Fornecedor', 'Data do preenchimento do formulário',
    'E-mail responsável fornecedor', 'Data da identificação da NC', 'Fonte da NC', 'Descrição da NC',
    'Contenção/Correção necessária Roche', 'Classificação de Risco da NC', 'Data da Avaliação de Risco',
    'E-mail responsável Roche', 'Anexos', 'Status', 'Origem'
  ]);
  const DEFAULT_CHAPTERS = Object.freeze(['Business Dev & Healthcare Transformation', 'CX and Business Continuity - Customer Engagement', 'CX and Business Continuity - Professional Services', 'CX and Business Continuity - Supply', 'Finance Sustainability and Operations', 'Legal and Compliance', 'Medical', 'Quality and Regulatory', 'Strategy and Transformation']);
  const DEFAULT_SUPPLIERS = Object.freeze(['Aferitec', 'Balitek', 'Bio Rad', 'Bomi Itapevi', 'Bomi Itajaí', 'Bomi - Transporte', 'Tecinlab', 'C4', 'CLIF']);
  const SUPPLIER_SOURCES = Object.freeze(['Auditoria de Fornecedor', 'Reclamação', 'Produção', 'Cadeia de Suprimentos/Reivindicações']);
  const SUPPLIER_RISKS = Object.freeze(['NC de Risco Baixo', 'NC de Risco Moderado', 'NC de Risco Alto']);
  const LOGO_URL = 'https://lh3.googleusercontent.com/d/1vsYZaquFToJi11vd611aXlvwT-bBTo4N';

  const log = (message, detail) => Logger.log('[NC BR] ' + message + (detail ? ' | ' + detail : ''));
  const text = value => String(value == null ? '' : value).trim();
  const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value));
  const currentEmail_ = () => text(Session.getActiveUser().getEmail()).toLowerCase();
  const safe_ = value => /^[=+\-@]/.test(text(value)) ? "'" + text(value) : text(value);
  const escape_ = value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const setupProject = () => {
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty(CONFIG.spreadsheetProperty);
    const folderId = properties.getProperty(CONFIG.uploadFolderProperty);
    const spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.create('Base - Gerenciamento de Melhoria e Resolução');
    if (!spreadsheetId) properties.setProperty(CONFIG.spreadsheetProperty, spreadsheet.getId());
    configureResponseSheets_(spreadsheet);
    configureCatalog_(spreadsheet, CONFIG.chaptersSheetName, 'Chapter', DEFAULT_CHAPTERS);
    configureCatalog_(spreadsheet, CONFIG.suppliersSheetName, 'Fornecedor', DEFAULT_SUPPLIERS);
    const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.createFolder('Anexos - Gerenciamento de Melhoria e Resolução');
    if (!folderId) properties.setProperty(CONFIG.uploadFolderProperty, folder.getId());
    log('Proyecto configurado.', 'base: ' + spreadsheet.getUrl() + ' | carpeta: ' + folder.getUrl());
    return { spreadsheetUrl: spreadsheet.getUrl(), folderUrl: folder.getUrl() };
  };

  const doGet = event => {
    const page = text(event && event.parameter && event.parameter.page).toLowerCase() || 'portal';
    const files = { portal: 'Portal', form: 'Index', supplier: 'Supplier', tracking: 'Tracking', dashboard: 'Dashboard' };
    const titles = { portal: 'Portal de Qualidade', form: 'Gerenciamento de Melhoria e Resolução', supplier: 'Não Conformidades de Fornecedores', tracking: 'Monitorar solicitação', dashboard: 'Dashboard de Não Conformidades' };
    const template = HtmlService.createTemplateFromFile(files[page] || 'Portal');
    template.appUrl = ScriptApp.getService().getUrl();
    template.requestId = text(event && event.parameter && event.parameter.id);
    if (page === 'portal') {
      const data = getPortalData(); template.databaseUrl = data.databaseUrl; template.dashboardUrl = data.dashboardUrl;
    }
    return template.evaluate().setTitle(titles[page] || titles.portal).addMetaTag('viewport', 'width=device-width, initial-scale=1');
  };

  const getInitialData = () => {
    const ss = ensureProject_();
    return { chapters: getCatalog_(ss, CONFIG.chaptersSheetName, DEFAULT_CHAPTERS), suppliers: getCatalog_(ss, CONFIG.suppliersSheetName, DEFAULT_SUPPLIERS), email: currentEmail_() };
  };
  const getPortalData = () => {
    const ss = ensureProject_();
    return { appUrl: ScriptApp.getService().getUrl(), databaseUrl: ss.getUrl(), dashboardUrl: PropertiesService.getScriptProperties().getProperty(CONFIG.dashboardUrlProperty) || '' };
  };
  
  // Devuelve únicamente datos de lectura para Dashboard.html.
  const getDashboardData = () => {
    const ss = ensureProject_();
    const internal = readDashboardSheet_(ss, CONFIG.internalSheetName, 'Interna');
    const supplier = readDashboardSheet_(ss, CONFIG.supplierSheetName, 'Fornecedor');
    const records = internal.concat(supplier).sort((a, b) => String(b.createdAtIso).localeCompare(String(a.createdAtIso)));
    return {
      generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
      spreadsheetUrl: ss.getUrl(),
      records: records,
      filters: {
        types: ['Interna', 'Fornecedor'],
        statuses: uniqueSorted_(records.map(record => record.status)),
        entities: uniqueSorted_(records.map(record => record.entity)),
        sources: uniqueSorted_(records.map(record => record.source)),
        risks: uniqueSorted_(records.map(record => record.risk)),
        years: uniqueSorted_(records.map(record => record.year))
      }
    };
  };
  // Acepta una o varias direcciones separadas por coma o punto y coma.
  const setAlertEmail = emails => {
    const parsed = parseEmails_(emails);
    if (text(emails) && !parsed.length) throw new Error('Informe al menos un e-mail válido.');
    PropertiesService.getScriptProperties().setProperty(CONFIG.alertEmailProperty, parsed.join(','));
    log('Destinatarios de Calidad actualizados.', parsed.join(', ') || 'sin destinatarios');
  };
  const setDashboardUrl = url => PropertiesService.getScriptProperties().setProperty(CONFIG.dashboardUrlProperty, text(url));

  // Compatibilidad con Index.html actual.
  const submitForm = payload => submitInternalForm(payload);
  const submitInternalForm = payload => {
    const record = {
      type: 'interna', reporterEmail: currentEmail_() || text(payload && payload.email).toLowerCase(),
      chapter: text(payload && payload.chapter), sources: (payload && payload.sources) || [], situation: text(payload && payload.situation),
      requiresAction: text(payload && payload.requiresAction), actions: text(payload && payload.actions), cause: text(payload && payload.cause),
      affectedPatient: text(payload && payload.affectedPatient), patientRisk: text(payload && payload.patientRisk), brokeLaw: text(payload && payload.brokeLaw), lawRisk: text(payload && payload.lawRisk), affectedQuality: text(payload && payload.affectedQuality), qualityRisk: text(payload && payload.qualityRisk),
      attachments: (payload && payload.attachments) || [], website: text(payload && payload.website), startedAt: Number(payload && payload.startedAt)
    };
    validateInternal_(record); return saveRecord_(record);
  };
  const submitSupplierForm = payload => {
    const record = {
      type: 'fornecedor', reporterEmail: currentEmail_() || text(payload && payload.reporterEmail).toLowerCase(),
      supplier: text(payload && payload.supplier), supplierContactEmail: text(payload && payload.supplierContactEmail).toLowerCase(), formDate: text(payload && payload.formDate), identificationDate: text(payload && payload.identificationDate), supplierSource: text(payload && payload.supplierSource), situation: text(payload && payload.situation), rocheContainment: text(payload && payload.rocheContainment), riskClassification: text(payload && payload.riskClassification), riskAssessmentDate: text(payload && payload.riskAssessmentDate), rocheResponsibleEmail: text(payload && payload.rocheResponsibleEmail).toLowerCase(),
      attachments: (payload && payload.attachments) || [], website: text(payload && payload.website), startedAt: Number(payload && payload.startedAt)
    };
    validateSupplier_(record); return saveRecord_(record);
  };

  const saveRecord_ = record => {
    const lock = LockService.getScriptLock(); lock.waitLock(30000);
    let files = []; let protocol = '';
    try {
      protocol = record.type === 'fornecedor' ? createSupplierProtocol_() : createInternalProtocol_();
      files = saveAttachments_(record.attachments, protocol); record.triage = calculateTriage_(record); appendRecord_(record, protocol, files);
    } catch (error) {
      files.forEach(file => { try { DriveApp.getFileById(file.id).setTrashed(true); } catch (ignored) {} });
      log('ERROR al registrar.', error.message); throw new Error('Não foi possível registrar a resposta. Tente novamente mais tarde.');
    } finally { lock.releaseLock(); }
    try { sendEmails_(record, protocol, files); } catch (error) { log('Registro guardado; fallo el e-mail.', error.message); }
    log('Registro creado.', 'protocolo: ' + protocol + ' | tipo: ' + record.type);
    return { ok: true, protocol: protocol };
  };

  const validateCommon_ = record => {
    if (record.website) throw new Error('Envio rejeitado.');
    if (!record.startedAt || Date.now() - record.startedAt < 2500) throw new Error('Envio rápido demais. Revise as respostas.');
    if (!isEmail(record.reporterEmail)) throw new Error('Informe um e-mail corporativo válido.');
    if (!Array.isArray(record.attachments) || record.attachments.length > CONFIG.maxFiles) throw new Error('Envie no máximo ' + CONFIG.maxFiles + ' arquivos.');
  };
  const validateInternal_ = record => {
    validateCommon_(record);
    if (getInitialData().chapters.indexOf(record.chapter) === -1) throw new Error('Selecione um Chapter válido.');
    if (!record.sources.length) throw new Error('Selecione ao menos uma fonte da situação.');
    if (!record.situation || record.situation.length > 5000) throw new Error('Descrição da situação é obrigatória e deve ter no máximo 5000 caracteres.');
    if (['Sim', 'Não'].indexOf(record.requiresAction) === -1) throw new Error('Selecione a ação imediata.');
    if (record.requiresAction === 'Sim' && !record.actions) throw new Error('Descreva as ações necessárias.');
    ['affectedPatient', 'patientRisk', 'brokeLaw', 'lawRisk', 'affectedQuality', 'qualityRisk'].forEach(key => {
      if (['Sim', 'Não', 'Não tenho esta informação'].indexOf(record[key]) === -1) throw new Error('Responda todas as perguntas de classificação inicial.');
    });
  };
  const validateSupplier_ = record => {
    validateCommon_(record);
    if (getInitialData().suppliers.indexOf(record.supplier) === -1) throw new Error('Selecione um fornecedor válido.');
    if (!isEmail(record.supplierContactEmail) || !isEmail(record.rocheResponsibleEmail)) throw new Error('Informe os dois e-mails responsáveis válidos.');
    if (![record.formDate, record.identificationDate, record.riskAssessmentDate].every(validDate_)) throw new Error('Informe datas válidas.');
    if (SUPPLIER_SOURCES.indexOf(record.supplierSource) === -1 || SUPPLIER_RISKS.indexOf(record.riskClassification) === -1) throw new Error('Selecione fonte e classificação de risco válidas.');
    if (!record.situation || !record.rocheContainment) throw new Error('Descrição e contenção/correção Roche são obrigatórias.');
  };
  const validDate_ = value => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) && !isNaN(new Date(value + 'T12:00:00').getTime());

  const appendRecord_ = (record, protocol, files) => {
    const ss = ensureProject_(); const supplier = record.type === 'fornecedor';
    const sheet = ss.getSheetByName(supplier ? CONFIG.supplierSheetName : CONFIG.internalSheetName);
    const values = supplier ? [
      new Date(), protocol, safe_(record.reporterEmail), safe_(record.supplier), record.formDate, safe_(record.supplierContactEmail), record.identificationDate, safe_(record.supplierSource), safe_(record.situation), safe_(record.rocheContainment), safe_(record.riskClassification), record.riskAssessmentDate, safe_(record.rocheResponsibleEmail), safe_(files.map(file => file.url).join('\n')), 'Novo', 'Web App'
    ] : [
      new Date(), protocol, '', safe_(record.reporterEmail), safe_(record.chapter), safe_(record.sources.join(' | ')), safe_(record.situation), record.requiresAction, safe_(record.actions || 'N/A'), safe_(record.cause || 'N/A'), record.affectedPatient, record.patientRisk, record.brokeLaw, record.lawRisk, record.affectedQuality, record.qualityRisk, record.triage, safe_(files.map(file => file.url).join('\n')), 'Sim', 'Novo', 'Web App'
    ];
    sheet.appendRow(values); sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  };

  const saveAttachments_ = (attachments, protocol) => {
    if (!attachments.length) return [];
    const folderId = PropertiesService.getScriptProperties().getProperty(CONFIG.uploadFolderProperty);
    if (!folderId) throw new Error('A pasta de anexos não foi configurada.');
    const folder = DriveApp.getFolderById(folderId);
    return attachments.map((item, index) => {
      const mime = text(item.mimeType); if (CONFIG.allowedMimeTypes.indexOf(mime) === -1) throw new Error('Tipo de arquivo não permitido.');
      const bytes = Utilities.base64Decode(text(item.base64)); if (bytes.length > CONFIG.maxFileBytes) throw new Error('Cada arquivo deve ter no máximo 5 MB.');
      const file = folder.createFile(
        Utilities.newBlob(bytes, mime, protocol + ' - ' + sanitize_(item.name || ('arquivo-' + (index + 1))))
      );
      return { id: file.getId(), name: file.getName(), url: file.getUrl() };
    });
  };
  const createInternalProtocol_ = () => {
    const properties = PropertiesService.getScriptProperties(); const key = 'ULTIMO_NUMERO_NC_BR';
    const next = Number(properties.getProperty(key) || '0') + 1; properties.setProperty(key, String(next));
    return 'NC.BR-' + String(next).padStart(3, '0');
  };
  // Formato solicitado: SA-(día)(mes)/(dos últimos dígitos del año), por ejemplo SA-289/26.
  const createSupplierProtocol_ = () => { const date = new Date(); return 'SA-' + date.getDate() + (date.getMonth() + 1) + '/' + String(date.getFullYear()).slice(-2); };
  const calculateTriage_ = record => {
    if (record.type === 'fornecedor') return record.riskClassification;
    const answers = [record.affectedPatient, record.patientRisk, record.brokeLaw, record.lawRisk, record.affectedQuality, record.qualityRisk];
    return answers.indexOf('Sim') >= 0 ? 'Revisão prioritária' : answers.indexOf('Não tenho esta informação') >= 0 ? 'Informação pendente' : 'Sem sinalização inicial';
  };

  const sendEmails_ = (record, protocol, files) => {
    const supplier = record.type === 'fornecedor'; const ss = ensureProject_();
    const title = supplier ? 'Não Conformidade de Fornecedor' : 'Não Conformidade Interna';
    const trackingUrl = ScriptApp.getService().getUrl() + '?page=tracking&id=' + encodeURIComponent(protocol);
    const attachments = files.length ? '<ul>' + files.map(file => '<li><a href="' + escape_(file.url) + '">' + escape_(file.name) + '</a></li>').join('') + '</ul>' : '<p>Sem anexos.</p>';
    const details = supplier ? supplierDetailsHtml_(record) : internalDetailsHtml_(record);
    MailApp.sendEmail({
      to: record.reporterEmail, subject: 'Recebemos sua solicitação - ' + protocol,
      htmlBody: emailShell_('Solicitação registrada', '<p>Olá,</p><p>Sua <strong>' + escape_(title) + '</strong> foi registrada com sucesso.</p><p><strong>Protocolo:</strong> ' + escape_(protocol) + '</p>' + details + attachments + '<p><a href="' + escape_(trackingUrl) + '">Monitorar sua solicitação</a></p>'),
      name: 'Gerenciamento de Melhoria e Resolução'
    });
    if (supplier) {
      MailApp.sendEmail({
        to: record.supplierContactEmail,
        cc: record.rocheResponsibleEmail,
        subject: '[' + title + '] ' + protocol,
        htmlBody: emailShell_('Nova não conformidade de fornecedor', '<p>Olá,</p><p>Foi registrada uma nova não conformidade relacionada ao fornecedor <strong>' + escape_(record.supplier) + '</strong>.</p><p><strong>Protocolo:</strong> ' + escape_(protocol) + '</p>' + details + attachments),
        name: 'Gerenciamento de Melhoria e Resolução'
      });
    }
    const quality = parseEmails_(PropertiesService.getScriptProperties().getProperty(CONFIG.alertEmailProperty));
    if (!quality.length) { log('Aviso: sin destinatarios de Calidad.', 'ejecute setAlertEmail("correo1@roche.com,correo2@roche.com")'); return; }
    MailApp.sendEmail({
      to: quality.join(','), subject: '[' + title + '] ' + protocol,
      htmlBody: emailShell_('Nova solicitação para análise', '<p>Foi registrada uma nova <strong>' + escape_(title) + '</strong>.</p><p><strong>Protocolo:</strong> ' + escape_(protocol) + '</p>' + details + attachments + '<p><a href="' + escape_(ss.getUrl()) + '">Abrir base de dados</a></p><p><a href="' + escape_(trackingUrl) + '">Monitorar solicitação</a></p>'),
      name: 'Gerenciamento de Melhoria e Resolução'
    });
    log('Notificaciones enviadas.', 'protocolo: ' + protocol + ' | Calidad: ' + quality.join(', '));
  };
  const emailShell_ = (heading, body) => '<div style="font-family:Arial,sans-serif;color:#14213d;max-width:650px;margin:0 auto;line-height:1.55"><div style="border-bottom:4px solid #0b5bd3;padding:0 0 14px;margin-bottom:22px"><img src="' + LOGO_URL + '" alt="Logo" style="display:block;max-width:130px;max-height:54px"></div><h2 style="color:#082c70">' + escape_(heading) + '</h2>' + body + '<p style="margin-top:32px;color:#64748b;font-size:12px">Gerenciamento de Melhoria e Resolução</p></div>';
  const internalDetailsHtml_ = record => '<div style="background:#f4f7fb;border-left:4px solid #0b5bd3;padding:14px 16px"><p><strong>Chapter:</strong> ' + escape_(record.chapter) + '</p><p><strong>Fonte:</strong> ' + escape_(record.sources.join(' | ')) + '</p><p><strong>Descrição:</strong><br>' + escape_(record.situation).replace(/\n/g, '<br>') + '</p><p><strong>Triagem:</strong> ' + escape_(record.triage) + '</p></div>';
  const supplierDetailsHtml_ = record => '<div style="background:#f4f7fb;border-left:4px solid #0b5bd3;padding:14px 16px"><p><strong>Fornecedor:</strong> ' + escape_(record.supplier) + '</p><p><strong>Data de identificação:</strong> ' + escape_(record.identificationDate) + '</p><p><strong>Fonte:</strong> ' + escape_(record.supplierSource) + '</p><p><strong>Descrição:</strong><br>' + escape_(record.situation).replace(/\n/g, '<br>') + '</p><p><strong>Contenção/Correção Roche:</strong><br>' + escape_(record.rocheContainment).replace(/\n/g, '<br>') + '</p><p><strong>Classificação de risco:</strong> ' + escape_(record.riskClassification) + '</p></div>';

  const lookupRequest = protocol => {
    const normalized = text(protocol).toUpperCase();
    if (!/^(NC\.BR-\d{3,}|SA-\d{2,4}\/\d{2})$/.test(normalized)) throw new Error('Informe um protocolo válido.');
    const ss = ensureProject_();
    return [CONFIG.internalSheetName, CONFIG.supplierSheetName].map(name => findProtocol_(ss.getSheetByName(name), normalized)).filter(Boolean)[0] || null;
  };
  const findProtocol_ = (sheet, protocol) => {
    const values = sheet.getDataRange().getDisplayValues(); if (values.length < 2) return null;
    const headers = values[0]; const index = headers.indexOf('Protocolo'); const row = values.slice(1).find(item => text(item[index]).toUpperCase() === protocol);
    if (!row) return null;
    const value = header => { const i = headers.indexOf(header); return i >= 0 ? row[i] : ''; };
    return { protocol: protocol, createdAt: value('Data e hora'), chapter: value('Chapter') || value('Fornecedor'), triage: value('Indicador de triagem') || value('Classificação de Risco da NC'), status: value('Status') || 'Novo' };
  };

  const readDashboardSheet_ = (ss, sheetName, type) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return [];
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(text);
    const column = aliases => {
      for (let index = 0; index < aliases.length; index++) {
        const found = headers.indexOf(aliases[index]);
        if (found >= 0) return found;
      }
      return -1;
    };
    const columns = {
      date: column(['Data e hora']), protocol: column(['Protocolo']), status: column(['Status']),
      description: column(type === 'Interna' ? ['Descrição da situação'] : ['Descrição da NC']),
      entity: column(type === 'Interna' ? ['Chapter'] : ['Fornecedor']),
      source: column(type === 'Interna' ? ['Fontes'] : ['Fonte da NC']),
      triage: column(type === 'Interna' ? ['Indicador de triagem'] : ['Classificação de Risco da NC']),
      risk: column(type === 'Fornecedor' ? ['Classificação de Risco da NC'] : []),
      reporter: column(type === 'Interna' ? ['E-mail'] : ['E-mail do reportante']),
      action: column(['Requer ação imediata']), attachments: column(['Anexos'])
    };
    return values.slice(1).map((row, index) => {
      const value = key => columns[key] < 0 ? '' : text(row[columns[key]]);
      const date = dashboardDate_(columns.date < 0 ? null : row[columns.date]);
      const triage = value('triage');
      const risk = dashboardRisk_(value('risk') || triage);
      const normalizedStatus = value('status') || 'Novo';
      const isClosed = /finaliz|fechad|cerrad|conclu|resolvid|cancelad/i.test(normalizedStatus);
      const isPriority = type === 'Fornecedor'
        ? risk === 'Alto'
        : /priorit|sim/i.test(triage + ' ' + value('action'));
      return {
        type: type,
        rowNumber: index + 2,
        sourceUrl: ss.getUrl() + '#gid=' + sheet.getSheetId() + '&range=A' + (index + 2),
        protocol: value('protocol'), status: normalizedStatus, entity: value('entity') || 'Sem informação',
        source: value('source') || 'Sem informação', description: value('description'), triage: triage || 'Sem informação',
        risk: risk, reporter: value('reporter'), attachments: value('attachments'),
        createdAt: date.display, createdAtIso: date.iso, year: date.year,
        isClosed: isClosed, isOpen: !isClosed, isPriority: isPriority
      };
    }).filter(record => record.protocol || record.description || record.entity !== 'Sem informação');
  };
  const dashboardDate_ = value => {
    const date = value instanceof Date && !isNaN(value.getTime()) ? value : new Date(value);
    if (!date || isNaN(date.getTime())) return { display: '—', iso: '', year: '' };
    return {
      display: Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
      iso: Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      year: String(date.getFullYear())
    };
  };
  const dashboardRisk_ = value => {
    const lower = text(value).toLowerCase();
    if (lower.indexOf('alto') >= 0 || lower.indexOf('priorit') >= 0) return 'Alto';
    if (lower.indexOf('moder') >= 0 || lower.indexOf('médio') >= 0 || lower.indexOf('medio') >= 0) return 'Moderado';
    if (lower.indexOf('baixo') >= 0 || lower.indexOf('bajo') >= 0) return 'Baixo';
    return 'Sem classificação';
  };
  const uniqueSorted_ = values => Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { numeric: true }));

  const configureResponseSheets_ = ss => {
    const legacy = ss.getSheetByName(CONFIG.legacyInternalSheetName);
    if (!ss.getSheetByName(CONFIG.internalSheetName) && legacy) legacy.setName(CONFIG.internalSheetName);
    configureSheet_(ss, CONFIG.internalSheetName, INTERNAL_HEADERS);
    configureSheet_(ss, CONFIG.supplierSheetName, SUPPLIER_HEADERS);
  };
  const configureSheet_ = (ss, name, headers) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      const first = ss.getSheets()[0];
      sheet = ['Sheet1', 'Página1'].indexOf(first.getName()) >= 0 ? first.setName(name) : ss.insertSheet(name);
    }
    const existing = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].filter(Boolean) : [];
    if (!existing.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const length = existing.length || headers.length;
    sheet.getRange(1, 1, 1, length).setBackground('#0b3d91').setFontColor('#ffffff').setFontWeight('bold').setWrap(true); sheet.setFrozenRows(1);
  };
  const configureCatalog_ = (ss, name, header, defaults) => {
    let sheet = ss.getSheetByName(name); if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() < 2) { sheet.clear(); sheet.getRange(1, 1).setValue(header); sheet.getRange(2, 1, defaults.length, 1).setValues(defaults.map(value => [value])); sheet.setFrozenRows(1); sheet.getRange(1, 1).setBackground('#0b3d91').setFontColor('#ffffff').setFontWeight('bold'); }
  };
  const getCatalog_ = (ss, name, defaults) => {
    const sheet = ss.getSheetByName(name); const rows = Math.max(sheet.getLastRow() - 1, 0);
    const values = rows ? sheet.getRange(2, 1, rows, 1).getDisplayValues().flat().map(text).filter(Boolean) : [];
    return values.length ? values : defaults.slice();
  };
  const ensureProject_ = () => {
    const properties = PropertiesService.getScriptProperties();
    if (!properties.getProperty(CONFIG.spreadsheetProperty) || !properties.getProperty(CONFIG.uploadFolderProperty)) setupProject();
    const ss = SpreadsheetApp.openById(properties.getProperty(CONFIG.spreadsheetProperty));
    configureResponseSheets_(ss); configureCatalog_(ss, CONFIG.chaptersSheetName, 'Chapter', DEFAULT_CHAPTERS); configureCatalog_(ss, CONFIG.suppliersSheetName, 'Fornecedor', DEFAULT_SUPPLIERS);
    return ss;
  };
  const parseEmails_ = values => uniqueEmails_(text(values).split(/[;,]/).map(value => text(value).toLowerCase()).filter(isEmail));
  const uniqueEmails_ = values => Array.from(new Set(values.map(value => text(value).toLowerCase()).filter(isEmail)));
  const sanitize_ = name => text(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 140);

  return { setupProject, setup: setupProject, doGet, getInitialData, getPortalData, getDashboardData, submitForm, submitInternalForm, submitSupplierForm, setAlertEmail, setDashboardUrl, lookupRequest };
})();

// Apps Script exige estos puntos de entrada globales.
function setupProject() { return BR_NC.setupProject(); }
function setup() { return BR_NC.setup(); }
function doGet(e) { return BR_NC.doGet(e); }
function getInitialData() { return BR_NC.getInitialData(); }
function getPortalData() { return BR_NC.getPortalData(); }
function getDashboardData() { return BR_NC.getDashboardData(); }
function submitForm(payload) { return BR_NC.submitForm(payload); }
function submitInternalForm(payload) { return BR_NC.submitInternalForm(payload); }
function submitSupplierForm(payload) { return BR_NC.submitSupplierForm(payload); }
function setAlertEmail(emails) { return BR_NC.setAlertEmail(emails); }
function setDashboardUrl(url) { return BR_NC.setDashboardUrl(url); }
function lookupRequest(protocol) { return BR_NC.lookupRequest(protocol); }
