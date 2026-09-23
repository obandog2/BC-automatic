# Ticket BCAT-0065 - Flujo por pasos sobre hoja "Plan de accion"

**Estado:** en pausa (esperando segunda reunión con el solicitante)
**Solicitante:** pendiente de identificar
**Origen:** Monday, pegado por Gaby
**Última actualización:** 2026-09-15

---

## Lo que dice el ticket

Flujo de trabajo por pasos. Se genera una copia de un archivo de Google Sheets (enlace en Drive corporativo de Roche). En la hoja **"Plan de accion"**:

- **Columna C, desde la fila 9:** las acciones.
- **Columna E, desde la fila 9:** el correo del responsable de esa acción.
- Por cada acción se envía un formulario al responsable.
- **Columna F:** fecha de envío del correo con el formulario.
- **Columna H:** fecha de respuesta, se llena cuando completan el paso.

Idea de arquitectura de Gaby, textual en el ticket:
1. Un archivo tipo plantilla.
2. Un botón en el menú que genere un archivo nuevo, porque es uno por proceso.
3. Un archivo de histórico de cuántas plantillas se han generado.
4. Otro histórico para guardar la información de lo que llenan del formulario.

**El enlace requiere sesión corporativa.** La estructura se verificó primero mediante la captura entregada por Gaby y después se recibió el enlace de la versión nativa de Google Sheets para usarlo en la configuración del código.

## Decisiones confirmadas por Gaby el 2026-09-15

1. Cada acción se atenderá mediante **Google Forms**. La respuesta deberá llevar un código de seguimiento prellenado que permita relacionarla con el proceso y la acción correctos.
2. Las acciones se ejecutarán de forma **secuencial**. No se enviarán todos los formularios al mismo tiempo.
3. La **fecha de cumplimiento de la columna H será automática**: corresponderá al momento en que se reciba la respuesta válida del formulario.
4. Para este ticket, la única hoja funcional que se debe procesar es **"Plan de acción"**.

Estas decisiones cerraron las tres preguntas bloqueantes originales. El alcance técnico completo quedó propuesto más abajo y está pendiente de la luz verde de Gaby.

## Estructura confirmada de la hoja "Plan de acción"

La captura entregada por Gaby muestra los encabezados en la fila 8 y los registros desde la fila 9:

| Columna | Encabezado visible | Uso confirmado |
|---|---|---|
| B | N° | Número mostrado para la tarea; en la muestra existen valores repetidos y filas sin número |
| C | Tarea | Descripción de la acción |
| D | Rol responsable | Rol o área responsable |
| E | Colaborador | Correo del responsable; en la muestra también hay celdas vacías |
| F | Plazo | Regla o descripción textual del plazo |
| G | Fecha límite | Fecha límite de la acción |
| H | Fecha de cumplimiento | Fecha automática al recibir una respuesta válida |
| I | Estatus | Estado visible de la acción |
| J | Entregable | Entregable o enlace asociado |
| K | Comentario | Comentario o enlace complementario |

La imagen corrige una interpretación del ticket inicial: **la columna F no es la fecha de envío**, sino el plazo. La estructura visible no contiene una columna para guardar la fecha de envío del formulario.

El primer enlace no pudo abrirse desde este entorno porque Google exige iniciar sesión. La captura permitió documentar la estructura visible y mostró que aquella primera versión era XLSX.

El 2026-09-15 Gaby entregó el enlace de la plantilla ya convertida a Google Sheets. El navegador de este entorno continúa sin una sesión corporativa y no puede abrirla, por lo que el código usará el ID entregado y la verificación final se realizará con la cuenta de Gaby.

## Alcance propuesto para aprobación

1. `setupSistema()` creará en My Drive una carpeta raíz del sistema, un Google Form, un histórico de procesos y un histórico de respuestas.
2. El histórico de procesos tendrá en la hoja visible las columnas A `ID` y B `Enlace del archivo`.
3. Desde un menú del histórico, Gaby podrá crear un proceso nuevo. El sistema generará IDs consecutivos `HPV-01`, `HPV-02`, etc.; después de `HPV-99` continuará con `HPV-100`.
4. Para cada proceso se creará en My Drive una carpeta llamada con el ID y dentro se guardará una copia de la plantilla con ese mismo nombre.
5. El proceso se iniciará desde el histórico seleccionando su fila y ejecutando el menú `HPV > Iniciar proceso`.
6. Al iniciar, el sistema leerá la columna C desde la fila 9 hacia abajo y conservará el orden físico de las filas. La numeración de B no se usará para ordenar.
7. Solo se enviará una acción a la vez. Una respuesta válida y completada habilitará el envío inmediato de la siguiente acción.
8. El correo tendrá un asunto con el formato `[HPV-01] Acción A01 - <texto de la tarea>` y un botón que abrirá el Google Form con el código de seguimiento prellenado.
9. `HPV-01` será el ID estable del proceso y del archivo. Cada acción tendrá además un identificador técnico `HPV-01-A01`, `HPV-01-A02`, etc., necesario para relacionar la respuesta con una fila sin depender del número visible de B.
10. El formulario tendrá los campos: código de seguimiento, acción completada `Sí/No`, entregable o enlace y comentario. El código de seguimiento se completará desde el enlace y se validará contra la acción activa.
11. Cuando la respuesta sea `Sí`, el sistema guardará la respuesta en el histórico, escribirá automáticamente la fecha en H, pondrá `Finalizado` en I, guardará el entregable en J y el comentario en K; después enviará la siguiente acción.
12. Si la siguiente acción tiene E vacía, no se enviará ningún correo ni se avanzará silenciosamente. La incidencia quedará registrada en el control técnico.
13. El formulario requerirá inicio de sesión y recopilará el correo. La aceptación de cuentas `@roche.com`, `@contractors.roche.com`, `@business.roche.com` y `@external.roche.com` depende de que estén incluidas o sean organizaciones confiables dentro de la configuración de Google Workspace de Roche; se verificará durante la prueba.
14. Al completar la última acción, el sistema enviará una notificación a la dirección indicada por Gaby.
15. Las fechas y el estado técnico de los envíos quedarán en una hoja oculta de control, sin utilizar ni sobrescribir la columna F.

## Supuestos incluidos en el plan, pendientes de luz verde

- Si la respuesta es `No`, se guarda en el histórico, no se llena H, no se cambia I a `Finalizado`, no se envía la siguiente acción y se notifica a Gaby.
- Una segunda respuesta para una acción ya finalizada se registra como duplicada y no modifica la hoja ni vuelve a disparar la secuencia.
- Una tarea puede editarse antes de iniciar el proceso. Después de iniciarlo, la secuencia usa la copia registrada en el control técnico para evitar cambios silenciosos.
- No se incluyen recordatorios automáticos en esta primera versión.
- El sistema es una automatización operativa; no se implementan firma electrónica ni controles de un sistema validado de calidad.

## Ejemplo de correo propuesto

**Asunto:** `[HPV-01] Acción A01 - Creación de la app en Rexis`

**Cuerpo:**

> Hola,
>
> Tienes una acción pendiente dentro del plan HPV-01.
>
> Acción: Creación de la app en Rexis  
> Fecha límite: 02/09/2026
>
> Utiliza el botón "Responder acción" para confirmar el resultado, adjuntar el enlace del entregable y registrar un comentario.
>
> La siguiente acción del proceso se habilitará cuando esta respuesta sea completada.

El texto del correo quedará agrupado en una sola función para que Gaby pueda modificarlo directamente sin tocar la lógica del flujo.

## Plan de implementación

**Archivos que se crearán después de la luz verde:**

- `Proyectos/Tickets/BCAT-0065-codigo/Code.gs` — configuración, creación del sistema, generación de procesos, secuencia, formulario, correos y triggers.
- `Proyectos/Tickets/BCAT-0065-codigo/appsscript.json` — zona horaria, servicios y permisos requeridos.
- `Proyectos/Tickets/BCAT-0065-codigo/README.md` — pasos para instalar, autorizar, probar y modificar el texto del correo.

**Funciones previstas:**

| Función | Responsabilidad |
|---|---|
| `setupSistema()` | Crear carpeta raíz, formulario, históricos, hojas técnicas y trigger de respuesta |
| `crearProceso()` | Generar el siguiente ID, crear la carpeta y copiar la plantilla, y registrar A/B en el histórico |
| `iniciarProceso()` | Leer las tareas del proceso seleccionado, congelar la secuencia y enviar la primera acción |
| `crearEnlacePrellenado_()` | Generar el enlace del Form con el ID técnico de la acción |
| `enviarAccion_()` | Enviar el correo HTML con el botón y registrar la fecha técnica de envío |
| `alEnviarFormulario(e)` | Validar la respuesta, actualizar H:K y decidir si avanza la secuencia |
| `enviarSiguienteAccion_()` | Buscar la siguiente tarea válida en orden físico y enviarla |
| `finalizarProceso_()` | Marcar el proceso como terminado y notificar a Gaby |

**Lo que no se tocará:**

- Las columnas B:G de la hoja `Plan de acción`.
- La columna F, que conserva el texto del plazo.
- Las demás hojas de la plantilla.
- El formato visual existente de la hoja.

**Luz verde recibida el 2026-09-15.** Gaby confirmó que una respuesta `No` se registra sin completar H ni avanzar la secuencia, y que una respuesta duplicada se conserva sin modificar la hoja ni enviar otra acción.

---

## Verificaciones pendientes para la instalación

- Confirmar durante la prueba que la cuenta ejecutora puede abrir la plantilla nativa, crear archivos en My Drive, enviar correos e instalar el trigger del formulario.
- Confirmar que la política de Google Workspace permite responder a las cuentas `@roche.com`, `@contractors.roche.com` y `@business.roche.com` bajo la restricción organizacional del Form.
- Probar el supuesto definido para una respuesta `No` y el tratamiento de respuestas duplicadas.
- Confirmar que la automatización es operativa y no requiere validación formal, firma electrónica ni controles adicionales de un registro regulado.

---

## Revisión de la arquitectura que propuso Gaby

Su enfoque es el correcto. Plantilla + generador + registro maestro + registro de respuestas es exactamente el patrón que este problema pide. Cuatro cosas que cambiaría y una que falta.

### 1. El código no debería vivir dentro de la plantilla

Si el Apps Script está pegado a la hoja plantilla, **cada copia se lleva su propia copia del código**. A los seis meses hay 40 archivos con 40 versiones distintas y un bug se arregla 40 veces, uno por uno. Es el costo oculto más caro de esta arquitectura.

Dos salidas:

- **Biblioteca.** El código vive en un proyecto standalone publicado como library. La plantilla solo lleva un stub de cinco líneas: `onOpen()` que arma el menú y funciones de una línea que delegan. El código se corrige en un lugar. Costo: la library hay que compartirla en lectura con todos los usuarios, y hay que decidir si las copias apuntan a versión fija (control, pero hay que subir versión) o a desarrollo (el cambio llega solo, y un error también llega solo a los 40 archivos).
- **Consola única.** Los archivos por proceso no tienen script en absoluto: son solo datos. El botón y toda la operación viven en un único archivo de control desde el que se administran todos los procesos. Más limpio y más fácil de mantener, pero solo sirve si quien opera es una persona central y no el dueño de cada proceso desde dentro de su archivo.

Para esta versión se eligió la **consola única**: el histórico central administra los procesos y las copias no llevan código propio.

### 2. El histórico de plantillas generadas debe ser un registro maestro, no un contador

"Cuántas plantillas se han generado" se queda corto para lo que ese archivo va a tener que contestar en tres meses. Es el mismo archivo, solo con las columnas correctas desde el día uno. Agregar columnas después es gratis; recuperar historia que nunca se guardó, no.

Esquema propuesto: `id_proceso` | `nombre_proceso` | `url_archivo` | `id_archivo_drive` | `creado_por` | `fecha_creacion` | `estado` | `total_acciones` | `acciones_cerradas` | `fecha_cierre`.

Con eso se responde "qué procesos están abiertos y atrasados" sin abrir cuarenta archivos, y el sistema tiene dónde validar que un código de seguimiento que llega es real.

### 3. El histórico de respuestas debería ser la fuente de verdad, y la columna H una consecuencia

Si la respuesta se escribe directo en H y alguien borra la celda, el dato se perdió y no hay de dónde sacarlo. Propongo el orden inverso: la respuesta cae primero en el histórico, que es append-only y no se edita nunca, y de ahí un paso la copia a H. Si H se rompe, se reconstruye.

Esto además permite conservar las respuestas duplicadas en el histórico sin volver a modificar la acción ni disparar otra vez la secuencia.

Esquema propuesto: `timestamp` | `id_proceso` | `id_accion` | `fila_origen` | `correo_responsable` | `correo_de_quien_respondio` | `fecha_ejecucion` | `[campos del formulario]` | `aplicada_a_H` (sí/no).

### 4. Lo que falta en la idea, y es el corazón del ticket: la clave de correlación

Un formulario que reciben cinco personas no sabe por sí solo a qué fila pertenece cada respuesta. Hay que hacer viajar una clave en el enlace del correo y recuperarla al recibir la respuesta. En Google Forms se hace con una URL prellenada (`createResponse().toPrefilledUrl()`) sobre un campo de texto corto tipo "Código de seguimiento — no modificar".

Dos advertencias sobre eso:

- **Forms no tiene campos ocultos de verdad.** El responsable ve el código y lo puede borrar o cambiar. Mitigación: validar el código contra el registro maestro y mandar lo que no cruce a una bandeja de excepciones en vez de descartarlo en silencio.
- **La clave nunca puede ser solo el número de fila.** Si alguien inserta una fila arriba, una respuesta pendiente puede apuntar al lugar equivocado. La clave será un identificador técnico como `HPV-01-A03`, validado contra el control central.

Gaby eligió Google Forms para esta versión. Una web app queda fuera del alcance.

### Riesgos técnicos concretos

- **Cuotas de correo.** Cada acción produce un correo. La versión inicial no incluye recordatorios, pero la cantidad de procesos simultáneos debe mantenerse dentro de las cuotas de la cuenta ejecutora.
- **Seis minutos de ejecución.** Un envío masivo que lee celda por celda revienta el límite. Se lee el rango entero de una vez, se procesa en memoria, se escribe el rango entero de una vez.
- **Corte a la mitad.** La rutina registrará cada envío exitoso en el control técnico oculto y saltará las acciones que ya tengan envío confirmado. Así volver a ejecutarla será inofensivo y no duplicará correos. La columna F no se usará porque contiene el plazo.
- **Doble clic en el botón** = dos archivos de proceso. Se resuelve con `LockService` y deshabilitando el menú mientras corre.
- **Concurrencia en el histórico.** Dos personas responden al mismo tiempo, dos disparos de `onFormSubmit` escriben en la misma hoja y una fila pisa a la otra. `LockService` también aquí.
- **Formato de fecha y zona horaria.** Definir si la fecha de envío y H llevan fecha sola o fecha y hora, y fijar la zona horaria del proyecto. Si no, aparecen desfases de un día que nadie sabe explicar.

---

## Sugerencias de Samuel (pendientes de tu decisión)

Nada de esto lo pidió el solicitante. Tú decides qué sube a la reunión.

- **Estados controlados en la columna I** (pendiente / enviada / respondida / vencida). La columna ya existe; falta confirmar si la automatización puede administrarla y qué valores exactos acepta.
- **Bandeja de excepciones**: una hoja donde caen los envíos fallidos, los correos inválidos y las respuestas cuyo código no cruza. Sin esto, los fallos son invisibles.
- **Validación previa al envío**: antes de mandar nada, revisar que todas las filas con acción tengan un correo con formato válido, y mostrarle al usuario la lista de problemas. Es diez minutos de código que ahorra el correo que nunca llegó.
- **Un registro de auditoría mínimo** (quién generó, quién envió, quién respondió y cuándo). El plan ya conserva esos datos en los históricos y el control técnico; no equivale a un sistema validado de calidad.
- **Modo prueba**: una constante que redirige todos los correos a la cuenta de Gaby. Para poder probar el flujo completo sin escribirle a media compañía.

---

## Criterios de aceptación propuestos para la luz verde

Quedan aprobados junto con el plan si Gaby da la luz verde sin correcciones.

1. Desde la plantilla, un usuario autorizado genera un archivo de proceso nuevo en la carpeta acordada, con el nombre acordado, y queda una fila en el registro maestro.
2. Al iniciar el proceso, solo la primera acción pendiente de la secuencia recibe un correo con su enlace prellenado de Google Forms; la fecha de envío queda en el control técnico oculto, sin modificar la columna F.
3. Cuando llega una respuesta válida, esta queda en el histórico, la fecha automática aparece en H de la fila correcta y se habilita el envío de la siguiente acción pendiente.
4. Una fila sin acción se ignora. Una tarea con acción pero sin correo no genera correo, detiene el avance y queda registrada como incidencia.
5. Volver a ejecutar el proceso no envía correos duplicados a una acción cuyo envío ya quedó registrado.
6. Todo lo anterior se cumple con [N] acciones en un proceso, dentro del límite de ejecución de Apps Script.

---

## Estado del desarrollo

**Código entregado el 2026-09-15.** Se crearon `Code.gs`, `appsscript.json` y `README.md` en `Proyectos/Tickets/BCAT-0065-codigo/`. La sintaxis de JavaScript y el JSON fueron revisados localmente. El ticket permanece `en código` hasta que Gaby instale y pruebe el sistema con sus permisos y datos reales de Google Workspace.

## Registro de cambios posteriores a la luz verde

| Fecha | Quién lo pidió | Cambio | Afecta a | Tipo | Decisión de Gaby |
|---|---|---|---|---|---|
| 2026-09-15 | Gaby | Usar el archivo `Tool` como consola: procesar filas con A marcada y B llena, pedir confirmación, copiar únicamente `Plan de acción`, usar un segundo menú `Envío de acción` y guardar respuestas en una pestaña nueva dentro de `Tool` | Arquitectura de archivos, `setupSistema()`, creación de procesos, menús, histórico y ubicación de respuestas | contradice el alcance aprobado | aprobado; luz verde v2 recibida |

### Parte confirmada del cambio

1. El archivo `Tool` será el punto de operación del flujo.
2. La primera acción del menú validará que la columna A de la fila sea `TRUE` y que B no esté vacía. Sin ambas condiciones no procesará esa fila.
3. Antes de crear el proceso mostrará `¿Está seguro de proceder?`. Solo continuará si el usuario acepta.
4. El nombre indicado en B se usará para renombrar la copia de `Plan de acción`.
5. Solo se copiará la hoja `Plan de acción`; las demás hojas de la plantilla quedan fuera.
6. El segundo elemento del menú se llamará `Envío de acción` y enviará la primera tarea encontrada en C desde la fila 9 al correo de E.
7. El correo conservará el botón hacia el Google Form y la secuencia acordada previamente.
8. Las respuestas del Form se guardarán en una nueva pestaña dentro del archivo `Tool`.

### Precisiones pendientes antes de modificar el código

1. Indicar el nombre exacto de la pestaña de `Tool` que contiene los checkboxes en A y los nombres en B.
2. Confirmar si la copia de `Plan de acción` será una **pestaña nueva dentro de `Tool`** o un **archivo de Google Sheets independiente**. La frase “nueva hoja” admite ambas lecturas.
3. Si hay varias filas con A marcada y B llena, confirmar si el primer botón procesa todas o solo la fila actualmente seleccionada.
4. Indicar dónde debe quedar el ID `HPV-01` y cómo se relaciona con la fila de `Tool`, ya que B ahora contiene el nombre y no el enlace generado.
5. Confirmar cómo identifica `Envío de acción` qué proceso debe iniciar: por la fila seleccionada, por el checkbox A, o por la pestaña activa.

La versión de código entregada antes de este cambio no debe instalarse como versión final, porque crea una arquitectura distinta.

## Alcance propuesto de la versión 2

1. El proyecto de Apps Script estará vinculado al archivo `Tool` indicado por Gaby, no a una hoja histórica vacía.
2. El menú tendrá dos acciones: `Generar hojas` y `Envío de acción`.
3. `Generar hojas` leerá todas las filas de la pestaña `Tool` y seleccionará únicamente aquellas con A igual a `TRUE`, B con contenido y C vacía.
4. Si no existen filas válidas, terminará sin crear hojas. Si existen, mostrará una confirmación única indicando cuántas filas se procesarán.
5. Al aceptar, por cada fila válida copiará únicamente la pestaña `Plan de acción` de la plantilla al archivo `Tool`, renombrará la copia con el valor de B, generará el siguiente ID `HPV-01`, `HPV-02`, etc., guardará la relación en `_Control` y escribirá `Completado` en C de `Tool`.
6. Si ya existe una pestaña con el nombre de B, esa fila no se sobrescribirá ni se marcará como completada; la incidencia quedará en `_Control`.
7. `Envío de acción` recorrerá los procesos creados que todavía no tengan un primer envío registrado. Para cada uno validará C9 y E9 en su pestaña; si ambos contienen datos y E9 pertenece a un dominio permitido, enviará el primer correo con el botón al Form.
8. Cada proceso conservará su ID HPV y cada acción tendrá un ID técnico `HPV-01-A01`, necesario para relacionar la respuesta con la pestaña y fila correctas.
9. El Google Form será único para todos los procesos. Tendrá código prellenado, acción completada Sí/No, entregable o enlace y comentario.
10. Las respuestas se guardarán en la pestaña `Respuestas HPV` dentro del mismo archivo `Tool`.
11. La secuencia posterior conserva las reglas ya aprobadas: una respuesta Sí actualiza H:K y envía la siguiente acción; No se registra pero no avanza; duplicadas se registran sin efectos.
12. `_Control` será una pestaña oculta del mismo archivo y almacenará ID, nombre de pestaña, fila de origen en Tool, acciones y estados técnicos.

## Plan de implementación de la versión 2

**Archivos nuevos:**

- `Proyectos/Tickets/BCAT-0065-codigo-v2/Code.gs` — versión vinculada al archivo Tool.
- `Proyectos/Tickets/BCAT-0065-codigo-v2/appsscript.json` — permisos y zona horaria.
- `Proyectos/Tickets/BCAT-0065-codigo-v2/README.md` — instalación, reemplazo y pruebas.

**Interpretación aprobada:** `Envío de acción` procesará en lote todas las pestañas creadas que estén pendientes de envío o cuya secuencia necesite reanudarse después de corregir un correo. No dependerá de la pestaña activa.

## Estado de desarrollo de la versión 2

**Código preparado el 2026-09-15.** Se crearon `Code.gs`, `appsscript.json` y `README.md` en `Proyectos/Tickets/BCAT-0065-codigo-v2/`. Después de la primera prueba se simplificaron los registros para que cada evento aparezca una sola vez mediante `Logger.log()` y muestre resultados directos como `CREADO` o `NO CREADO`, junto con el nombre de la pestaña. La sintaxis y el manifiesto se revisaron localmente; la ejecución real queda pendiente de completar la prueba con los permisos corporativos de Gaby.

**Pausa acordada el 2026-09-15.** La creación de pestañas y el envío inicial ya funcionan. No se harán más cambios hasta realizar una segunda reunión con el solicitante y confirmar los ajustes restantes.
