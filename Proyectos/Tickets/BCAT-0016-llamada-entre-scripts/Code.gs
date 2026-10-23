/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Ejecuta la función general2026PE() publicada como biblioteca desde otro
 * proyecto de Apps Script.
 *
 * Validaciones para ejecutar ejecutarGeneral2026PE():
 * 1) El proyecto origen debe agregarse como biblioteca con el identificador General2026PE.
 * 2) La biblioteca debe tener una versión publicada que exponga general2026PE().
 * 3) La hoja update del archivo de control debe tener B2 con el valor update.
 */

function ejecutarGeneral2026PE() {
  if (!validarConArchivoControl()) return;
  Logger.log('[BCAT-0016] Inicio de llamada a la biblioteca General2026PE.');
  try {
    const resultado = General2026PE.general2026PE();
    Logger.log('[BCAT-0016] Llamada a general2026PE() finalizada correctamente.');
    return resultado;
  } catch (error) {
    Logger.log('[BCAT-0016] ERROR al llamar general2026PE(): ' + error.message);
    throw error;
  }
}

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
