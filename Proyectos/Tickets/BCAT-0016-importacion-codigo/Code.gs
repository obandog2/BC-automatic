/*
  Programado por: Gabriela Obando

  ¿Qué hace?
  Descarga la exportación CPS EC enviada por correo, la agrega sin duplicados
  a la hoja 2026 CPS EC y conserva la fecha de última actualización.

  Validaciones para ejecutar importarArchivo_CPS_EC():
  1) Hoja "2026 CPS EC" existente en el archivo configurado.
  2) Correo en bandeja de entrada con asunto que contenga "2026 CPS EC".
  3) Correo con enlace de descarga válido a CSV, XLS, XLSX o ZIP.
  4) Archivo de origen con 92 columnas de datos, desde A hasta CN.
*/
function importarArchivo_CPS_EC() {
  const CONFIG = Object.freeze({
    etiqueta: 'CPS EC',
    spreadsheetId: '18owZa7X4dh1keiH-0t0iKyJkHUh6VeX3QcgBAvEHcS4',
    hojaDatos: '2026 CPS EC',
    asuntoCorreo: '2026 CPS EC',
    columnasDatos: 92, // A:CN. CO1 queda reservada para la última actualización.
    primeraFilaDatos: 2,
    celdaUltimaActualizacion: 'CO1',
    hojaControl: '_Control Importaciones CPS EC',
    prefijoPropiedades: 'CPS_EC',
    versionIndice: 'v3-encapsulado-92-columnas',
    lote: 500,
    maxMsPreparacion: 250000
  });

  const log = (mensaje, detalle) => Logger.log('[' + CONFIG.etiqueta + '] ' + mensaje + (detalle ? ' | ' + detalle : ''));
  const vacio = valor => valor === '' || valor === null || valor === undefined;
  const normalizarTexto = valor => String(valor == null ? '' : valor).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const clave = nombre => CONFIG.prefijoPropiedades + '_' + nombre;

  const obtenerHojaDatos = () => {
    const libro = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const hoja = libro.getSheetByName(CONFIG.hojaDatos);
    if (!hoja) throw new Error('No se encontró la hoja destino "' + CONFIG.hojaDatos + '".');
    return hoja;
  };
  const obtenerHojaControl = libro => {
    let hoja = libro.getSheetByName(CONFIG.hojaControl);
    if (!hoja) {
      hoja = libro.insertSheet(CONFIG.hojaControl);
      hoja.getRange(1, 1, 1, 3).setValues([['Huella', 'Fila destino', 'Fecha de registro']]);
      hoja.hideSheet();
      log('Se creó la hoja técnica de control.');
    }
    return hoja;
  };
  const huellaFila = fila => {
    const contenido = fila.map(valor => {
      if (valor instanceof Date) return 'fecha:' + valor.getTime();
      if (typeof valor === 'number') return 'numero:' + String(valor);
      if (typeof valor === 'boolean') return 'booleano:' + String(valor);
      return 'texto:' + normalizarTexto(valor);
    }).join('\u001F');
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, contenido)
      .map(byte => ('0' + (byte & 0xff).toString(16)).slice(-2)).join('');
  };
  const agregarHuellas = (hoja, filas) => {
    if (filas.length) hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 3).setValues(filas);
  };
  const obtenerHuellas = hoja => {
    const ultima = hoja.getLastRow();
    return ultima < 2 ? new Set() : new Set(hoja.getRange(2, 1, ultima - 1, 1).getDisplayValues().flat().filter(Boolean));
  };
  const reiniciarIndice = hoja => {
    hoja.clearContents();
    hoja.getRange(1, 1, 1, 3).setValues([['Huella', 'Fila destino', 'Fecha de registro']]);
    const propiedades = PropertiesService.getScriptProperties();
    ['INDICE_INICIALIZADO', 'CURSOR', 'FILA_OBJETIVO'].forEach(nombre => propiedades.deleteProperty(clave(nombre)));
  };
  const prepararIndice = (hojaDatos, hojaControl) => {
    const propiedades = PropertiesService.getScriptProperties();
    const version = propiedades.getProperty(clave('VERSION_INDICE'));
    if (version !== CONFIG.versionIndice) {
      log('Se detectó un índice anterior y se reconstruirá automáticamente.');
      reiniciarIndice(hojaControl);
      propiedades.setProperty(clave('VERSION_INDICE'), CONFIG.versionIndice);
    }
    if (propiedades.getProperty(clave('INDICE_INICIALIZADO')) === 'SI') return true;
    const objetivo = Number(propiedades.getProperty(clave('FILA_OBJETIVO')) || hojaDatos.getLastRow());
    let cursor = Number(propiedades.getProperty(clave('CURSOR')) || CONFIG.primeraFilaDatos);
    propiedades.setProperty(clave('FILA_OBJETIVO'), String(objetivo));
    const inicio = Date.now();
    log('Preparando el índice histórico antes de importar.', 'desdeFila: ' + cursor + ' | hastaFila: ' + objetivo);
    while (cursor <= objetivo && Date.now() - inicio < CONFIG.maxMsPreparacion) {
      const cantidad = Math.min(CONFIG.lote, objetivo - cursor + 1);
      const valores = hojaDatos.getRange(cursor, 1, cantidad, CONFIG.columnasDatos).getValues();
      const registros = [];
      valores.forEach((fila, indice) => {
        if (!fila.every(vacio)) registros.push([huellaFila(fila), cursor + indice, new Date()]);
      });
      agregarHuellas(hojaControl, registros);
      cursor += cantidad;
      propiedades.setProperty(clave('CURSOR'), String(cursor));
    }
    if (cursor <= objetivo) {
      log('Índice en preparación. Ejecuta nuevamente la misma función para continuar.', 'próximaFila: ' + cursor);
      return false;
    }
    propiedades.setProperty(clave('INDICE_INICIALIZADO'), 'SI');
    propiedades.deleteProperty(clave('CURSOR'));
    propiedades.deleteProperty(clave('FILA_OBJETIVO'));
    log('Índice histórico terminado.');
    return true;
  };
  const sincronizarColaNoIndexada = (hojaDatos, hojaControl) => {
    const ultimaControl = hojaControl.getLastRow();
    const filasIndexadas = ultimaControl < 2 ? [] : hojaControl.getRange(2, 2, ultimaControl - 1, 1).getValues().flat().map(Number).filter(Boolean);
    const ultimaIndexada = filasIndexadas.length ? Math.max.apply(null, filasIndexadas) : CONFIG.primeraFilaDatos - 1;
    const ultimaDatos = hojaDatos.getLastRow();
    if (ultimaDatos <= ultimaIndexada) return;
    const valores = hojaDatos.getRange(ultimaIndexada + 1, 1, ultimaDatos - ultimaIndexada, CONFIG.columnasDatos).getValues();
    const registros = [];
    valores.forEach((fila, indice) => {
      if (!fila.every(vacio)) registros.push([huellaFila(fila), ultimaIndexada + 1 + indice, new Date()]);
    });
    agregarHuellas(hojaControl, registros);
    log('Se sincronizó el índice con filas ya existentes.', 'filas: ' + registros.length);
  };

  const obtenerMensaje = () => {
    // Gmail interpreta subject:"texto" como asunto que contiene el texto;
    // no exige que el asunto sea exactamente igual.
    const hilos = GmailApp.search(
      'in:inbox subject:"' + CONFIG.asuntoCorreo + '"'
    );
    let elegido = null;

    hilos.forEach(hilo => hilo.getMessages().forEach(mensaje => {
      if (!elegido || mensaje.getDate().getTime() > elegido.getDate().getTime()) elegido = mensaje;
    }));

    if (!elegido) {
      log('No hay archivos en la bandeja de entrada.');
      return null;
    }

    return elegido;
  };
  const limpiarEnlace = enlace => {
    let resultado = String(enlace || '').replace(/&amp;/gi, '&').replace(/[)>.,;]+$/, '');
    if (resultado.toLowerCase().includes('safelinks.protection.outlook.com')) {
      const match = resultado.match(/[?&]url=([^&]+)/i);
      if (match) resultado = decodeURIComponent(match[1]);
    }
    return resultado;
  };
  const extraerEnlaces = html => {
    const enlaces = new Set();
    const href = /href\s*=\s*["']([^"']+)["']/gi;
    const url = /https?:\/\/[^\s"'<>]+/gi;
    let match;
    while ((match = href.exec(html || ''))) enlaces.add(limpiarEnlace(match[1]));
    while ((match = url.exec(html || ''))) enlaces.add(limpiarEnlace(match[0]));
    return Array.from(enlaces).filter(enlace => /^https?:\/\//i.test(enlace));
  };
  const puntajeEnlace = enlace => {
    const texto = enlace.toLowerCase();
    if (/(logo|image|facebook|linkedin|instagram|unsubscribe|schema\.org|roche\.com)/.test(texto)) return -100;
    return (/(download|descarga|archivo|export|cobus)/.test(texto) ? 20 : 0) + (/\.(zip|csv|xlsx|xls)(\?|$)/.test(texto) ? 10 : 0);
  };
  const comienzaCon = (bytes, firma) => firma.every((valor, indice) => bytes[indice] === valor);
  const esHtml = bytes => {
    const muestra = Utilities.newBlob(bytes.slice(0, 4096)).getDataAsString('UTF-8').toLowerCase();
    return /<(?:!doctype|html|head|body|table\b|!attlist)|%implied/.test(muestra);
  };
  const nombreArchivo = (respuesta, predeterminado) => {
    const cabecera = respuesta.getHeaders()['Content-Disposition'] || respuesta.getHeaders()['content-disposition'] || '';
    const match = cabecera.match(/filename\*?=(?:UTF-8''|["'])?([^"';]+)/i);
    return match ? decodeURIComponent(match[1]).trim() : predeterminado;
  };
  const clasificarBlob = (blob, nombre) => {
    const bytes = blob.getBytes();
    if (esHtml(bytes)) throw new Error('La descarga devolvió una página HTML, no un archivo de datos.');
    const bajo = String(nombre || '').toLowerCase();
    if (comienzaCon(bytes, [80, 75])) {
      const contenidos = Utilities.unzip(blob.setContentType('application/zip'));
      const nombres = contenidos.map(archivo => archivo.getName().toLowerCase());
      if (nombres.indexOf('xl/workbook.xml') !== -1 || nombres.indexOf('[content_types].xml') !== -1) return { tipo: 'XLSX', blob: blob, nombre: nombre };
      return { tipo: 'ZIP', archivos: contenidos, nombre: nombre };
    }
    if (comienzaCon(bytes, [208, 207, 17, 224, 161, 177, 26, 225]) || /\.xls$/i.test(bajo)) return { tipo: 'XLS', blob: blob, nombre: nombre };
    if (/\.csv$/i.test(bajo) || /csv|text\/plain/i.test(blob.getContentType())) return { tipo: 'CSV', blob: blob, nombre: nombre };
    throw new Error('No se pudo reconocer el formato de "' + nombre + '".');
  };
  const descargarArchivos = mensaje => {
    const candidatos = extraerEnlaces(mensaje.getBody()).sort((a, b) => puntajeEnlace(b) - puntajeEnlace(a));
    if (!candidatos.length) throw new Error('No se encontraron enlaces de descarga en el correo.');
    let ultimoError = '';
    for (const enlace of candidatos) {
      if (puntajeEnlace(enlace) < 0) continue;
      try {
        const respuesta = UrlFetchApp.fetch(enlace, { muteHttpExceptions: true, followRedirects: true });
        if (respuesta.getResponseCode() < 200 || respuesta.getResponseCode() >= 300) throw new Error('HTTP ' + respuesta.getResponseCode());
        const nombre = nombreArchivo(respuesta, 'archivo-descargado');
        const clasificado = clasificarBlob(respuesta.getBlob().setName(nombre), nombre);
        const archivos = clasificado.tipo === 'ZIP'
          ? clasificado.archivos.map(archivo => clasificarBlob(archivo, archivo.getName())).filter(archivo => archivo.tipo !== 'ZIP')
          : [clasificado];
        if (!archivos.length) throw new Error('El ZIP no contiene CSV o Excel.');
        log('Descarga válida encontrada.', 'nombre: ' + nombre + ' | tipo: ' + clasificado.tipo + ' | archivos: ' + archivos.length);
        return archivos;
      } catch (error) { ultimoError = error.message; }
    }
    throw new Error('No fue posible descargar un archivo válido. ' + ultimoError);
  };
  const delimitadorCsv = texto => {
    const muestra = texto.slice(0, 20000);
    let mejor = ',', mayor = -1;
    [',', ';', '\t', '|'].forEach(candidato => {
      let cuenta = 0, comillas = false;
      for (let i = 0; i < muestra.length; i++) {
        if (muestra[i] === '"') comillas = !comillas;
        else if (!comillas && muestra[i] === candidato) cuenta++;
      }
      if (cuenta > mayor) { mayor = cuenta; mejor = candidato; }
    });
    return mejor;
  };
  const leerExcel = archivo => {
    const nombre = 'TMP_' + CONFIG.prefijoPropiedades + '_' + Date.now() + '_' + archivo.nombre;
    const tipoMime = archivo.tipo === 'XLSX'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/vnd.ms-excel';
    const temporal = DriveApp.createFile(archivo.blob.copyBlob().setName(nombre).setContentType(tipoMime));
    let convertido;
    try {
      convertido = Drive.Files.copy({ title: nombre, mimeType: MimeType.GOOGLE_SHEETS }, temporal.getId());
      return SpreadsheetApp.openById(convertido.id).getSheets()[0].getDataRange().getValues();
    } finally {
      try { DriveApp.getFileById(temporal.getId()).setTrashed(true); } catch (e) {}
      try { if (convertido) DriveApp.getFileById(convertido.id).setTrashed(true); } catch (e) {}
    }
  };
  const leerArchivo = archivo => {
    if (archivo.tipo === 'CSV') {
      const texto = archivo.blob.getDataAsString('UTF-8').replace(/^\uFEFF/, '');
      return Utilities.parseCsv(texto, delimitadorCsv(texto));
    }
    return leerExcel(archivo);
  };
  const validarFilas = (filas, nombre) => {
    if (!filas.length) return [];
    const cabecera = filas[0].slice();
    while (cabecera.length > CONFIG.columnasDatos && vacio(cabecera[cabecera.length - 1])) cabecera.pop();
    if (cabecera.length !== CONFIG.columnasDatos) throw new Error('El encabezado de "' + nombre + '" tiene ' + cabecera.length + ' columnas; se esperaban ' + CONFIG.columnasDatos + '.');
    return filas.slice(1).filter(fila => !fila.every(vacio)).map(fila => {
      const resultado = fila.slice(0, CONFIG.columnasDatos);
      while (resultado.length < CONFIG.columnasDatos) resultado.push('');
      if (fila.slice(CONFIG.columnasDatos).some(valor => !vacio(valor))) throw new Error('Una fila de "' + nombre + '" tiene datos después de la columna esperada.');
      return resultado;
    });
  };

  const ejecutar = () => {
    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(30000);
    try {
      const hojaDatos = obtenerHojaDatos();
      const hojaControl = obtenerHojaControl(hojaDatos.getParent());
      if (!prepararIndice(hojaDatos, hojaControl)) return;
      sincronizarColaNoIndexada(hojaDatos, hojaControl);
      const mensaje = obtenerMensaje();
      if (!mensaje) return;
      log('Procesando correo.', 'asunto: ' + mensaje.getSubject() + ' | fecha: ' + Utilities.formatDate(mensaje.getDate(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'));
      const archivos = descargarArchivos(mensaje);
      const filasLeidas = archivos.flatMap(archivo => validarFilas(leerArchivo(archivo), archivo.nombre));
      const existentes = obtenerHuellas(hojaControl);
      const nuevas = [], huellasNuevas = [];
      filasLeidas.forEach(fila => {
        const huella = huellaFila(fila);
        if (!existentes.has(huella)) {
          existentes.add(huella);
          nuevas.push(fila);
          huellasNuevas.push(huella);
        }
      });
      if (nuevas.length) {
        const inicio = Math.max(hojaDatos.getLastRow() + 1, CONFIG.primeraFilaDatos);
        for (let desde = 0; desde < nuevas.length; desde += CONFIG.lote) {
          const bloque = nuevas.slice(desde, desde + CONFIG.lote);
          hojaDatos.getRange(inicio + desde, 1, bloque.length, CONFIG.columnasDatos).setValues(bloque);
          agregarHuellas(hojaControl, bloque.map((fila, indice) => [huellasNuevas[desde + indice], inicio + desde + indice, new Date()]));
        }
        log('Filas nuevas agregadas.', 'filas: ' + nuevas.length + ' | desdeFila: ' + inicio + ' | hastaFila: ' + (inicio + nuevas.length - 1));
      } else {
        log('No se agregaron filas: todas ya existían en el índice.');
      }
      hojaDatos.getRange(CONFIG.celdaUltimaActualizacion).setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
      mensaje.moveToTrash();
      log('Importación terminada correctamente.', 'filasLeidas: ' + filasLeidas.length + ' | filasAgregadas: ' + nuevas.length + ' | duplicadas: ' + (filasLeidas.length - nuevas.length) + ' | archivosProcesados: ' + archivos.length);
    } catch (error) {
      log('ERROR: el correo se conserva y no se movió a la papelera.', 'motivo: ' + error.message);
      throw error;
    } finally {
      bloqueo.releaseLock();
    }
  };
  return ejecutar();
}
