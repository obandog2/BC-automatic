/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Genera una hoja de revisión para depurar el diccionario IVD sin alterar sus listas fuente.
 *
 * Validaciones para ejecutar auditarDiccionarioIVD():
 * 1) Las cuatro hojas de entrenamiento deben conservar categoría en A y término o entidad en B.
 * 2) La hoja Revision Diccionario IVD se puede reemplazar porque contiene solo resultados de auditoría.
 * 3) La hoja update del archivo de control debe conservar B2 con el texto exacto update.
 */

function auditarDiccionarioIVD() {
  if (!validarConArchivoControl()) return;
  return AuditorDiccionarioIVD.ejecutar();
}

const AuditorDiccionarioIVD = (function() {
  const CONFIGURACION = Object.freeze({
    prefijoLog: '[BCAT-0050]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    hojaRevision: 'Revision Diccionario IVD',
    hojas: Object.freeze([
      'KeyWordsDescriptionTraining (M)',
      'KeyWordsBuyerTraining (M)',
      'IrrelevantWordsTraining (M)',
      'IrrelevantWordsBuyerTraining (M)'
    ]),
    terminosGenericosIVD: new Set([
      'test', 'roche', 'laboratorio', 'determinacion', 'sangre', 'tubo', 'vial', 'punta',
      'tip', 'reactivo', 'diagnostico', 'molecular', 'cultivo', 'plasma', 'manual', 'programa',
      'material', 'producto', 'muestra', 'control', 'lectura', 'insumo', 'insumos', 'kit'
    ]),
    compradoresNoExclusivos: new Set([
      'roche', 'nipro', 'hospital', 'clinica', 'ministerio de salud', 'msp', 'iess', 'solca',
      'cruz roja', 'centro de salud', 'dispensario', 'laboratori', 'junta de beneficencia',
      'isspol', 'issfa'
    ]),
    terminosPharma: new Set([
      'medicament', 'farmac', 'pildora', 'tableta', 'jarabe', 'vacuna', 'trastuzumab',
      'rituximab', 'atezolizumab', 'bevacizumab', 'tocilizumab', 'ocrelizumab', 'alectinib',
      'ceftriaxona', 'pertuzumab', 'vemurafenib', 'faricimab', 'polatuzumab', 'risdiplam',
      'epoetina', 'dornasa', 'kadcyla', 'herceptin', 'mabthera', 'actemra', 'avastin'
    ])
  });

  function ejecutar() {
    try {
      Logger.log(CONFIGURACION.prefijoLog + ' Inicio de auditoría del diccionario IVD.');
      const libro = SpreadsheetApp.openById(CONFIGURACION.idDiccionario);
      const registros = leerRegistros_(libro);
      const hallazgos = detectarHallazgos_(registros);
      escribirRevision_(libro, hallazgos);

      const resumen = {
        registrosLeidos: registros.length,
        hallazgos: hallazgos.length
      };
      Logger.log(CONFIGURACION.prefijoLog + ' Auditoría terminada. | ' + JSON.stringify(resumen));
      return resumen;
    } catch (error) {
      Logger.log(CONFIGURACION.prefijoLog + ' ERROR en auditarDiccionarioIVD. | motivo: ' + error.message);
      throw error;
    }
  }

  function leerRegistros_(libro) {
    const registros = [];
    CONFIGURACION.hojas.forEach(function(nombreHoja) {
      const hoja = libro.getSheetByName(nombreHoja);
      if (!hoja) throw new Error('No se encontró la hoja de diccionario: ' + nombreHoja + '.');
      const ultimaFila = hoja.getLastRow();
      if (ultimaFila < 2) return;

      hoja.getRange(2, 1, ultimaFila - 1, 2).getDisplayValues().forEach(function(fila, indice) {
        const categoria = normalizar_(fila[0]).toUpperCase();
        const termino = normalizar_(fila[1]);
        if (!termino) return;
        registros.push({
          hoja: nombreHoja,
          fila: indice + 2,
          categoria: categoria,
          termino: termino,
          raiz: raiz_(termino)
        });
      });
    });
    return registros;
  }

  function detectarHallazgos_(registros) {
    const hallazgos = [];
    const porRaiz = new Map();

    registros.forEach(function(registro) {
      if (!porRaiz.has(registro.raiz)) porRaiz.set(registro.raiz, []);
      porRaiz.get(registro.raiz).push(registro);

      if (compactar_(registro.termino).length < 3) {
        agregarHallazgo_(hallazgos, registro, 'Término muy corto', 'Eliminar o revisar', 'Los fragmentos menores de tres caracteres son ambiguos.');
      }

      if (registro.hoja === 'KeyWordsDescriptionTraining (M)' && CONFIGURACION.terminosGenericosIVD.has(registro.termino)) {
        agregarHallazgo_(hallazgos, registro, 'Evidencia IVD genérica', 'Quitar de puntuación IVD', 'Puede aparecer en IVD, Pharma, dispositivos o logística.');
      }

      if (registro.hoja === 'KeyWordsBuyerTraining (M)' && CONFIGURACION.compradoresNoExclusivos.has(registro.termino)) {
        agregarHallazgo_(hallazgos, registro, 'Comprador no exclusivo', 'Quitar de compradores IVD', 'La entidad compra o comercializa más de una categoría.');
      }

      if (registro.hoja === 'IrrelevantWordsTraining (M)' && registro.categoria === 'NO ES IVD' && CONFIGURACION.terminosPharma.has(registro.termino)) {
        agregarHallazgo_(hallazgos, registro, 'Término Pharma mal categorizado', 'Cambiar categoría a PHARMA', 'Con la categoría actual el clasificador devuelve 0,00 % en vez de PHARMA.');
      }
    });

    porRaiz.forEach(function(grupo) {
      const tieneIVD = grupo.some(function(registro) { return registro.categoria === 'IVD'; });
      const tieneIrrelevante = grupo.some(function(registro) {
        return registro.categoria === 'NO ES IVD' || registro.categoria === 'PHARMA';
      });
      if (!tieneIVD || !tieneIrrelevante) return;

      grupo.forEach(function(registro) {
        agregarHallazgo_(hallazgos, registro, 'Conflicto entre categorías', 'Decidir una sola función', 'La misma raíz aparece como IVD y como descarte o Pharma.');
      });
    });

    return hallazgos.sort(function(a, b) {
      return a.hoja.localeCompare(b.hoja) || a.fila - b.fila || a.tipo.localeCompare(b.tipo);
    });
  }

  function agregarHallazgo_(hallazgos, registro, tipo, accion, motivo) {
    hallazgos.push({
      hoja: registro.hoja,
      fila: registro.fila,
      categoria: registro.categoria,
      termino: registro.termino,
      tipo: tipo,
      accion: accion,
      motivo: motivo
    });
  }

  function escribirRevision_(libro, hallazgos) {
    let hoja = libro.getSheetByName(CONFIGURACION.hojaRevision);
    if (!hoja) hoja = libro.insertSheet(CONFIGURACION.hojaRevision);

    hoja.clearContents();
    hoja.getRange(1, 1, 1, 7).setValues([[
      'Hoja origen', 'Fila origen', 'Categoría actual', 'Término', 'Tipo de hallazgo', 'Acción sugerida', 'Motivo'
    ]]);

    if (hallazgos.length) {
      hoja.getRange(2, 1, hallazgos.length, 7).setValues(hallazgos.map(function(hallazgo) {
        return [hallazgo.hoja, hallazgo.fila, hallazgo.categoria, hallazgo.termino, hallazgo.tipo, hallazgo.accion, hallazgo.motivo];
      }));
    }

    hoja.setFrozenRows(1);
    hoja.autoResizeColumns(1, 7);
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactar_(texto) {
    return texto.replace(/\s/g, '');
  }

  function raiz_(texto) {
    const compacto = compactar_(texto);
    return compacto.length > 4 && compacto.endsWith('s') ? compacto.slice(0, -1) : compacto;
  }

  return { ejecutar: ejecutar };
})();
