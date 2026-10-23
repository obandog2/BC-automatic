/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Homologa las marcas de la columna H y aprende variantes seguras en el diccionario.
 *
 * Validaciones para ejecutar homologarMarcas():
 * 1) La hoja 2026 debe existir en el archivo destino y la columna H debe contener una marca por fila.
 * 2) La hoja Marcas Homologadas debe conservar A como variante y B como marca oficial.
 * 3) La hoja update del archivo de control debe conservar B2 con el texto exacto update.
 */

function homologarMarcas() {
  if (!validarConArchivoControl()) return;
  return SistemaHomologacionMarcas.ejecutar();
}

const SistemaHomologacionMarcas = (function() {
  const CONFIGURACION = Object.freeze({
    prefijoLog: '[BCAT-0016]',
    idDestino: '1iqn2M5Z_iJcM-D9oN95xoV0qVfjjDv8XBHNZ8apCb7Q',
    hojaDestino: '2026',
    columnaMarca: 8,
    primeraFilaDatos: 2,
    idDiccionario: '1fSKIi1za_nTEnQSQSD-tlMT9RDuJs9B2yvXY3DVoy5o',
    hojaDiccionario: 'Marcas Homologadas',
    colorPendiente: '#f4cccc',
    colorAprobado: '#ffffff',
    longitudMinimaPrefijo: 4,
    proporcionMinimaPrefijo: 0.75,
    longitudMinimaFirma: 3,
    confianzaMinima: 0.86,
    diferenciaMinima: 0.12
  });

  function ejecutar() {
    let bloqueo;
    try {
      Logger.log(CONFIGURACION.prefijoLog + ' Inicio de homologación de marcas.');
      bloqueo = LockService.getScriptLock();
      bloqueo.waitLock(30000);

      const hojaDestino = obtenerHoja_(CONFIGURACION.idDestino, CONFIGURACION.hojaDestino);
      const hojaDiccionario = obtenerHoja_(CONFIGURACION.idDiccionario, CONFIGURACION.hojaDiccionario);
      const modelo = crearModelo_(hojaDiccionario);

      pintarFilas_(hojaDiccionario, modelo.filasAprobadasEnRojo, CONFIGURACION.colorAprobado);
      pintarFilas_(hojaDiccionario, modelo.filasRevision, CONFIGURACION.colorPendiente);
      Logger.log(CONFIGURACION.prefijoLog + ' Diccionario cargado. | relaciones: ' + modelo.relaciones + ' | pendientes: ' + modelo.pendientes + ' | conflictos: ' + modelo.conflictos.length);
      modelo.conflictos.forEach(function(variante) {
        Logger.log(CONFIGURACION.prefijoLog + ' CONFLICTO: la variante no se aplicará hasta corregir el diccionario. | variante: ' + variante);
      });

      const resultado = procesarColumnaH_(hojaDestino, modelo);
      const aprendizaje = guardarAprendizajes_(hojaDiccionario, modelo, resultado.aprendizajes, resultado.pendientes);
      const resumen = {
        filasRevisadas: resultado.filasRevisadas,
        homologadas: resultado.homologadas,
        aprendidas: aprendizaje.aprendidas,
        pendientesNuevas: aprendizaje.pendientes,
        conflictos: modelo.conflictos.length,
        formulasOmitidas: resultado.formulasOmitidas,
        vacias: resultado.vacias
      };
      Logger.log(CONFIGURACION.prefijoLog + ' Homologación terminada. | ' + JSON.stringify(resumen));
      return resumen;
    } catch (error) {
      Logger.log(CONFIGURACION.prefijoLog + ' ERROR en homologarMarcas. | motivo: ' + error.message);
      throw error;
    } finally {
      if (bloqueo && bloqueo.hasLock()) bloqueo.releaseLock();
    }
  }

  function obtenerHoja_(idArchivo, nombreHoja) {
    const hoja = SpreadsheetApp.openById(idArchivo).getSheetByName(nombreHoja);
    if (!hoja) throw new Error('No se encontró la hoja obligatoria: ' + nombreHoja + '.');
    return hoja;
  }

  function crearModelo_(hoja) {
    const modelo = {
      exactas: new Map(), formas: [], firmas: new Map(), filas: new Map(), existentes: new Set(),
      filasAprobadasEnRojo: [], filasRevision: [], conflictos: [], relaciones: 0, pendientes: 0
    };
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) return modelo;

    const cantidad = ultimaFila - 1;
    const rango = hoja.getRange(2, 1, cantidad, 2);
    const valores = rango.getDisplayValues();
    const fondos = rango.getBackgrounds();
    const destinos = new Map();
    const filasPorVariante = new Map();
    const nombresCanonicos = new Map();

    valores.forEach(function(fila, indice) {
      const variante = normalizar_(fila[0]);
      const marca = String(fila[1] || '').trim();
      const numeroFila = indice + 2;
      if (!variante) return;

      modelo.existentes.add(variante);
      if (!modelo.filas.has(variante)) modelo.filas.set(variante, { fila: numeroFila, homologada: marca });
      if (!filasPorVariante.has(variante)) filasPorVariante.set(variante, []);
      filasPorVariante.get(variante).push(numeroFila);

      if (!marca) {
        modelo.pendientes++;
        modelo.filasRevision.push(numeroFila);
        return;
      }

      modelo.relaciones++;
      const canonica = normalizar_(marca);
      if (!nombresCanonicos.has(canonica)) nombresCanonicos.set(canonica, marca);
      if (!destinos.has(variante)) destinos.set(variante, new Set());
      destinos.get(variante).add(canonica);

      if (esColorPendiente_(fondos[indice][0]) || esColorPendiente_(fondos[indice][1])) {
        modelo.filasAprobadasEnRojo.push(numeroFila);
      }
    });

    destinos.forEach(function(marcas, variante) {
      if (marcas.size !== 1) {
        Array.prototype.push.apply(modelo.filasRevision, filasPorVariante.get(variante));
        modelo.conflictos.push(variante);
        return;
      }
      modelo.exactas.set(variante, nombresCanonicos.get(Array.from(marcas)[0]));
    });

    nombresCanonicos.forEach(function(marca, canonica) {
      if (!modelo.exactas.has(canonica)) modelo.exactas.set(canonica, marca);
    });
    modelo.exactas.forEach(function(marca, variante) {
      agregarForma_(modelo, variante, marca);
      agregarForma_(modelo, normalizar_(marca), marca);
    });

    modelo.filasRevision = Array.from(new Set(modelo.filasRevision));
    const filasRevision = new Set(modelo.filasRevision);
    modelo.filasAprobadasEnRojo = modelo.filasAprobadasEnRojo.filter(function(fila) {
      return !filasRevision.has(fila);
    });
    return modelo;
  }

  function agregarForma_(modelo, texto, marca) {
    const compacta = compactar_(texto);
    if (!modelo.formas.some(function(forma) { return forma.texto === texto && forma.marca === marca; })) {
      modelo.formas.push({ texto: texto, compacta: compacta, marca: marca });
    }
    const firma = firmaConsonantica_(texto);
    if (firma.length >= CONFIGURACION.longitudMinimaFirma) {
      if (!modelo.firmas.has(firma)) modelo.firmas.set(firma, new Set());
      modelo.firmas.get(firma).add(marca);
    }
  }

  function procesarColumnaH_(hoja, modelo) {
    const resultado = {
      filasRevisadas: 0, homologadas: 0, formulasOmitidas: 0, vacias: 0,
      aprendizajes: new Map(), pendientes: new Map()
    };
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < CONFIGURACION.primeraFilaDatos) return resultado;

    const cantidad = ultimaFila - CONFIGURACION.primeraFilaDatos + 1;
    const rango = hoja.getRange(CONFIGURACION.primeraFilaDatos, CONFIGURACION.columnaMarca, cantidad, 1);
    const valores = rango.getValues();
    const formulas = rango.getFormulas();
    let huboCambios = false;

    valores.forEach(function(fila, indice) {
      const original = String(fila[0] == null ? '' : fila[0]).trim();
      if (!original) {
        resultado.vacias++;
        return;
      }
      if (formulas[indice][0]) {
        resultado.formulasOmitidas++;
        return;
      }

      resultado.filasRevisadas++;
      const clasificacion = clasificar_(original, modelo);
      const clave = normalizar_(original);
      if (clasificacion.segura) {
        if (original !== clasificacion.marca) {
          valores[indice][0] = clasificacion.marca;
          huboCambios = true;
        }
        resultado.homologadas++;
        if (!modelo.exactas.has(clave)) {
          resultado.aprendizajes.set(clave, { variante: original.toUpperCase(), homologada: clasificacion.marca });
        }
      } else if (!modelo.existentes.has(clave)) {
        resultado.pendientes.set(clave, original.toUpperCase());
      }
    });

    if (huboCambios) rango.setValues(valores);
    return resultado;
  }

  function clasificar_(original, modelo) {
    const texto = normalizar_(original);
    const compacta = compactar_(texto);
    if (modelo.exactas.has(texto)) return { segura: true, marca: modelo.exactas.get(texto) };

    const prefijo = buscarPorPrefijo_(compacta, modelo.formas);
    if (prefijo) return { segura: true, marca: prefijo };

    const firma = firmaConsonantica_(texto);
    const marcasFirma = modelo.firmas.get(firma);
    if (firma.length >= CONFIGURACION.longitudMinimaFirma && marcasFirma && marcasFirma.size === 1) {
      return { segura: true, marca: Array.from(marcasFirma)[0] };
    }
    return buscarPorSimilitud_(compacta, modelo.formas);
  }

  function buscarPorPrefijo_(entrada, formas) {
    if (entrada.length < CONFIGURACION.longitudMinimaPrefijo) return '';
    const candidatas = new Set();
    formas.forEach(function(forma) {
      const menor = Math.min(entrada.length, forma.compacta.length);
      const mayor = Math.max(entrada.length, forma.compacta.length);
      if (menor && menor / mayor >= CONFIGURACION.proporcionMinimaPrefijo &&
          (entrada.indexOf(forma.compacta) === 0 || forma.compacta.indexOf(entrada) === 0)) {
        candidatas.add(forma.marca);
      }
    });
    return candidatas.size === 1 ? Array.from(candidatas)[0] : '';
  }

  function buscarPorSimilitud_(entrada, formas) {
    if (entrada.length < 5) return { segura: false, marca: '' };
    const puntuaciones = new Map();
    formas.forEach(function(forma) {
      const longitud = Math.max(entrada.length, forma.compacta.length);
      if (!longitud) return;
      const confianza = 1 - distanciaLevenshtein_(entrada, forma.compacta) / longitud;
      if (confianza > (puntuaciones.get(forma.marca) || 0)) puntuaciones.set(forma.marca, confianza);
    });
    const candidatas = Array.from(puntuaciones.entries())
      .map(function(par) { return { marca: par[0], confianza: par[1] }; })
      .sort(function(a, b) { return b.confianza - a.confianza; });
    if (!candidatas.length) return { segura: false, marca: '' };
    const mejor = candidatas[0];
    const diferencia = candidatas[1] ? mejor.confianza - candidatas[1].confianza : mejor.confianza;
    return {
      segura: mejor.confianza >= CONFIGURACION.confianzaMinima && diferencia >= CONFIGURACION.diferenciaMinima,
      marca: mejor.marca
    };
  }

  function guardarAprendizajes_(hoja, modelo, aprendizajes, pendientes) {
    let aprendidas = 0;
    let pendientesNuevas = 0;
    const filasNuevas = [];
    aprendizajes.forEach(function(aprendizaje, clave) {
      const existente = modelo.filas.get(clave);
      if (existente && !existente.homologada) {
        hoja.getRange(existente.fila, 1, 1, 2).setValues([[aprendizaje.variante, aprendizaje.homologada]]).setBackground(CONFIGURACION.colorAprobado);
        aprendidas++;
      } else if (!existente) {
        filasNuevas.push([aprendizaje.variante, aprendizaje.homologada]);
        aprendidas++;
      }
    });
    pendientes.forEach(function(variante, clave) {
      if (!modelo.existentes.has(clave)) {
        filasNuevas.push([variante, '']);
        pendientesNuevas++;
      }
    });
    if (filasNuevas.length) {
      const rango = hoja.getRange(hoja.getLastRow() + 1, 1, filasNuevas.length, 2);
      rango.setValues(filasNuevas);
      rango.setBackgrounds(filasNuevas.map(function(fila) {
        return fila[1] ? [CONFIGURACION.colorAprobado, CONFIGURACION.colorAprobado] : [CONFIGURACION.colorPendiente, CONFIGURACION.colorPendiente];
      }));
    }
    Logger.log(CONFIGURACION.prefijoLog + ' Aprendizaje guardado. | aliases: ' + aprendidas + ' | pendientes nuevas: ' + pendientesNuevas);
    return { aprendidas: aprendidas, pendientes: pendientesNuevas };
  }

  function pintarFilas_(hoja, filas, color) {
    if (filas.length) hoja.getRangeList(filas.map(function(fila) { return 'A' + fila + ':B' + fila; })).setBackground(color);
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function compactar_(valor) {
    return normalizar_(valor).replace(/\s/g, '');
  }

  function firmaConsonantica_(valor) {
    return compactar_(valor).replace(/[aeiou]/g, '');
  }

  function distanciaLevenshtein_(a, b) {
    let anterior = Array.from({ length: b.length + 1 }, function(_, indice) { return indice; });
    for (let i = 1; i <= a.length; i++) {
      const actual = [i];
      for (let j = 1; j <= b.length; j++) {
        actual[j] = a[i - 1] === b[j - 1] ? anterior[j - 1] : Math.min(anterior[j - 1] + 1, actual[j - 1] + 1, anterior[j] + 1);
      }
      anterior = actual;
    }
    return anterior[b.length];
  }

  function esColorPendiente_(color) {
    return String(color || '').toLowerCase() === CONFIGURACION.colorPendiente;
  }

  return { ejecutar: ejecutar };
})();

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
