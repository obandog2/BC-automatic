/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Clasifica la hoja 2025 como IVD, NO ES IVD o PHARMA mediante un método híbrido:
 * reglas absolutas para productos inequívocos y puntajes para los casos restantes.
 * Lee B:T y escribe únicamente en V.
 *
 * Validaciones para ejecutar clasificarIVDHibrido2025():
 * 1) Debe existir la función validarConArchivoControl() en el proyecto.
 * 2) La hoja 2025 debe conservar las columnas B:T y la salida V.
 * 3) Las hojas del diccionario deben conservar categoría en A y término en B.
 */

function clasificarIVDHibrido2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorHibridoIVD2025.iniciar();
}

function continuarClasificacionIVDHibrido2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorHibridoIVD2025.continuar();
}

function diagnosticarHibridoIVD2025(numeroFila) {
  if (!validarConArchivoControl()) return;
  return ClasificadorHibridoIVD2025.diagnosticar(numeroFila);
}

const ClasificadorHibridoIVD2025 = (function() {
  const CONFIG = Object.freeze({
    prefijoLog: '[BCAT-0050-HIBRIDO]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    idDestino: '1iDzirC_nfjzXadwa1yPEPA64ObVBt8ej69BJ0F6UGtw',
    hojaDestino: '2025',
    primeraFila: 2,
    primeraColumnaLectura: 2,
    columnasLectura: 19,
    columnaSalida: 22,
    filasPorLote: 2500,
    minutosSiguienteLote: 1,
    maxMilisegundosPorEjecucion: 240000,
    estadoPendiente: 'PENDIENTE',
    maxCaracteresRegex: 10000,
    umbralSimilitudComprador: 0.8,
    propiedadCursor: 'BCAT_0050_HIBRIDO_CURSOR',
    propiedadUltimaFila: 'BCAT_0050_HIBRIDO_ULTIMA',
    propiedadConteos: 'BCAT_0050_HIBRIDO_CONTEOS',
    pesos: Object.freeze({
      terminoIVD: 4,
      compradorIVD: 2,
      partidaIVD: 2,
      marcaIVD: 2,
      fabricanteIVD: 3,
      terminoNoIVD: 1,
      compradorNoIVD: 3,
      senalIVDFuerte: 8,
      senalNoIVDFuerte: 5,
      maxCoincidencias: 3,
      minimoIVD: 4,
      minimoNoIVD: 4,
      ventaja: 1
    }),
    partidasIVD: ['3822', '300215', '300290', '300630'],
    pharmaAbsoluto: [
      'medicamento para uso humano', 'ocrevus', 'ocrelizumab', 'hemlibra', 'emicizumab',
      'kadcyla', 'perjeta', 'phesgo', 'avastin', 'herceptin', 'actemra', 'alecensa',
      'zelboraf', 'mabthera', 'evrysdi', 'pulmozyme', 'vabysmo', 'tecentriq',
      'trastuzumab', 'rituximab', 'tocilizumab', 'bevacizumab', 'pertuzumab',
      'atezolizumab', 'risdiplam', 'entrectinib', 'recormon', 'epoetina beta'
    ],
    ivdAbsoluto: [
      'diagnostico in vitro', 'prueba cualitativa in vitro', 'reactivos de diagnostico',
      'reactivo de diagnostico', 'reactivos de laboratorio', 'cobas', 'elecsys', 'accu chek',
      'hematology analyzer', 'chemistry analyzer', 'blood gas analyzer', 'blood type analyzer',
      'analizador hematologico', 'analizador de orina', 'analizador de gases sanguineos',
      'urine analysis system', 'automatic coagulation analyzer', 'inmunoassay', 'eclia', 'clia',
      'elisa', 'pcr', 'hba1c', 'hiv ag ab', 'hbsag', 'troponina', 'vitrostainer',
      'vitrocycler', 'citologia en base liquida', 'liquid based cytology', 'equipo de diagnostico',
      'reaction cell', 'tube sst', 'edta k3', 'sta cuvette', 'maglumi', 'facslyric',
      'labscan3d', 'd dimer', 'kit glucometer', 'glucometer', 'blood set', 'tisseel'
    ],
    noIVDAbsoluto: [
      'maquina de dialisis', 'dializador', 'filtro dializador', 'hemodialisis', 'blood tubing',
      'lineas arteriovenosas', 'pump tubing', 'consultorio dental', 'sillon dental',
      'odontologia', 'implante', 'osteosintesis', 'pegamento quirurgico', 'floseal',
      'tomografia', 'ecografia', 'resonancia magnetica', 'solucion de detergente',
      'detergente limpiador', 'detergente', 'limpiador'
    ],
    ambiguosPharma: new Set([
      'concentrado', 'solucion', 'vial', 'viales', 'ampolla', 'ampollas', 'frasco',
      'capsula', 'capsulas', 'inyeccion', 'inyectable', 'subcutanea', 'intravenosa',
      'precargada', 'precargadas', 'comprimidos', 'tableta', 'tabletas', 'jarabe',
      'pelicula', 'coated', 'duras', 'recubiertos'
    ]),
    ambiguosNoIVD: new Set([
      'equipo', 'laboratorio', 'tubo', 'tubos', 'medidor', 'medidores', 'reactivo',
      'reactivos', 'kit', 'test', 'vial', 'viales', 'muestra', 'muestras', 'control',
      'analizador', 'analizadores', 'diagnostico', 'diagnosticos', 'cuveta', 'cubeta'
    ]),
    genericosIVD: new Set([
      'test', 'laboratorio', 'determinacion', 'sangre', 'tubo', 'vial', 'reactivo',
      'diagnostico', 'kit', 'equipo', 'analizador', 'instrumento', 'aparato', 'control'
    ]),
    palabrasIgnoradasComprador: new Set([
      'sa', 's', 'a', 'cia', 'ltda', 'inc', 'corp', 'corporation', 'company', 'co',
      'de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'sociedad', 'anonima', 'limited'
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
    const hoja = hojaDestino_();
    const propiedades = PropertiesService.getScriptProperties();
    hoja.getRange(1, CONFIG.columnaSalida).setValue('Clasificación IVD');
    if (hoja.getLastRow() >= CONFIG.primeraFila) {
      const pendientes = Array.from(
        { length: hoja.getLastRow() - CONFIG.primeraFila + 1 },
        function() { return [CONFIG.estadoPendiente]; }
      );
      hoja.getRange(CONFIG.primeraFila, CONFIG.columnaSalida, pendientes.length, 1).setValues(pendientes).setNumberFormat('@');
    }
    propiedades.setProperty(CONFIG.propiedadCursor, String(CONFIG.primeraFila));
    propiedades.setProperty(CONFIG.propiedadUltimaFila, String(hoja.getLastRow()));
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
      let cursor = Number(propiedades.getProperty(CONFIG.propiedadCursor));
      const ultimaFila = Number(propiedades.getProperty(CONFIG.propiedadUltimaFila));
      if (!cursor || cursor > ultimaFila) return finalizar_();

      const reglas = cargarReglas_();
      const hoja = hojaDestino_();
      const conteos = leerConteos_();
      const inicio = Date.now();
      const primeraFilaProcesada = cursor;

      while (cursor <= ultimaFila && Date.now() - inicio < CONFIG.maxMilisegundosPorEjecucion) {
        const hasta = Math.min(cursor + CONFIG.filasPorLote - 1, ultimaFila);
        const cantidad = hasta - cursor + 1;
        const filas = hoja.getRange(cursor, CONFIG.primeraColumnaLectura, cantidad, CONFIG.columnasLectura).getDisplayValues();
        const detalles = filas.map(function(fila) { return evaluar_(fila, reglas); });
        hoja.getRange(cursor, CONFIG.columnaSalida, cantidad, 1).setValues(detalles.map(function(detalle) {
          return [detalle.resultado];
        })).setNumberFormat('@');
        detalles.forEach(function(detalle) { conteos[detalle.resultado]++; });
        cursor = hasta + 1;
        propiedades.setProperty(CONFIG.propiedadCursor, String(cursor));
      }

      propiedades.setProperty(CONFIG.propiedadConteos, JSON.stringify(conteos));
      Logger.log(CONFIG.prefijoLog + ' Ejecución terminada. | filas: ' + primeraFilaProcesada + '-' + (cursor - 1));
      if (cursor > ultimaFila) return finalizar_();
      programarContinuacion_();
      return { estado: 'EN PROCESO', desdeFila: primeraFilaProcesada, hastaFila: cursor - 1, siguienteFila: cursor };
    } catch (error) {
      Logger.log(CONFIG.prefijoLog + ' ERROR. | motivo: ' + error.message);
      throw error;
    } finally {
      if (bloqueo && bloqueo.hasLock()) bloqueo.releaseLock();
    }
  }

  function evaluar_(fila, reglas) {
    const comprador = normalizar_(fila[0]);
    const partida = String(fila[2] || '').replace(/[^0-9]/g, '');
    const marca = normalizar_(fila[6]);
    const descripcion = normalizar_([fila[4], fila[5], marca].join(' '));
    const shipper = normalizar_(fila[18]);

    const pharma = obtener_(descripcion, reglas.pharmaAbsoluto).concat(
      obtener_(descripcion, reglas.pharmaDiccionario).filter(esPharmaEspecifico_)
    );
    if (pharma.length) return detalle_('PHARMA', 'REGLA ABSOLUTA PHARMA', { IVD: 0, 'NO ES IVD': 0, PHARMA: 100 }, pharma);

    const puntos = { IVD: 0, 'NO ES IVD': 0, PHARMA: 0 };
    const evidencia = [];
    sumar_(puntos, evidencia, 'IVD', obtener_(descripcion, reglas.ivdAbsoluto), CONFIG.pesos.senalIVDFuerte, 'Señal IVD fuerte');
    sumar_(puntos, evidencia, 'NO ES IVD', obtener_(descripcion, reglas.noIVDAbsoluto), CONFIG.pesos.senalNoIVDFuerte, 'Señal NO ES IVD fuerte');
    sumar_(puntos, evidencia, 'IVD', obtener_(descripcion, reglas.ivdDescripcion).filter(esIVDUtil_), CONFIG.pesos.terminoIVD, 'Término IVD');
    sumar_(puntos, evidencia, 'IVD', compradoresSimilares_(comprador, reglas.ivdCompradores).filter(esCompradorIVDUtil_), CONFIG.pesos.compradorIVD, 'Comprador IVD similar');
    sumar_(puntos, evidencia, 'NO ES IVD', obtener_(descripcion, reglas.noIVDDescripcion).filter(esNoIVDUtil_), CONFIG.pesos.terminoNoIVD, 'Término NO ES IVD');
    sumar_(puntos, evidencia, 'NO ES IVD', compradoresSimilares_(comprador, reglas.noIVDCompradores), CONFIG.pesos.compradorNoIVD, 'Comprador NO ES IVD similar');

    if (CONFIG.partidasIVD.some(function(prefijo) { return partida.indexOf(prefijo) === 0; })) agregar_(puntos, evidencia, 'IVD', CONFIG.pesos.partidaIVD, 'Partida IVD');
    if (coincide_(marca, CONFIG.marcasIVD)) agregar_(puntos, evidencia, 'IVD', CONFIG.pesos.marcaIVD, 'Marca IVD');
    if (coincide_(shipper, CONFIG.fabricantesIVD)) agregar_(puntos, evidencia, 'IVD', CONFIG.pesos.fabricanteIVD, 'Fabricante IVD');

    return detalle_(decidir_(puntos), 'PUNTAJE IVD VS NO ES IVD', puntos, evidencia);
  }

  function decidir_(puntos) {
    const ganador = puntos.IVD > puntos['NO ES IVD'] ? 'IVD' : 'NO ES IVD';
    const segundo = ganador === 'IVD' ? 'NO ES IVD' : 'IVD';
    const minimo = ganador === 'IVD' ? CONFIG.pesos.minimoIVD : CONFIG.pesos.minimoNoIVD;
    if (puntos[ganador] < minimo || puntos[ganador] - puntos[segundo] < CONFIG.pesos.ventaja) return 'NO ES IVD';
    return ganador;
  }

  function detalle_(resultado, regla, puntos, evidencia) {
    return { resultado: resultado, regla: regla, puntajes: puntos, evidencia: evidencia };
  }

  function sumar_(puntos, evidencia, categoria, coincidencias, peso, etiqueta) {
    const usadas = coincidencias.slice(0, CONFIG.pesos.maxCoincidencias);
    if (!usadas.length) return;
    agregar_(puntos, evidencia, categoria, usadas.length * peso, etiqueta + ': ' + usadas.join(', '));
  }

  function agregar_(puntos, evidencia, categoria, cantidad, etiqueta) {
    puntos[categoria] += cantidad;
    evidencia.push(etiqueta + ' +' + cantidad);
  }

  function diagnosticar(numeroFila) {
    const fila = Number(numeroFila);
    if (!Number.isInteger(fila) || fila < CONFIG.primeraFila) throw new Error('Indica una fila válida.');
    const reglas = cargarReglas_();
    const datos = hojaDestino_().getRange(fila, CONFIG.primeraColumnaLectura, 1, CONFIG.columnasLectura).getDisplayValues()[0];
    const resultado = evaluar_(datos, reglas);
    Logger.log(CONFIG.prefijoLog + ' Diagnóstico fila ' + fila + '. | ' + JSON.stringify(resultado));
    return resultado;
  }

  function cargarReglas_() {
    const libro = SpreadsheetApp.openById(CONFIG.idDiccionario);
    return {
      ivdDescripcion: compilar_(leer_(libro, CONFIG.hojas.descripcionIVD, 'IVD')),
      ivdCompradores: leer_(libro, CONFIG.hojas.compradorIVD, 'IVD'),
      pharmaDiccionario: compilar_(leer_(libro, CONFIG.hojas.irrelevantesDescripcion, 'PHARMA')),
      noIVDDescripcion: compilar_(leer_(libro, CONFIG.hojas.irrelevantesDescripcion, 'NO ES IVD')),
      noIVDCompradores: leer_(libro, CONFIG.hojas.irrelevantesComprador, 'NO ES IVD'),
      pharmaAbsoluto: compilar_(CONFIG.pharmaAbsoluto),
      ivdAbsoluto: compilar_(CONFIG.ivdAbsoluto),
      noIVDAbsoluto: compilar_(CONFIG.noIVDAbsoluto)
    };
  }

  function leer_(libro, nombre, categoria) {
    const hoja = libro.getSheetByName(nombre);
    if (!hoja) throw new Error('No se encontró la hoja: ' + nombre + '.');
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const salida = new Set();
    hoja.getRange(2, 1, ultima - 1, 2).getDisplayValues().forEach(function(fila) {
      const termino = normalizar_(fila[1]);
      if (normalizar_(fila[0]).toUpperCase() === categoria && termino.length >= 3) salida.add(termino);
    });
    return Array.from(salida).sort(function(a, b) { return b.length - a.length; });
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

  function compradoresSimilares_(comprador, candidatos) {
    if (!comprador) return [];
    const compactoComprador = comprador.replace(/\s/g, '');
    const palabrasComprador = palabrasComprador_(comprador);
    const coincidencias = new Set();

    candidatos.forEach(function(candidato) {
      if (!candidato || candidato.length < 5) return;
      const compactoCandidato = candidato.replace(/\s/g, '');
      if (comprador.indexOf(candidato) !== -1 || candidato.indexOf(comprador) !== -1 || compactoComprador.indexOf(compactoCandidato) !== -1) {
        coincidencias.add(candidato);
        return;
      }

      const palabrasCandidato = palabrasComprador_(candidato);
      if (palabrasCandidato.length < 2 || palabrasComprador.length < 2) return;
      const palabrasEnComun = palabrasCandidato.filter(function(palabra) {
        return palabrasComprador.indexOf(palabra) !== -1;
      }).length;
      const coberturaCandidato = palabrasEnComun / palabrasCandidato.length;
      const jaccard = palabrasEnComun / new Set(palabrasCandidato.concat(palabrasComprador)).size;
      if (coberturaCandidato >= CONFIG.umbralSimilitudComprador || jaccard >= CONFIG.umbralSimilitudComprador) {
        coincidencias.add(candidato);
        return;
      }

      if (compactoCandidato.length >= 8 && compactoComprador.length >= 8 && Math.abs(compactoCandidato.length - compactoComprador.length) <= 2) {
        const similitudCaracteres = 1 - distanciaLevenshtein_(compactoComprador, compactoCandidato) / Math.max(compactoComprador.length, compactoCandidato.length);
        if (similitudCaracteres >= 0.9) coincidencias.add(candidato);
      }
    });

    return Array.from(coincidencias).sort();
  }

  function palabrasComprador_(texto) {
    return normalizar_(texto).split(' ').filter(function(palabra) {
      return palabra.length >= 3 && !CONFIG.palabrasIgnoradasComprador.has(palabra);
    });
  }

  function distanciaLevenshtein_(a, b) {
    let anterior = Array.from({ length: b.length + 1 }, function(_, indice) { return indice; });
    for (let i = 1; i <= a.length; i++) {
      const actual = [i];
      for (let j = 1; j <= b.length; j++) {
        actual[j] = a[i - 1] === b[j - 1]
          ? anterior[j - 1]
          : Math.min(anterior[j - 1] + 1, actual[j - 1] + 1, anterior[j] + 1);
      }
      anterior = actual;
    }
    return anterior[b.length];
  }

  function esNoIVDUtil_(termino) {
    return !CONFIG.ambiguosNoIVD.has(termino);
  }

  function esPharmaEspecifico_(termino) {
    return !CONFIG.ambiguosPharma.has(termino);
  }

  function esIVDUtil_(termino) {
    return !CONFIG.genericosIVD.has(termino);
  }

  function esCompradorIVDUtil_(termino) {
    return termino !== 'hospital' && termino !== 'clinica' && termino !== 'laboratori';
  }

  function coincide_(texto, conjunto) {
    return Array.from(conjunto).some(function(valor) { return (' ' + texto + ' ').indexOf(' ' + valor + ' ') !== -1; });
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escapar_(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function hojaDestino_() {
    const hoja = SpreadsheetApp.openById(CONFIG.idDestino).getSheetByName(CONFIG.hojaDestino);
    if (!hoja) throw new Error('No se encontró la hoja destino 2025.');
    return hoja;
  }

  function leerConteos_() {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty(CONFIG.propiedadConteos) || '{"IVD":0,"NO ES IVD":0,"PHARMA":0}');
  }

  function programarContinuacion_() {
    borrarTriggers_();
    ScriptApp.newTrigger('continuarClasificacionIVDHibrido2025').timeBased().after(CONFIG.minutosSiguienteLote * 60000).create();
  }

  function borrarTriggers_() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'continuarClasificacionIVDHibrido2025') ScriptApp.deleteTrigger(trigger);
    });
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

  return { iniciar: iniciar, continuar: continuar, diagnosticar: diagnosticar };
})();
