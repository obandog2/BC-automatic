/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Revisa los términos de la columna B de IrrelevantWordsTraining (M) y escribe
 * FUERTE o DEBIL en la columna C según una lista controlada de exclusiones.
 * No modifica las columnas A ni B.
 *
 * Validaciones para ejecutar asignarFuerzaIrrelevantes():
 * 1) Debe existir la función validarConArchivoControl() en el proyecto.
 * 2) Debe existir la hoja IrrelevantWordsTraining (M) en el archivo diccionario.
 * 3) La fila 1 debe ser encabezado; los términos deben comenzar en B2.
 */

function asignarFuerzaIrrelevantes() {
  if (!validarConArchivoControl()) return;
  return AsignadorFuerzaIrrelevantes.ejecutar();
}

const AsignadorFuerzaIrrelevantes = (function() {
  const CONFIG = Object.freeze({
    prefijoLog: '[BCAT-0050-FUERZA]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    hoja: 'IrrelevantWordsTraining (M)',
    primeraFila: 2,
    columnaTermino: 2,
    columnaFuerza: 3,
    fuertes: [
      'protesis', 'protesis articulares', 'implante', 'dental', 'traumatolog',
      'tomograf', 'rayos x', 'radiograf', 'ecograf', 'resonanc', 'quirofano',
      'desfibrilad', 'ventilador', 'ortopedic', 'clavo', 'placa de titanio',
      'osteosintesis', 'tornillo', 'mamograf', 'fluoroscop', 'arco en c',
      'cirugia', 'bisturi', 'pinza', 'alicates', 'herramienta', 'tuttnauer',
      'agujas', 'cateter', 'cateteres', 'sutura', 'anestesia', 'respirador',
      'marcapasos', 'camilla', 'silla de ruedas', 'muleta', 'audifono',
      'oftalmolog', 'odontolog', 'silla dental', 'amalgama', 'resina',
      'dialisis', 'hemodialisis', 'dialyzer', 'dializador', 'consultorio',
      'endodoncia', 'floseal', 'diamax', 'arteriovenosas', 'oxigenador', 'oxygenator',
      'h pylori antigen rapid test cassette', 'h pylori antigen feces cassette',
      'h pylori antibody rapid test cassette', 'h pylori ag rapid test cassette',
      'quanta lyser3000', 'bact alert fa plus', 'bact alert pf plus',
      'bact alert fn plus', 'bact alert fa 100 btls', 'bact alert pf 100 btls',
      'feces analyzer', 'ds en 20l', 'xn check', 'm 6fr', 'm 6ln', 'm 6fd', 'm 6lh',
      'bactec mgit 320', 'af 600 automated id ast system', 'af 300 automated id ast system',
      'meditape uc 11a', 'vitek2 compact 60', 'vitek densichek',
      'gel clot activator tube', 'sc 120 auto slide maker stainer', 'bd phoenix m50',
      'bd facsflow sheath fluid', 'sheath fluid',
      'zelboraf', 'tecentriq', 'emicizumab', 'trastuzumab', 'rituximab', 'ocrevus',
      'ocrelizumab', 'pulmozyme', 'epoetina', 'bevacizumab', 'mabthera',
      'atezolizumab', 'kadcyla', 'risdiplam', 'avastin', 'tocilizumab', 'hemlibra',
      'alecensa', 'rocephin', 'ceftriaxona', 'polatuzumab', 'alectinib', 'actemra',
      'faricimab', 'pertuzumab', 'vabysmo', 'perjeta', 'vemurafenib'
    ].map(normalizar_)
  });

  function ejecutar() {
    const hoja = SpreadsheetApp.openById(CONFIG.idDiccionario).getSheetByName(CONFIG.hoja);
    if (!hoja) throw new Error('No se encontró la hoja: ' + CONFIG.hoja + '.');
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < CONFIG.primeraFila) return { filas: 0, fuertes: 0, debiles: 0 };

    const terminos = hoja.getRange(CONFIG.primeraFila, CONFIG.columnaTermino, ultimaFila - 1, 1).getDisplayValues();
    let fuertes = 0;
    const salida = terminos.map(function(fila) {
      const termino = normalizar_(fila[0]);
      const esFuerte = termino && CONFIG.fuertes.some(function(patron) {
        return termino === patron || termino.indexOf(patron) !== -1;
      });
      if (esFuerte) fuertes++;
      return [esFuerte ? 'FUERTE' : 'DEBIL'];
    });

    hoja.getRange(CONFIG.primeraFila, CONFIG.columnaFuerza, salida.length, 1).setValues(salida);
    const resultado = { filas: salida.length, fuertes: fuertes, debiles: salida.length - fuertes };
    Logger.log(CONFIG.prefijoLog + ' Fuerzas actualizadas. | ' + JSON.stringify(resultado));
    return resultado;
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return { ejecutar: ejecutar };
})();
