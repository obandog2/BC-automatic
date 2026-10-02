/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Registra uno o varios planes de acción vinculados por protocolo a una NC.
 *
 * Validaciones para ejecutar submitActionPlans():
 * 1) El protocolo debe existir en NC Internas o NC Fornecedores.
 * 2) Solo los correos autorizados pueden cambiar el protocolo prellenado.
 * 3) Cada fila debe tener descripción, responsable, e-mail y fecha de entrega.
 */
const BR_ACTION_PLAN = (() => {
  const PREFIX = '[BCAT-BR] ';
  const EDITABLE_PROTOCOL_EMAILS = Object.freeze([
    'gabriela.obando_angulo@external.roche.com'
  ]);
  const CONFIG = Object.freeze({ spreadsheetProperty: 'FORM_SPREADSHEET_ID', actionPlanSheetName: 'Planos de Ação', internalSheetName: 'NC Internas', supplierSheetName: 'NC Fornecedores' });
  const HEADERS = Object.freeze(['Protocolo', 'Número do plano', 'Descrição do plano de ação', 'Responsável', 'E-mail responsável', 'Data de entrega', 'Status', 'Data de criação', 'Data de atualização']);
  const log_ = (message, detail) => Logger.log(PREFIX + message + (detail ? ' | ' + detail : ''));
  const text_ = value => String(value == null ? '' : value).trim();
  const email_ = value => text_(value).toLowerCase();
  const isEmail_ = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_(value));
  const validDate_ = value => /^\d{4}-\d{2}-\d{2}$/.test(text_(value)) && !isNaN(new Date(text_(value) + 'T12:00:00').getTime());
  const currentEmail_ = () => email_(Session.getActiveUser().getEmail());
  const canEditProtocol_ = () => EDITABLE_PROTOCOL_EMAILS.indexOf(currentEmail_()) >= 0;

  const spreadsheet_ = () => {
    const id = PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetProperty);
    if (!id) throw new Error('Execute setupProject() antes de registrar planos de ação.');
    return SpreadsheetApp.openById(id);
  };
  const ensureStorage = () => {
    const ss = spreadsheet_(); let sheet = ss.getSheetByName(CONFIG.actionPlanSheetName);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.actionPlanSheetName);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#0b3d91').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
      sheet.setFrozenRows(1); log_('Hoja Planos de Ação creada.');
    }
    const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(['Pendente', 'Em andamento', 'Concluído', 'Cancelado'], true).setAllowInvalid(false).build();
    sheet.getRange(2, 7, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(statusRule);
    return sheet;
  };
  const requestExists_ = protocol => {
    const normalized = text_(protocol).toUpperCase(); const ss = spreadsheet_();
    return [CONFIG.internalSheetName, CONFIG.supplierSheetName].some(name => {
      const sheet = ss.getSheetByName(name); if (!sheet || sheet.getLastRow() < 2) return false;
      const values = sheet.getDataRange().getDisplayValues(); const column = values[0].map(text_).indexOf('Protocolo');
      return column >= 0 && values.slice(1).some(row => text_(row[column]).toUpperCase() === normalized);
    });
  };
  const nextPlanNumber_ = (sheet, protocol) => {
    if (sheet.getLastRow() < 2) return 1;
    return sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().filter(row => text_(row[0]).toUpperCase() === protocol).length + 1;
  };
  const normalizePlans_ = plans => {
    if (!Array.isArray(plans) || !plans.length) throw new Error('Adicione ao menos um plano de ação.');
    return plans.map((plan, index) => {
      const description = text_(plan && plan.description), responsible = text_(plan && plan.responsible), responsibleEmail = email_(plan && plan.responsibleEmail), dueDate = text_(plan && plan.dueDate);
      if (!description || !responsible || !isEmail_(responsibleEmail) || !validDate_(dueDate)) throw new Error('Preencha descrição, responsável, e-mail válido e data de entrega no plano ' + (index + 1) + '.');
      return { description, responsible, responsibleEmail, dueDate };
    });
  };
  const submit = payload => {
    log_('Início submitActionPlans.');
    const protocol = text_(payload && payload.protocol).toUpperCase();
    const originalProtocol = text_(payload && payload.originalProtocol).toUpperCase();
    if (!protocol) throw new Error('O ID da solicitação é obrigatório.');
    if (!canEditProtocol_() && (!originalProtocol || protocol !== originalProtocol)) {
      log_('Alteração de protocolo rejeitada.', 'usuário não autorizado');
      throw new Error('Você não possui permissão para alterar o ID da solicitação.');
    }
    if (!requestExists_(protocol)) throw new Error('ID da solicitação não encontrado. Verifique o protocolo informado.');
    const plans = normalizePlans_(payload && payload.plans); const lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      const sheet = ensureStorage(), firstNumber = nextPlanNumber_(sheet, protocol), now = new Date();
      const rows = plans.map((plan, index) => [protocol, firstNumber + index, plan.description, plan.responsible, plan.responsibleEmail, plan.dueDate, 'Pendente', now, now]);
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
      sheet.getRange(sheet.getLastRow() - rows.length + 1, 8, rows.length, 2).setNumberFormat('dd/mm/yyyy hh:mm:ss');
      consolidarTudo();
      log_('Fim submitActionPlans.', 'protocolo: ' + protocol + ' | planos: ' + rows.length);
      return { ok: true, protocol, createdPlans: rows.length };
    } catch (error) { log_('Erro submitActionPlans.', error && error.message); throw error; } finally { lock.releaseLock(); }
  };
  const getFormAccess = () => ({ canEditProtocol: canEditProtocol_() });
  return { ensureStorage, submit, getFormAccess };
})();

function getActionPlanFormAccess() {
  if (!validarConArchivoControl()) return;
  return BR_ACTION_PLAN.getFormAccess();
}

function submitActionPlans(payload) {
  if (!validarConArchivoControl()) return;
  return BR_ACTION_PLAN.submit(payload);
}

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
