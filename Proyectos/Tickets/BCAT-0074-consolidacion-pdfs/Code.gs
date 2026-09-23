function consolidarPDFsEnDoc() {
  const CONFIG = Object.freeze({
    hojaPlantilla: 'Plantilla',
    documentoDestinoId: '1mjd9o4gzIRop7zMAFdophHIqQQL1PUH146JcPQI417E',
    hojaControl: '_Control OCR PDFs',
    propiedadCarpetaCache: 'BCAT_0074_CARPETA_CACHE_OCR_ID',
    nombreCarpetaCache: 'BCAT-0074 - Cache OCR PDFs',
    columnaEnlaces: 1,
    primeraFila: 2,
    idiomaOcr: 'es',
    maxIntentosOcr: 5,
    esperaOcrMs: 1200
  });

  const log = (mensaje, detalle) => Logger.log('[BCAT-0074] ' + mensaje + (detalle ? ' | ' + detalle : ''));
  const texto = valor => String(valor == null ? '' : valor).trim();
  const esVacio = valor => texto(valor) === '';

  const obtenerEnlaceDesdeCelda = (richText, formula, valor) => {
    if (richText) {
      const enlaceDirecto = richText.getLinkUrl();
      if (enlaceDirecto) return enlaceDirecto;
      const runConEnlace = richText.getRuns().find(run => run.getLinkUrl());
      if (runConEnlace) return runConEnlace.getLinkUrl();
    }
    const formulaMatch = texto(formula).match(/^=HYPERLINK\(\s*"([^"]+)"/i);
    if (formulaMatch) return formulaMatch[1];
    const urlMatch = texto(valor).match(/https?:\/\/[^\s"'<>]+/i);
    return urlMatch ? urlMatch[0] : '';
  };

  const extraerIdCarpeta = enlace => {
    const url = texto(enlace);
    const patrones = [/\/folders\/([a-zA-Z0-9_-]+)/i, /[?&]id=([a-zA-Z0-9_-]+)/i];
    for (let i = 0; i < patrones.length; i++) {
      const match = url.match(patrones[i]);
      if (match) return match[1];
    }
    return '';
  };

  const leerCarpetasDesdePlantilla = hoja => {
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < CONFIG.primeraFila) return [];
    const cantidad = ultimaFila - CONFIG.primeraFila + 1;
    const rango = hoja.getRange(CONFIG.primeraFila, CONFIG.columnaEnlaces, cantidad, 1);
    const ricos = rango.getRichTextValues();
    const formulas = rango.getFormulas();
    const valores = rango.getDisplayValues();
    const carpetas = [];
    const idsVistos = new Set();

    for (let i = 0; i < cantidad; i++) {
      const fila = CONFIG.primeraFila + i;
      const enlace = obtenerEnlaceDesdeCelda(ricos[i][0], formulas[i][0], valores[i][0]);
      if (!enlace) {
        if (!esVacio(valores[i][0])) log('Fila omitida: no se encontró enlace válido.', 'fila: ' + fila);
        continue;
      }
      const folderId = extraerIdCarpeta(enlace);
      if (!folderId) {
        log('Fila omitida: el enlace no contiene un ID de carpeta.', 'fila: ' + fila);
        continue;
      }
      if (idsVistos.has(folderId)) {
        log('Carpeta repetida en Plantilla; se omite.', 'fila: ' + fila);
        continue;
      }
      idsVistos.add(folderId);
      carpetas.push({ fila: fila, id: folderId });
    }
    return carpetas;
  };

  const obtenerPdfs = carpeta => {
    const iterador = carpeta.getFilesByType(MimeType.PDF);
    const pdfs = [];
    while (iterador.hasNext()) pdfs.push(iterador.next());
    return pdfs.sort((a, b) => a.getName().localeCompare(b.getName()));
  };

  const obtenerHojaControl = libro => {
    let hoja = libro.getSheetByName(CONFIG.hojaControl);
    if (!hoja) {
      hoja = libro.insertSheet(CONFIG.hojaControl);
      hoja.getRange(1, 1, 1, 6).setValues([[
        'ID archivo fuente', 'Nombre PDF', 'Última modificación fuente',
        'ID documento OCR', 'Último uso', 'Estado'
      ]]);
      hoja.hideSheet();
      log('Se creó la hoja técnica de caché OCR.');
    }
    return hoja;
  };

  const obtenerCarpetaCache = () => {
    const propiedades = PropertiesService.getScriptProperties();
    const idExistente = propiedades.getProperty(CONFIG.propiedadCarpetaCache);
    if (idExistente) {
      try { return DriveApp.getFolderById(idExistente); } catch (error) {
        log('La carpeta de caché anterior no está disponible; se creará una nueva.');
      }
    }
    const carpeta = DriveApp.createFolder(CONFIG.nombreCarpetaCache);
    propiedades.setProperty(CONFIG.propiedadCarpetaCache, carpeta.getId());
    log('Se creó la carpeta de caché OCR.', 'nombre: ' + carpeta.getName());
    return carpeta;
  };

  const cargarCache = hojaControl => {
    const ultimaFila = hojaControl.getLastRow();
    const porId = new Map();
    if (ultimaFila < 2) return porId;
    hojaControl.getRange(2, 1, ultimaFila - 1, 6).getValues().forEach((fila, indice) => {
      const sourceId = texto(fila[0]);
      if (!sourceId) return;
      porId.set(sourceId, {
        fila: indice + 2,
        nombre: texto(fila[1]),
        modificadoMs: Number(fila[2]) || 0,
        cacheDocId: texto(fila[3]),
        estado: texto(fila[5])
      });
    });
    return porId;
  };

  const leerDocumentoCache = cacheDocId => {
    const archivo = DriveApp.getFileById(cacheDocId);
    if (archivo.isTrashed()) throw new Error('El documento de caché está en la papelera.');
    return DocumentApp.openById(cacheDocId).getBody().getText();
  };

  const crearCacheOcr = (archivoPdf, carpetaCache) => {
    let temporalId = '';
    try {
      const recurso = { title: 'OCR - ' + archivoPdf.getName().replace(/\.pdf$/i, '') };
      temporalId = Drive.Files.insert(recurso, archivoPdf.getBlob(), {
        convert: true,
        ocr: true,
        ocrLanguage: CONFIG.idiomaOcr
      }).id;

      let ultimoError = '';
      for (let intento = 1; intento <= CONFIG.maxIntentosOcr; intento++) {
        try {
          Utilities.sleep(CONFIG.esperaOcrMs);
          const textoOcr = DocumentApp.openById(temporalId).getBody().getText();
          DriveApp.getFileById(temporalId).moveTo(carpetaCache);
          return { id: temporalId, texto: textoOcr };
        } catch (error) {
          ultimoError = error.message;
          log('OCR aún no disponible; se reintentará.', 'archivo: ' + archivoPdf.getName() + ' | intento: ' + intento);
        }
      }
      throw new Error('No fue posible abrir el resultado OCR. ' + ultimoError);
    } catch (error) {
      if (temporalId) {
        try { DriveApp.getFileById(temporalId).setTrashed(true); } catch (ignored) {}
      }
      throw error;
    }
  };

  const guardarRegistroCache = (hojaControl, registro, archivoPdf, cacheDocId, estado) => {
    const valores = [[
      archivoPdf.getId(),
      archivoPdf.getName(),
      archivoPdf.getLastUpdated().getTime(),
      cacheDocId || '',
      new Date(),
      estado
    ]];
    if (registro && registro.fila) hojaControl.getRange(registro.fila, 1, 1, 6).setValues(valores);
    else hojaControl.getRange(hojaControl.getLastRow() + 1, 1, 1, 6).setValues(valores);
  };

  const obtenerTextoPdf = (archivoPdf, cache, hojaControl, carpetaCache) => {
    const registro = cache.get(archivoPdf.getId());
    const modificadoMs = archivoPdf.getLastUpdated().getTime();
    if (registro && registro.nombre === archivoPdf.getName() &&
        registro.modificadoMs === modificadoMs && registro.cacheDocId) {
      try {
        const textoCache = leerDocumentoCache(registro.cacheDocId);
        guardarRegistroCache(hojaControl, registro, archivoPdf, registro.cacheDocId, 'REUTILIZADO');
        log('PDF reutilizado desde caché.', 'nombre: ' + archivoPdf.getName());
        return { texto: textoCache, reutilizado: true };
      } catch (error) {
        log('Caché no disponible; se ejecutará OCR nuevamente.', 'nombre: ' + archivoPdf.getName());
      }
    }

    const resultadoOcr = crearCacheOcr(archivoPdf, carpetaCache);
    guardarRegistroCache(hojaControl, registro, archivoPdf, resultadoOcr.id, 'OCR NUEVO');
    if (registro && registro.cacheDocId && registro.cacheDocId !== resultadoOcr.id) {
      try { DriveApp.getFileById(registro.cacheDocId).setTrashed(true); } catch (ignored) {}
    }
    cache.set(archivoPdf.getId(), {
      fila: registro && registro.fila ? registro.fila : hojaControl.getLastRow(),
      nombre: archivoPdf.getName(),
      modificadoMs: modificadoMs,
      cacheDocId: resultadoOcr.id,
      estado: 'OCR NUEVO'
    });
    log('PDF procesado con OCR nuevo.', 'nombre: ' + archivoPdf.getName());
    return { texto: resultadoOcr.texto, reutilizado: false };
  };

  const escribirDocumentoFinal = (documento, documentos, carpetasRevisadas) => {
    const cuerpo = documento.getBody();
    cuerpo.clear();
    const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    cuerpo.appendParagraph('Consolidación de PDFs').setHeading(DocumentApp.ParagraphHeading.TITLE);
    cuerpo.appendParagraph('Fecha de ejecución: ' + fecha).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    cuerpo.appendParagraph('Carpetas revisadas: ' + carpetasRevisadas).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    cuerpo.appendParagraph('PDFs únicos incorporados: ' + documentos.length).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    cuerpo.appendParagraph('Archivos incorporados:').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (documentos.length) documentos.forEach(item => cuerpo.appendListItem(item.nombre));
    else cuerpo.appendParagraph('No se encontraron PDFs para consolidar.');
    cuerpo.appendPageBreak();
    documentos.forEach((item, indice) => {
      cuerpo.appendParagraph(item.nombre).setHeading(DocumentApp.ParagraphHeading.HEADING1);
      cuerpo.appendParagraph(item.texto || '[El PDF no contiene texto reconocible por OCR.]');
      if (indice < documentos.length - 1) cuerpo.appendPageBreak();
    });
    documento.saveAndClose();
  };

  const ejecutar = () => {
    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(30000);
    try {
      log('Iniciando consolidación de PDFs.');
      const libro = SpreadsheetApp.getActiveSpreadsheet();
      const hoja = libro.getSheetByName(CONFIG.hojaPlantilla);
      if (!hoja) throw new Error('No se encontró la hoja "' + CONFIG.hojaPlantilla + '".');
      const hojaControl = obtenerHojaControl(libro);
      const carpetaCache = obtenerCarpetaCache();
      const cache = cargarCache(hojaControl);
      const carpetas = leerCarpetasDesdePlantilla(hoja);
      const nombresVistos = new Set();
      const documentos = [];
      let nuevos = 0;
      let reutilizados = 0;

      log('Carpetas encontradas en Plantilla.', 'cantidad: ' + carpetas.length);
      carpetas.forEach(referencia => {
        try {
          const carpeta = DriveApp.getFolderById(referencia.id);
          const pdfs = obtenerPdfs(carpeta);
          log('Carpeta revisada.', 'fila: ' + referencia.fila + ' | nombre: ' + carpeta.getName() + ' | PDFs: ' + pdfs.length);
          pdfs.forEach(pdf => {
            const nombre = pdf.getName();
            if (nombresVistos.has(nombre)) {
              log('PDF omitido por nombre duplicado.', 'nombre: ' + nombre);
              return;
            }
            nombresVistos.add(nombre);
            try {
              const resultado = obtenerTextoPdf(pdf, cache, hojaControl, carpetaCache);
              documentos.push({ nombre: nombre, texto: resultado.texto });
              if (resultado.reutilizado) reutilizados++;
              else nuevos++;
            } catch (error) {
              log('PDF omitido por error OCR.', 'nombre: ' + nombre + ' | motivo: ' + error.message);
            }
          });
        } catch (error) {
          log('Carpeta omitida por error.', 'fila: ' + referencia.fila + ' | motivo: ' + error.message);
        }
      });

      escribirDocumentoFinal(DocumentApp.openById(CONFIG.documentoDestinoId), documentos, carpetas.length);
      log('Consolidación terminada.', 'PDFs: ' + documentos.length + ' | OCR nuevo: ' + nuevos + ' | reutilizados: ' + reutilizados);
      return { carpetas: carpetas.length, pdfs: documentos.length, nuevos: nuevos, reutilizados: reutilizados };
    } catch (error) {
      log('ERROR en la consolidación.', error.message);
      throw error;
    } finally {
      bloqueo.releaseLock();
    }
  };

  return ejecutar();
}
