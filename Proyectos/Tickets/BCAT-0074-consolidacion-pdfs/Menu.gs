function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Quality Advisor (QA)')
    .addItem('Actualizar PDFs y abrir Quality Advisor', 'actualizarYAbrirQualityAdvisor')
    .addToUi();
}

function actualizarYAbrirQualityAdvisor() {
  const ui = SpreadsheetApp.getUi();
  const libro = SpreadsheetApp.getActiveSpreadsheet();

  try {
    libro.toast('Actualizando la consolidación de PDFs. Espera un momento.', 'Quality Advisor (QA)', 30);
    const resultado = consolidarPDFsEnDoc();

    const resumen =
      'PDFs incluidos: ' + resultado.pdfs +
      '<br>OCR nuevo: ' + resultado.nuevos +
      '<br>PDFs reutilizados: ' + resultado.reutilizados;

    const html = HtmlService.createHtmlOutput(
      '<!DOCTYPE html>' +
      '<html><head><base target="_blank">' +
      '<style>' +
      'body{font-family:Arial,sans-serif;padding:24px;color:#17252d;line-height:1.5;}' +
      'h2{margin-top:0;color:#0b3d91;}' +
      '.button{display:inline-block;margin-top:18px;padding:11px 18px;background:#0b3d91;color:#fff;' +
      'text-decoration:none;border-radius:5px;font-weight:600;}' +
      '.button:hover{background:#082f6b;}' +
      '</style></head><body>' +
      '<h2>Quality Advisor (QA)</h2>' +
      '<p>La consolidación de PDFs terminó correctamente.</p>' +
      '<p>' + resumen + '</p>' +
      '<a class="button" href="https://gemini.google.com/gem/1LdOsDOXMNymb2f8VY-8U7mccpAOcYsVJ?usp=sharing"' +
      ' onclick="google.script.host.close()">Abrir Quality Advisor (QA)</a>' +
      '</body></html>'
    ).setWidth(440).setHeight(310);

    ui.showModalDialog(html, 'Abrir Quality Advisor (QA)');
  } catch (error) {
    Logger.log('[BCAT-0074] Error al actualizar antes de abrir Quality Advisor. | ' + error.message);
    ui.alert(
      'Quality Advisor (QA)',
      'No se pudo actualizar la consolidación de PDFs. No se abrirá Quality Advisor.\n\nDetalle: ' + error.message,
      ui.ButtonSet.OK
    );
  }
}
