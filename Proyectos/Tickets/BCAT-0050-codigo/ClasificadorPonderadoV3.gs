/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Clasifica las importaciones de la hoja 2025 como IVD, NO ES IVD o PHARMA.
 * Lee B, D, F, G, H y T; escribe únicamente el resultado en V. Las reglas
 * proceden de los cuatro diccionarios y de la columna C: Fuerza.
 *
 * Validaciones para ejecutar clasificarIVDPonderadoV3():
 * 1) La hoja 2025 debe conservar B:T y V en sus posiciones actuales.
 * 2) Los diccionarios deben tener Categoría en A, Término en B y Fuerza en C.
 * 3) Fuerza debe ser FUERTE o DEBIL; vacía se interpreta como DEBIL.
 * 4) Debe existir la función validarConArchivoControl() en el proyecto.
 */

function clasificarIVDPonderadoV3() {
  if (!validarConArchivoControl()) return;
  return ClasificadorIVDPonderadoV3.iniciar();
}

function continuarClasificacionIVDPonderadoV3() {
  if (!validarConArchivoControl()) return;
  return ClasificadorIVDPonderadoV3.continuar();
}

function diagnosticarIVDPonderadoV3(numeroFila) {
  if (!validarConArchivoControl()) return;
  return ClasificadorIVDPonderadoV3.diagnosticar(numeroFila);
}

const ClasificadorIVDPonderadoV3 = (function() {
  const C = Object.freeze({
    prefijo: '[BCAT-0050-V3]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    idDestino: '1iDzirC_nfjzXadwa1yPEPA64ObVBt8ej69BJ0F6UGtw',
    hojaDestino: '2025',
    primeraFila: 2,
    primeraColumna: 2,
    columnas: 19,
    columnaSalida: 22,
    filasPorLote: 2500,
    maxMilisegundos: 240000,
    siguienteLoteMinutos: 1,
    maxRegex: 10000,
    cursor: 'BCAT_0050_V3_CURSOR',
    ultimaFila: 'BCAT_0050_V3_ULTIMA',
    conteos: 'BCAT_0050_V3_CONTEOS',
    hojas: Object.freeze([
      'KeyWordsDescriptionTraining (M)',
      'IrrelevantWordsTraining (M)',
      'KeyWordsBuyerTraining (M)',
      'IrrelevantWordsBuyerTraining (M)'
    ]),
    pesos: Object.freeze({
      ivdFuerte: 8,
      ivdDebil: 1,
      noIVDFuerte: 8,
      noIVDDebil: 1,
      pharmaFuerte: 100,
      pharmaDebil: 2,
      compradorFuerte: 4,
      compradorDebil: 1,
      partidaIVD: 2,
      marcaIVD: 2,
      shipperIVD: 3,
      minimoIVD: 7,
      minimoPharma: 7,
      ventaja: 2,
      maxTerminosPorGrupo: 3
    }),
    partidasIVD: ['3822', '300215', '300290', '300630'],
    pharmaDirecto: [
      'medicamento para uso humano', 'ocrevus', 'ocrelizumab', 'hemlibra', 'emicizumab',
      'kadcyla', 'perjeta', 'phesgo', 'avastin', 'herceptin', 'actemra', 'alecensa',
      'zelboraf', 'mabthera', 'evrysdi', 'pulmozyme', 'vabysmo', 'tecentriq',
      'trastuzumab', 'rituximab', 'tocilizumab', 'bevacizumab', 'pertuzumab',
      'atezolizumab', 'risdiplam', 'entrectinib', 'amoxicilina', 'ceftriaxona',
      'meropenem', 'vancomicina', 'phenobarbital', 'metotrexato', 'methotrexate'
    ],
    ivdDirecto: [
      'diagnostico in vitro', 'dispositivo para diagnostico in vitro', 'reactivo de diagnostico',
      'reactivos de diagnostico', 'prueba cualitativa in vitro', 'prueba cuantitativa in vitro',
      'test inmunologico in vitro', 'ceivd', 'ivdr'
    ],
    noIVDDirecto: [
      'maquina de dialisis', 'dializador', 'filtro dializador', 'hemodialisis',
      'blood tubing', 'lineas arteriovenosas', 'consultorio dental', 'sillon dental',
      'implante', 'osteosintesis', 'protesis', 'pegamento quirurgico', 'floseal',
      'tomografia', 'ecografia', 'resonancia magnetica', 'solucion de detergente',
      'detergente limpiador', 'agujas y cateteres', 'aguja', 'agujas', 'cateter',
      'cateteres', 'catheter', 'catheters', 'blood set', 'set de sangre'
    ],
    marcasIVD: new Set([
      'abbott', 'agappe', 'becton dickinson', 'bio rad', 'biomerieux', 'cepheid', 'dirui',
      'dymind', 'edan', 'euroimmun', 'genrui', 'human', 'lifotronic', 'maccura', 'mindray',
      'orgentec', 'sebia', 'siemens', 'snibe', 'sysmex', 'vircell', 'werfen', 'zybio',
      'yhlo', 'aesku', 'stago', 'keyu', 'wondfo', 'roche'
    ]),
    shippersIVD: new Set([
      'roche diagnostics', 'sysmex america', 'siemens healthineers', 'abbott',
      'becton dickinson', 'bio rad', 'biomerieux', 'euroimmun', 'mindray', 'snibe',
      'werfen', 'orgentec', 'molbio diagnostics', 'diagnostica stago', 'one lambda',
      'wondfo', 'keyu biological'
    ]),
    palabrasEmpresaIgnoradas: new Set([
      'sa', 's', 'a', 'cia', 'ltda', 'inc', 'corp', 'corporation', 'company', 'co',
      'de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'sociedad', 'anonima', 'limited'
    ])
  });

  function iniciar() {
    borrarTriggers_();
    const hoja = hojaDestino_();
    const props = PropertiesService.getScriptProperties();
    hoja.getRange(1, C.columnaSalida).setValue('Clasificación IVD');
    props.setProperty(C.cursor, String(C.primeraFila));
    props.setProperty(C.ultimaFila, String(hoja.getLastRow()));
    props.setProperty(C.conteos, JSON.stringify({ IVD: 0, 'NO ES IVD': 0, PHARMA: 0 }));
    return procesar_();
  }

  function continuar() {
    return procesar_();
  }

  function procesar_() {
    let bloqueo;
    try {
      bloqueo = LockService.getScriptLock();
      bloqueo.waitLock(30000);
      const props = PropertiesService.getScriptProperties();
      let cursor = Number(props.getProperty(C.cursor));
      const ultima = Number(props.getProperty(C.ultimaFila));
      if (!cursor || cursor > ultima) return finalizar_();

      const reglas = cargarReglas_();
      const hoja = hojaDestino_();
      const conteos = leerConteos_();
      const inicio = Date.now();
      const desde = cursor;
      while (cursor <= ultima && Date.now() - inicio < C.maxMilisegundos) {
        const hasta = Math.min(cursor + C.filasPorLote - 1, ultima);
        const total = hasta - cursor + 1;
        const filas = hoja.getRange(cursor, C.primeraColumna, total, C.columnas).getDisplayValues();
        const detalles = filas.map(function(fila) { return evaluar_(fila, reglas); });
        hoja.getRange(cursor, C.columnaSalida, total, 1)
          .setValues(detalles.map(function(d) { return [d.resultado]; })).setNumberFormat('@');
        detalles.forEach(function(d) { conteos[d.resultado]++; });
        cursor = hasta + 1;
        props.setProperty(C.cursor, String(cursor));
      }
      props.setProperty(C.conteos, JSON.stringify(conteos));
      Logger.log(C.prefijo + ' Lote procesado. | filas: ' + desde + '-' + (cursor - 1));
      if (cursor > ultima) return finalizar_();
      programarContinuacion_();
      return { estado: 'EN PROCESO', desdeFila: desde, hastaFila: cursor - 1, siguienteFila: cursor };
    } catch (error) {
      Logger.log(C.prefijo + ' ERROR. | ' + error.message);
      throw error;
    } finally {
      if (bloqueo && bloqueo.hasLock()) bloqueo.releaseLock();
    }
  }

  function diagnosticar(numeroFila) {
    const fila = Number(numeroFila);
    if (!Number.isInteger(fila) || fila < C.primeraFila) throw new Error('Indica una fila válida.');
    const datos = hojaDestino_().getRange(fila, C.primeraColumna, 1, C.columnas).getDisplayValues()[0];
    const detalle = evaluar_(datos, cargarReglas_());
    Logger.log(C.prefijo + ' Diagnóstico fila ' + fila + '. | ' + JSON.stringify(detalle));
    return detalle;
  }

  function evaluar_(fila, reglas) {
    const comprador = normalizar_(fila[0]);       // B
    const partida = String(fila[2] || '').replace(/[^0-9]/g, ''); // D
    const marca = normalizar_(fila[6]);           // H
    const descripcion = normalizar_([fila[4], fila[5], fila[6]].join(' ')); // F + G + H
    const shipper = normalizar_(fila[18]);        // T
    const puntos = { IVD: 0, 'NO ES IVD': 0, PHARMA: 0 };
    const evidencia = [];

    const pharmaDirecto = obtener_(descripcion, reglas.pharmaDirecto);
    if (pharmaDirecto.length) return detalle_('PHARMA', puntos, ['PHARMA directo: ' + pharmaDirecto.join(', ')]);

    // Una exclusión FUERTE y específica del diccionario manual prevalece sobre
    // marcas, partidas o términos IVD genéricos acumulados.
    const exclusionesNoIVD = obtener_(descripcion, reglas.noIVDDirecto)
      .concat(obtener_(descripcion, reglas.descripcion['NO ES IVD'].FUERTE))
      .filter(esExclusionEspecifica_);
    if (exclusionesNoIVD.length) {
      return detalle_('NO ES IVD', puntos, ['Exclusión NO ES IVD específica: ' + Array.from(new Set(exclusionesNoIVD)).join(', ')]);
    }

    sumar_(puntos, evidencia, 'IVD', obtener_(descripcion, reglas.ivdDirecto), C.pesos.ivdFuerte, 'IVD directo');
    sumar_(puntos, evidencia, 'NO ES IVD', obtener_(descripcion, reglas.noIVDDirecto), C.pesos.noIVDFuerte, 'NO ES IVD directo');
    puntuarTerminos_(puntos, evidencia, descripcion, reglas.descripcion);
    puntuarCompradores_(puntos, evidencia, comprador, reglas.compradores);

    if (C.partidasIVD.some(function(prefijo) { return partida.indexOf(prefijo) === 0; })) {
      agregar_(puntos, evidencia, 'IVD', C.pesos.partidaIVD, 'Partida compatible con IVD');
    }
    if (coincideConjunto_(marca, C.marcasIVD)) agregar_(puntos, evidencia, 'IVD', C.pesos.marcaIVD, 'Marca IVD');
    if (coincideConjunto_(shipper, C.shippersIVD)) agregar_(puntos, evidencia, 'IVD', C.pesos.shipperIVD, 'Fabricante IVD');

    return detalle_(decidir_(puntos), puntos, evidencia);
  }

  function puntuarTerminos_(puntos, evidencia, texto, grupos) {
    ['IVD', 'NO ES IVD', 'PHARMA'].forEach(function(categoria) {
      ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
        const terminos = obtener_(texto, grupos[categoria][fuerza]).slice(0, C.pesos.maxTerminosPorGrupo);
        if (!terminos.length) return;
        const peso = pesoTermino_(categoria, fuerza);
        agregar_(puntos, evidencia, categoria, terminos.length * peso, categoria + ' ' + fuerza + ': ' + terminos.join(', '));
      });
    });
  }

  function puntuarCompradores_(puntos, evidencia, comprador, grupos) {
    ['IVD', 'NO ES IVD', 'PHARMA'].forEach(function(categoria) {
      ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
        const encontrados = compradoresSimilares_(comprador, grupos[categoria][fuerza]);
        if (!encontrados.length) return;
        const peso = fuerza === 'FUERTE' ? C.pesos.compradorFuerte : C.pesos.compradorDebil;
        agregar_(puntos, evidencia, categoria, peso, 'Comprador ' + categoria + ' ' + fuerza + ': ' + encontrados[0]);
      });
    });
  }

  function pesoTermino_(categoria, fuerza) {
    if (categoria === 'IVD') return fuerza === 'FUERTE' ? C.pesos.ivdFuerte : C.pesos.ivdDebil;
    if (categoria === 'NO ES IVD') return fuerza === 'FUERTE' ? C.pesos.noIVDFuerte : C.pesos.noIVDDebil;
    return fuerza === 'FUERTE' ? C.pesos.pharmaFuerte : C.pesos.pharmaDebil;
  }

  function decidir_(puntos) {
    if (puntos.PHARMA >= C.pesos.pharmaFuerte ||
        (puntos.PHARMA >= C.pesos.minimoPharma && puntos.PHARMA >= puntos.IVD + C.pesos.ventaja && puntos.PHARMA >= puntos['NO ES IVD'] + C.pesos.ventaja)) return 'PHARMA';
    if (puntos.IVD >= C.pesos.minimoIVD && puntos.IVD >= puntos['NO ES IVD'] + C.pesos.ventaja) return 'IVD';
    return 'NO ES IVD';
  }

  function cargarReglas_() {
    const libro = SpreadsheetApp.openById(C.idDiccionario);
    const salida = { descripcion: crearGrupos_(), compradores: crearGrupos_() };
    C.hojas.forEach(function(nombre) {
      const hoja = libro.getSheetByName(nombre);
      if (!hoja || hoja.getLastRow() < 2) return;
      const esComprador = nombre.indexOf('Buyer') !== -1;
      hoja.getRange(2, 1, hoja.getLastRow() - 1, 3).getDisplayValues().forEach(function(fila) {
        const categoria = categoria_(fila[0]);
        const termino = normalizar_(fila[1]);
        const fuerza = fuerza_(fila[2]);
        if (!categoria || termino.length < 3) return;
        (esComprador ? salida.compradores : salida.descripcion)[categoria][fuerza].add(termino);
      });
    });
    ['descripcion', 'compradores'].forEach(function(tipo) {
      ['IVD', 'NO ES IVD', 'PHARMA'].forEach(function(categoria) {
        ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
          const terminos = Array.from(salida[tipo][categoria][fuerza]).sort(function(a, b) { return b.length - a.length; });
          salida[tipo][categoria][fuerza] = tipo === 'descripcion' ? compilar_(terminos) : terminos;
        });
      });
    });
    salida.pharmaDirecto = compilar_(C.pharmaDirecto);
    salida.ivdDirecto = compilar_(C.ivdDirecto);
    salida.noIVDDirecto = compilar_(C.noIVDDirecto);
    return salida;
  }

  function crearGrupos_() {
    return {
      IVD: { FUERTE: new Set(), DEBIL: new Set() },
      'NO ES IVD': { FUERTE: new Set(), DEBIL: new Set() },
      PHARMA: { FUERTE: new Set(), DEBIL: new Set() }
    };
  }

  function categoria_(valor) {
    const texto = normalizar_(valor).toUpperCase();
    if (texto === 'IVD') return 'IVD';
    if (texto === 'PHARMA') return 'PHARMA';
    if (texto === 'NO ES IVD' || texto === 'NO IVD') return 'NO ES IVD';
    return '';
  }

  function fuerza_(valor) {
    return normalizar_(valor).toUpperCase() === 'FUERTE' ? 'FUERTE' : 'DEBIL';
  }

  function compilar_(terminos) {
    const grupos = [];
    let grupo = [];
    let longitud = 0;
    Array.from(new Set(terminos)).forEach(function(termino) {
      const seguro = escapar_(termino);
      if (grupo.length && longitud + seguro.length + 1 > C.maxRegex) {
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
      let coincidencia;
      while ((coincidencia = patron.exec(texto)) !== null) encontrados.add(coincidencia[1]);
      patron.lastIndex = 0;
    });
    return Array.from(encontrados).sort();
  }

  function compradoresSimilares_(comprador, candidatos) {
    if (!comprador) return [];
    const palabras = palabrasEmpresa_(comprador);
    const compacto = comprador.replace(/\s/g, '');
    return candidatos.filter(function(candidato) {
      const candidatoCompacto = candidato.replace(/\s/g, '');
      if (comprador.indexOf(candidato) !== -1 || candidato.indexOf(comprador) !== -1 || compacto.indexOf(candidatoCompacto) !== -1) return true;
      const otras = palabrasEmpresa_(candidato);
      if (palabras.length < 2 || otras.length < 2) return false;
      const comunes = otras.filter(function(palabra) { return palabras.indexOf(palabra) !== -1; }).length;
      return comunes / otras.length >= 0.8;
    });
  }

  function palabrasEmpresa_(texto) {
    return normalizar_(texto).split(' ').filter(function(palabra) {
      return palabra.length >= 3 && !C.palabrasEmpresaIgnoradas.has(palabra);
    });
  }

  function coincideConjunto_(texto, conjunto) {
    return Array.from(conjunto).some(function(valor) { return (' ' + texto + ' ').indexOf(' ' + valor + ' ') !== -1; });
  }

  function esExclusionEspecifica_(termino) {
    const palabras = termino.split(' ').filter(Boolean);
    return palabras.length >= 2 && termino.length >= 10;
  }

  function sumar_(puntos, evidencia, categoria, coincidencias, peso, etiqueta) {
    const usadas = coincidencias.slice(0, C.pesos.maxTerminosPorGrupo);
    if (!usadas.length) return;
    agregar_(puntos, evidencia, categoria, usadas.length * peso, etiqueta + ': ' + usadas.join(', '));
  }

  function agregar_(puntos, evidencia, categoria, valor, texto) {
    puntos[categoria] += valor;
    evidencia.push(texto + ' +' + valor);
  }

  function detalle_(resultado, puntos, evidencia) {
    return { resultado: resultado, puntajes: puntos, evidencia: evidencia };
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escapar_(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function hojaDestino_() {
    const hoja = SpreadsheetApp.openById(C.idDestino).getSheetByName(C.hojaDestino);
    if (!hoja) throw new Error('No se encontró la hoja destino 2025.');
    return hoja;
  }

  function leerConteos_() {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty(C.conteos) || '{"IVD":0,"NO ES IVD":0,"PHARMA":0}');
  }

  function programarContinuacion_() {
    borrarTriggers_();
    ScriptApp.newTrigger('continuarClasificacionIVDPonderadoV3').timeBased().after(C.siguienteLoteMinutos * 60000).create();
  }

  function borrarTriggers_() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'continuarClasificacionIVDPonderadoV3') ScriptApp.deleteTrigger(trigger);
    });
  }

  function finalizar_() {
    const conteos = leerConteos_();
    borrarTriggers_();
    const props = PropertiesService.getScriptProperties();
    [C.cursor, C.ultimaFila, C.conteos].forEach(function(nombre) { props.deleteProperty(nombre); });
    Logger.log(C.prefijo + ' Finalizado. | ' + JSON.stringify(conteos));
    return conteos;
  }

  return { iniciar: iniciar, continuar: continuar, diagnosticar: diagnosticar };
})();
