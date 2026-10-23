/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Clasifica las importaciones de la hoja 2025 como IVD, NO ES IVD o PHARMA.
 * Lee únicamente A:T, usa B, C, D, F, G, H y T, y escribe el resultado en V.
 * Para soportar más de 50 000 filas, trabaja en lotes y programa el siguiente lote.
 *
 * Validaciones para ejecutar calcularRelevanciaIVD2025():
 * 1) La hoja 2025 debe existir y conservar B, C, D, F, G, H, T y V.
 * 2) Las cuatro hojas de entrenamiento deben conservar categoría en A y término o entidad en B.
 * 3) La hoja update del archivo de control debe conservar B2 con el texto exacto update.
 */

function calcularRelevanciaIVD2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorRelevanciaIVD.iniciar();
}

function continuarClasificacionIVD2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorRelevanciaIVD.continuar();
}

function diagnosticarFilaIVD2025(numeroFila) {
  if (!validarConArchivoControl()) return;
  return ClasificadorRelevanciaIVD.diagnosticar(numeroFila);
}

const ClasificadorRelevanciaIVD = (function() {
  const CONFIGURACION = Object.freeze({
    prefijoLog: '[BCAT-0050]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    idDestino: '1iDzirC_nfjzXadwa1yPEPA64ObVBt8ej69BJ0F6UGtw',
    hojaDestino: '2025',
    primeraFilaDatos: 2,
    primeraColumnaLectura: 2,
    columnaSalida: 22,
    anchoLectura: 19,
    filasPorLote: 2500,
    minutosSiguienteLote: 1,
    longitudMinimaTermino: 3,
    caracteresMaximosPatron: 10000,
    propiedadCursor: 'BCAT_0050_CURSOR',
    propiedadUltimaFila: 'BCAT_0050_ULTIMA_FILA',
    propiedadConteos: 'BCAT_0050_CONTEOS',
    partidasIVD: ['3822', '300215', '300290', '300630'],
    terminosPharmaFuertes: [
      'medicamento para uso humano', 'ocrevus', 'ocrelizumab', 'hemlibra', 'emicizumab',
      'kadcyla', 'trastuzumab emtansina', 'pertuzumab', 'perjeta', 'phesgo', 'avastin',
      'bevacizumab', 'herceptin', 'trastuzumab', 'actemra', 'tocilizumab', 'alecensa',
      'alectinib', 'zelboraf', 'vemurafenib', 'mabthera', 'rituximab', 'evrysdi', 'evrisdy',
      'risdiplam', 'pulmozyme', 'dornasa alfa', 'vabysmo', 'faricimab', 'tecentriq',
      'atezolizumab', 'recormon', 'epoetina beta', 'rozlytrek', 'entrectinib',
      'rocephin', 'ceftriaxona', 'polivy', 'polatuzumab'
    ],
    terminosIVDFuertes: [
      'diagnostico in vitro', 'in vitro para deteccion', 'reactivos de diagnostico',
      'reactivos de laboratorio', 'reactivo de diagnostico', 'prueba cualitativa in vitro',
      'prueba rapida', 'hematology analyzer', 'hemoglobin analyzer', 'chemistry analyzer',
      'auto hematology analyzer', 'immunoassay analyzer', 'immunoassay', 'inmunoassay',
      'analizador hematologico', 'analizador de orina', 'analizador de quimica clinica',
      'analizador de quimica', 'inmunoanalizador', 'quimica clinica', 'uroanalisis',
      'urinalysis', 'tiras reactivas', 'tira reactiva', 'medidor de glucosa', 'accu chek',
      'cobas', 'elecsys', 'calset', 'troponin', 'troponina', 'hbsag', 'hiv', 'vih',
      'hepatitis', 'elisa', 'clia', 'eclia', 'pcr', 'pcr detection', 'hba1c',
      'hemoglobina glicosilada', 'factor reumatoide', 'prolactin detection kit',
      'estradiol detection kit', 'progesterone detection kit', 'testosterone detection kit',
      'luteinizing hormone detection kit', 'human interleukin', 'cancer antigen',
      'thyroid peroxidase antibody', 'carcinoembryonic antigen', 'ferritin clia',
      'herpes simplex', 'calibrador', 'calibrator', 'control normal para',
      'determinacion cuantitativa', 'inmunoquimica', 'inmunofluorescencia',
      'facslyric', 'maglumi', 'alinity i', 'alinity c', 'cobas c', 'cobas 8000',
      'bc 780', 'd 10 hb', 'uriskan', 'nova view', 'humalyzer', 'flow cell', 'cd27 fitc',
      'citologia en base liquida', 'cell preserve', 'solucion gyn', 'euroline', 'ana profile',
      'equipo de diagnostico', 'medio de cultivo', 'phoenix id broth', 'edta k3',
      'tubo tapa lila', 'tube sst', 'biovue', 'sta cuvette', 'maglumi wash', 'asps smpl',
      'ft3 rapid', 'bnp kit', 'hba1c kit', 'hba0103', 'd dimer', 'reaction cell',
      'c 503', 'c513', 'sars cov2', 'influenza a b', 'spintrol', 'suero control',
      'i smart', 'medicion de concentraciones de electrolitos', 'dg gel', 'dengue card',
      'hiv ag ab', 'automatic coagulation analyzer', 'coagulation analyzer', 'lysing reagent',
      'vitrostainer', 'vitrocycler', 'liquid based cytology', 'cytology workstation',
      'molecular automated integral solution', 'fluorescent quantitative', 'urine analysis system',
      'automatic system for urine', 'blood gas analyzer', 'analizador de gases sanguineos',
      'blood type analyzer', 'automatic blood type analyzer', 'labscan3d', 'histo tek',
      'vacuum infiltration processor', 'media preparator', 'mediaprep', 'rotofix', 'ivdr',
      'sample collection cup', 'specimen cup', 'kit glucometer', 'glucometer',
      'biochemical analyzer', 'e 1 analyzer', 'reaction cell', 'x y stainer',
      'automatic biochemical analyzer', 'bactec', 'phoenix id', 'tube sst plh',
      'tenidor de tejidos', 'estacion de secado', 'blood set', 'tisseel',
      'tube sonificador', 'articulos de vidrio para laboratorio', 'tyvek heat sealing',
      'icp centrifugal pump', 'accesorio plastico', 'filter gyn urine', 'citologia'
    ],
    terminosNoIVDFuertes: [
      'maquina de dialisis', 'hemodialisis', 'dializador', 'filtro dializador', 'blood tubing',
      'lineas arteriovenosas', 'pump tubing', 'tubing set', 'dristate dry acid',
      'consultorio dental', 'sillon dental', 'odontologia', 'odontologico', 'protesis',
      'implante', 'osteosintesis', 'tornillo', 'sutura', 'cateter', 'esterilizador',
      'plazmax', 'adhesivos esteriles', 'floseal', 'barcode scanner', 'scanner 2d',
      'equipo de rayos x', 'tomografia', 'ecografia', 'resonancia magnetica'
    ],
    marcasIVD: new Set([
      'abbott', 'agappe', 'bio rad', 'biomerieux', 'becton dickinson', 'cepheid', 'dirui',
      'dymind', 'edan', 'euroimmun', 'genrui', 'human', 'lifotronic', 'mac cura', 'maccura',
      'medcaptain', 'microbiologics', 'mindray', 'monobind', 'sebia', 'siemens', 'snibe',
      'sysmex', 'vibag', 'vircell', 'werfen', 'zybio', 'yhlo', 'stago', 'quidelortho',
      'j mitra', 'ctk biotech', 'spinreact', 'i sens', 'grifols', 'linear chemicals',
      'tosoh', 'greiner bio one', 'celltrazone', 'vitro', 'orgentec', 'convergent', 'aesku',
      'flashdx', 'diatech pharmacogenetics', 'bio optica', 'sakura', 'hettich', 'wondfo',
      'medica corporation', 'keyu', 'reetoo', 'stago', 'systec'
    ]),
    compradoresIVD: new Set([
      'blue health', 'distprolab', 'reactlab', 'lab quality', 'vibag', 'frisonex', 'medibac',
      'estrella sango', 'rocar system', 'rocarsystem', 'medilabor', 'simed'
    ]),
    fabricantesIVD: new Set([
      'roche diagnostics', 'abbott', 'agappe diagnostics', 'becton dickinson', 'bio rad',
      'biomerieux', 'dirui', 'dymind', 'edan', 'euroimmun', 'human gesellschaft', 'lifotronic',
      'medcaptain', 'microbiologics', 'mindray', 'sebia', 'siemens health', 'snibe', 'sysmex',
      'vircell', 'werfen', 'zybio', 'monobind', 'diagnostica stago', 'diagnostic grifols',
      'ctk biotech', 'j mitra', 'spinreact', 'i sens', 'linear chemicals', 'tosoh bioscience',
      'greiner bio one', 'celltrazone', 'shenzhen drawray', 'orgentec diagnostika',
      'convergent technologies', 'molbio diagnostics', 'flashdx', 'diatech pharmacogenetics',
      'bio optica', 'sakura finetek', 'andreas hettich', 'guangzhou wondfo',
      'medica corporation', 'zhuhai keyu', 'shenzhen reetoo', 'systec gmbh'
    ]),
    fabricantesIVDFuertes: new Set([
      'roche diagnostics', 'sysmex america', 'diagnostica stago', 'becton dickinson de colombia',
      'siemens healthineers', 'abbott gmbh', 'abbott laboratories', 'bio rad laboratories',
      'werfen instrumentation', 'mindray', 'snibe', 'euroimmun', 'orgentec diagnostika',
      'molbio diagnostics', 'one lambda', 'shenzhen drawray'
    ]),
    terminosIVDGenericos: new Set([
      'test', 'laboratorio', 'determinacion', 'sangre', 'tubo', 'vial', 'punta', 'tip',
      'reactivo', 'diagnostico', 'molecular', 'cultivo', 'plasma', 'manual', 'programa',
      'material', 'producto', 'muestra', 'control', 'lectura', 'insumo', 'insumos', 'kit',
      'roche', 'human', 'analisis', 'analizador', 'equipo', 'instrumento', 'aparato'
    ]),
    terminosNoIVDAmbiguos: new Set([
      'laboratorio', 'tubo', 'tubos', 'pipeta', 'pipetas', 'micropipeta', 'micropipetas',
      'cubreobjetos', 'glucometro', 'medidor', 'medidores', 'reactivo', 'reactivos',
      'diagnostico', 'diagnosticos', 'analizador', 'analizadores', 'centrifuga', 'incubadora',
      'estufa', 'placa', 'placas', 'vial', 'viales', 'cuveta', 'cubeta', 'cubetas', 'tira',
      'tiras', 'kit', 'test', 'sangre', 'muestra', 'muestras', 'control', 'calibrador'
    ]),
    hojas: Object.freeze({
      descripcionIVD: 'KeyWordsDescriptionTraining (M)',
      compradorIVD: 'KeyWordsBuyerTraining (M)',
      irrelevantesDescripcion: 'IrrelevantWordsTraining (M)',
      irrelevantesComprador: 'IrrelevantWordsBuyerTraining (M)'
    })
  });

  function iniciar() {
    const propiedades = PropertiesService.getScriptProperties();
    eliminarTriggersPendientes_();
    const hoja = obtenerHoja_(CONFIGURACION.idDestino, CONFIGURACION.hojaDestino);
    const ultimaFila = hoja.getLastRow();
    hoja.getRange(1, CONFIGURACION.columnaSalida).setValue('Clasificación IVD');
    hoja.getRange(1, CONFIGURACION.columnaSalida, Math.max(1, ultimaFila), 1).setNumberFormat('@');
    propiedades.setProperty(CONFIGURACION.propiedadCursor, String(CONFIGURACION.primeraFilaDatos));
    propiedades.setProperty(CONFIGURACION.propiedadUltimaFila, String(ultimaFila));
    propiedades.setProperty(CONFIGURACION.propiedadConteos, JSON.stringify({ pharma: 0, noEsIVD: 0, ivd: 0 }));
    Logger.log(CONFIGURACION.prefijoLog + ' Inicio solicitado. | filas objetivo: ' + Math.max(0, ultimaFila - 1));
    return procesarSiguienteLote_();
  }

  function continuar() {
    return procesarSiguienteLote_();
  }

  function procesarSiguienteLote_() {
    let bloqueo;
    try {
      bloqueo = LockService.getScriptLock();
      bloqueo.waitLock(30000);
      const propiedades = PropertiesService.getScriptProperties();
      const cursor = Number(propiedades.getProperty(CONFIGURACION.propiedadCursor));
      const ultimaFila = Number(propiedades.getProperty(CONFIGURACION.propiedadUltimaFila));
      if (!cursor || !ultimaFila || cursor > ultimaFila) return finalizarProceso_();

      const hastaFila = Math.min(cursor + CONFIGURACION.filasPorLote - 1, ultimaFila);
      const cantidad = hastaFila - cursor + 1;
      const libroDiccionario = SpreadsheetApp.openById(CONFIGURACION.idDiccionario);
      const hojaDestino = obtenerHoja_(CONFIGURACION.idDestino, CONFIGURACION.hojaDestino);
      const reglas = cargarReglas_(libroDiccionario);
      const datos = hojaDestino.getRange(cursor, CONFIGURACION.primeraColumnaLectura, cantidad, CONFIGURACION.anchoLectura).getDisplayValues();
      const resultado = clasificarFilas_(datos, reglas);

      hojaDestino.getRange(cursor, CONFIGURACION.columnaSalida, cantidad, 1).setValues(resultado.salida).setNumberFormat('@');
      const conteos = obtenerConteos_(propiedades);
      conteos.pharma += resultado.pharma;
      conteos.noEsIVD += resultado.noEsIVD;
      conteos.ivd += resultado.ivd;
      propiedades.setProperty(CONFIGURACION.propiedadConteos, JSON.stringify(conteos));
      propiedades.setProperty(CONFIGURACION.propiedadCursor, String(hastaFila + 1));

      Logger.log(CONFIGURACION.prefijoLog + ' Lote terminado. | filas: ' + cursor + '-' + hastaFila + ' | PHARMA: ' + resultado.pharma + ' | NO ES IVD: ' + resultado.noEsIVD + ' | IVD: ' + resultado.ivd);
      if (hastaFila >= ultimaFila) return finalizarProceso_();
      programarSiguienteLote_();
      return { estado: 'EN PROCESO', desdeFila: cursor, hastaFila: hastaFila, siguienteFila: hastaFila + 1 };
    } catch (error) {
      Logger.log(CONFIGURACION.prefijoLog + ' ERROR en clasificación. | motivo: ' + error.message);
      throw error;
    } finally {
      if (bloqueo && bloqueo.hasLock()) bloqueo.releaseLock();
    }
  }

  function finalizarProceso_() {
    const propiedades = PropertiesService.getScriptProperties();
    const conteos = obtenerConteos_(propiedades);
    eliminarTriggersPendientes_();
    [CONFIGURACION.propiedadCursor, CONFIGURACION.propiedadUltimaFila, CONFIGURACION.propiedadConteos].forEach(function(nombre) {
      propiedades.deleteProperty(nombre);
    });
    Logger.log(CONFIGURACION.prefijoLog + ' Clasificación finalizada. | PHARMA: ' + conteos.pharma + ' | NO ES IVD: ' + conteos.noEsIVD + ' | IVD: ' + conteos.ivd);
    return { estado: 'FINALIZADO', pharma: conteos.pharma, noEsIVD: conteos.noEsIVD, ivd: conteos.ivd };
  }

  function programarSiguienteLote_() {
    eliminarTriggersPendientes_();
    ScriptApp.newTrigger('continuarClasificacionIVD2025').timeBased().after(CONFIGURACION.minutosSiguienteLote * 60 * 1000).create();
  }

  function eliminarTriggersPendientes_() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'continuarClasificacionIVD2025') ScriptApp.deleteTrigger(trigger);
    });
  }

  function obtenerConteos_(propiedades) {
    try {
      return JSON.parse(propiedades.getProperty(CONFIGURACION.propiedadConteos) || '{"pharma":0,"noEsIVD":0,"ivd":0}');
    } catch (error) {
      return { pharma: 0, noEsIVD: 0, ivd: 0 };
    }
  }

  function diagnosticar(numeroFila) {
    try {
      const fila = Number(numeroFila);
      if (!Number.isInteger(fila) || fila < CONFIGURACION.primeraFilaDatos) throw new Error('Indica una fila válida.');
      const libroDiccionario = SpreadsheetApp.openById(CONFIGURACION.idDiccionario);
      const hojaDestino = obtenerHoja_(CONFIGURACION.idDestino, CONFIGURACION.hojaDestino);
      const reglas = cargarReglas_(libroDiccionario);
      const datosFila = hojaDestino.getRange(fila, CONFIGURACION.primeraColumnaLectura, 1, CONFIGURACION.anchoLectura).getDisplayValues()[0];
      const detalle = evaluarFila_(datosFila, reglas);
      Logger.log(CONFIGURACION.prefijoLog + ' Diagnóstico fila ' + fila + '. | ' + JSON.stringify(detalle));
      return detalle;
    } catch (error) {
      Logger.log(CONFIGURACION.prefijoLog + ' ERROR en diagnóstico. | motivo: ' + error.message);
      throw error;
    }
  }

  function obtenerHoja_(idArchivo, nombreHoja) {
    const hoja = SpreadsheetApp.openById(idArchivo).getSheetByName(nombreHoja);
    if (!hoja) throw new Error('No se encontró la hoja obligatoria: ' + nombreHoja + '.');
    return hoja;
  }

  function cargarReglas_(libroDiccionario) {
    const descripcionIVD = leerTerminos_(libroDiccionario, CONFIGURACION.hojas.descripcionIVD, 'IVD');
    const compradorIVD = leerTerminos_(libroDiccionario, CONFIGURACION.hojas.compradorIVD, 'IVD');
    const pharmaDescripcion = leerTerminos_(libroDiccionario, CONFIGURACION.hojas.irrelevantesDescripcion, 'PHARMA');
    const pharmaComprador = leerTerminos_(libroDiccionario, CONFIGURACION.hojas.irrelevantesComprador, 'PHARMA');
    const noIVDOriginal = leerTerminos_(libroDiccionario, CONFIGURACION.hojas.irrelevantesDescripcion, 'NO ES IVD');
    const noIVDComprador = leerTerminos_(libroDiccionario, CONFIGURACION.hojas.irrelevantesComprador, 'NO ES IVD');
    const setIVD = new Set(descripcionIVD);
    const noIVDDescripcion = noIVDOriginal.filter(function(termino) {
      return !setIVD.has(termino) && esTerminoNoIVDUtil_(termino);
    });

    Logger.log(CONFIGURACION.prefijoLog + ' Diccionarios filtrados. | IVD: ' + descripcionIVD.length + ' | NO ES IVD utilizables: ' + noIVDDescripcion.length + ' de ' + noIVDOriginal.length + ' | PHARMA: ' + (pharmaDescripcion.length + pharmaComprador.length));
    return {
      descripcionIVD: compilarPatrones_(descripcionIVD),
      compradorIVD: compilarPatrones_(compradorIVD),
      pharmaDescripcion: compilarPatrones_(pharmaDescripcion.concat(CONFIGURACION.terminosPharmaFuertes)),
      pharmaComprador: compilarPatrones_(pharmaComprador),
      noIVDDescripcion: compilarPatrones_(noIVDDescripcion.concat(CONFIGURACION.terminosNoIVDFuertes)),
      noIVDComprador: compilarPatrones_(noIVDComprador),
      ivdFuertes: compilarPatrones_(CONFIGURACION.terminosIVDFuertes)
    };
  }

  function leerTerminos_(libro, nombreHoja, categoriaObjetivo) {
    const hoja = libro.getSheetByName(nombreHoja);
    if (!hoja) throw new Error('No se encontró la hoja de diccionario: ' + nombreHoja + '.');
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) return [];
    const terminos = new Set();
    hoja.getRange(2, 1, ultimaFila - 1, 2).getDisplayValues().forEach(function(fila) {
      const categoria = normalizarCategoria_(fila[0]);
      const termino = normalizarTexto_(fila[1]);
      if (categoria === categoriaObjetivo && compactar_(termino).length >= CONFIGURACION.longitudMinimaTermino) terminos.add(termino);
    });
    return Array.from(terminos).sort(function(a, b) { return b.length - a.length; });
  }

  function compilarPatrones_(terminos) {
    const terminosUnicos = Array.from(new Set(terminos)).filter(Boolean).sort(function(a, b) { return b.length - a.length; });
    const grupos = [];
    let grupo = [];
    let longitud = 0;
    terminosUnicos.forEach(function(termino) {
      const escapado = escaparRegex_(termino);
      if (grupo.length && longitud + escapado.length + 1 > CONFIGURACION.caracteresMaximosPatron) {
        grupos.push(grupo);
        grupo = [];
        longitud = 0;
      }
      grupo.push(escapado);
      longitud += escapado.length + 1;
    });
    if (grupo.length) grupos.push(grupo);
    return grupos.map(function(grupoActual) {
      return new RegExp('(?:^|[^a-z0-9])(' + grupoActual.join('|') + ')(?=$|[^a-z0-9])', 'g');
    });
  }

  function clasificarFilas_(datos, reglas) {
    const resultado = { salida: [], pharma: 0, noEsIVD: 0, ivd: 0 };
    datos.forEach(function(fila) {
      const detalle = evaluarFila_(fila, reglas);
      resultado.salida.push([detalle.resultado]);
      if (detalle.resultado === 'PHARMA') resultado.pharma++;
      else if (detalle.resultado === 'IVD') resultado.ivd++;
      else resultado.noEsIVD++;
    });
    return resultado;
  }

  function evaluarFila_(fila, reglas) {
    const comprador = normalizarTexto_(fila[0]);
    const ruc = normalizarTexto_(fila[1]);
    const marca = normalizarTexto_(fila[6]);
    const shipper = normalizarTexto_(fila[18]);
    const entidad = normalizarTexto_([comprador, ruc, shipper].join(' '));
    const descripcion = normalizarTexto_([fila[4], fila[5], marca].join(' '));
    const partida = String(fila[2] == null ? '' : fila[2]).replace(/[^0-9]/g, '');

    const pharma = obtenerCoincidencias_(descripcion, reglas.pharmaDescripcion).concat(obtenerCoincidencias_(entidad, reglas.pharmaComprador));
    if (pharma.length) return crearDetalle_('PHARMA', 'PHARMA PRIORITARIO', pharma, []);

    const ivdFuerte = obtenerCoincidencias_(descripcion, reglas.ivdFuertes);
    if (ivdFuerte.length) return crearDetalle_('IVD', 'SEÑAL IVD FUERTE', ivdFuerte, []);

    if (coincideConConjunto_(shipper, CONFIGURACION.fabricantesIVDFuertes)) {
      return crearDetalle_('IVD', 'FABRICANTE IVD ESPECÍFICO', [shipper], []);
    }

    const noIVDFuerte = obtenerCoincidencias_(descripcion, reglas.noIVDDescripcion).concat(obtenerCoincidencias_(entidad, reglas.noIVDComprador));
    if (noIVDFuerte.length) return crearDetalle_('NO ES IVD', 'SEÑAL NO IVD FUERTE', noIVDFuerte, []);

    const ivdDescripcion = obtenerCoincidencias_(descripcion, reglas.descripcionIVD).filter(esEvidenciaIVDUtil_);
    const ivdComprador = obtenerCoincidencias_(entidad, reglas.compradorIVD).filter(esCompradorIVDUtil_);
    const esPartidaIVD = CONFIGURACION.partidasIVD.some(function(prefijo) { return partida.indexOf(prefijo) === 0; });
    const esMarcaIVD = coincideConConjunto_(marca, CONFIGURACION.marcasIVD);
    const esCompradorIVD = coincideConConjunto_(comprador, CONFIGURACION.compradoresIVD);
    const esFabricanteIVD = coincideConConjunto_(shipper, CONFIGURACION.fabricantesIVD);
    let puntos = 0;
    const criterios = [];
    if (ivdDescripcion.length) { puntos++; criterios.push('Término IVD específico'); }
    if (esPartidaIVD) { puntos++; criterios.push('Partida de diagnóstico'); }
    if (esMarcaIVD) { puntos++; criterios.push('Marca IVD'); }
    if (esCompradorIVD) { puntos++; criterios.push('Comprador IVD'); }
    if (esFabricanteIVD) { puntos++; criterios.push('Fabricante IVD'); }
    if (puntos >= 2) return crearDetalle_('IVD', 'DOS O MÁS SEÑALES IVD', ivdDescripcion, criterios);
    return crearDetalle_('NO ES IVD', 'SIN EVIDENCIA IVD SUFICIENTE', ivdDescripcion.concat(ivdComprador), criterios);
  }

  function crearDetalle_(resultado, reglaAplicada, coincidencias, criterios) {
    return { resultado: resultado, reglaAplicada: reglaAplicada, coincidencias: Array.from(new Set(coincidencias)).sort(), criterios: criterios };
  }

  function esEvidenciaIVDUtil_(termino) {
    return !CONFIGURACION.terminosIVDGenericos.has(termino);
  }

  function esCompradorIVDUtil_(termino) {
    return termino.length >= 6 && termino !== 'hospital' && termino !== 'clinica' && termino !== 'laboratori';
  }

  function esTerminoNoIVDUtil_(termino) {
    return termino.length >= 5 && !CONFIGURACION.terminosNoIVDAmbiguos.has(termino);
  }

  function coincideConConjunto_(texto, conjunto) {
    return Array.from(conjunto).some(function(valor) { return contieneFrase_(texto, valor); });
  }

  function contieneFrase_(texto, frase) {
    return (' ' + texto + ' ').indexOf(' ' + frase + ' ') !== -1;
  }

  function obtenerCoincidencias_(texto, patrones) {
    const coincidencias = new Set();
    patrones.forEach(function(patron) {
      patron.lastIndex = 0;
      let coincidencia;
      while ((coincidencia = patron.exec(texto)) !== null) coincidencias.add(coincidencia[1]);
      patron.lastIndex = 0;
    });
    return Array.from(coincidencias).sort();
  }

  function normalizarCategoria_(valor) {
    return normalizarTexto_(valor).toUpperCase();
  }

  function normalizarTexto_(valor) {
    return String(valor == null ? '' : valor)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactar_(texto) {
    return texto.replace(/\s/g, '');
  }

  function escaparRegex_(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return { iniciar: iniciar, continuar: continuar, diagnosticar: diagnosticar };
})();

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
