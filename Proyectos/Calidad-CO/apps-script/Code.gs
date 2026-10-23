/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Conecta directamente a la base de datos de Calidad Colombia por ID fijo,
 * procesa notificaciones, maneja acciones CAPA en hojas separadas (internas vs proveedores),
 * administra eliminación/actualización de planes con evidencia de seguimiento y alimenta los tableros.
 */

const CALIDAD_CO = (() => {
  const PROP = PropertiesService.getScriptProperties();
  const BASE_ID = '1o7kOqcIa0y3iO8EGrVZbLfbFoN5pAXiq6RWb6EIbFHM';
  const PLANES_CO = 'Planes de acción-int';
  const PLANES_PROV = 'Planes de acción-prov';
  const CONFIG = 'Configuración';
  const HOJAS = ['NC interna', 'NC proveedores', 'Oportunidad Mejora', 'Extensión', 'Diferencia'];

  const CORREOS_AUTORIZADOS_ELIMINAR = [
    'gabriela.obando_angulo@external.roche.com',
    'paula.cortes@roche.com',
    'alexa.yunda@roche.com'
  ];

  const H_NC = [
    'ID de solicitud','Tipo de notificación','Evaluación QR','Responsable de la NC/CAPA',
    'Fecha del incumplimiento o identificación de mejora','Fecha de registro','Código NC SAP',
    'Título / Descripción breve','Reincidencia','Fecha de cierre de la NC','Estado NC',
    'Riesgo (Bajo-Moderado-Alto)','Código CAPA SAP','Fecha de cierre de CAPA','Estado CAPA',
    'Extensión (Indicar n°)','Comentario','Responsable','Correo electrónico','Evidencia general',
    'Evaluación de seguridad','Formato de proveedor','Formato ausencia NC','Detalles adicionales','URL de respuesta'
  ];

  const H_PLANES = [
    'ID de solicitud','Número de plan','Descripción del plan de acción','Responsable',
    'Correo del responsable','Fecha de compromiso','Estado del plan','Comentario',
    'Fecha de creación','Fecha de actualización','Correo electrónico',
    'Evidencia de acción inmediata','Documento de plan de acción',
    'Investigación y causa raíz','URL de respuesta','Evidencia de seguimiento'
  ];

  const t = v => String(v == null ? '' : v).trim();
  const limpiarH = h => String(h || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizar = text => String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  const correoValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t(v));

  const log = msg => Logger.log('[CALIDAD CO] ' + msg);

  const validarPermisoEliminar = () => {
    const correo = t(Session.getActiveUser().getEmail()).toLowerCase();

    if (!correo) {
      log('Intento de eliminación bloqueado: no fue posible identificar al usuario.');
      throw new Error('No fue posible identificar su correo. No tiene permiso para eliminar planes.');
    }

    if (!CORREOS_AUTORIZADOS_ELIMINAR.includes(correo)) {
      log('Intento de eliminación bloqueado para el correo: ' + correo);
      throw new Error('No tiene permiso para eliminar planes de acción.');
    }

    return correo;
  };

  const tipoNormalizado = valor => {
    const x = t(valor).toLowerCase();
    if (/proveedor|supplier|extern/.test(x)) return 'Proveedor';
    if (/diferencia|variance/.test(x)) return 'Diferencia (Variance)';
    if (/ausencia|oportunidad/.test(x)) return 'Ausencia de NC / Oportunidad de mejora';
    if (/extensi/.test(x)) return 'Extensión de fecha';
    return 'NC interna';
  };

  const ruta = tipo => ({
    'NC interna': { hoja: 'NC interna', prefijo: 'NCI-' },
    'Proveedor': { hoja: 'NC proveedores', prefijo: 'NCP-' },
    'Ausencia de NC / Oportunidad de mejora': { hoja: 'Oportunidad Mejora', prefijo: 'OPM-' },
    'Extensión de fecha': { hoja: 'Extensión', prefijo: 'EXT-' },
    'Diferencia (Variance)': { hoja: 'Diferencia', prefijo: 'DIF-' }
  }[tipo] || { hoja: 'NC interna', prefijo: 'NCI-' });

  const obtenerHojaPlanesPorId = id => {
    const norm = normalizar(id);
    if (norm.startsWith('NCP')) {
      return PLANES_PROV;
    }
    return PLANES_CO;
  };

  const obtenerHojaSolicitudPorId = id => {
    const norm = normalizar(id);

    if (norm.startsWith('NCI')) return 'NC interna';
    if (norm.startsWith('NCP')) return 'NC proveedores';
    if (norm.startsWith('OPM')) return 'Oportunidad Mejora';
    if (norm.startsWith('EXT')) return 'Extensión';
    if (norm.startsWith('DIF')) return 'Diferencia';

    throw new Error('El ID debe iniciar con NCI-, NCP-, OPM-, EXT- o DIF-.');
  };

  const base = () => SpreadsheetApp.openById(BASE_ID);

  const asegurarHoja = (ss, nombre, encabezados) => {
    let h = ss.getSheetByName(nombre);
    if (!h) {
      h = ss.insertSheet(nombre);
      h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
      h.getRange(1, 1, 1, encabezados.length)
        .setFontWeight('bold').setBackground('#004b87')
        .setFontColor('#ffffff').setWrap(true);
      h.setFrozenRows(1);
      log('Hoja creada: ' + nombre);
    } else {
      const actuales = h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1)).getDisplayValues()[0].map(limpiarH);
      const faltantes = encabezados.filter(x => !actuales.includes(x));
      if (faltantes.length) {
        const inicio = h.getLastColumn() + 1;
        h.getRange(1, inicio, 1, faltantes.length).setValues([faltantes]);
        h.getRange(1, inicio, 1, faltantes.length)
          .setFontWeight('bold').setBackground('#004b87')
          .setFontColor('#ffffff').setWrap(true);
        log('Encabezados actualizados en ' + nombre + ': ' + faltantes.join(', '));
      }
    }
    return h;
  };

  const siguienteId = (hoja, prefijo) => {
    let mayor = 0;
    if (hoja.getLastRow() > 1) {
      const patron = new RegExp('^' + prefijo.replace('-', '\\-') + '(\\d+)$', 'i');
      hoja.getRange(2, 1, hoja.getLastRow() - 1, 1)
        .getDisplayValues()
        .forEach(fila => {
          const m = t(fila[0]).match(patron);
          if (m) mayor = Math.max(mayor, Number(m[1]));
        });
    }
    return prefijo + String(mayor + 1).padStart(3, '0');
  };

  const fecha = valor => {
    if (!valor) return '';
    if (valor instanceof Date) return valor;
    const partes = String(valor).split('-');
    if (partes.length === 3 && partes[0].length === 4) {
      return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    }
    return new Date(valor);
  };

  const guardarArchivos = (adjuntos, id) => {
    if (!adjuntos || !adjuntos.length) return [];

    let carpetaId = PROP.getProperty('CALIDAD_CO_CARPETA_ADJUNTOS');
    let carpeta;
    if (carpetaId) {
      try {
        carpeta = DriveApp.getFolderById(carpetaId);
      } catch (e) {
        carpeta = DriveApp.createFolder('Adjuntos - Calidad Colombia');
        PROP.setProperty('CALIDAD_CO_CARPETA_ADJUNTOS', carpeta.getId());
      }
    } else {
      carpeta = DriveApp.createFolder('Adjuntos - Calidad Colombia');
      PROP.setProperty('CALIDAD_CO_CARPETA_ADJUNTOS', carpeta.getId());
    }

    return adjuntos.map((a, i) => {
      const bytes = Utilities.base64Decode(t(a.base64));
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
        throw new Error('Cada archivo debe tener un tamaño máximo de 10 MB.');
      }

      const archivo = carpeta.createFile(
        Utilities.newBlob(
          bytes,
          t(a.tipo) || 'application/octet-stream',
          id + ' - ' + (t(a.nombre) || ('adjunto-' + (i + 1)))
        )
      );

      return { categoria: t(a.categoria) || 'seguimiento', url: archivo.getUrl() };
    });
  };

  const porCategoria = archivos => archivos.reduce((r, a) => {
    const cat = a.categoria || 'evidencia';
    r[cat] = r[cat] ? r[cat] + '\n' + a.url : a.url;
    return r;
  }, {});

  const contarPlanes = (hoja, id) => {
    if (hoja.getLastRow() < 2) return 0;
    return hoja.getRange(2, 1, hoja.getLastRow() - 1, 1)
      .getDisplayValues()
      .filter(f => normalizar(f[0]) === normalizar(id)).length;
  };

  const enviarCorreos = (ss, datos) => {
    if (!['NC interna', 'Proveedor'].includes(datos.tipo)) return;

    try {
      const p = datos.payload;
      const tipoTexto = datos.tipo === 'Proveedor' ? 'NC de Proveedor' : 'Proceso Interno';
      const asunto = datos.id + '-' + tipoTexto;
      const baseUrl = ScriptApp.getService().getUrl();
      const monitor = baseUrl + '?pagina=monitor&id=' + encodeURIComponent(datos.id);
      const enlaceFormularioCapa = baseUrl + '?pagina=capa&id=' + encodeURIComponent(datos.id);

      let detalle = {};
      try { detalle = JSON.parse(p.detalleAdicional || '{}'); } catch (e) {}

      const f = fecha(p.fechaIdentificacion);
      const fechaTexto = f && !isNaN(f.getTime())
        ? Utilities.formatDate(f, Session.getScriptTimeZone(), 'dd/MM/yyyy')
        : 'No especificada';

      let riesgoFormat = "NA";
      const riesgoCrudo = t(p.riesgo).toLowerCase();
      if (riesgoCrudo.includes("bajo")) riesgoFormat = "Riesgo Bajo 🟢";
      else if (riesgoCrudo.includes("moderado")) riesgoFormat = "Riesgo Moderado 🟡";
      else if (riesgoCrudo.includes("alto")) riesgoFormat = "Riesgo Alto 🔴";
      else riesgoFormat = t(p.riesgo) || "NA";

      const areaResponsableTexto = t(p.responsableNC) || 'No especificada';
      const personasResponsablesTexto = t(p.responsable) || 'No especificado';

      let adjuntosHtml = '';
      if (datos.archivosLista && datos.archivosLista.length > 0) {
        const enlaces = datos.archivosLista.map((a, i) =>
          `<a href="${a.url}" target="_blank" style="color:#005A9C;font-weight:bold;">Adjunto ${i + 1} (${a.categoria || 'Evidencia'})</a>`
        ).join('<br>');
        adjuntosHtml = `<p style="margin:6px 0;"><strong>Archivos adjuntos:</strong><br>${enlaces}</p>`;
      } else {
        adjuntosHtml = `<p style="margin:6px 0;"><strong>Archivos adjuntos:</strong> Sin archivos adjuntos</p>`;
      }

      const bloque = `
        <div style="background:#f4f5f7;border-left:4px solid #005A9C;padding:15px;margin:25px 0">
          <p style="margin:6px 0;"><strong>ID de solicitud:</strong> ${datos.id}</p>
          <p style="margin:6px 0;"><strong>Área que reporta:</strong> ${detalle.areaReporta || detalle.areaReportaProveedor || 'No especificada'}</p>
          <p style="margin:6px 0;"><strong>Área responsable:</strong> ${areaResponsableTexto}</p>
          <p style="margin:6px 0;"><strong>País:</strong> Colombia</p>
          <p style="margin:6px 0;"><strong>Fecha del incumplimiento:</strong> ${fechaTexto}</p>
          <p style="margin:6px 0;"><strong>Personas responsables:</strong> ${personasResponsablesTexto}</p>
          <p style="margin:6px 0;"><strong>Descripción:</strong> ${t(p.descripcion)}</p>
          <p style="margin:6px 0;"><strong>Riesgo:</strong> ${riesgoFormat}</p>
          ${adjuntosHtml}
        </div>`;

      const instruccionPlanAccion = `
        <p style="margin:20px 0;line-height:1.6;color:#333333;">
          Reúnase con su equipo, Analice la causa raíz de esta No conformidad con una metodología apropiada (Espina de pescado, 5 porqués?, Etc) y genere un plan de acciones correctivas o preventivas para mitigar la causa raíz. Remita esta información en este <a href="${enlaceFormularioCapa}" style="color:#005A9C;font-weight:bold;text-decoration:underline;">form</a> dentro de los siguientes 8 días hábiles. Comuníquese con calidad si tiene dudas del procedimiento.
        </p>`;

      const inicio = `<div style="font-family:Arial,sans-serif;color:#333;max-width:650px;margin:auto;line-height:1.5">
        <div style="text-align:right"><img src="https://lh3.googleusercontent.com/d/1vsYZaquFToJi11vd611aXlvwT-bBTo4N" width="120"></div>`;

      const fin = `<p style="text-align:center;color:#005A9C;font-style:italic;font-weight:bold;margin-top:40px">
        ¡Do it smart, do it remote, do it automatic!
      </p></div>`;

      const listaDestinatarios = [];

      if (correoValido(p.correo)) listaDestinatarios.push(t(p.correo));

      if (p.responsable) {
        p.responsable.split(/[,;]+/).forEach(c => {
          const correoLimpio = t(c);
          if (correoValido(correoLimpio) && !listaDestinatarios.includes(correoLimpio)) {
            listaDestinatarios.push(correoLimpio);
          }
        });
      }

      const correosFijos = ['alexa.yunda@roche.com', 'paula.cortes@roche.com', 'gabriela.obando_angulo@external.roche.com'];
      correosFijos.forEach(c => {
        if (correoValido(c) && !listaDestinatarios.includes(c)) {
          listaDestinatarios.push(c);
        }
      });

      if (listaDestinatarios.length > 0) {
        MailApp.sendEmail({
          to: listaDestinatarios.join(','),
          subject: asunto,
          name: 'Calidad Colombia',
          htmlBody: inicio +
            `<p>Estimado equipo,</p>
             <p>Se ha ingresado una nueva NC. Favor validarla y, si procede, generar la NC en SAP incluyendo el <strong>ID de solicitud en el título de SAP</strong>.</p>` +
            bloque +
            instruccionPlanAccion +
            `<p><a href="${ss.getUrl()}" style="color:#005A9C;font-weight:bold;">Abrir base de datos</a> ·
            <a href="${monitor}" style="color:#005A9C;font-weight:bold;">Abrir monitor</a></p>` +
            fin
        });
        log('Correo enviado para ID ' + datos.id);
      }

    } catch (e) {
      log('La NC fue guardada, pero falló el envío de correo: ' + e.message);
    }
  };

  const guardarNotificacionWeb = datos => {
    if (!validarConArchivoControl()) return;

    const p = datos || {};
    if (!t(p.tipo) || !t(p.descripcion) || !correoValido(p.correo)) {
      throw new Error('Complete el tipo, la descripción y un correo electrónico válido.');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const ss = base();
      const tipo = tipoNormalizado(p.tipo);
      const destino = ruta(tipo);
      const hoja = asegurarHoja(ss, destino.hoja, H_NC);

      const id = siguienteId(hoja, destino.prefijo);

      const listaArchivos = guardarArchivos(p.adjuntos || [], id);
      const archivos = porCategoria(listaArchivos);

      hoja.appendRow([
        id,
        tipo,
        t(p.evaluacionQR),
        t(p.responsableNC),
        fecha(p.fechaIdentificacion),
        new Date(),
        t(p.codigoNCSAP),
        t(p.descripcion),
        t(p.reincidencia),
        '',
        t(p.estadoNC || 'Abierta'),
        t(p.riesgo),
        t(p.codigoCAPASAP),
        '',
        t(p.estadoCAPA || 'No aplica'),
        t(p.extension),
        t(p.comentario),
        t(p.responsable),
        t(p.correo),
        archivos.evidencia || '',
        archivos.seguridad || '',
        archivos.proveedor || '',
        archivos.ausencia || '',
        t(p.detalleAdicional),
        ''
      ]);

      log('Notificación guardada con ID: ' + id);

      enviarCorreos(ss, { id: id, tipo: tipo, payload: p, archivosLista: listaArchivos });
      return { id: id };
    } finally {
      lock.releaseLock();
    }
  };

  const guardarCAPAWeb = datos => {
    if (!validarConArchivoControl()) return;

    const p = datos || {};
    const id = t(p.idSolicitud);

    if (!id || !t(p.causaRaiz) || !correoValido(p.correo)) {
      throw new Error('Indique el ID de solicitud, causa raíz final y correo electrónico válido.');
    }

    const acciones = Array.isArray(p.acciones)
      ? p.acciones.filter(a => t(a.descripcion))
      : [];

    if (!acciones.length) throw new Error('Agregue al menos una acción.');

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const ss = base();
      const nombreHojaDestino = obtenerHojaPlanesPorId(id);
      const hojaPlanes = asegurarHoja(ss, nombreHojaDestino, H_PLANES);
      const archivos = porCategoria(guardarArchivos(p.adjuntos || [], id));
      const primerNumero = contarPlanes(hojaPlanes, id) + 1;

      acciones.forEach((accion, i) => {
        const ahora = new Date();

        hojaPlanes.appendRow([
          id,
          primerNumero + i,
          t(accion.descripcion),
          t(accion.responsable),
          t(accion.correo),
          fecha(accion.fecha),
          t(accion.estado || 'Pendiente'),
          t(accion.comentario),
          ahora,
          ahora,
          t(p.correo),
          archivos.inmediata || '',
          archivos.plan || '',
          t(p.investigacion) + '\nCausa raíz final: ' + t(p.causaRaiz),
          '',
          archivos.seguimiento || ''
        ]);
      });

      log('Guardadas ' + acciones.length + ' acciones para el ID ' + id + ' en ' + nombreHojaDestino);

      return { id: id, acciones: acciones.length };
    } finally {
      lock.releaseLock();
    }
  };

  const leerObjetos = nombre => {
    const hoja = base().getSheetByName(nombre);
    if (!hoja || hoja.getLastRow() < 2) return [];

    const valores = hoja.getDataRange().getDisplayValues();
    const encabezados = valores.shift().map(limpiarH);

    return valores.filter(f => f.some(x => x !== '')).map(fila =>
      encabezados.reduce((obj, encabezado, i) => {
        obj[encabezado] = fila[i];
        return obj;
      }, {})
    );
  };

  const leerTodas = () => HOJAS.reduce((todas, nombre) => {
    const hoja = base().getSheetByName(nombre);
    if (!hoja || hoja.getLastRow() < 2) return todas;

    const valores = hoja.getDataRange().getDisplayValues();
    const encabezados = valores.shift().map(limpiarH);

    return todas.concat(valores.filter(f => f.some(x => x !== '')).map(fila =>
      encabezados.reduce((obj, encabezado, i) => {
        obj[encabezado] = fila[i];
        return obj;
      }, {})
    ));
  }, []);

  const formatear = valor => {
    if (!valor) return '';
    if (valor instanceof Date) {
      return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    }
    return t(valor);
  };

  const semaforo = plan => {
    const estado = t(plan['Estado del plan'] || plan['Estado']).toLowerCase();
    if (['completado', 'cancelado', 'cerrada', 'cerrado'].includes(estado)) return 'Cerrado';
    const rawFecha = plan['Fecha de compromiso'] || plan['Fecha'];
    if (!rawFecha) return 'Sin fecha';

    const f = fecha(rawFecha);
    if (!(f instanceof Date) || isNaN(f.getTime())) return 'Sin fecha';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    f.setHours(0, 0, 0, 0);

    const dias = Math.ceil((f - hoy) / 86400000);
    return dias < 0 ? 'Vencido' : dias <= 5 ? 'Próximo a vencer' : 'A tiempo';
  };

  const obtenerDatosDashboardNC = () => {
    const vistos = new Set();

    const filas = leerTodas().filter(fila => {
      const id = t(fila['ID de solicitud']);
      if (!id || vistos.has(id)) return false;
      vistos.add(id);
      return true;
    });

    const registros = filas.map(fila => {
      const estado = t(fila['Estado NC']) || 'Abierta';
      const riesgo = t(fila['Riesgo (Bajo-Moderado-Alto)']) || 'Sin clasificación';
      const f = fila['Fecha de registro'];

      return {
        id: fila['ID de solicitud'],
        tipo: fila['Tipo de notificación'] || 'Interna',
        fecha: formatear(f),
        fechaIso: f instanceof Date
          ? Utilities.formatDate(f, Session.getScriptTimeZone(), 'yyyy-MM-dd')
          : '',
        titulo: fila['Título / Descripción breve'],
        estadoNC: estado,
        estadoCAPA: fila['Estado CAPA'] || 'No aplica',
        riesgo: riesgo,
        responsable: fila.Responsable || 'Sin responsable',
        cerrado: /cerrad|completad|cancelad|finaliz/i.test(estado),
        prioritario: /alto|moderado/i.test(riesgo.toLowerCase())
      };
    });

    return {
      registros: registros,
      actualizado: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
      filtros: {
        tipos: [...new Set(registros.map(x => x.tipo))].sort(),
        estados: [...new Set(registros.map(x => x.estadoNC))].sort(),
        riesgos: [...new Set(registros.map(x => x.riesgo))].sort(),
        responsables: [...new Set(registros.map(x => x.responsable))].sort()
      }
    };
  };

  const obtenerDatosMonitor = query => {
    const idBuscado = normalizar(query);
    if (!idBuscado) return null;

    const ss = base();
    const nombreHojaSolicitud = obtenerHojaSolicitudPorId(idBuscado);
    const hojaSolicitud = ss.getSheetByName(nombreHojaSolicitud);

    if (!hojaSolicitud || hojaSolicitud.getLastRow() < 2) {
      throw new Error('No existen registros en la hoja ' + nombreHojaSolicitud + '.');
    }

    const valores = hojaSolicitud.getDataRange().getDisplayValues();
    const encabezados = valores[0].map(limpiarH);

    const fila = valores.slice(1).find(f => normalizar(f[0]) === idBuscado);

    if (!fila) {
      return null;
    }

    const solicitud = encabezados.reduce((obj, enc, i) => {
      obj[enc] = fila[i];
      return obj;
    }, {});

    let detalle = {};
    try {
      detalle = JSON.parse(t(solicitud['Detalles adicionales']) || '{}');
    } catch (e) {}

    solicitud.Area =
      detalle.areaReporta ||
      detalle.areaReportaProveedor ||
      detalle.areaReportaDiferencia ||
      detalle.areaReportaMejora ||
      'No especificada';

    solicitud['Fecha de registro'] = formatear(solicitud['Fecha de registro']);

    const nombreHojaPlanes = obtenerHojaPlanesPorId(idBuscado);
    const hojaPlanes = ss.getSheetByName(nombreHojaPlanes);
    let planes = [];

    if (hojaPlanes && hojaPlanes.getLastRow() >= 2) {
      const datosPlanes = hojaPlanes.getDataRange().getDisplayValues();
      const encabezadosPlanes = datosPlanes[0].map(limpiarH);

      const colId = 0;
      const colNum = encabezadosPlanes.findIndex(h => normalizar(h) === 'NUMERODEPLAN' || normalizar(h) === 'NUMERODEPLANDEACCION');
      const colDesc = encabezadosPlanes.findIndex(h => normalizar(h) === 'DESCRIPCIONDELPLANDEACCION');
      const colResp = encabezadosPlanes.findIndex(h => normalizar(h) === 'RESPONSABLE');
      const colFecha = encabezadosPlanes.findIndex(h => normalizar(h) === 'FECHADECOMPROMISO');
      const colEst = encabezadosPlanes.findIndex(h => normalizar(h) === 'ESTADODELPLAN');
      const colCom = encabezadosPlanes.findIndex(h => normalizar(h) === 'COMENTARIO');
      const colInm = encabezadosPlanes.findIndex(h => normalizar(h) === 'EVIDENCIADEACCIONINMEDIATA');
      const colDoc = encabezadosPlanes.findIndex(h => normalizar(h) === 'DOCUMENTODEPLANDEACCION');
      const colSeg = encabezadosPlanes.findIndex(h => normalizar(h) === 'EVIDENCIADESEGUIMIENTO');

      planes = datosPlanes.slice(1)
        .filter(fila => normalizar(fila[colId]) === idBuscado)
        .map(fila => {
          const planObj = {
            'Estado del plan': fila[colEst],
            'Fecha de compromiso': fila[colFecha]
          };

          return {
            numero: fila[colNum],
            descripcion: fila[colDesc],
            responsable: fila[colResp],
            fecha: formatear(fila[colFecha]),
            estado: fila[colEst],
            comentario: fila[colCom],
            semaforo: semaforo(planObj),
            inmediata: colInm >= 0 ? fila[colInm] : '',
            planDoc: colDoc >= 0 ? fila[colDoc] : '',
            evidenciaSeguimiento: colSeg >= 0 ? fila[colSeg] : ''
          };
        });
    }

    log('Monitor consultado para ID: ' + idBuscado + ' (' + planes.length + ' planes encontrados en ' + nombreHojaPlanes + ')');

    return {
      solicitud: solicitud,
      planes: planes,
      hojaPlanes: nombreHojaPlanes
    };
  };

  const obtenerDatosDashboardPlanes = () => {
    const planesCO = leerObjetos(PLANES_CO);
    const planesProv = leerObjetos(PLANES_PROV);
    const todos = planesCO.concat(planesProv);

    return {
      planes: todos.map(p => ({
        id: p['ID de solicitud'],
        numero: p['Número de plan'],
        descripcion: p['Descripción del plan de acción'],
        responsable: p.Responsable,
        fecha: formatear(p['Fecha de compromiso']),
        estado: p['Estado del plan'],
        semaforo: semaforo(p)
      }))
    };
  };

  const eliminarPlanes = (idSolicitud, numerosPlan) => {
    if (!validarConArchivoControl()) return;

    const correoUsuario = validarPermisoEliminar();

    const idNorm = normalizar(idSolicitud);
    if (!idNorm || !Array.isArray(numerosPlan) || !numerosPlan.length) {
      throw new Error('Parámetros inválidos para eliminar planes.');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const ss = base();
      const nombreHoja = obtenerHojaPlanesPorId(idNorm);
      const hoja = ss.getSheetByName(nombreHoja);

      if (!hoja || hoja.getLastRow() < 2) {
        throw new Error('No existen registros en la hoja ' + nombreHoja);
      }

      const valores = hoja.getDataRange().getDisplayValues();
      const encabezados = valores[0].map(limpiarH);
      const colId = 0;
      const colNum = encabezados.findIndex(h => normalizar(h) === 'NUMERODEPLAN' || normalizar(h) === 'NUMERODEPLANDEACCION');

      const numerosSet = new Set(numerosPlan.map(n => String(n).trim()));
      let eliminados = 0;

      for (let i = valores.length - 1; i >= 1; i--) {
        const fila = valores[i];
        if (normalizar(fila[colId]) === idNorm && numerosSet.has(String(fila[colNum]).trim())) {
          hoja.deleteRow(i + 1);
          eliminados++;
        }
      }

      log(
        'El usuario ' + correoUsuario +
        ' eliminó ' + eliminados +
        ' plan(es) del ID ' + idNorm +
        ' en la hoja ' + nombreHoja
      );
      return { ok: true, eliminados: eliminados };
    } finally {
      lock.releaseLock();
    }
  };

  const actualizarComentarioYEvidencia = datos => {
    if (!validarConArchivoControl()) return;

    const idNorm = normalizar(datos.idSolicitud);
    const numPlan = String(datos.numeroPlan).trim();

    if (!idNorm || !numPlan) {
      throw new Error('ID de solicitud y número de plan son requeridos.');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const ss = base();
      const nombreHoja = obtenerHojaPlanesPorId(idNorm);
      const hoja = asegurarHoja(ss, nombreHoja, H_PLANES);

      const valores = hoja.getDataRange().getDisplayValues();
      const encabezados = valores[0].map(limpiarH);

      const colId = 0;
      const colNum = encabezados.findIndex(h => normalizar(h) === 'NUMERODEPLAN' || normalizar(h) === 'NUMERODEPLANDEACCION');
      const colComentario = encabezados.findIndex(h => normalizar(h) === 'COMENTARIO');
      const colActualización = encabezados.findIndex(h => normalizar(h) === 'FECHADEACTUALIZACION');
      const colSeguimiento = encabezados.findIndex(h => normalizar(h) === 'EVIDENCIADESEGUIMIENTO');

      let filaEncontrada = -1;

      for (let i = 1; i < valores.length; i++) {
        if (normalizar(valores[i][colId]) === idNorm && String(valores[i][colNum]).trim() === numPlan) {
          filaEncontrada = i + 1;
          break;
        }
      }

      if (filaEncontrada === -1) {
        throw new Error('No se encontró el plan de acción #' + numPlan + ' para el ID ' + idNorm);
      }

      let nuevasEvidencias = [];
      if (datos.adjuntos && datos.adjuntos.length > 0) {
        nuevasEvidencias = guardarArchivos(datos.adjuntos, idNorm + '-Plan' + numPlan);
      }

      if (colComentario >= 0) {
        hoja.getRange(filaEncontrada, colComentario + 1).setValue(t(datos.comentario));
      }

      if (colActualización >= 0) {
        const ahora = new Date();
        hoja.getRange(filaEncontrada, colActualización + 1).setValue(ahora).setNumberFormat('dd/MM/yyyy HH:mm');
      }

      if (colSeguimiento >= 0 && nuevasEvidencias.length > 0) {
        const urlExistente = t(hoja.getRange(filaEncontrada, colSeguimiento + 1).getValue());
        const urlsNuevas = nuevasEvidencias.map(e => e.url).join('\n');
        const urlFinal = urlExistente ? urlExistente + '\n' + urlsNuevas : urlsNuevas;
        hoja.getRange(filaEncontrada, colSeguimiento + 1).setValue(urlFinal);
      }

      log('Actualizado comentario/evidencias en plan #' + numPlan + ' ID ' + idNorm + ' en hoja ' + nombreHoja);
      return { ok: true };
    } finally {
      lock.releaseLock();
    }
  };

  const obtenerCorreoUsuario = () => t(Session.getActiveUser().getEmail()).toLowerCase();

  const alEditarBase = e => {
    const r = e && e.range;
    if (!r || r.getRow() === 1 || !HOJAS.includes(r.getSheet().getName())) return;

    const valor = t(r.getValue()).toLowerCase();

    if (r.getColumn() === 11 && valor === 'cerrada') {
      r.getSheet().getRange(r.getRow(), 10).setValue(new Date());
    }

    if (r.getColumn() === 15 && ['cerrada', 'completada'].includes(valor)) {
      r.getSheet().getRange(r.getRow(), 14).setValue(new Date());
    }
  };

  const doGet = evento => {
    const pagina = t(evento && evento.parameter && evento.parameter.pagina).toLowerCase() || 'portal';
    const archivos = { portal: 'Portal', formnc: 'FormularioNC', capa: 'FormularioCAPA', dashboard: 'DashboardNC', monitor: 'Monitor', planes: 'DashboardPlanes' };
    const titulos = { portal: 'Portal de Calidad Colombia', formnc: 'Registro de no conformidad', capa: 'Plan de acción', dashboard: 'Tablero de notificaciones', monitor: 'Monitor de solicitudes', planes: 'Tablero de planes de acción' };

    const plantilla = HtmlService.createTemplateFromFile(archivos[pagina] || 'Portal');
    plantilla.appUrl = ScriptApp.getService().getUrl();
    plantilla.idSolicitud = t(evento && evento.parameter && evento.parameter.id);
    plantilla.databaseUrl = base().getUrl();
    plantilla.formularioNC = ScriptApp.getService().getUrl() + '?pagina=formnc';
    plantilla.formularioPlanes = ScriptApp.getService().getUrl() + '?pagina=capa';

    const paginaRenderizada = plantilla.evaluate();
    paginaRenderizada.setTitle(titulos[pagina] || titulos.portal);
    return paginaRenderizada;
  };

  const onOpen = () => {
    SpreadsheetApp.getUi().createMenu('Calidad Colombia')
      .addItem('Configurar base y disparadores', 'configurarProyectoColombia')
      .addToUi();
  };

  const configurarProyectoColombia = () => {
    const ss = base();

    HOJAS.forEach(nombre => {
      asegurarHoja(ss, nombre, H_NC);
    });

    asegurarHoja(ss, PLANES_CO, H_PLANES);
    asegurarHoja(ss, PLANES_PROV, H_PLANES);
    asegurarHoja(ss, CONFIG, ['Clave', 'Valor', 'Uso']);

    ScriptApp.getProjectTriggers()
      .filter(x => x.getHandlerFunction() === 'alEditarBase')
      .forEach(x => ScriptApp.deleteTrigger(x));

    ScriptApp.newTrigger('alEditarBase').forSpreadsheet(ss).onEdit().create();

    log('Proyecto configurado correctamente.');
    return { baseDeDatos: ss.getUrl() };
  };

  return {
    configurarProyectoColombia, doGet, onOpen, guardarNotificacionWeb,
    guardarCAPAWeb, obtenerCorreoUsuario, obtenerDatosDashboardNC,
    obtenerDatosMonitor, obtenerDatosDashboardPlanes, alEditarBase,
    eliminarPlanes, actualizarComentarioYEvidencia
  };
})();

function doGet(e) { return CALIDAD_CO.doGet(e); }
function onOpen() { return CALIDAD_CO.onOpen(); }
function configurarProyectoColombia() { return CALIDAD_CO.configurarProyectoColombia(); }
function guardarNotificacionWeb(datos) { return CALIDAD_CO.guardarNotificacionWeb(datos); }
function guardarCAPAWeb(datos) { return CALIDAD_CO.guardarCAPAWeb(datos); }
function obtenerCorreoUsuario() { return CALIDAD_CO.obtenerCorreoUsuario(); }
function obtenerDatosDashboardNC() { return CALIDAD_CO.obtenerDatosDashboardNC(); }
function obtenerDatosMonitor(id) { return CALIDAD_CO.obtenerDatosMonitor(id); }
function obtenerDatosDashboardPlanes() { return CALIDAD_CO.obtenerDatosDashboardPlanes(); }
function alEditarBase(e) { return CALIDAD_CO.alEditarBase(e); }
function eliminarPlanes(idSolicitud, numerosPlan) { return CALIDAD_CO.eliminarPlanes(idSolicitud, numerosPlan); }
function actualizarComentarioYEvidencia(datos) { return CALIDAD_CO.actualizarComentarioYEvidencia(datos); }

function validarConArchivoControl() {
  try {
    const hoja = SpreadsheetApp
      .openById('1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM')
      .getSheetByName('update');

    return hoja.getRange('B2').getValue() === 'update';
  } catch (e) {
    return true;
  }
}
