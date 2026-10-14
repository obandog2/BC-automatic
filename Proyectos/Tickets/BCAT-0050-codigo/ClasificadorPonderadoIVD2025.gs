/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Clasifica importaciones como IVD, NO ES IVD o PHARMA mediante puntajes.
 * Lee B:T y escribe únicamente el resultado en V.
 *
 * Validaciones para ejecutar clasificarIVDConPesos2025():
 * 1) Debe existir la función validarConArchivoControl() en el proyecto.
 * 2) La hoja 2025 debe conservar B:T y la columna V de salida.
 * 3) Las hojas del diccionario deben conservar categoría en A y término en B.
 */

function clasificarIVDConPesos2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorPonderadoIVD2025.iniciar();
}

function continuarClasificacionIVDConPesos2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorPonderadoIVD2025.continuar();
}

function diagnosticarPesosIVD2025(numeroFila) {
  if (!validarConArchivoControl()) return;
  return ClasificadorPonderadoIVD2025.diagnosticar(numeroFila);
}

const ClasificadorPonderadoIVD2025 = (function() {
  const CONFIG = Object.freeze({
    prefijoLog: '[BCAT-0050-PESOS]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    idDestino: '1iDzirC_nfjzXadwa1yPEPA64ObVBt8ej69BJ0F6UGtw',
    hojaDestino: '2025',
    primeraFila: 2,
    primeraColumnaLectura: 2,
    columnasLectura: 19,
    columnaSalida: 22,
    filasPorLote: 2500,
    minutosSiguienteLote: 1,
    maxCaracteresRegex: 10000,
    propiedadCursor: 'BCAT_0050_PESOS_CURSOR',
    propiedadUltimaFila: 'BCAT_0050_PESOS_ULTIMA',
    propiedadConteos: 'BCAT_0050_PESOS_CONTEOS',
    pesos: Object.freeze({
      pharmaFuerte: 12,
      pharmaDiccionario: 5,
      pharmaComprador: 6,
      noIVDFuerte: 9,
      noIVDDiccionario: 1,
      noIVDComprador: 4,
      ivdFuerte: 9,
      ivdDiccionario: 2,
      ivdComprador: 2,
      partidaIVD: 2,
      fabricanteIVD: 3,
      marcaIVD: 2,
      maxCoincidenciasPorGrupo: 3,
      minimoIVD: 4,
      minimoNoIVD: 4,
      minimoPharma: 6,
      ventajaMinima: 1
    }),
    partidasIVD: ['3822', '300215', '300290', '300630'],
    terminosPharmaFuertes: [
      'medicamento para uso humano', 'ocrevus', 'hemlibra', 'kadcyla', 'perjeta', 'phesgo',
      'avastin', 'herceptin', 'actemra', 'alecensa', 'zelboraf', 'mabthera', 'evrysdi',
      'pulmozyme', 'vabysmo', 'tecentriq', 'trastuzumab', 'rituximab', 'tocilizumab',
      'bevacizumab', 'pertuzumab', 'ocrelizumab', 'emicizumab', 'atezolizumab', 'risdiplam'
    ],
    terminosIVDFuertes: [
      'diagnostico in vitro', 'reactivos de diagnostico', 'reactivo de diagnostico',
      'reactivos de laboratorio', 'prueba cualitativa in vitro', 'inmunoassay', 'eclia', 'clia',
      'elisa', 'pcr', 'elecsys', 'cobas', 'accu chek', 'hematology analyzer',
      'chemistry analyzer', 'analizador hematologico', 'analizador de orina',
      'analizador de gases sanguineos', 'blood gas analyzer', 'blood type analyzer',
      'urine analysis system', 'tira reactiva', 'hba1c', 'hiv ag ab', 'hbsag', 'troponina',
      'vitrostainer', 'vitrocycler', 'citologia en base liquida', 'liquid based cytology',
      'equipo de diagnostico', 'reaction cell', 'tube sst', 'edta k3', 'sta cuvette',
      'maglumi', 'facslyric', 'labscan3d', 'automatic coagulation analyzer', 'd dimer'
    ],
    terminosNoIVDFuertes: [
      'maquina de dialisis', 'dializador', 'filtro dializador', 'hemodialisis', 'blood tubing',
      'lineas arteriovenosas', 'pump tubing', 'consultorio dental', 'sillon dental',
      'odontologia', 'implante', 'osteosintesis', 'pegamento quirurgico', 'floseal',
      'esterilizador', 'tomografia', 'ecografia', 'resonancia magnetica'
    ],
    terminosAmbiguosNoIVD: new Set([
      'equipo', 'laboratorio', 'tubo', 'tubos', 'medidor', 'medidores', 'reactivo',
      'reactivos', 'kit', 'test', 'vial', 'viales', 'muestra', 'muestras', 'control',
      'analizador', 'analizadores', 'diagnostico', 'diagnosticos', 'cuveta', 'cubeta'
    ]),
    terminosGenericosIVD: new Set([
      'test', 'laboratorio', 'determinacion', 'sangre', 'tubo', 'vial', 'reactivo',
      'diagnostico', 'kit', 'equipo', 'analizador', 'instrumento', 'aparato', 'control'
    ]),
    marcasIVD: new Set([
      'abbott', 'agappe', 'becton dickinson', 'bio rad', 'biomerieux', 'cepheid', 'dirui',
      'dymind', 'edan', 'euroimmun', 'genrui', 'human', 'lifotronic', 'maccura',
      'medcaptain', 'mindray', 'orgentec', 'sebia', 'siemens', 'snibe', 'sysmex',
      'vircell', 'werfen', 'zybio', 'yhlo', 'aesku', 'stago', 'keyu', 'wondfo'
    ]),
    fabricantesIVD: new Set([
      'roche diagnostics', 'sysmex america', 'siemens healthineers', 'abbott', 'becton dickinson',
      'bio rad', 'biomerieux', 'euroimmun', 'mindray', 'snibe', 'werfen', 'orgentec',
      'molbio diagnostics', 'diagnostica stago', 'one lambda', 'wondfo', 'keyu biological'
    ]),
    hojas: Object.freeze({
      descripcionIVD: 'KeyWordsDescriptionTraining (M)',
      compradorIVD: 'KeyWordsBuyerTraining (M)',
      irrelevantesDescripcion: 'IrrelevantWordsTraining (M)',
      irrelevantesComprador: 'IrrelevantWordsBuyerTraining (M)'
    })
  });

  function iniciar() {
    borrarTriggers_();
    const hoja = obtenerHojaDestino_();
    const ultimaFila = hoja.getLastRow();
    const propiedades = PropertiesService.getScriptProperties();
    hoja.getRange(1, CONFIG.columnaSalida).setValue('Clasificación IVD');
    propiedades.setProperty(CONFIG.propiedadCursor, String(CONFIG.primeraFila));
    propiedades.setProperty(CONFIG.propiedadUltimaFila, String(ultimaFila));
    propiedades.setProperty(CONFIG.propiedadConteos, JSON.stringify({ IVD: 0, 'NO ES IVD': 0, PHARMA: 0 }));
    return procesarLote_();
  }

  function continuar() {
    return procesarLote_();
  }

  function procesarLote_() {
    let bloqueo;
    try {
      bloqueo = LockService.getScriptLock();
      bloqueo.waitLock(30000);
      const propiedades = PropertiesService.getScriptProperties();
      const cursor = Number(propiedades.getProperty(CONFIG.propiedadCursor));
      const ultimaFila = Number(propiedades.getProperty(CONFIG.propiedadUltimaFila));
      if (!cursor || cursor > ultimaFila) return finalizar_();

      const hastaFila = Math.min(cursor + CONFIG.filasPorLote - 1, ultimaFila);
      const cantidad = hastaFila - cursor + 1;
      const reglas = cargarReglas_();
      const hoja = obtenerHojaDestino_();
      const filas = hoja.getRange(cursor, CONFIG.primeraColumnaLectura, cantidad, CONFIG.columnasLectura).getDisplayValues();
      const resultado = filas.map(function(fila) { return evaluarFila_(fila, reglas); });
      hoja.getRange(cursor, CONFIG.columnaSalida, cantidad, 1).setValues(resultado.map(function(detalle) {
        return [detalle.resultado];
      })).setNumberFormat('@');

      const conteos = leerConteos_();
      resultado.forEach(function(detalle) { conteos[detalle.resultado]++; });
      propiedades.setProperty(CONFIG.propiedadConteos, JSON.stringify(conteos));
      propiedades.setProperty(CONFIG.propiedadCursor, String(hastaFila + 1));
      Logger.log(CONFIG.prefijoLog + ' Lote ' + cursor + '-' + hastaFila + ' terminado.');

      if (hastaFila >= ultimaFila) return finalizar_();
      programarContinuacion_();
      return { estado: 'EN PROCESO', desdeFila: cursor, hastaFila: hastaFila };
    } finally {
      if (bloqueo && bloqueo.hasLock()) bloqueo.releaseLock();
    }
  }

  function finalizar_() {
    const conteos = leerConteos_();
    borrarTriggers_();
    const propiedades = PropertiesService.getScriptProperties();
    [CONFIG.propiedadCursor, CONFIG.propiedadUltimaFila, CONFIG.propiedadConteos].forEach(function(nombre) {
      propiedades.deleteProperty(nombre);
    });
    Logger.log(CONFIG.prefijoLog + ' Finalizado. | ' + JSON.stringify(conteos));
    return conteos;
  }

  function diagnosticar(numeroFila) {
    const fila = Number(numeroFila);
    if (!Number.isInteger(fila) || fila < CONFIG.primeraFila) throw new Error('Indica una fila válida.');
    const reglas = cargarReglas_();
    const datos = obtenerHojaDestino_().getRange(fila, CONFIG.primeraColumnaLectura, 1, CONFIG.columnasLectura).getDisplayValues()[0];
    const detalle = evaluarFila_(datos, reglas);
    Logger.log(CONFIG.prefijoLog + ' Diagnóstico fila ' + fila + '. | ' + JSON.stringify(detalle));
    return detalle;
  }

  function evaluarFila_(fila, reglas) {
    const comprador = normalizar_(fila[0]);
    const partida = String(fila[2] || '').replace(/[^0-9]/g, '');
    const marca = normalizar_(fila[6]);
    const descripcion = normalizar_([fila[4], fila[5], marca].join(' '));
    const shipper = normalizar_(fila[18]);
    const entidad = normalizar_([comprador, fila[1], shipper].join(' '));
    const puntajes = { IVD: 0, 'NO ES IVD': 0, PHARMA: 0 };
    const evidencia = { IVD: [], 'NO ES IVD': [], PHARMA: [] };

    sumar_(puntajes, evidencia, 'PHARMA', obtener_(descripcion, reglas.pharmaDescripcion), CONFIG.pesos.pharmaDiccionario, 'Diccionario PHARMA');
    sumar_(puntajes, evidencia, 'PHARMA', obtener_(entidad, reglas.pharmaComprador), CONFIG.pesos.pharmaComprador, 'Comprador PHARMA');
    sumar_(puntajes, evidencia, 'PHARMA', obtener_(descripcion, reglas.pharmaFuerte), CONFIG.pesos.pharmaFuerte, 'Producto PHARMA explícito');

    sumar_(puntajes, evidencia, 'NO ES IVD', obtener_(descripcion, reglas.noIVDDescripcion).filter(esNoIVDUtil_), CONFIG.pesos.noIVDDiccionario, 'Diccionario NO ES IVD');
    sumar_(puntajes, evidencia, 'NO ES IVD', obtener_(entidad, reglas.noIVDComprador), CONFIG.pesos.noIVDComprador, 'Comprador NO ES IVD');
    sumar_(puntajes, evidencia, 'NO ES IVD', obtener_(descripcion, reglas.noIVDFuerte), CONFIG.pesos.noIVDFuerte, 'Producto NO IVD explícito');

    sumar_(puntajes, evidencia, 'IVD', obtener_(descripcion, reglas.ivdDescripcion).filter(esIVDUtil_), CONFIG.pesos.ivdDiccionario, 'Diccionario IVD');
    sumar_(puntajes, evidencia, 'IVD', obtener_(entidad, reglas.ivdComprador).filter(esCompradorIVDUtil_), CONFIG.pesos.ivdComprador, 'Comprador IVD');
    sumar_(puntajes, evidencia, 'IVD', obtener_(descripcion, reglas.ivdFuerte), CONFIG.pesos.ivdFuerte, 'Producto IVD explícito');
    if (CONFIG.partidasIVD.some(function(prefijo) { return partida.indexOf(prefijo) === 0; })) {
      puntajes.IVD += CONFIG.pesos.partidaIVD;
      evidencia.IVD.push('Partida IVD +' + CONFIG.pesos.partidaIVD);
    }
    if (coincide_(marca, CONFIG.marcasIVD)) {
      puntajes.IVD += CONFIG.pesos.marcaIVD;
      evidencia.IVD.push('Marca IVD +' + CONFIG.pesos.marcaIVD);
    }
    if (coincide_(shipper, CONFIG.fabricantesIVD)) {
      puntajes.IVD += CONFIG.pesos.fabricanteIVD;
      evidencia.IVD.push('Fabricante IVD +' + CONFIG.pesos.fabricanteIVD);
    }

    const resultado = decidir_(puntajes);
    return { resultado: resultado, puntajes: puntajes, evidencia: evidencia };
  }

  function decidir_(puntajes) {
    const orden = ['PHARMA', 'IVD', 'NO ES IVD'];
    const ganador = orden.slice().sort(function(a, b) { return puntajes[b] - puntajes[a]; })[0];
    const segundo = orden.filter(function(categoria) { return categoria !== ganador; }).sort(function(a, b) {
      return puntajes[b] - puntajes[a];
    })[0];
    const minimo = ganador === 'PHARMA' ? CONFIG.pesos.minimoPharma : ganador === 'IVD' ? CONFIG.pesos.minimoIVD : CONFIG.pesos.minimoNoIVD;
    if (puntajes[ganador] < minimo) return 'NO ES IVD';
    if (puntajes[ganador] - puntajes[segundo] < CONFIG.pesos.ventajaMinima) return 'NO ES IVD';
    return ganador;
  }

  function sumar_(puntajes, evidencia, categoria, coincidencias, peso, origen) {
    const usadas = coincidencias.slice(0, CONFIG.pesos.maxCoincidenciasPorGrupo);
    if (!usadas.length) return;
    puntajes[categoria] += usadas.length * peso;
    evidencia[categoria].push(origen + ': ' + usadas.join(', ') + ' +' + (usadas.length * peso));
  }

  function cargarReglas_() {
    const libro = SpreadsheetApp.openById(CONFIG.idDiccionario);
    return {
      ivdDescripcion: compilar_(leer_(libro, CONFIG.hojas.descripcionIVD, 'IVD')),
      ivdComprador: compilar_(leer_(libro, CONFIG.hojas.compradorIVD, 'IVD')),
      pharmaDescripcion: compilar_(leer_(libro, CONFIG.hojas.irrelevantesDescripcion, 'PHARMA')),
      pharmaComprador: compilar_(leer_(libro, CONFIG.hojas.irrelevantesComprador, 'PHARMA')),
      noIVDDescripcion: compilar_(leer_(libro, CONFIG.hojas.irrelevantesDescripcion, 'NO ES IVD')),
      noIVDComprador: compilar_(leer_(libro, CONFIG.hojas.irrelevantesComprador, 'NO ES IVD')),
      pharmaFuerte: compilar_(CONFIG.terminosPharmaFuertes),
      ivdFuerte: compilar_(CONFIG.terminosIVDFuertes),
      noIVDFuerte: compilar_(CONFIG.terminosNoIVDFuertes)
    };
  }

  function leer_(libro, nombreHoja, categoriaObjetivo) {
    const hoja = libro.getSheetByName(nombreHoja);
    if (!hoja) throw new Error('No se encontró la hoja: ' + nombreHoja + '.');
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const terminos = new Set();
    hoja.getRange(2, 1, ultima - 1, 2).getDisplayValues().forEach(function(fila) {
      const termino = normalizar_(fila[1]);
      if (normalizar_(fila[0]).toUpperCase() === categoriaObjetivo && termino.length >= 3) terminos.add(termino);
    });
    return Array.from(terminos).sort(function(a, b) { return b.length - a.length; });
  }

  function compilar_(terminos) {
    const grupos = [];
    let grupo = [];
    let longitud = 0;
    Array.from(new Set(terminos)).forEach(function(termino) {
      const seguro = escapar_(termino);
      if (grupo.length && longitud + seguro.length + 1 > CONFIG.maxCaracteresRegex) {
        grupos.push(grupo);
        grupo = [];
        longitud = 0;
      }
      grupo.push(seguro);
      longitud += seguro.length + 1;
    });
    if (grupo.length) grupos.push(grupo);
    return grupos.map(function(actual) {
      return new RegExp('(?:^|[^a-z0-9])(' + actual.join('|') + ')(?=$|[^a-z0-9])', 'g');
    });
  }

  function obtener_(texto, patrones) {
    const encontrados = new Set();
    patrones.forEach(function(patron) {
      patron.lastIndex = 0;
      let match;
      while ((match = patron.exec(texto)) !== null) encontrados.add(match[1]);
      patron.lastIndex = 0;
    });
    return Array.from(encontrados).sort();
  }

  function esNoIVDUtil_(termino) {
    return !CONFIG.terminosAmbiguosNoIVD.has(termino);
  }

  function esIVDUtil_(termino) {
    return !CONFIG.terminosGenericosIVD.has(termino);
  }

  function esCompradorIVDUtil_(termino) {
    return termino !== 'hospital' && termino !== 'clinica' && termino !== 'laboratori';
  }

  function coincide_(texto, conjunto) {
    return Array.from(conjunto).some(function(termino) { return (' ' + texto + ' ').indexOf(' ' + termino + ' ') !== -1; });
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escapar_(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function obtenerHojaDestino_() {
    const hoja = SpreadsheetApp.openById(CONFIG.idDestino).getSheetByName(CONFIG.hojaDestino);
    if (!hoja) throw new Error('No se encontró la hoja destino 2025.');
    return hoja;
  }

  function leerConteos_() {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty(CONFIG.propiedadConteos) || '{"IVD":0,"NO ES IVD":0,"PHARMA":0}');
  }

  function programarContinuacion_() {
    borrarTriggers_();
    ScriptApp.newTrigger('continuarClasificacionIVDConPesos2025').timeBased().after(CONFIG.minutosSiguienteLote * 60000).create();
  }

  function borrarTriggers_() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'continuarClasificacionIVDConPesos2025') ScriptApp.deleteTrigger(trigger);
    });
  }

  return { iniciar: iniciar, continuar: continuar, diagnosticar: diagnosticar };
})();
