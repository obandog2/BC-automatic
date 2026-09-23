/**
 * Asistente Personal - v2
 * Servidor principal: configuración, creación de la base y router de la web app.
 *
 * Orden de uso: ejecutar setupAsistente() UNA VEZ, y después publicar la web app.
 * Al actualizar desde la v1: volvé a ejecutar setupAsistente() (es idempotente,
 * solo agrega la pestaña Prioridades) y creá una versión nueva de la implementación.
 */

// =============================================================================
// AJUSTÁ ESTO ANTES DE USAR
//
// Todo lo configurable vive acá arriba. Ninguno de estos valores está repetido
// ni enterrado en la lógica: cambiás la línea y el asistente completo se
// comporta distinto. No hace falta entender el resto del código.
// =============================================================================
const CONFIG = Object.freeze({

  // Zona horaria de TODO el asistente: qué día se considera "hoy", a qué hora
  // corre el digest, y cómo se muestran las horas en pantalla.
  // Confirmada por Gaby: Ecuador continental (UTC-5).
  // Si alguna vez la cambiás, hacelo acá Y en el campo "timeZone" de
  // appsscript.json. Los dos valores tienen que coincidir: si no, la agenda
  // te va a mostrar el día equivocado cerca de medianoche.
  zonaHoraria: 'America/Guayaquil',

  // Hora local a la que corre solo el digest automático de correo (0-23).
  // Google lo dispara dentro de una ventana aproximada de 15 minutos.
  // Si cambiás estos dos valores, volvé a ejecutar instalarTriggerDigest().
  horaDigest: 6,
  minutoDigest: 30,

  // Cuántas horas hacia atrás mira el digest. 24 = "qué pasó desde ayer".
  // Ojo: esto NO afecta a los correos que marcaste importantes. Esos se
  // muestran siempre, sin importar cuánto tiempo pasó.
  ventanaHorasCorreo: 24,

  // Tope de hilos que se leen de Gmail en el digest. Es un freno de cuota y
  // de tiempo de ejecución, no un capricho.
  topeHilos: 50,

  // Un hilo cuenta como "esperando respuesta" cuando el último mensaje lo
  // escribiste vos y ya pasaron estos días sin que nadie conteste.
  diasEsperandoRespuesta: 3,

  // Cuánto hacia atrás se buscan tus enviados para calcular lo anterior,
  // y cuántos hilos como máximo.
  diasBusquedaEnviados: 30,
  topeHilosEnviados: 50,

  // Cuántos ítems se muestran en cada lista del correo. Los totales siempre
  // se calculan sobre todo lo leído; esto solo recorta lo que se pinta.
  topeItemsPorLista: 15,

  // Cuántos correos marcados como importantes se muestran arriba de todo.
  topeImportantes: 25,

  // Tope de correos con estrella de Gmail que se usan como semilla de
  // importancia. Tu marca desde el sitio siempre le gana a la estrella.
  topeDestacadosGmail: 25,

  // Minutos que se guarda el digest en caché antes de volver a leer Gmail.
  // El botón "Actualizar" de la sección Correo ignora la caché a propósito.
  minutosCacheDigest: 5,

  // Nombre del archivo de Google Sheets que crea setupAsistente().
  // Cambiarlo después del setup NO renombra nada: el ID queda en propiedades.
  nombreArchivoBase: 'Asistente Personal - Base',

  // Título de la pestaña del navegador.
  tituloApp: 'Mi asistente',

  // --- De acá para abajo no hace falta tocar nada ---
  versionSnapshot: 2,
  propBaseId: 'ASISTENTE_BASE_ID',
  propUltimoDigest: 'ASISTENTE_ULTIMO_DIGEST',
  claveCacheDigest: 'digest_correo_v2',
  hojaNotas: 'Notas',
  hojaMetas: 'Metas',
  hojaPendientes: 'Pendientes',
  hojaPrioridades: 'Prioridades',
  hojaDigest: 'DigestCorreo',
  hojaConfig: 'Config',
  triggerDigest: 'tareaDigestDiario',
  secciones: ['inicio', 'correo', 'agenda', 'notas']
});

const ENCABEZADOS = Object.freeze({
  Notas: ['Id', 'Creada', 'Actualizada', 'Texto'],
  Metas: ['Id', 'Fecha', 'Meta', 'Estado', 'Creada', 'Completada'],
  Pendientes: ['Id', 'Creado', 'Descripcion', 'Estado', 'Cerrado'],
  Prioridades: ['Id hilo', 'Nivel', 'Asunto', 'Remitente', 'URL', 'Marcado'],
  DigestCorreo: ['Generado', 'Desde', 'Hasta', 'Hilos', 'Sin leer', 'Importantes',
                 'Esperando respuesta', 'Snapshot JSON'],
  Config: ['Clave', 'Valor']
});

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_HECHO = 'Hecha';
const ESTADO_CERRADO = 'Cerrado';

// Los tres únicos niveles de prioridad. "normal" no se guarda: es la ausencia
// de marca, y marcar algo como normal borra su fila de la pestaña Prioridades.
const NIVEL_IMPORTANTE = 'importante';
const NIVEL_SILENCIADO = 'silenciado';
const NIVEL_NORMAL = 'normal';

// =============================================================================
// Setup. Se ejecuta a mano desde el editor, las veces que haga falta.
// =============================================================================

/**
 * Crea el Google Sheet con todas sus pestañas e instala el trigger diario.
 * Es idempotente: si la base ya existe, solo agrega lo que falte y no toca
 * ni una fila de datos.
 * @return {{baseUrl: string}}
 */
function setupAsistente() {
  const propiedades = PropertiesService.getScriptProperties();
  let baseId = propiedades.getProperty(CONFIG.propBaseId);

  let base;
  if (baseId) {
    base = SpreadsheetApp.openById(baseId);
  } else {
    base = SpreadsheetApp.create(CONFIG.nombreArchivoBase);
    baseId = base.getId();
    propiedades.setProperty(CONFIG.propBaseId, baseId);
  }

  base.setSpreadsheetTimeZone(CONFIG.zonaHoraria);

  const primera = base.getSheets()[0];
  if (['Sheet1', 'Hoja 1', 'Hoja1', 'Página1'].indexOf(primera.getName()) !== -1) {
    primera.setName(CONFIG.hojaNotas);
  }

  crearHojaSiFalta_(base, CONFIG.hojaNotas, ENCABEZADOS.Notas);
  crearHojaSiFalta_(base, CONFIG.hojaMetas, ENCABEZADOS.Metas);
  crearHojaSiFalta_(base, CONFIG.hojaPendientes, ENCABEZADOS.Pendientes);
  crearHojaSiFalta_(base, CONFIG.hojaPrioridades, ENCABEZADOS.Prioridades);
  crearHojaSiFalta_(base, CONFIG.hojaDigest, ENCABEZADOS.DigestCorreo);
  crearHojaSiFalta_(base, CONFIG.hojaConfig, ENCABEZADOS.Config);

  escribirConfigInformativa_(base);
  instalarTriggerDigest();

  console.log('Base creada o verificada: ' + base.getUrl());
  return { baseUrl: base.getUrl() };
}

/**
 * Instala (o reinstala) el trigger diario del digest. Ejecutala de nuevo si
 * cambiás CONFIG.horaDigest o CONFIG.minutoDigest.
 */
function instalarTriggerDigest() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === CONFIG.triggerDigest) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(CONFIG.triggerDigest)
    .timeBased()
    .atHour(CONFIG.horaDigest)
    .nearMinute(CONFIG.minutoDigest)
    .everyDays(1)
    .inTimezone(CONFIG.zonaHoraria)
    .create();

  console.log('Trigger diario instalado para las ' +
    CONFIG.horaDigest + ':' + ('0' + CONFIG.minutoDigest).slice(-2) +
    ' (' + CONFIG.zonaHoraria + ').');
}

/**
 * Crea una pestaña si no existe. El formato se aplica SOLO al crearla: nunca
 * se reescriben los encabezados de una hoja que ya está en uso.
 */
function crearHojaSiFalta_(base, nombre, encabezados) {
  let hoja = base.getSheetByName(nombre);
  if (!hoja) {
    hoja = base.insertSheet(nombre);
  }
  if (hoja.getLastRow() >= 1 && String(hoja.getRange(1, 1).getValue()).trim()) {
    return hoja;
  }

  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, encabezados.length)
    .setBackground('#0b3d91')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  hoja.autoResizeColumns(1, encabezados.length);
  return hoja;
}

function escribirConfigInformativa_(base) {
  const hoja = base.getSheetByName(CONFIG.hojaConfig);
  const filas = [
    ['Version', 'v2'],
    ['Actualizado', formatoFecha_(new Date(), 'dd/MM/yyyy HH:mm')],
    ['Zona horaria', CONFIG.zonaHoraria],
    ['Hora del digest', CONFIG.horaDigest + ':' + ('0' + CONFIG.minutoDigest).slice(-2)],
    ['Nota', 'Esta pestaña es informativa. El asistente NO lee valores de aquí: ' +
             'todo se configura en CONFIG, al inicio de Code.gs.']
  ];
  hoja.getRange(2, 1, filas.length, 2).setValues(filas);
  hoja.autoResizeColumns(1, 2);
}

// =============================================================================
// Web app
// =============================================================================

/**
 * El parámetro ?page= solo decide con qué sección abre la primera carga.
 * Después la navegación es del lado del cliente y no vuelve al servidor.
 */
function doGet(evento) {
  const pedida = String((evento && evento.parameter && evento.parameter.page) || '')
    .toLowerCase();

  const plantilla = HtmlService.createTemplateFromFile('Dashboard');
  plantilla.seccionInicial = CONFIG.secciones.indexOf(pedida) !== -1 ? pedida : 'inicio';
  return plantilla.evaluate()
    .setTitle(CONFIG.tituloApp)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Permite partir el HTML en varios archivos. */
function include(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

/**
 * Lo primero que pide el cliente: liviano, no toca Gmail ni Calendar, así la
 * cabecera se pinta al instante mientras la sección activa carga sus datos.
 */
function obtenerEstadoInicial() {
  return {
    correo: correoUsuario_(),
    fechaIso: hoyIso_(),
    fechaLarga: formatoFecha_(new Date(), 'EEEE d \'de\' MMMM'),
    zonaHoraria: CONFIG.zonaHoraria,
    chatDisponible: false
  };
}

// =============================================================================
// Helpers compartidos por Correo.gs, Agenda.gs y Datos.gs
// =============================================================================

function getBase_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.propBaseId);
  if (!id) {
    throw new Error('Ejecutá setupAsistente() una vez antes de abrir el dashboard.');
  }
  return SpreadsheetApp.openById(id);
}

function getHoja_(nombre) {
  const hoja = getBase_().getSheetByName(nombre);
  if (!hoja) {
    throw new Error('Falta la pestaña "' + nombre + '". Volvé a ejecutar setupAsistente().');
  }
  return hoja;
}

/** Devuelve las filas de datos (sin encabezado) como arreglo de arreglos. */
function leerFilas_(hoja) {
  const filas = Math.max(hoja.getLastRow() - 1, 0);
  if (!filas) return [];
  return hoja.getRange(2, 1, filas, hoja.getLastColumn()).getValues();
}

/**
 * Ubica una fila por su clave (columna 1) y devuelve su número de fila real,
 * o 0 si no existe. El volumen de una base personal es chico; si algún día
 * crece mucho, este es el punto a cambiar por un índice.
 */
function buscarFilaPorId_(hoja, id) {
  const filas = Math.max(hoja.getLastRow() - 1, 0);
  if (!filas) return 0;
  const ids = hoja.getRange(2, 1, filas, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}

/** Toda escritura a la hoja pasa por acá, para que dos pestañas abiertas no choquen. */
function conLock_(funcion) {
  const lock = LockService.getUserLock();
  lock.waitLock(20000);
  try {
    return funcion();
  } finally {
    lock.releaseLock();
  }
}

function nuevoId_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function correoUsuario_() {
  return String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
}

function formatoFecha_(fecha, patron) {
  return Utilities.formatDate(fecha, CONFIG.zonaHoraria, patron);
}

function hoyIso_() {
  return formatoFecha_(new Date(), 'yyyy-MM-dd');
}

/** Evita que un texto que empieza con = + - @ se interprete como fórmula. */
function celdaSegura_(valor) {
  const texto = String(valor == null ? '' : valor).trim();
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function textoRequerido_(valor, etiqueta, maximo) {
  const texto = String(valor == null ? '' : valor).trim();
  if (!texto) throw new Error('El campo "' + etiqueta + '" no puede ir vacío.');
  if (texto.length > maximo) {
    throw new Error('El campo "' + etiqueta + '" supera los ' + maximo + ' caracteres.');
  }
  return texto;
}
