/**
 * BCAT-0016 - Homologación y aprendizaje supervisado de marcas.
 *
 * Diccionario:
 *   Columna A: variante recibida.
 *   Columna B: marca oficial confirmada.
 */

const CONFIG_MARCAS = Object.freeze({
  ARCHIVO_DESTINO_ID: '1iqn2M5Z_iJcM-D9oN95xoV0qVfjjDv8XBHNZ8apCb7Q',
  HOJA_DESTINO: '2026',
  COLUMNA_MARCA: 8,
  PRIMERA_FILA_DATOS: 2,

  ARCHIVO_DICCIONARIO_ID: '1fSKIi1za_nTEnQSQSD-tlMT9RDuJs9B2yvXY3DVoy5o',
  HOJA_DICCIONARIO: 'Marcas Homologadas',
  PRIMERA_FILA_DICCIONARIO: 2,

  COLOR_PENDIENTE: '#f4cccc',
  COLOR_APROBADO: '#ffffff',
  LONGITUD_MINIMA_PREFIJO: 4,
  PROPORCION_MINIMA_PREFIJO: 0.75,
  LONGITUD_MINIMA_FIRMA: 3,
  LONGITUD_MINIMA_SIMILITUD: 5,
  CONFIANZA_MINIMA: 0.86,
  DIFERENCIA_MINIMA: 0.12
});

function homologarMarcas() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    logMarcas_('Iniciando homologación de marcas.');

    const hojaDestino = obtenerHojaObligatoria_(
      CONFIG_MARCAS.ARCHIVO_DESTINO_ID,
      CONFIG_MARCAS.HOJA_DESTINO
    );
    const hojaDiccionario = obtenerHojaObligatoria_(
      CONFIG_MARCAS.ARCHIVO_DICCIONARIO_ID,
      CONFIG_MARCAS.HOJA_DICCIONARIO
    );

    const modelo = crearModeloMarcas_(hojaDiccionario);
    limpiarFilasAprobadas_(hojaDiccionario, modelo.filasAprobadasEnRojo);
    marcarFilasParaRevision_(hojaDiccionario, modelo.filasParaRevision);

    logMarcas_('Diccionario cargado.', {
      relacionesConfirmadas: modelo.totalRelaciones,
      pendientesExistentes: modelo.totalPendientes,
      conflictos: modelo.conflictos.length,
      filasMarcadasEnRojo: modelo.filasParaRevision.length
    });

    modelo.conflictos.forEach(function(conflicto) {
      logMarcas_('CONFLICTO: una variante apunta a más de una marca y no se utilizará.', {
        variante: conflicto.variante,
        marcas: conflicto.marcas.join(' / ')
      });
    });

    const resultado = procesarMarcas_(hojaDestino, modelo);
    const nuevasPendientes = registrarPendientes_(
      hojaDiccionario,
      resultado.pendientes,
      modelo.variantesExistentes
    );

    const resumen = {
      filasRevisadas: resultado.filasRevisadas,
      homologadas: resultado.homologadas,
      coincidenciasExactas: resultado.metodos.exacta,
      coincidenciasPorPrefijo: resultado.metodos.prefijo,
      coincidenciasPorFirma: resultado.metodos.firma,
      coincidenciasPorSimilitud: resultado.metodos.similitud,
      pendientesNuevas: nuevasPendientes,
      pendientesYaRegistradas: resultado.pendientesYaRegistradas,
      vacias: resultado.vacias
    };

    logMarcas_('Homologación terminada.', resumen);
    return resumen;
  } catch (error) {
    logMarcas_('ERROR: no se pudo completar la homologación.', {
      motivo: error.message
    });
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function crearModeloMarcas_(hoja) {
  const ultimaFila = hoja.getLastRow();
  const modelo = {
    exactas: new Map(),
    formas: [],
    firmas: new Map(),
    variantesExistentes: new Set(),
    conflictos: [],
    filasAprobadasEnRojo: [],
    filasParaRevision: [],
    totalRelaciones: 0,
    totalPendientes: 0
  };

  if (ultimaFila < CONFIG_MARCAS.PRIMERA_FILA_DICCIONARIO) return modelo;

  const cantidad = ultimaFila - CONFIG_MARCAS.PRIMERA_FILA_DICCIONARIO + 1;
  const rango = hoja.getRange(CONFIG_MARCAS.PRIMERA_FILA_DICCIONARIO, 1, cantidad, 2);
  const valores = rango.getDisplayValues();
  const fondos = rango.getBackgrounds();
  const nombresCanonicos = new Map();
  const destinosPorVariante = new Map();
  const filasPorVariante = new Map();
  const formasTemporales = [];

  valores.forEach(function(fila, indice) {
    const varianteOriginal = String(fila[0] || '').trim();
    const marcaOficial = String(fila[1] || '').trim();
    const variante = normalizarMarca_(varianteOriginal);
    const claveCanonica = normalizarMarca_(marcaOficial);
    const numeroFila = CONFIG_MARCAS.PRIMERA_FILA_DICCIONARIO + indice;

    if (variante) modelo.variantesExistentes.add(variante);

    if (!varianteOriginal || !marcaOficial) {
      if (varianteOriginal && !marcaOficial) {
        modelo.totalPendientes++;
        modelo.filasParaRevision.push(numeroFila);
      }
      return;
    }

    modelo.totalRelaciones++;
    if (!nombresCanonicos.has(claveCanonica)) {
      nombresCanonicos.set(claveCanonica, marcaOficial);
    }

    if (!destinosPorVariante.has(variante)) destinosPorVariante.set(variante, new Set());
    destinosPorVariante.get(variante).add(claveCanonica);
    if (!filasPorVariante.has(variante)) filasPorVariante.set(variante, []);
    filasPorVariante.get(variante).push(numeroFila);

    formasTemporales.push({
      claveCanonica: claveCanonica,
      texto: variante
    });
    formasTemporales.push({
      claveCanonica: claveCanonica,
      texto: claveCanonica
    });

    if (esColorPendiente_(fondos[indice][0]) || esColorPendiente_(fondos[indice][1])) {
      modelo.filasAprobadasEnRojo.push(numeroFila);
    }
  });

  destinosPorVariante.forEach(function(destinos, variante) {
    if (destinos.size === 1) {
      const clave = Array.from(destinos)[0];
      modelo.exactas.set(variante, nombresCanonicos.get(clave));
    } else {
      const filasConflicto = filasPorVariante.get(variante) || [];
      Array.prototype.push.apply(modelo.filasParaRevision, filasConflicto);
      modelo.conflictos.push({
        variante: variante,
        marcas: Array.from(destinos).map(function(clave) {
          return nombresCanonicos.get(clave);
        })
      });
    }
  });

  modelo.filasParaRevision = Array.from(new Set(modelo.filasParaRevision));
  const filasRevision = new Set(modelo.filasParaRevision);
  modelo.filasAprobadasEnRojo = modelo.filasAprobadasEnRojo.filter(function(numeroFila) {
    return !filasRevision.has(numeroFila);
  });

  nombresCanonicos.forEach(function(nombre, clave) {
    if (!modelo.exactas.has(clave)) modelo.exactas.set(clave, nombre);
  });

  const formasVistas = new Set();
  formasTemporales.forEach(function(forma) {
    const identificador = forma.claveCanonica + '|' + forma.texto;
    if (formasVistas.has(identificador)) return;
    formasVistas.add(identificador);

    const marca = nombresCanonicos.get(forma.claveCanonica);
    const compacta = compactarMarca_(forma.texto);
    const firma = firmaConsonantica_(forma.texto);
    modelo.formas.push({
      claveCanonica: forma.claveCanonica,
      marca: marca,
      texto: forma.texto,
      compacta: compacta,
      firma: firma
    });

    if (firma.length >= CONFIG_MARCAS.LONGITUD_MINIMA_FIRMA) {
      if (!modelo.firmas.has(firma)) modelo.firmas.set(firma, new Set());
      modelo.firmas.get(firma).add(forma.claveCanonica);
    }
  });

  modelo.nombresCanonicos = nombresCanonicos;
  return modelo;
}

function procesarMarcas_(hoja, modelo) {
  const ultimaFila = hoja.getLastRow();
  const resultado = {
    filasRevisadas: 0,
    homologadas: 0,
    vacias: 0,
    pendientesYaRegistradas: 0,
    pendientes: new Map(),
    metodos: { exacta: 0, prefijo: 0, firma: 0, similitud: 0 }
  };

  if (ultimaFila < CONFIG_MARCAS.PRIMERA_FILA_DATOS) return resultado;

  const cantidad = ultimaFila - CONFIG_MARCAS.PRIMERA_FILA_DATOS + 1;
  const rango = hoja.getRange(
    CONFIG_MARCAS.PRIMERA_FILA_DATOS,
    CONFIG_MARCAS.COLUMNA_MARCA,
    cantidad,
    1
  );
  const valores = rango.getValues();
  const formulas = rango.getFormulas();
  let huboCambios = false;

  valores.forEach(function(fila, indice) {
    const valorOriginal = fila[0];
    const textoOriginal = String(valorOriginal == null ? '' : valorOriginal).trim();
    if (!textoOriginal) {
      resultado.vacias++;
      return;
    }

    resultado.filasRevisadas++;
    const clasificacion = clasificarMarca_(textoOriginal, modelo);

    if (clasificacion.segura) {
      if (String(valorOriginal) !== clasificacion.marca) {
        valores[indice][0] = clasificacion.marca;
        huboCambios = true;
      }
      resultado.homologadas++;
      resultado.metodos[clasificacion.metodo]++;
      return;
    }

    if (formulas[indice][0]) valores[indice][0] = formulas[indice][0];
    const normalizada = normalizarMarca_(textoOriginal);
    if (modelo.variantesExistentes.has(normalizada)) {
      resultado.pendientesYaRegistradas++;
      return;
    }

    if (!resultado.pendientes.has(normalizada)) {
      resultado.pendientes.set(normalizada, {
        original: textoOriginal,
        sugerencia: clasificacion.sugerencia || '',
        confianza: clasificacion.confianza || 0
      });
    }
  });

  if (huboCambios) rango.setValues(valores);
  return resultado;
}

function clasificarMarca_(textoOriginal, modelo) {
  const normalizada = normalizarMarca_(textoOriginal);
  const compacta = compactarMarca_(normalizada);

  if (modelo.exactas.has(normalizada)) {
    return resultadoSeguro_(modelo.exactas.get(normalizada), 'exacta', 1);
  }

  const porPrefijo = buscarPorPrefijo_(compacta, modelo.formas);
  if (porPrefijo) return resultadoSeguro_(porPrefijo, 'prefijo', 0.96);

  const firma = firmaConsonantica_(normalizada);
  if (firma.length >= CONFIG_MARCAS.LONGITUD_MINIMA_FIRMA && modelo.firmas.has(firma)) {
    const claves = modelo.firmas.get(firma);
    if (claves.size === 1) {
      const clave = Array.from(claves)[0];
      return resultadoSeguro_(modelo.nombresCanonicos.get(clave), 'firma', 0.94);
    }
  }

  const porSimilitud = buscarPorSimilitud_(compacta, modelo.formas);
  if (porSimilitud.segura) {
    return resultadoSeguro_(porSimilitud.marca, 'similitud', porSimilitud.confianza);
  }

  return {
    segura: false,
    marca: '',
    metodo: 'pendiente',
    confianza: porSimilitud.confianza,
    sugerencia: porSimilitud.marca
  };
}

function buscarPorPrefijo_(entrada, formas) {
  if (entrada.length < CONFIG_MARCAS.LONGITUD_MINIMA_PREFIJO) return '';

  const candidatas = new Map();
  formas.forEach(function(forma) {
    const candidata = forma.compacta;
    if (!candidata) return;

    const menor = Math.min(entrada.length, candidata.length);
    const mayor = Math.max(entrada.length, candidata.length);
    if (menor < CONFIG_MARCAS.LONGITUD_MINIMA_PREFIJO) return;
    if (menor / mayor < CONFIG_MARCAS.PROPORCION_MINIMA_PREFIJO) return;
    if (!entrada.startsWith(candidata) && !candidata.startsWith(entrada)) return;

    candidatas.set(forma.claveCanonica, forma.marca);
  });

  return candidatas.size === 1 ? Array.from(candidatas.values())[0] : '';
}

function buscarPorSimilitud_(entrada, formas) {
  if (entrada.length < CONFIG_MARCAS.LONGITUD_MINIMA_SIMILITUD) {
    return { segura: false, marca: '', confianza: 0 };
  }

  const puntajes = new Map();
  formas.forEach(function(forma) {
    if (!forma.compacta) return;
    const distancia = levenshteinMarcas_(entrada, forma.compacta);
    const longitud = Math.max(entrada.length, forma.compacta.length);
    const confianza = longitud ? 1 - distancia / longitud : 0;
    const actual = puntajes.get(forma.claveCanonica);
    if (!actual || confianza > actual.confianza) {
      puntajes.set(forma.claveCanonica, {
        marca: forma.marca,
        confianza: confianza
      });
    }
  });

  const ordenados = Array.from(puntajes.values()).sort(function(a, b) {
    return b.confianza - a.confianza;
  });
  if (!ordenados.length) return { segura: false, marca: '', confianza: 0 };

  const mejor = ordenados[0];
  const segundo = ordenados[1] || { confianza: 0 };
  const diferencia = mejor.confianza - segundo.confianza;
  return {
    segura: mejor.confianza >= CONFIG_MARCAS.CONFIANZA_MINIMA &&
      diferencia >= CONFIG_MARCAS.DIFERENCIA_MINIMA,
    marca: mejor.marca,
    confianza: mejor.confianza
  };
}

function registrarPendientes_(hoja, pendientes, variantesExistentes) {
  const nuevas = [];
  pendientes.forEach(function(pendiente, normalizada) {
    if (variantesExistentes.has(normalizada)) return;
    nuevas.push([pendiente.original, '']);
    variantesExistentes.add(normalizada);
    logMarcas_('PENDIENTE: se agregó una marca al diccionario para revisión.', {
      marcaRecibida: pendiente.original,
      sugerencia: pendiente.sugerencia || '(sin sugerencia)',
      confianza: pendiente.confianza
        ? Math.round(pendiente.confianza * 100) + '%'
        : '0%'
    });
  });

  if (!nuevas.length) return 0;

  const filaInicial = hoja.getLastRow() + 1;
  const rango = hoja.getRange(filaInicial, 1, nuevas.length, 2);
  rango.setValues(nuevas)
    .setBackground(CONFIG_MARCAS.COLOR_PENDIENTE)
    .setFontColor('#990000');
  return nuevas.length;
}

function limpiarFilasAprobadas_(hoja, filas) {
  filas.forEach(function(numeroFila) {
    hoja.getRange(numeroFila, 1, 1, 2)
      .setBackground(CONFIG_MARCAS.COLOR_APROBADO)
      .setFontColor('#000000');
  });

  if (filas.length) {
    logMarcas_('Se quitaron las marcas rojas de relaciones ya confirmadas.', {
      cantidad: filas.length
    });
  }
}

function marcarFilasParaRevision_(hoja, filas) {
  filas.forEach(function(numeroFila) {
    hoja.getRange(numeroFila, 1, 1, 2)
      .setBackground(CONFIG_MARCAS.COLOR_PENDIENTE)
      .setFontColor('#990000');
  });

  if (filas.length) {
    logMarcas_('Se marcaron en rojo las filas pendientes o con conflicto.', {
      cantidad: filas.length
    });
  }
}

function normalizarMarca_(valor) {
  return String(valor == null ? '' : valor)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactarMarca_(valor) {
  return normalizarMarca_(valor).replace(/\s+/g, '');
}

function firmaConsonantica_(valor) {
  return compactarMarca_(valor).replace(/[aeiou]/g, '');
}

function resultadoSeguro_(marca, metodo, confianza) {
  return {
    segura: true,
    marca: marca,
    metodo: metodo,
    confianza: confianza,
    sugerencia: marca
  };
}

function levenshteinMarcas_(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let anterior = [];
  let actual = [];
  for (let j = 0; j <= b.length; j++) anterior[j] = j;

  for (let i = 1; i <= a.length; i++) {
    actual = [i];
    for (let j = 1; j <= b.length; j++) {
      const costo = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      actual[j] = Math.min(
        anterior[j] + 1,
        actual[j - 1] + 1,
        anterior[j - 1] + costo
      );
    }
    anterior = actual;
  }
  return anterior[b.length];
}

function esColorPendiente_(color) {
  return String(color || '').toLowerCase() === CONFIG_MARCAS.COLOR_PENDIENTE;
}

function obtenerHojaObligatoria_(archivoId, nombreHoja) {
  const archivo = SpreadsheetApp.openById(archivoId);
  const hoja = archivo.getSheetByName(nombreHoja);
  if (!hoja) throw new Error('No se encontró la hoja "' + nombreHoja + '".');
  return hoja;
}

function logMarcas_(mensaje, datos) {
  const detalle = datos && typeof datos === 'object'
    ? Object.keys(datos).map(function(clave) {
        return clave + ': ' + String(datos[clave]);
      }).join(' | ')
    : '';
  Logger.log('[MARCAS] ' + mensaje + (detalle ? ' | ' + detalle : ''));
}
