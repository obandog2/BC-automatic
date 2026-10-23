/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Consolida solo filas nuevas de archivos Google Sheets de Perú y conserva
 * la información que ya existe en la hoja destino.
 *
 * Validaciones para ejecutar consolidarArchivosPE():
 * 1) La carpeta fuente debe contener archivos Google Sheets accesibles.
 * 2) La hoja Data cobus 2026 PE del archivo destino debe ser accesible.
 * 3) Las columnas origen configuradas deben existir en cada hoja fuente.
 * 4) La hoja update del archivo de control debe tener B2 con el valor update.
 */

const BCAT0016_CONSOLIDACION_PE = (() => {
  const CONFIG = Object.freeze({
    prefijoLog: '[BCAT-0016]',
    carpetaFuenteId: '1GCWzKXIHxCPIh8hMR0h-rEMyCQCdCrj4',
    archivoDestinoId: '1GGfKpKWTjSj28WCiH8ILPvwTqhyLJP27b5-XZ9OA0GY',
    hojaDestinoNombre: 'Data cobus 2026 PE',
    hojaControlNombre: '_Control Consolidacion Cobus PE',
    propiedadIndiceArchivo: 'BCAT0016_COBUS_PE_INDICE_ARCHIVO',
    propiedadIndiceHistorico: 'BCAT0016_COBUS_PE_INDICE_HISTORICO',
    propiedadHistoricoListo: 'BCAT0016_COBUS_PE_HISTORICO_LISTO',
    columnasOrigen: [
      1, 3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17,
      21, 24, 25, 26, 29, 30, 31, 32, 41, 44, 50
    ],
    filasPorLote: 500,
    tiempoMaximoMs: 270000
  });

  const log_ = (mensaje, detalle) => Logger.log(
    CONFIG.prefijoLog + ' ' + mensaje + (detalle ? ' | ' + detalle : '')
  );

  const consolidar = () => {
    const inicio = Date.now();
    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(30000);

    try {
      log_('Inicio de consolidación incremental.');
      const propiedades = PropertiesService.getScriptProperties();
      const destino = obtenerDestino_();
      const control = obtenerControl_(destino.libro);

      if (!prepararIndiceHistorico_(destino.hoja, control, propiedades, inicio)) {
        log_('Índice histórico en preparación. Ejecute nuevamente la misma función para continuar.');
        return;
      }

      const archivos = obtenerArchivosFuente_();
      if (!archivos.length) {
        log_('Finalizado sin cambios: no hay archivos fuente disponibles.');
        return;
      }

      const huellas = obtenerHuellas_(control);
      let indice = Number(propiedades.getProperty(CONFIG.propiedadIndiceArchivo) || '0');
      let nuevas = 0;
      let omitidas = 0;

      log_('Archivos fuente identificados.', 'total: ' + archivos.length + ' | inicio: ' + (indice + 1));

      while (indice < archivos.length) {
        if (Date.now() - inicio >= CONFIG.tiempoMaximoMs) {
          propiedades.setProperty(CONFIG.propiedadIndiceArchivo, String(indice));
          log_('Tiempo máximo alcanzado.', 'próximo archivo: ' + (indice + 1) + ' | nuevas: ' + nuevas);
          return;
        }

        const resultado = procesarArchivo_(archivos[indice], destino.hoja, control, huellas);
        nuevas += resultado.nuevas;
        omitidas += resultado.omitidas;
        indice++;
        propiedades.setProperty(CONFIG.propiedadIndiceArchivo, String(indice));
      }

      propiedades.deleteProperty(CONFIG.propiedadIndiceArchivo);
      destino.hoja.getRange('AA1').setValue(
        'LastUpdate: ' + Utilities.formatDate(
          new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'
        )
      );
      log_('Consolidación finalizada.', 'filas nuevas: ' + nuevas + ' | ya existentes: ' + omitidas);
    } catch (error) {
      log_('ERROR en consolidación.', error && error.message ? error.message : String(error));
      throw error;
    } finally {
      bloqueo.releaseLock();
    }
  };

  const obtenerDestino_ = () => {
    const libro = SpreadsheetApp.openById(CONFIG.archivoDestinoId);
    let hoja = libro.getSheetByName(CONFIG.hojaDestinoNombre);
    if (!hoja) {
      hoja = libro.insertSheet(CONFIG.hojaDestinoNombre);
      log_('Hoja destino creada.', CONFIG.hojaDestinoNombre);
    }
    asegurarColumnas_(hoja, totalColumnas_());
    return { libro: libro, hoja: hoja };
  };

  const obtenerControl_ = libro => {
    let hoja = libro.getSheetByName(CONFIG.hojaControlNombre);
    if (!hoja) {
      hoja = libro.insertSheet(CONFIG.hojaControlNombre);
      hoja.getRange(1, 1, 1, 3).setValues([['Huella', 'Archivo origen', 'Registrado el']]);
      hoja.hideSheet();
      log_('Índice técnico creado.', CONFIG.hojaControlNombre);
    }
    return hoja;
  };

  const obtenerArchivosFuente_ = () => {
    const iterador = DriveApp.getFolderById(CONFIG.carpetaFuenteId).getFiles();
    const archivos = [];
    while (iterador.hasNext()) {
      const archivo = iterador.next();
      if (archivo.getMimeType() === MimeType.GOOGLE_SHEETS && archivo.getId() !== CONFIG.archivoDestinoId) {
        archivos.push(archivo);
      }
    }
    return archivos.sort((a, b) => a.getName().localeCompare(b.getName()));
  };

  const prepararIndiceHistorico_ = (destino, control, propiedades, inicio) => {
    if (propiedades.getProperty(CONFIG.propiedadHistoricoListo) === 'SI') return true;

    const ultimaFila = destino.getLastRow();
    if (ultimaFila < 2) {
      propiedades.setProperty(CONFIG.propiedadHistoricoListo, 'SI');
      propiedades.deleteProperty(CONFIG.propiedadIndiceHistorico);
      return true;
    }

    let fila = Number(propiedades.getProperty(CONFIG.propiedadIndiceHistorico) || '2');
    log_('Preparando índice de datos existentes.', 'desde fila: ' + fila);

    while (fila <= ultimaFila) {
      if (Date.now() - inicio >= CONFIG.tiempoMaximoMs) {
        propiedades.setProperty(CONFIG.propiedadIndiceHistorico, String(fila));
        return false;
      }
      const cantidad = Math.min(CONFIG.filasPorLote, ultimaFila - fila + 1);
      const filas = destino.getRange(fila, 1, cantidad, totalColumnas_()).getDisplayValues();
      const registros = filas
        .filter(esFilaConDatos_)
        .map(valores => [crearHuella_(valores[0], valores.slice(1)), valores[0], new Date()]);
      agregarControl_(control, registros);
      fila += cantidad;
      propiedades.setProperty(CONFIG.propiedadIndiceHistorico, String(fila));
    }

    propiedades.setProperty(CONFIG.propiedadHistoricoListo, 'SI');
    propiedades.deleteProperty(CONFIG.propiedadIndiceHistorico);
    log_('Índice de datos existentes completado.');
    return true;
  };

  const procesarArchivo_ = (archivo, destino, control, huellas) => {
    const nombre = archivo.getName();
    let nuevas = 0;
    let omitidas = 0;
    try {
      const libroOrigen = SpreadsheetApp.openById(archivo.getId());
      const hoja = libroOrigen.getSheets().filter(item => !item.isSheetHidden())[0];
      if (!hoja) {
        log_('Archivo omitido: no tiene pestañas visibles.', nombre);
        return { nuevas: nuevas, omitidas: omitidas };
      }
      if (hoja.getLastColumn() < Math.max.apply(null, CONFIG.columnasOrigen) || hoja.getLastRow() < 2) {
        log_('Archivo omitido: no tiene las columnas o filas requeridas.', nombre);
        return { nuevas: nuevas, omitidas: omitidas };
      }

      asegurarEncabezados_(destino, hoja);
      const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getDisplayValues();
      const salida = [];
      const controlNuevos = [];

      datos.forEach(fila => {
        const seleccionados = CONFIG.columnasOrigen.map(columna => fila[columna - 1] || '');
        if (!seleccionados.some(valor => texto_(valor) !== '')) return;
        const huella = crearHuella_(nombre, seleccionados);
        if (huellas.has(huella)) {
          omitidas++;
          return;
        }
        huellas.add(huella);
        salida.push([nombre].concat(seleccionados));
        controlNuevos.push([huella, nombre, new Date()]);
        nuevas++;
      });

      if (salida.length) {
        const inicio = destino.getLastRow() + 1;
        asegurarFilas_(destino, inicio + salida.length - 1);
        destino.getRange(inicio, 1, salida.length, totalColumnas_()).setNumberFormat('@').setValues(salida);
        agregarControl_(control, controlNuevos);
      }
      log_('Archivo procesado.', nombre + ' | nuevas: ' + nuevas + ' | ya existentes: ' + omitidas);
    } catch (error) {
      log_('ERROR en archivo.', nombre + ' | ' + (error.message || String(error)));
    }
    return { nuevas: nuevas, omitidas: omitidas };
  };

  const asegurarEncabezados_ = (destino, origen) => {
    const actuales = destino.getRange(1, 1, 1, totalColumnas_()).getDisplayValues()[0];
    if (actuales.some(valor => texto_(valor) !== '')) return;
    const origenEncabezados = origen.getRange(1, 1, 1, origen.getLastColumn()).getDisplayValues()[0];
    const encabezados = ['Archivo origen'].concat(CONFIG.columnasOrigen.map(columna =>
      origenEncabezados[columna - 1] || 'Columna ' + columna
    ));
    destino.getRange(1, 1, 1, totalColumnas_()).setValues([encabezados]);
    log_('Encabezados creados en destino.');
  };

  const obtenerHuellas_ = hoja => {
    const ultimaFila = hoja.getLastRow();
    return ultimaFila < 2 ? new Set() : new Set(
      hoja.getRange(2, 1, ultimaFila - 1, 1).getDisplayValues().flat().filter(Boolean)
    );
  };
  const agregarControl_ = (hoja, registros) => {
    if (!registros.length) return;
    const inicio = hoja.getLastRow() + 1;
    asegurarFilas_(hoja, inicio + registros.length - 1);
    hoja.getRange(inicio, 1, registros.length, 3).setValues(registros);
  };
  const crearHuella_ = (archivo, valores) => Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    [archivo].concat(valores).map(texto_).join('\u001F')
  ).map(byte => ('0' + (byte & 0xff).toString(16)).slice(-2)).join('');
  const esFilaConDatos_ = fila => fila.some(valor => texto_(valor) !== '');
  const totalColumnas_ = () => CONFIG.columnasOrigen.length + 1;
  const texto_ = valor => String(valor == null ? '' : valor).trim();
  const asegurarColumnas_ = (hoja, total) => {
    if (hoja.getMaxColumns() < total) hoja.insertColumnsAfter(hoja.getMaxColumns(), total - hoja.getMaxColumns());
  };
  const asegurarFilas_ = (hoja, hastaFila) => {
    if (hoja.getMaxRows() < hastaFila) hoja.insertRowsAfter(hoja.getMaxRows(), hastaFila - hoja.getMaxRows());
  };

  return { consolidar: consolidar };
})();

function consolidarArchivosPE() {
  if (!validarConArchivoControl()) return;
  return BCAT0016_CONSOLIDACION_PE.consolidar();
}

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
