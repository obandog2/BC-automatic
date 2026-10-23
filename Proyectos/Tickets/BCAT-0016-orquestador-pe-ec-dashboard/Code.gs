/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Ejecuta secuencialmente la actualización de Perú, Ecuador y la reparación
 * del dashboard desde el proyecto que contiene REPARAR_DASHBOARD().
 *
 * Validaciones para ejecutar ejecutarActualizacionPE_EC_Dashboard():
 * 1) La biblioteca General2026PE debe exponer general2026PE().
 * 2) La biblioteca General2026EC debe exponer general2026EC().
 * 3) REPARAR_DASHBOARD() debe existir en este mismo proyecto.
 * 4) La hoja update del archivo de control debe tener B2 con el valor update.
 */

const BCAT0016_ORQUESTADOR = (() => {
  const PREFIJO_LOG = '[BCAT-0016]';

  const ejecutar = () => {
    const inicio = new Date();
    Logger.log(PREFIJO_LOG + ' Inicio de actualización secuencial PE, EC y dashboard.');

    try {
      Logger.log(PREFIJO_LOG + ' Paso 1 de 3: ejecutando general2026PE().');
      const resultadoPE = General2026PE.general2026PE();
      Logger.log(PREFIJO_LOG + ' Paso 1 completado: Perú.');

      Logger.log(PREFIJO_LOG + ' Paso 2 de 3: ejecutando general2026EC().');
      const resultadoEC = General2026EC.general2026EC();
      Logger.log(PREFIJO_LOG + ' Paso 2 completado: Ecuador.');

      Logger.log(PREFIJO_LOG + ' Paso 3 de 3: ejecutando REPARAR_DASHBOARD().');
      const resultadoDashboard = REPARAR_DASHBOARD();
      Logger.log(PREFIJO_LOG + ' Paso 3 completado: dashboard.');

      const resumen = {
        ejecutadoEl: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
        duracionSegundos: Math.round((Date.now() - inicio.getTime()) / 1000),
        peru: resultadoPE,
        ecuador: resultadoEC,
        dashboard: resultadoDashboard
      };
      Logger.log(PREFIJO_LOG + ' Proceso completo. | duración en segundos: ' + resumen.duracionSegundos);
      return resumen;
    } catch (error) {
      Logger.log(PREFIJO_LOG + ' ERROR: proceso detenido. | ' + (error && error.message ? error.message : String(error)));
      throw error;
    }
  };

  return { ejecutar: ejecutar };
})();

function ejecutarActualizacionPE_EC_Dashboard() {
  if (!validarConArchivoControl()) return;
  return BCAT0016_ORQUESTADOR.ejecutar();
}

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
