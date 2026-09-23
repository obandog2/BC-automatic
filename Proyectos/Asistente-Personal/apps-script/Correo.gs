/**
 * Asistente Personal - v2
 * Digest de correo: el proceso automático de la mañana y la lectura del sitio.
 *
 * Dos capas, a propósito separadas:
 *
 *   1. generarDigestCorreo() lee Gmail y produce un snapshot NEUTRO: los hilos
 *      del día tal cual, sin opinar sobre cuál importa. Es lo caro y lo que
 *      corre el trigger de la mañana.
 *   2. aplicarPrioridades_() toma ese snapshot y lo ordena según tus marcas.
 *      Es barato (solo lee el Sheet) y corre cada vez que abrís el sitio.
 *
 * Gracias a esa separación, marcar un correo como importante se refleja al
 * instante en la próxima carga sin volver a tocar Gmail. Y si algún día querés
 * cambiar el criterio del resumen, se reemplaza la capa 1 y nada más.
 */

/** Lo que dispara el trigger diario. No lo llames desde el cliente. */
function tareaDigestDiario() {
  const snapshot = generarDigestCorreo();
  guardarDigest_(snapshot);
  console.log('Digest generado: ' + snapshot.totales.hilos + ' hilos, ' +
    snapshot.totales.sinLeer + ' sin leer.');
}

/**
 * Lo que pide el sitio. Por defecto usa el último snapshot guardado, que carga
 * instantáneo. Con forzar = true vuelve a leer Gmail en vivo.
 * Las prioridades se aplican siempre al final, sobre datos frescos del Sheet.
 * @param {boolean} forzar
 */
function obtenerResumenCorreo(forzar) {
  const cache = CacheService.getUserCache();
  let snapshot = null;

  if (!forzar) {
    const enCache = cache.get(CONFIG.claveCacheDigest);
    if (enCache) {
      snapshot = JSON.parse(enCache);
    } else {
      snapshot = leerUltimoDigest_();
      if (snapshot) {
        cache.put(CONFIG.claveCacheDigest, JSON.stringify(snapshot),
          CONFIG.minutosCacheDigest * 60);
      }
    }
  }

  if (!snapshot) {
    snapshot = generarDigestCorreo();
    guardarDigest_(snapshot);
  }

  return aplicarPrioridades_(snapshot);
}

// =============================================================================
// Capa 1: leer Gmail y producir el snapshot neutro
// =============================================================================

/**
 * Lee la bandeja y devuelve los hilos del período, sin clasificar.
 * @return {Object} snapshot versionado
 */
function generarDigestCorreo() {
  const yo = correoUsuario_();
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - CONFIG.ventanaHorasCorreo * 3600 * 1000);
  const destacados = hilosDestacadosGmail_();

  const entrantes = [];
  let sinLeer = 0;

  // Gmail acepta un epoch en segundos dentro de after:, así que la ventana es
  // exacta en horas y no se redondea al día como con after:yyyy/MM/dd.
  const consulta = 'after:' + Math.floor(desde.getTime() / 1000) +
    ' -in:chats -in:drafts -in:spam -in:trash';
  const hilos = GmailApp.search(consulta, 0, CONFIG.topeHilos);

  // Una sola llamada batch para todos los hilos. Pedir los mensajes hilo por
  // hilo dentro de un for es lo que hace que un digest tarde minutos.
  const mensajesPorHilo = hilos.length ? GmailApp.getMessagesForThreads(hilos) : [];

  hilos.forEach(function (hilo, indice) {
    const mensajes = mensajesPorHilo[indice] || [];
    if (!mensajes.length) return;

    const ultimo = mensajes[mensajes.length - 1];
    const remitente = partesRemitente_(ultimo.getFrom());
    const noLeidos = mensajes.filter(function (m) { return m.isUnread(); }).length;
    sinLeer += noLeidos;

    // Los hilos donde el último mensaje es mío no son correo entrante: esos se
    // evalúan aparte, como "esperando respuesta".
    if (remitente.correo === yo) return;

    const para = String(ultimo.getTo() || '').toLowerCase();
    const copia = String(ultimo.getCc() || '').toLowerCase();
    const id = hilo.getId();

    entrantes.push({
      id: id,
      asunto: hilo.getFirstMessageSubject() || '(sin asunto)',
      de: remitente.nombre,
      url: hilo.getPermalink(),
      hora: formatoFecha_(ultimo.getDate(), 'dd/MM HH:mm'),
      ordenar: ultimo.getDate().getTime(),
      sinLeer: noLeidos,
      directo: para.indexOf(yo) !== -1,
      copia: copia.indexOf(yo) !== -1,
      destacado: !!destacados[id]
    });
  });

  return {
    version: CONFIG.versionSnapshot,
    generado: formatoFecha_(ahora, 'dd/MM/yyyy HH:mm'),
    ventanaHoras: CONFIG.ventanaHorasCorreo,
    diasEsperandoRespuesta: CONFIG.diasEsperandoRespuesta,
    entrantes: entrantes,
    esperando: calcularEsperandoRespuesta_(yo, ahora),
    totales: {
      hilos: hilos.length,
      sinLeer: sinLeer,
      topeAlcanzado: hilos.length >= CONFIG.topeHilos
    }
  };
}

/** Ids de los hilos con estrella. Solo se usan como semilla de importancia. */
function hilosDestacadosGmail_() {
  const mapa = {};
  GmailApp.search('is:starred -in:chats -in:trash', 0, CONFIG.topeDestacadosGmail)
    .forEach(function (hilo) { mapa[hilo.getId()] = true; });
  return mapa;
}

/**
 * Hilos donde vos escribiste último y nadie contestó en N días.
 * Se busca sobre los enviados recientes, no sobre la ventana del digest: un
 * correo tuyo de hace una semana no aparece en las últimas 24 horas.
 */
function calcularEsperandoRespuesta_(yo, ahora) {
  const consulta = 'in:sent newer_than:' + CONFIG.diasBusquedaEnviados + 'd -in:chats';
  const hilos = GmailApp.search(consulta, 0, CONFIG.topeHilosEnviados);
  if (!hilos.length) return [];

  const mensajesPorHilo = GmailApp.getMessagesForThreads(hilos);
  const umbralMs = CONFIG.diasEsperandoRespuesta * 24 * 3600 * 1000;
  const resultado = [];

  hilos.forEach(function (hilo, indice) {
    const mensajes = mensajesPorHilo[indice] || [];
    if (!mensajes.length) return;

    const ultimo = mensajes[mensajes.length - 1];
    if (partesRemitente_(ultimo.getFrom()).correo !== yo) return;

    const transcurrido = ahora.getTime() - ultimo.getDate().getTime();
    if (transcurrido < umbralMs) return;

    resultado.push({
      id: hilo.getId(),
      asunto: hilo.getFirstMessageSubject() || '(sin asunto)',
      de: primerDestinatario_(ultimo.getTo()),
      url: hilo.getPermalink(),
      dias: Math.floor(transcurrido / (24 * 3600 * 1000)),
      sinLeer: 0,
      ordenar: ultimo.getDate().getTime()
    });
  });

  return resultado.sort(function (a, b) { return b.dias - a.dias; });
}

// =============================================================================
// Capa 2: aplicar tus prioridades sobre el snapshot
// =============================================================================

/**
 * Clasifica el snapshot según la pestaña Prioridades.
 * Reglas, en este orden:
 *   - Lo que marcaste vos manda, siempre.
 *   - La estrella de Gmail solo cuenta para lo que todavía no marcaste.
 *   - Lo silenciado no se lista en ningún lado, solo se cuenta.
 *   - Lo importante se muestra aunque haya salido de la ventana del digest.
 * El asistente nunca escribe en Gmail: la estrella se lee, no se toca.
 */
function aplicarPrioridades_(snapshot) {
  const prioridades = leerPrioridades_();
  const importantes = [];
  const delDia = [];
  const enCopia = [];
  const vistos = {};
  let silenciados = 0;

  (snapshot.entrantes || []).forEach(function (hilo) {
    const nivel = prioridades[hilo.id]
      ? prioridades[hilo.id].nivel
      : (hilo.destacado ? NIVEL_IMPORTANTE : NIVEL_NORMAL);

    if (nivel === NIVEL_SILENCIADO) {
      silenciados += 1;
      return;
    }

    const item = {
      id: hilo.id,
      asunto: hilo.asunto,
      de: hilo.de,
      url: hilo.url,
      hora: hilo.hora,
      ordenar: hilo.ordenar,
      sinLeer: hilo.sinLeer,
      nivel: nivel
    };
    vistos[hilo.id] = true;

    if (nivel === NIVEL_IMPORTANTE) importantes.push(item);
    else if (hilo.directo || !hilo.copia) delDia.push(item);
    else enCopia.push(item);
  });

  // Los importantes que ya salieron de la ventana se reconstruyen desde la
  // copia guardada al marcarlos. Sin esto, marcar algo importante dejaría de
  // servir a las 24 horas, que es justo cuando más falta hace.
  Object.keys(prioridades).forEach(function (id) {
    const marca = prioridades[id];
    if (marca.nivel !== NIVEL_IMPORTANTE || vistos[id]) return;
    importantes.push({
      id: id,
      asunto: marca.asunto || '(sin asunto)',
      de: marca.remitente || '',
      url: marca.url || '',
      hora: marca.marcado || '',
      ordenar: 0,
      sinLeer: 0,
      nivel: NIVEL_IMPORTANTE,
      anterior: true
    });
  });

  const esperando = (snapshot.esperando || [])
    .filter(function (hilo) {
      return !(prioridades[hilo.id] && prioridades[hilo.id].nivel === NIVEL_SILENCIADO);
    })
    .map(function (hilo) {
      const nivel = prioridades[hilo.id] ? prioridades[hilo.id].nivel : NIVEL_NORMAL;
      return {
        id: hilo.id, asunto: hilo.asunto, de: hilo.de, url: hilo.url,
        dias: hilo.dias, sinLeer: 0, nivel: nivel, ordenar: hilo.ordenar
      };
    });

  const masReciente = function (a, b) { return b.ordenar - a.ordenar; };
  importantes.sort(masReciente);
  delDia.sort(masReciente);
  enCopia.sort(masReciente);

  return {
    generado: snapshot.generado,
    ventanaHoras: snapshot.ventanaHoras,
    diasEsperandoRespuesta: snapshot.diasEsperandoRespuesta,
    totales: {
      hilos: snapshot.totales.hilos,
      sinLeer: snapshot.totales.sinLeer,
      importantes: importantes.length,
      silenciados: silenciados,
      esperando: esperando.length,
      topeAlcanzado: snapshot.totales.topeAlcanzado
    },
    importantes: importantes.slice(0, CONFIG.topeImportantes),
    delDia: delDia.slice(0, CONFIG.topeItemsPorLista),
    enCopia: enCopia.slice(0, CONFIG.topeItemsPorLista),
    esperando: esperando.slice(0, CONFIG.topeItemsPorLista)
  };
}

// =============================================================================
// Utilidades
// =============================================================================

/** Separa "Nombre Apellido <correo@dominio>" en sus dos partes. */
function partesRemitente_(texto) {
  const crudo = String(texto || '').trim();
  const conNombre = crudo.match(/^(.*?)\s*<([^>]+)>$/);
  if (conNombre) {
    const nombre = conNombre[1].replace(/^"|"$/g, '').trim();
    const correo = conNombre[2].trim().toLowerCase();
    return { nombre: nombre || correo, correo: correo };
  }
  return { nombre: crudo.toLowerCase(), correo: crudo.toLowerCase() };
}

function primerDestinatario_(texto) {
  const primero = String(texto || '').split(',')[0];
  return partesRemitente_(primero).nombre || '(sin destinatario)';
}

function guardarDigest_(snapshot) {
  const hoja = getHoja_(CONFIG.hojaDigest);
  conLock_(function () {
    hoja.appendRow([
      snapshot.generado,
      snapshot.ventanaHoras + ' h',
      snapshot.entrantes.length,
      snapshot.totales.hilos,
      snapshot.totales.sinLeer,
      '',
      snapshot.esperando.length,
      JSON.stringify(snapshot)
    ]);
  });

  CacheService.getUserCache().put(
    CONFIG.claveCacheDigest,
    JSON.stringify(snapshot),
    CONFIG.minutosCacheDigest * 60
  );
  PropertiesService.getScriptProperties()
    .setProperty(CONFIG.propUltimoDigest, snapshot.generado);
}

/**
 * Lee el último snapshot guardado. Si es de una versión anterior del formato
 * (por ejemplo, uno que quedó de la v1), devuelve null para que se regenere en
 * vez de romper la pantalla con una forma que ya no existe.
 */
function leerUltimoDigest_() {
  const hoja = getHoja_(CONFIG.hojaDigest);
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return null;

  const json = hoja.getRange(ultimaFila, ENCABEZADOS.DigestCorreo.length).getValue();
  if (!json) return null;

  try {
    const snapshot = JSON.parse(json);
    if (!snapshot || snapshot.version !== CONFIG.versionSnapshot) return null;
    return snapshot;
  } catch (error) {
    console.error('El último snapshot no se pudo leer: ' + error);
    return null;
  }
}
