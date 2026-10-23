/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Clasifica productos en AA con reglas fuzzy, únicamente cuando AB está vacía.
 *
 * Validaciones para ejecutar clasificarDatosFuzzy():
 * 1) La hoja Data cobus 2026 PE debe existir en el archivo de datos.
 * 2) Las hojas de diccionario configuradas deben existir en el archivo diccionario.
 * 3) La marca debe estar en la columna M; la salida está en AA y el bloqueo en AB.
 * 4) La hoja update del archivo de control debe tener B2 con el valor update.
 */

const BCAT0016_CLASIFICADOR_FUZZY = (() => {
  const CONFIG = Object.freeze({
    prefijoLog: '[BCAT-0016]',
    idData: '1GGfKpKWTjSj28WCiH8ILPvwTqhyLJP27b5-XZ9OA0GY',
    idDiccionario: '1LR2l596TWoDO0pbTlDU3O8K7C-VYP2mdAQu-ecUI4z8',
    nombreHojaData: 'Data cobus 2026 PE',
    indiceBrand: 12,
    columnaSalida: 27,
    columnaBloqueo: 28
  });

  const clasificar = () => {
    Logger.log(CONFIG.prefijoLog + ' Inicio de clasificación fuzzy.');
    const spreadsheetDict = SpreadsheetApp.openById(CONFIG.idDiccionario);
    const limpiarTexto_ = texto => String(texto == null ? '' : texto).toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    const extraerDiccionario_ = nombreHoja => {
      const sheet = spreadsheetDict.getSheetByName(nombreHoja);
      if (!sheet) throw new Error('No se encontró la hoja de diccionario: ' + nombreHoja);
      const keywords = [];
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const fraseLimpia = limpiarTexto_(data[i][1]);
        if (!fraseLimpia) continue;
        const palabras = fraseLimpia.split(' ');
        let puntos = palabras.length;
        if (palabras.length >= 2) puntos = palabras.length * 50;
        if (fraseLimpia.length >= 15) puntos += 10000;
        keywords.push({ fraseLimpia: fraseLimpia, palabras: palabras, puntos: puntos });
      }
      return keywords.sort((a, b) => b.puntos - a.puntos);
    };

    Logger.log(CONFIG.prefijoLog + ' Cargando y normalizando diccionarios.');
    const ivdKeywords = extraerDiccionario_('KeyWordsDescriptionTraining (M)');
    const noIvdKeywords = extraerDiccionario_('IrrelevantWordsTraining (M)');
    const pharmaKeywords = extraerDiccionario_('pharmaWordsTraining (M)');
    Logger.log(CONFIG.prefijoLog + ' Diccionarios cargados. | IVD: ' + ivdKeywords.length + ' | NO IVD: ' + noIvdKeywords.length + ' | PHARMA: ' + pharmaKeywords.length);

    const spreadsheetData = SpreadsheetApp.openById(CONFIG.idData);
    const sheetData = spreadsheetData.getSheetByName(CONFIG.nombreHojaData);
    if (!sheetData) throw new Error('No se encontró la hoja de datos: ' + CONFIG.nombreHojaData);
    const ultimaFila = sheetData.getLastRow();
    if (ultimaFila < 2) throw new Error('No existen filas de datos para clasificar.');

    const valoresDatos = sheetData.getRange(1, 1, ultimaFila, 20).getValues();
    // Se lee AA y AB: AA se conserva intacta cuando AB contiene un valor.
    const valoresSalidaYBloqueo = sheetData.getRange(
      1,
      CONFIG.columnaSalida,
      ultimaFila,
      CONFIG.columnaBloqueo - CONFIG.columnaSalida + 1
    ).getValues();
    const regexPharma = /\b\w+(MAB|NIB)\b/i;
    const stats = { pharma: 0, no_ivd: 0, ivd: 0, empates: 0, sin_clasificar: 0, omitidas_por_ab: 0 };

    const evaluarPuntajeMaximo_ = (textoFila, diccionario) => {
      const textoComparar = ' ' + textoFila + ' ';
      for (let i = 0; i < diccionario.length; i++) {
        const kw = diccionario[i];
        if (textoComparar.includes(' ' + kw.fraseLimpia + ' ')) return kw.puntos;
        if (kw.palabras.length >= 3) {
          let encontradas = 0;
          for (let j = 0; j < kw.palabras.length; j++) {
            if (textoComparar.includes(' ' + kw.palabras[j] + ' ')) encontradas++;
          }
          if (encontradas / kw.palabras.length >= 0.80) return kw.puntos;
        }
      }
      return 0;
    };

    const frasesIvd = [
      'REACTIVO PARA USO EN LABORATORIO', 'REACTIVOS DE DIAGNOSTICO IN VITRO',
      'USADO EN DIAGNOSTICO IN VITRO', 'REACTIVO DE DIAGNOSTICO',
      'REACTIVO PARA LABORATORIO', 'USADO PARA DIAGNOSTICO IN VITRO',
      'REACTIVOS DE DIAGNOSTICO EXTRANJERO DE USO IN VITRO',
      'REACTIVOS USADOS EN DIAGNOSTICO IN VITRO', 'REACTIVOS DIAGNOSTICO IN VITRO',
      'CONTROL DE EQUIPO DE DIAGNOSTICO IN VITRO', 'TIPO: REACTIVO',
      'USO: LABORATORIO DE BIOLOGIA MOLECULAR', 'USO: SOLO EN LABORATORIO DE INVESTIGACION',
      'PARA USO EN LABORATORIO', 'REACTIVO, QIAGEN, S/M', 'CONTROL DE LA CALIDAD',
      'USO EN LABORATORIO', 'VITRO PARA LA DETERMINACI', 'REACTIVOS PARA ANALISIS',
      'DIAGNOSTICO IN VITRO', 'REACTIVO DE LABORATORIO',
      'REACTIVOS DE DIAGNOSTICO DE USO IN VITRO EXTRANJERO', 'LOTTO',
      'CALIBRADOR PARA REACTIVO', 'CONTROL PARA REACTIVO',
      'REACTIVOS DE DIAGNOSTICO DE LABORATORIO'
    ].map(limpiarTexto_);

    Logger.log(CONFIG.prefijoLog + ' Iniciando clasificación por puntaje máximo.');
    // null significa: AB tiene datos y esa celda AA no debe escribirse.
    const resultados = [];

    for (let i = 1; i < valoresDatos.length; i++) {
      if (i % 5000 === 0) Logger.log(CONFIG.prefijoLog + ' Procesando fila ' + (i + 1) + ' de ' + ultimaFila + '.');

      if (String(valoresSalidaYBloqueo[i][1] == null ? '' : valoresSalidaYBloqueo[i][1]).trim() !== '') {
        resultados.push(null);
        stats.omitidas_por_ab++;
        continue;
      }

      const filaActual = valoresDatos[i];
      const textoOriginalUnido = filaActual.join(' ').toUpperCase();
      const textoFilaLimpio = limpiarTexto_(textoOriginalUnido);
      let clasificacion = 'SIN CLASIFICAR';

      if (!textoFilaLimpio) {
        resultados.push(['']);
        continue;
      }

      const contieneFraseIvd = frasesIvd.some(frase => textoFilaLimpio.includes(frase));
      const contieneLote = /\bLOTE?\b/.test(textoOriginalUnido);
      if (contieneFraseIvd || contieneLote) {
        resultados.push(['IVD']);
        stats.ivd++;
        continue;
      }

      let scorePharma = evaluarPuntajeMaximo_(textoFilaLimpio, pharmaKeywords);
      if (regexPharma.test(textoFilaLimpio)) scorePharma = Math.max(scorePharma, 10000);
      const scoreIvd = evaluarPuntajeMaximo_(textoFilaLimpio, ivdKeywords);
      const scoreNoIvd = evaluarPuntajeMaximo_(textoFilaLimpio, noIvdKeywords);
      const marcaLimpia = limpiarTexto_(filaActual[CONFIG.indiceBrand] || '');
      const esRoche = marcaLimpia.includes('ROCHE');
      const esNoMarcaIvd = marcaLimpia === 'NO ES MARCA IVD';

      if (esNoMarcaIvd) { clasificacion = 'NO ES IVD'; stats.no_ivd++; }
      else if (scorePharma > 0 && esRoche) { clasificacion = 'PHARMA'; stats.pharma++; }
      else if (scoreIvd > scoreNoIvd) { clasificacion = 'IVD'; stats.ivd++; }
      else if (scoreNoIvd > scoreIvd) { clasificacion = 'NO ES IVD'; stats.no_ivd++; }
      else if (scoreIvd > 0 && scoreIvd === scoreNoIvd) { clasificacion = 'EMPATE - REVISAR'; stats.empates++; }
      else stats.sin_clasificar++;
      resultados.push([clasificacion]);
    }

    Logger.log(CONFIG.prefijoLog + ' Análisis completado. Guardando únicamente AA donde AB está vacía.');
    guardarResultados_(sheetData, resultados);
    sheetData.getRange('AA1').setValue('CLASIFICACIÓN_BOT');
    Logger.log(CONFIG.prefijoLog + ' Resumen. | PHARMA: ' + stats.pharma + ' | IVD: ' + stats.ivd + ' | NO IVD: ' + stats.no_ivd + ' | EMPATES: ' + stats.empates + ' | SIN CLASIFICAR: ' + stats.sin_clasificar + ' | OMITIDAS AB: ' + stats.omitidas_por_ab);
    return stats;
  };

  const guardarResultados_ = (hoja, resultados) => {
    let inicioLote = 0;
    let lote = [];
    const guardarLote = () => {
      if (!lote.length) return;
      hoja.getRange(inicioLote + 2, CONFIG.columnaSalida, lote.length, 1).setValues(lote).setNumberFormat('@');
      lote = [];
    };
    resultados.forEach((resultado, indice) => {
      if (resultado === null) {
        guardarLote();
        return;
      }
      if (!lote.length) inicioLote = indice;
      lote.push(resultado);
    });
    guardarLote();
  };

  return { clasificar: clasificar };
})();

function clasificarDatosFuzzy() {
  if (!validarConArchivoControl()) return;
  return BCAT0016_CLASIFICADOR_FUZZY.clasificar();
}

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
