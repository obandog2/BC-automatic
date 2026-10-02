/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Consolida NC internas y de fornecedores con sus planes de acción.
 *
 * Validaciones para ejecutar consolidarTudo():
 * 1) NC Internas, NC Fornecedores y Planos de Ação deben existir.
 * 2) Las tres hojas deben conservar la columna Protocolo.
 * 3) Las hojas consolidadas se reconstruyen en cada ejecución.
 */
const BR_NC_CONSOLIDADO = (() => {
  const PREFIX = '[BCAT-BR] ';
  const CONFIG = Object.freeze({ spreadsheetProperty: 'FORM_SPREADSHEET_ID', plansSheetName: 'Planos de Ação', sources: [{ name: 'NC Internas', output: 'NC Internas Consolidado' }, { name: 'NC Fornecedores', output: 'NC Fornecedores Consolidado' }] });
  const PLAN_COLUMNS = Object.freeze([['Número do plano', 'Número do plano'], ['Descrição do plano de ação', 'Descrição do plano de ação'], ['Responsável', 'Responsável do plano'], ['E-mail responsável', 'E-mail responsável do plano'], ['Data de entrega', 'Data de entrega'], ['Status', 'Status do plano'], ['Data de criação', 'Data de criação do plano'], ['Data de atualização', 'Data de atualização do plano']]);
  const text_ = value => String(value == null ? '' : value).trim();
  const log_ = (message, detail) => Logger.log(PREFIX + message + (detail ? ' | ' + detail : ''));
  const indexHeaders_ = headers => headers.reduce((out, header, index) => { out[text_(header)] = index; return out; }, {});
  const spreadsheet_ = () => { const id = PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetProperty); if (!id) throw new Error('Execute setupProject() antes de consolidar os dados.'); return SpreadsheetApp.openById(id); };
  const groupPlans_ = (rows, indexes) => {
    if (indexes.Protocolo == null) throw new Error('A coluna Protocolo não foi encontrada em Planos de Ação.');
    return rows.slice(1).reduce((out, row) => { const protocol = text_(row[indexes.Protocolo]).toUpperCase(); if (protocol) (out[protocol] || (out[protocol] = [])).push(row); return out; }, {});
  };
  const consolidateOne_ = (ss, source, plansByProtocol, planIndexes) => {
    const input = ss.getSheetByName(source.name); if (!input) throw new Error('A folha ' + source.name + ' não foi encontrada.');
    const values = input.getDataRange().getValues(); if (!values.length) throw new Error('A folha ' + source.name + ' está vazia.');
    const sourceHeaders = values[0], indexes = indexHeaders_(sourceHeaders); if (indexes.Protocolo == null) throw new Error('A coluna Protocolo não foi encontrada em ' + source.name + '.');
    const keptColumns = sourceHeaders.map((header, index) => ({ header, index })).filter(column => source.name !== 'NC Internas' || text_(column.header) !== 'Nome');
    const headers = keptColumns.map(column => column.header);
    const rows = [];
    values.slice(1).forEach(nc => { const ncData = keptColumns.map(column => nc[column.index]); const plans = plansByProtocol[text_(nc[indexes.Protocolo]).toUpperCase()] || []; if (!plans.length) return rows.push(ncData.concat(PLAN_COLUMNS.map(() => ''))); plans.forEach(plan => rows.push(ncData.concat(PLAN_COLUMNS.map(([header]) => planIndexes[header] == null ? '' : plan[planIndexes[header]])))); });
    let output = ss.getSheetByName(source.output); if (!output) output = ss.insertSheet(source.output);
    output.clear(); const outputHeaders = headers.concat(PLAN_COLUMNS.map(([, header]) => header));
    output.getRange(1, 1, 1, outputHeaders.length).setValues([outputHeaders]);
    output.getRange(1, 1, 1, outputHeaders.length).setBackground('#0b3d91').setFontColor('#ffffff').setFontWeight('bold').setWrap(true); output.setFrozenRows(1);
    if (rows.length) output.getRange(2, 1, rows.length, outputHeaders.length).setValues(rows);
    output.autoResizeColumns(1, outputHeaders.length); return rows.length;
  };
  const consolidateAll = () => {
    log_('Início consolidarTudo.'); const ss = spreadsheet_(), plansSheet = ss.getSheetByName(CONFIG.plansSheetName);
    if (!plansSheet) throw new Error('A folha Planos de Ação não foi encontrada.');
    const planValues = plansSheet.getDataRange().getValues(); if (!planValues.length) throw new Error('A folha Planos de Ação está vazia.');
    const planIndexes = indexHeaders_(planValues[0]), plansByProtocol = groupPlans_(planValues, planIndexes);
    const counts = CONFIG.sources.reduce((out, source) => { out[source.name] = consolidateOne_(ss, source, plansByProtocol, planIndexes); return out; }, {});
    log_('Fim consolidarTudo.', 'internas: ' + counts['NC Internas'] + ' | fornecedores: ' + counts['NC Fornecedores']);
    return { ok: true, internalRows: counts['NC Internas'], supplierRows: counts['NC Fornecedores'] };
  };
  return { consolidateAll };
})();

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Consolidar').addItem('Consolidar internas e fornecedores', 'consolidarTudo').addToUi();
}
function consolidarTudo() {
  if (!validarConArchivoControl()) return;
  return BR_NC_CONSOLIDADO.consolidateAll();
}
