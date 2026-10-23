/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Importa reportes CSV enviados por correo, agrega solo IDs nuevos según la
 * columna D y actualiza exclusivamente la fecha de la columna N en IDs existentes.
 *
 * Validaciones para ejecutar importCSVFromEmailAccount():
 * 1) Los correos deben tener Reporte en el asunto y adjuntos CSV válidos.
 * 2) La hoja PEC_CX Recommendations debe tener el ID único en la columna D.
 * 3) La fecha que se actualizará debe venir en la columna N del CSV.
 * 4) La hoja update del archivo de control debe tener B2 con el valor update.
 */

const IMPORTACION_PEC_CX = (() => {
  const CONFIG = Object.freeze({
    prefijoLog: '[PEC-CX-IMPORTACION]',
    asunto: 'Reporte',
    hojaDestino: 'PEC_CX Recommendations',
    hojaInformacion: 'Informacion',
    columnaId: 4,
    columnaFecha: 14,
    codificacion: 'ISO-8859-1'
  });

  const importar = () => {
    const hilos = GmailApp.search('subject:"' + CONFIG.asunto + '"');
    if (!hilos.length) {
      Logger.log(CONFIG.prefijoLog + ' No se encontraron correos para importar.');
      return { nuevos: 0, fechasActualizadas: 0, omitidosSinId: 0, archivos: 0 };
    }

    const libro = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = libro.getSheetByName(CONFIG.hojaDestino);
    if (!hoja) throw new Error('No se encontró la hoja "' + CONFIG.hojaDestino + '".');

    const indiceIds = construirIndiceIds_(hoja);
    const resumen = { nuevos: 0, fechasActualizadas: 0, omitidosSinId: 0, archivos: 0 };
    Logger.log(CONFIG.prefijoLog + ' Inicio de importación incremental. | correos: ' + hilos.length);

    hilos.forEach(hilo => {
      hilo.getMessages().forEach(mensaje => {
        mensaje.getAttachments().forEach(adjunto => {
          try {
            const resultado = procesarAdjunto_(adjunto, hoja, indiceIds);
            resumen.nuevos += resultado.nuevos;
            resumen.fechasActualizadas += resultado.fechasActualizadas;
            resumen.omitidosSinId += resultado.omitidosSinId;
            resumen.archivos++;
            Logger.log(CONFIG.prefijoLog + ' Adjunto procesado. | archivo: ' + adjunto.getName() + ' | nuevos: ' + resultado.nuevos + ' | fechas actualizadas: ' + resultado.fechasActualizadas);
          } catch (error) {
            Logger.log(CONFIG.prefijoLog + ' ERROR en adjunto. | archivo: ' + adjunto.getName() + ' | ' + (error.message || String(error)));
          }
        });
      });
      hilo.moveToTrash();
    });

    actualizarFechaEjecucion_(libro);
    Logger.log(CONFIG.prefijoLog + ' Importación finalizada. | nuevos: ' + resumen.nuevos + ' | fechas actualizadas: ' + resumen.fechasActualizadas + ' | sin ID: ' + resumen.omitidosSinId);
    return resumen;
  };

  const procesarAdjunto_ = (adjunto, hoja, indiceIds) => {
    const csv = Utilities.newBlob(adjunto.getBytes(), adjunto.getContentType(), adjunto.getName())
      .getDataAsString(CONFIG.codificacion);
    const datos = Utilities.parseCsv(csv);
    if (!datos.length || !datos[0].length) throw new Error('El CSV está vacío o no es válido.');
    if (datos[0].length < CONFIG.columnaFecha) throw new Error('El CSV no contiene la columna N requerida.');

    const columnasDestino = prepararEncabezados_(hoja, datos[0]);
    const nuevasFilas = [];
    const nuevasPorId = {};
    const fechasPorFila = {};
    let omitidosSinId = 0;

    datos.slice(1).forEach(filaCsv => {
      const id = normalizarId_(filaCsv[CONFIG.columnaId - 1]);
      if (!id) {
        omitidosSinId++;
        return;
      }
      const fechaCsv = filaCsv[CONFIG.columnaFecha - 1] == null ? '' : filaCsv[CONFIG.columnaFecha - 1];
      const filaExistente = indiceIds[id];
      if (filaExistente) {
        fechasPorFila[filaExistente] = fechaCsv;
        return;
      }
      if (nuevasPorId[id] !== undefined) {
        nuevasFilas[nuevasPorId[id]][CONFIG.columnaFecha - 1] = fechaCsv;
        return;
      }
      nuevasPorId[id] = nuevasFilas.length;
      nuevasFilas.push(normalizarFila_(filaCsv, columnasDestino));
    });

    actualizarFechas_(hoja, fechasPorFila);
    const filaInicio = agregarFilasNuevas_(hoja, nuevasFilas, columnasDestino);
    nuevasFilas.forEach((fila, indice) => {
      indiceIds[normalizarId_(fila[CONFIG.columnaId - 1])] = filaInicio + indice;
    });

    return {
      nuevos: nuevasFilas.length,
      fechasActualizadas: Object.keys(fechasPorFila).length,
      omitidosSinId: omitidosSinId
    };
  };

  const construirIndiceIds_ = hoja => {
    const indice = {};
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) return indice;
    hoja.getRange(2, CONFIG.columnaId, ultimaFila - 1, 1).getDisplayValues().forEach((fila, indiceCero) => {
      const id = normalizarId_(fila[0]);
      if (id && indice[id] === undefined) indice[id] = indiceCero + 2;
    });
    return indice;
  };

  const prepararEncabezados_ = (hoja, encabezadosCsv) => {
    const columnas = Math.max(hoja.getLastColumn(), encabezadosCsv.length, CONFIG.columnaFecha);
    asegurarColumnas_(hoja, columnas);
    if (hoja.getLastRow() === 0 || hoja.getRange(1, 1, 1, columnas).getDisplayValues()[0].every(valor => !String(valor).trim())) {
      hoja.getRange(1, 1, 1, encabezadosCsv.length).setValues([encabezadosCsv]);
    }
    return columnas;
  };

  const actualizarFechas_ = (hoja, fechasPorFila) => {
    const actualizaciones = Object.keys(fechasPorFila).map(Number).sort((a, b) => a - b);
    let primeraFila = null;
    let valores = [];
    const guardar = () => {
      if (!valores.length) return;
      hoja.getRange(primeraFila, CONFIG.columnaFecha, valores.length, 1).setValues(valores);
      primeraFila = null;
      valores = [];
    };
    actualizaciones.forEach(fila => {
      if (primeraFila !== null && fila !== primeraFila + valores.length) guardar();
      if (primeraFila === null) primeraFila = fila;
      valores.push([fechasPorFila[fila]]);
    });
    guardar();
  };

  const agregarFilasNuevas_ = (hoja, filas, columnas) => {
    if (!filas.length) return hoja.getLastRow() + 1;
    const inicio = hoja.getLastRow() + 1;
    asegurarFilas_(hoja, inicio + filas.length - 1);
    hoja.getRange(inicio, 1, filas.length, columnas).setValues(filas);
    return inicio;
  };

  const actualizarFechaEjecucion_ = libro => {
    let hoja = libro.getSheetByName(CONFIG.hojaInformacion);
    if (!hoja) hoja = libro.insertSheet(CONFIG.hojaInformacion);
    hoja.getRange('B2').setValue(new Date());
  };
  const normalizarFila_ = (fila, columnas) => Array.from({ length: columnas }, (_, indice) => fila[indice] == null ? '' : fila[indice]);
  const normalizarId_ = valor => String(valor == null ? '' : valor).trim();
  const asegurarColumnas_ = (hoja, columnas) => {
    if (hoja.getMaxColumns() < columnas) hoja.insertColumnsAfter(hoja.getMaxColumns(), columnas - hoja.getMaxColumns());
  };
  const asegurarFilas_ = (hoja, filas) => {
    if (hoja.getMaxRows() < filas) hoja.insertRowsAfter(hoja.getMaxRows(), filas - hoja.getMaxRows());
  };

  return { importar: importar };
})();

function importCSVFromEmailAccount() {
  if (!validarConArchivoControl()) return;
  return IMPORTACION_PEC_CX.importar();
}

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
