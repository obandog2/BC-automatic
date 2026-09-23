# Asistente Personal (v2)

Asistente personal en Google Apps Script: un digest automático de tu correo cada mañana y un sitio privado con cuatro secciones —Inicio, Correo, Agenda y Notas— donde ves tu día, decidís qué correo importa y qué no, y seguís tu avance contra las metas que te pusiste hoy. Todo se guarda en un Google Sheet que el propio código crea.

**Novedad de la v2:** la prioridad de los correos la ponés vos desde el sitio, no solo Gmail.

---

## 1. Ajustá esto antes de usar

Todo lo configurable vive en la constante `CONFIG`, al inicio de `apps-script/Code.gs`. Es lo primero del archivo y nada está repetido en la lógica: cambiás la línea y listo.

| Valor | Qué controla | Viene en |
|---|---|---|
| `zonaHoraria` | Qué día es "hoy", la hora del digest y el formato de las horas | `America/Guayaquil` |
| `horaDigest` / `minutoDigest` | A qué hora corre el digest automático | 6:30 |
| `ventanaHorasCorreo` | Cuántas horas hacia atrás mira el digest | 24 |
| `topeHilos` | Máximo de hilos que se leen de Gmail | 50 |
| `diasEsperandoRespuesta` | Días sin contestar para marcar un hilo como "esperando respuesta" | 3 |
| `diasBusquedaEnviados` | Cuánto atrás se buscan tus enviados para lo anterior | 30 |
| `topeItemsPorLista` | Cuántos ítems se muestran por lista | 15 |
| `topeImportantes` | Cuántos correos marcados importantes se muestran arriba | 25 |
| `topeDestacadosGmail` | Cuántos correos con estrella se usan como semilla de importancia | 25 |
| `minutosCacheDigest` | Cuánto dura la caché antes de volver a leer Gmail | 5 |
| `nombreArchivoBase` | Nombre del Sheet que se crea | Asistente Personal - Base |

**Importante sobre la zona horaria:** `CONFIG.zonaHoraria` y el campo `timeZone` de `appsscript.json` tienen que decir lo mismo. Los dos vienen en `America/Guayaquil`. Si cambiás uno, cambiá el otro, porque la agenda usa la zona del manifiesto para decidir qué eventos son de hoy.

**Si cambiás la hora del digest,** ejecutá `instalarTriggerDigest()` de nuevo. Borra el trigger viejo y crea el nuevo; no se duplican.

---

## 2. Actualizar desde la v1

Si ya tenés la v1 desplegada y funcionando, son cuatro pasos:

1. Reemplazá el contenido de estos seis archivos en el editor de Apps Script: `Code.gs`, `Correo.gs`, `Datos.gs`, `Dashboard.html`, `Estilos.html` y `Cliente.html`. Van completos, no por partes.
2. **`Agenda.gs` y `appsscript.json` no se tocan.** Quedan exactamente como están.
3. Ejecutá `setupAsistente()` otra vez. Es idempotente: crea la pestaña `Prioridades` y no toca ni una fila de tus datos.
4. **Implementar > Administrar implementaciones > editar (el lápiz) > Versión: Nueva versión > Implementar.** Sin este paso seguís sirviendo el HTML viejo, que es el error más fácil de cometer.

El snapshot del digest cambió de formato y lleva número de versión. Si el último guardado es de la v1, el sitio lo descarta y lo regenera solo en lugar de romperse: la primera carga después de actualizar puede tardar unos segundos más.

---

## 3. Instalación desde cero

1. Entrá a [script.google.com](https://script.google.com/) con tu cuenta de Roche y creá un **proyecto nuevo**.
2. En **Configuración del proyecto**, activá **Mostrar el archivo de manifiesto `appsscript.json` en el editor**.
3. Reemplazá el contenido de `Código.gs` por el de `apps-script/Code.gs`.
4. Agregá tres scripts más (**Archivo > Nuevo > Secuencia de comandos**) llamados exactamente `Correo`, `Agenda` y `Datos`.
5. Agregá tres archivos HTML llamados exactamente `Dashboard`, `Estilos` y `Cliente`. Los nombres importan: el código los busca así.
6. Reemplazá el manifiesto por `apps-script/appsscript.json`.
7. Revisá el `CONFIG` (sección 1).
8. Ejecutá **`setupAsistente`** y aceptá los permisos.
9. Abrí el **Registro de ejecución** y copiá la URL del Sheet. Guardala: es tu base de datos.
10. **Implementar > Nueva implementación > Aplicación web**, con **Ejecutar como: Yo** y **Acceso: Solo yo**. Copiá la URL `/exec`.

Podés entrar directo a una sección con `?page=correo`, `?page=agenda` o `?page=notas` al final de la URL. Después de la primera carga la navegación es del lado del cliente y no vuelve al servidor.

---

## 4. Cómo funciona la prioridad de los correos

Tres niveles, y solo dos botones:

- **★ Importante.** Sube el hilo al bloque de arriba en la sección Correo.
- **✕ Silenciado.** Lo saca de todas las listas. Se sigue contando, pero no lo ves.
- **Normal.** Es la ausencia de marca. Volvés a normal pulsando de nuevo el mismo botón.

Las reglas, en orden:

1. **Tu marca manda siempre.** Si lo marcaste, eso vale.
2. **La estrella de Gmail es solo una semilla**, para los hilos que todavía no marcaste. Si algo está destacado en Gmail y vos no dijiste nada, entra como importante. Si lo silenciaste desde el sitio, se silencia aunque tenga estrella.
3. **El asistente nunca escribe en Gmail.** El scope es de solo lectura y así queda: si el asistente empezara a poner y quitar estrellas en tu bandeja real, un error te desordenaría el correo de verdad.
4. **Lo importante no caduca.** Un hilo marcado importante se sigue mostrando aunque ya haya salido de la ventana de 24 horas. Por eso, al marcarlo, se guarda una copia de su asunto, su remitente y su link en la pestaña `Prioridades`. Los que llegan de esa copia aparecen con la nota "marcado antes".

Todo vive en la pestaña `Prioridades` del Sheet, con el id del hilo de Gmail como clave. Podés editarla o vaciarla a mano sin romper nada: volver a normal es simplemente borrar la fila.

**Por qué marcar se siente instantáneo.** El clic cambia la pantalla de inmediato y la escritura al Sheet va por detrás; si falla, la pantalla se revierte y aparece el aviso. Además, la clasificación se calcula al leer y no al generar el digest, así que la marca ya está aplicada en la siguiente carga sin volver a tocar Gmail.

---

## 5. Cómo lee el correo (sin IA)

El resumen es determinista a propósito: no sale de tu bandeja nada hacia ningún modelo externo.

Está partido en dos capas, y esa separación es lo que hace que el sitio cargue rápido:

- **`generarDigestCorreo()`** lee Gmail y produce un snapshot neutro: los hilos del período, sin opinar sobre cuál importa. Es lo caro, y es lo que corre el trigger de la mañana.
- **`aplicarPrioridades_()`** toma ese snapshot y lo ordena según tus marcas. Solo lee el Sheet, así que es barato y corre en cada carga.

El digest separa lo que te llegó a vos de lo que te llegó en copia, cuenta los mensajes sin leer, y aparte busca tus enviados de los últimos `diasBusquedaEnviados` días para marcar como **esperando respuesta** los hilos donde el último mensaje es tuyo y ya pasaron `diasEsperandoRespuesta` días. Esos son los que de verdad están trabados.

Si algún día querés cambiar el criterio, o pasarlo por un modelo, se reemplaza `generarDigestCorreo()` y nada más.

---

## 6. Cosas que vas a querer cambiar después

### Agregar calendarios compartidos

Hoy se lee solo el principal, en `obtenerCalendarios_()` de `Agenda.gs`:

```javascript
function obtenerCalendarios_() {
  return [CalendarApp.getDefaultCalendar()];
}
```

Para sumar otros, devolvé más elementos, por ejemplo con `CalendarApp.getCalendarById('id@group.calendar.google.com')`. El resto ya está preparado: cada evento lleva el nombre de su calendario y el orden es por hora, mezclando todos.

### Pasar los pendientes a Google Tasks

La v2 los guarda en el Sheet. El cambio está acotado a `obtenerPendientes()` en `Datos.gs`, que es lo único que decide de dónde salen. Habría que habilitar el servicio avanzado de Tasks, agregar su scope al manifiesto y reemplazar la lectura de la pestaña por `Tasks.Tasks.list(...)`. Ni el sitio ni el cliente cambian.

### Encender Google Chat

Sigue fuera, con la pestaña visible y apagada en la navegación. **Se puede, pero no depende del código:** dependen tres cosas encadenadas, y con que falle una no hay Chat.

1. El proyecto de Apps Script tiene que estar asociado a un **proyecto estándar de Google Cloud** (no el que Apps Script crea solo).
2. La **Chat API** tiene que estar habilitada en ese proyecto.
3. El administrador de Workspace no tiene que tener restringidos los scopes `chat.spaces.readonly` y `chat.messages.readonly`.

Ninguna de las tres se puede verificar desde el código. Dos caminos para saberlo: correr un script desechable de diez minutos en un proyecto nuevo que liste espacios y mensajes, o preguntarle al administrador del dominio. Hay un borrador de ese mensaje listo en `Owner Inbox/Pending Review/`.

Cuando la respuesta sea sí, encenderlo es un archivo `Chat.gs` nuevo, el scope en el manifiesto y un cargador de sección en `Cliente.html`. La navegación y el router ya están preparados; nada del resto se toca.

---

## 7. Límites conocidos

- **Cuotas de Apps Script.** El trigger hace tres búsquedas de Gmail y dos llamadas batch. Con los topes de fábrica queda muy lejos del límite de 6 minutos por ejecución. Si subís `topeHilos` o `diasBusquedaEnviados` mucho, medí antes de dejarlo fijo.
- **Búsqueda por clave.** Metas, notas, pendientes y prioridades se ubican recorriendo la primera columna. Con volumen personal es instantáneo; si algún día son miles de filas, el punto a cambiar es `buscarFilaPorId_()` en `Code.gs`.
- **Hilos importantes viejos.** La pestaña `Prioridades` no se limpia sola. Si acumulás muchos importantes, el bloque de arriba crece hasta `topeImportantes`. Se limpia volviendo el hilo a normal desde el sitio o borrando la fila a mano.
- **Scopes.** El manifiesto declara los mínimos, explícitos. Si al autorizar Google se queja de un permiso faltante, borrá el bloque `oauthScopes` completo y volvé a ejecutar `setupAsistente()`: Apps Script los infiere solo, aunque de forma más amplia.
- **Acceso.** La web app está en `MYSELF`. No la cambies a `ANYONE`: corre con tus permisos sobre tu correo y tu calendario.
- **Pestaña `Config`.** Es informativa. El asistente no lee valores de ahí.
