/**
 * Asistente Personal - v2
 * Todo lo que se guarda: prioridades de correo, metas del día, notas y pendientes.
 *
 * Los pendientes son solo los que escribís vos. En la v1 también aparecían acá
 * los correos con estrella; en la v2 la estrella pasó a ser una señal de
 * importancia dentro de la sección Correo, que es donde tiene sentido.
 * Si algún día pasás a Google Tasks, el único punto a tocar es
 * obtenerPendientes(): la pestaña y las escrituras quedan igual.
 */

// =============================================================================
// Prioridad propia de los correos
// =============================================================================

/**
 * Mapa { idHilo: {nivel, asunto, remitente, url, marcado} }.
 * Se lee en cada carga del sitio: es barato y siempre está fresco.
 */
function leerPrioridades_() {
  const filas = leerFilas_(getHoja_(CONFIG.hojaPrioridades));
  const mapa = {};

  filas.forEach(function (fila) {
    const id = String(fila[0] || '').trim();
    if (!id) return;
    mapa[id] = {
      nivel: String(fila[1] || '').trim().toLowerCase(),
      asunto: String(fila[2] || ''),
      remitente: String(fila[3] || ''),
      url: String(fila[4] || ''),
      marcado: String(fila[5] || '')
    };
  });

  return mapa;
}

/**
 * Marca un hilo como importante, silenciado o normal.
 *
 * Se guarda una copia del asunto, el remitente y el link porque los hilos
 * importantes se siguen mostrando cuando ya salieron de la ventana del digest,
 * y en ese momento no hay de dónde sacar esos datos sin volver a Gmail.
 *
 * Marcar como "normal" borra la fila: la ausencia de marca ES lo normal.
 *
 * @param {{id: string, asunto: string, de: string, url: string}} hilo
 * @param {string} nivel 'importante' | 'silenciado' | 'normal'
 * @return {{id: string, nivel: string}}
 */
function marcarPrioridad(hilo, nivel) {
  if (!hilo || !hilo.id) throw new Error('Falta el hilo a marcar.');

  const limpio = String(nivel || '').trim().toLowerCase();
  if ([NIVEL_IMPORTANTE, NIVEL_SILENCIADO, NIVEL_NORMAL].indexOf(limpio) === -1) {
    throw new Error('Nivel de prioridad no válido: ' + nivel);
  }

  const hoja = getHoja_(CONFIG.hojaPrioridades);

  conLock_(function () {
    const fila = buscarFilaPorId_(hoja, hilo.id);

    if (limpio === NIVEL_NORMAL) {
      if (fila) hoja.deleteRow(fila);
      return;
    }

    const valores = [
      String(hilo.id),
      limpio,
      celdaSegura_(String(hilo.asunto || '').slice(0, 300)),
      celdaSegura_(String(hilo.de || '').slice(0, 200)),
      String(hilo.url || '').slice(0, 500),
      formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm')
    ];

    if (fila) {
      hoja.getRange(fila, 1, 1, valores.length).setValues([valores]);
    } else {
      hoja.appendRow(valores);
    }
  });

  // La caché guarda el snapshot NEUTRO, sin prioridades aplicadas, así que no
  // hace falta invalidarla: la clasificación se recalcula en cada lectura.
  return { id: hilo.id, nivel: limpio };
}

// =============================================================================
// Metas del día
// =============================================================================

/**
 * Metas de una fecha, con el avance calculado.
 * @param {string} fechaIso 'yyyy-MM-dd'. Si viene vacío, es hoy.
 */
function obtenerMetas(fechaIso) {
  const fecha = String(fechaIso || '').trim() || hoyIso_();
  const filas = leerFilas_(getHoja_(CONFIG.hojaMetas));

  const metas = filas
    .filter(function (fila) { return String(fila[1]) === fecha; })
    .map(function (fila) {
      return {
        id: String(fila[0]),
        fecha: String(fila[1]),
        texto: String(fila[2]),
        hecha: String(fila[3]) === ESTADO_HECHO
      };
    });

  const hechas = metas.filter(function (meta) { return meta.hecha; }).length;

  return {
    fecha: fecha,
    metas: metas,
    total: metas.length,
    hechas: hechas,
    porcentaje: metas.length ? Math.round((hechas / metas.length) * 100) : 0
  };
}

function agregarMeta(texto, fechaIso) {
  const limpio = textoRequerido_(texto, 'Meta', 300);
  const fecha = String(fechaIso || '').trim() || hoyIso_();
  const hoja = getHoja_(CONFIG.hojaMetas);

  conLock_(function () {
    hoja.appendRow([
      nuevoId_(),
      fecha,
      celdaSegura_(limpio),
      ESTADO_PENDIENTE,
      formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm'),
      ''
    ]);
  });

  return obtenerMetas(fecha);
}

function cambiarEstadoMeta(id, hecha) {
  const hoja = getHoja_(CONFIG.hojaMetas);

  const fecha = conLock_(function () {
    const fila = buscarFilaPorId_(hoja, id);
    if (!fila) throw new Error('Esa meta ya no existe.');
    hoja.getRange(fila, 4).setValue(hecha ? ESTADO_HECHO : ESTADO_PENDIENTE);
    hoja.getRange(fila, 6).setValue(hecha ? formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm') : '');
    return String(hoja.getRange(fila, 2).getValue());
  });

  return obtenerMetas(fecha);
}

function eliminarMeta(id) {
  const hoja = getHoja_(CONFIG.hojaMetas);

  const fecha = conLock_(function () {
    const fila = buscarFilaPorId_(hoja, id);
    if (!fila) throw new Error('Esa meta ya no existe.');
    const valor = String(hoja.getRange(fila, 2).getValue());
    hoja.deleteRow(fila);
    return valor;
  });

  return obtenerMetas(fecha);
}

// =============================================================================
// Notas
// =============================================================================

/** Las notas más recientes primero. El guardado es explícito, nunca automático. */
function obtenerNotas() {
  const filas = leerFilas_(getHoja_(CONFIG.hojaNotas));

  return filas
    .map(function (fila, indice) {
      return {
        id: String(fila[0]),
        creada: String(fila[1]),
        actualizada: String(fila[2]),
        texto: String(fila[3]),
        orden: indice
      };
    })
    .sort(function (a, b) { return b.orden - a.orden; });
}

function agregarNota(texto) {
  const limpio = textoRequerido_(texto, 'Nota', 8000);
  const hoja = getHoja_(CONFIG.hojaNotas);
  const ahora = formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm');

  conLock_(function () {
    hoja.appendRow([nuevoId_(), ahora, ahora, celdaSegura_(limpio)]);
  });

  return obtenerNotas();
}

function guardarNota(id, texto) {
  const limpio = textoRequerido_(texto, 'Nota', 8000);
  const hoja = getHoja_(CONFIG.hojaNotas);

  conLock_(function () {
    const fila = buscarFilaPorId_(hoja, id);
    if (!fila) throw new Error('Esa nota ya no existe.');
    hoja.getRange(fila, 3).setValue(formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm'));
    hoja.getRange(fila, 4).setValue(celdaSegura_(limpio));
  });

  return obtenerNotas();
}

function eliminarNota(id) {
  const hoja = getHoja_(CONFIG.hojaNotas);

  conLock_(function () {
    const fila = buscarFilaPorId_(hoja, id);
    if (!fila) throw new Error('Esa nota ya no existe.');
    hoja.deleteRow(fila);
  });

  return obtenerNotas();
}

// =============================================================================
// Pendientes
// =============================================================================

/** Los pendientes abiertos que escribiste vos. */
function obtenerPendientes() {
  const filas = leerFilas_(getHoja_(CONFIG.hojaPendientes));

  const abiertos = filas
    .filter(function (fila) { return String(fila[3]) === ESTADO_PENDIENTE; })
    .map(function (fila) {
      return {
        id: String(fila[0]),
        creado: String(fila[1]),
        descripcion: String(fila[2])
      };
    });

  return { pendientes: abiertos, total: abiertos.length };
}

function agregarPendiente(descripcion) {
  const limpio = textoRequerido_(descripcion, 'Pendiente', 500);
  const hoja = getHoja_(CONFIG.hojaPendientes);

  conLock_(function () {
    hoja.appendRow([
      nuevoId_(),
      formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm'),
      celdaSegura_(limpio),
      ESTADO_PENDIENTE,
      ''
    ]);
  });

  return obtenerPendientes();
}

/** Cierra un pendiente. No borra la fila: queda el historial. */
function cerrarPendiente(id) {
  const hoja = getHoja_(CONFIG.hojaPendientes);

  conLock_(function () {
    const fila = buscarFilaPorId_(hoja, id);
    if (!fila) throw new Error('Ese pendiente ya no existe.');
    hoja.getRange(fila, 4).setValue(ESTADO_CERRADO);
    hoja.getRange(fila, 5).setValue(formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm'));
  });

  return obtenerPendientes();
}
