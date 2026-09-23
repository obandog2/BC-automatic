/**
 * Asistente Personal - v1
 * Agenda del día, desde tu calendario principal.
 *
 * Para sumar calendarios compartidos, ver la sección correspondiente del README:
 * es cambiar la lista de calendarios de obtenerCalendarios_() y nada más.
 */

/**
 * Eventos de hoy, sin los que declinaste.
 * @return {{fecha: string, eventos: Array, total: number}}
 */
function obtenerAgenda() {
  const ahora = new Date();
  const eventos = [];

  obtenerCalendarios_().forEach(function (calendario) {
    // getEventsForDay usa la zona horaria del script, que es la del manifiesto.
    // Por eso CONFIG.zonaHoraria y appsscript.json tienen que coincidir.
    calendario.getEventsForDay(ahora).forEach(function (evento) {
      const item = describirEvento_(evento, ahora, calendario.getName());
      if (item) eventos.push(item);
    });
  });

  eventos.sort(function (a, b) {
    if (a.todoElDia !== b.todoElDia) return a.todoElDia ? -1 : 1;
    return a.ordenar - b.ordenar;
  });

  return {
    fecha: formatoFecha_(ahora, 'EEEE d \'de\' MMMM'),
    eventos: eventos,
    total: eventos.length
  };
}

/**
 * Calendarios que se leen. Hoy solo el principal, que es lo acordado para la v1.
 * Para agregar uno compartido, ver el README.
 */
function obtenerCalendarios_() {
  return [CalendarApp.getDefaultCalendar()];
}

/**
 * Convierte un evento de Calendar en lo que necesita la pantalla.
 * Devuelve null si el evento no debe mostrarse.
 */
function describirEvento_(evento, ahora, nombreCalendario) {
  // getMyStatus lanza excepción cuando no sos invitada sino dueña del evento.
  let miEstado = null;
  try {
    miEstado = evento.getMyStatus();
  } catch (error) {
    miEstado = null;
  }
  if (miEstado === CalendarApp.GuestStatus.NO) return null;

  const inicio = evento.getStartTime();
  const fin = evento.getEndTime();
  const todoElDia = evento.isAllDayEvent();

  let estado = 'por venir';
  if (!todoElDia) {
    if (ahora >= inicio && ahora <= fin) estado = 'en curso';
    else if (ahora > fin) estado = 'terminado';
  }

  let invitados = 0;
  try {
    invitados = evento.getGuestList().length;
  } catch (error) {
    invitados = 0;
  }

  return {
    titulo: evento.getTitle() || '(sin título)',
    todoElDia: todoElDia,
    inicio: todoElDia ? 'Todo el día' : formatoFecha_(inicio, 'HH:mm'),
    fin: todoElDia ? '' : formatoFecha_(fin, 'HH:mm'),
    ubicacion: String(evento.getLocation() || '').trim(),
    invitados: invitados,
    estado: estado,
    calendario: nombreCalendario,
    ordenar: inicio.getTime()
  };
}
