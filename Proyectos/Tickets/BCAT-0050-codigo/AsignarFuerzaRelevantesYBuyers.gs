/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Completa la columna C de los diccionarios de términos IVD y compradores IVD.
 * Asigna FUERTE a señales específicas y DEBIL al resto, sin modificar A ni B.
 *
 * Validaciones para ejecutar asignarFuerzaRelevantesIVD():
 * 1) Debe existir la función validarConArchivoControl() en el proyecto.
 * 2) Deben existir KeyWordsDescriptionTraining (M) y KeyWordsBuyerTraining (M).
 * 3) Los términos y compradores deben empezar en B2.
 */

function asignarFuerzaRelevantesIVD() {
  if (!validarConArchivoControl()) return;
  return AsignadorFuerzaRelevantesIVD.actualizarDescripciones();
}

function asignarFuerzaBuyersIVD() {
  if (!validarConArchivoControl()) return;
  return AsignadorFuerzaRelevantesIVD.actualizarCompradores();
}

const AsignadorFuerzaRelevantesIVD = (function() {
  const CONFIG = Object.freeze({
    prefijoLog: '[BCAT-0050-FUERZA-IVD]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    primeraFila: 2,
    columnaTermino: 2,
    columnaFuerza: 3,
    hojaDescripciones: 'KeyWordsDescriptionTraining (M)',
    hojaCompradores: 'KeyWordsBuyerTraining (M)',
    terminosFuertes: [
      'ivd', 'in vitro', 'ivdr', 'ceivd', 'diagnostico in vitro',
      'elecsys', 'cobas', 'atellica', 'alinity', 'architect', 'maglumi',
      'geneexpert', 'genexpert', 'cepheid', 'vitek', 'bactec', 'bact alert',
      'filmarray', 'biofire', 'pcr', 'rt pcr', 'qpcr', 'taqman', 'ngs',
      'secuenciacion', 'elisa', 'eclia', 'clia', 'quimioluminiscencia',
      'inmunofluorescencia', 'inmunoensayo', 'immunoassay', 'hba1c',
      'hemoglobina glicosilada', 'troponina', 'tsh', 'psa', 'hbsag',
      'hiv', 'vih', 'sars cov 2', 'covid', 'hepatitis', 'dengue', 'chagas',
      'factor reumatoide', 'procalcitonina', 'ferritina', 'd dimer', 'dimero d',
      'grupo sanguineo', 'coombs', 'urocultiv', 'hemocultiv', 'coprocultiv',
      'antibiograma', 'hematologia', 'bioquimica clinica', 'quimica clinica',
      'analizador hematologico', 'hematology analyzer', 'chemistry analyzer',
      'analizador de quimica clinica', 'blood gas analyzer',
      'analizador de gases sanguineos', 'urine analysis system',
      'automatic coagulation analyzer', 'reactivos de diagnostico',
      'reactivo de diagnostico', 'prueba cualitativa in vitro',
      'prueba cuantitativa in vitro'
    ].map(normalizar_),
    compradoresFuertes: [
      'lab quality', 'reactlab', 'distprolabecuador', 'makolecuador',
      'medibac', 'sigma health', 'sistemas de salud rocarsystem', 'rocarsystem'
    ].map(normalizar_)
  });

  function actualizarDescripciones() {
    return actualizar_(CONFIG.hojaDescripciones, CONFIG.terminosFuertes, 'términos IVD');
  }

  function actualizarCompradores() {
    return actualizar_(CONFIG.hojaCompradores, CONFIG.compradoresFuertes, 'compradores IVD');
  }

  function actualizar_(nombreHoja, listaFuerte, etiqueta) {
    const hoja = SpreadsheetApp.openById(CONFIG.idDiccionario).getSheetByName(nombreHoja);
    if (!hoja) throw new Error('No se encontró la hoja: ' + nombreHoja + '.');
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < CONFIG.primeraFila) return { filas: 0, fuertes: 0, debiles: 0 };

    const valores = hoja.getRange(CONFIG.primeraFila, CONFIG.columnaTermino, ultimaFila - 1, 1).getDisplayValues();
    let fuertes = 0;
    const salida = valores.map(function(fila) {
      const valor = normalizar_(fila[0]);
      const esFuerte = valor && listaFuerte.some(function(patron) {
        return valor === patron || valor.indexOf(patron) !== -1;
      });
      if (esFuerte) fuertes++;
      return [esFuerte ? 'FUERTE' : 'DEBIL'];
    });

    hoja.getRange(CONFIG.primeraFila, CONFIG.columnaFuerza, salida.length, 1).setValues(salida);
    const resultado = { hoja: nombreHoja, tipo: etiqueta, filas: salida.length, fuertes: fuertes, debiles: salida.length - fuertes };
    Logger.log(CONFIG.prefijoLog + ' Fuerzas actualizadas. | ' + JSON.stringify(resultado));
    return resultado;
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return { actualizarDescripciones: actualizarDescripciones, actualizarCompradores: actualizarCompradores };
})();
