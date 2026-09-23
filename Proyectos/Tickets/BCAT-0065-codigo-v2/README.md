# BCAT-0065 — instalación de la versión 2

Esta versión debe instalarse como un proyecto de Apps Script vinculado al archivo `Tool`:

`1_KGwTYFT3ju7Egjb4rRD-CjvOA1X77_SoUpP9PpylT4`

No debe instalarse en una hoja vacía ni en un proyecto independiente.

## 1. Instalar el código

1. Abra el archivo `Tool`.
2. Entre en **Extensiones > Apps Script**.
3. Sustituya el contenido de `Code.gs` por el archivo `Code.gs` de esta carpeta.
4. En Apps Script, abra **Configuración del proyecto** y active **Mostrar el archivo de manifiesto `appsscript.json` en el editor**.
5. Sustituya el manifiesto por el archivo `appsscript.json` de esta carpeta.
6. Guarde el proyecto y recargue la hoja de cálculo.

Al recargar aparecerá el menú **HPV** con estas opciones:

- `Configurar sistema`
- `Generar hojas`
- `Envío de acción`

## 2. Configurar una sola vez

Ejecute **HPV > Configurar sistema** y autorice los permisos solicitados.

El proceso crea:

- la hoja oculta `_Control`;
- la hoja `Respuestas HPV`;
- un Google Form para responder las acciones;
- el trigger instalable `alEnviarFormulario`.

La ejecución muestra en el registro las direcciones de edición y respuesta del formulario.

## 3. Restringir manualmente el formulario

Abra el formulario con la URL indicada por el registro `SETUP_FIN`. En la configuración del formulario, restrinja el acceso a usuarios autorizados de Roche y organizaciones confiables. Mantenga activada la recopilación de correo.

El código también valida estos dominios antes de procesar una respuesta:

- `roche.com`
- `contractors.roche.com`
- `business.roche.com`
- `external.roche.com`

## 4. Generar hojas de proceso

En `Tool`, cada fila se procesa solamente cuando:

- columna A está marcada;
- columna B contiene el nombre de la nueva pestaña;
- columna C está vacía.

Ejecute **HPV > Generar hojas**. El sistema muestra una confirmación antes de continuar y procesa todas las filas elegibles. Por cada fila copia únicamente `Plan de acción` desde la plantilla, crea un ID `HPV-01`, `HPV-02`, etc., y escribe `Completado` en la columna C.

Si una fila falla, las demás continúan. El error queda registrado en `_Control` y en los registros de ejecución.

## 5. Enviar la primera acción

Ejecute **HPV > Envío de acción**. Para cada proceso pendiente, el sistema valida:

- tarea inicial en C9;
- correo inicial en E9;
- dominio Roche permitido.

Si las validaciones pasan, envía la primera acción. El asunto contiene el ID del proceso y la acción. El botón del correo abre el formulario con el código de seguimiento autocompletado.

## 6. Secuencia automática

Cuando una respuesta válida indica `Sí`:

- completa H con la fecha y hora;
- completa I con `Finalizado`;
- copia entregable y comentario en J y K;
- envía la siguiente acción que tenga tarea en la columna C.

Una respuesta `No` se registra, no modifica H:K, no avanza la secuencia y notifica a `gabriela.obando_angulo@external.roche.com`.

Una respuesta duplicada se registra, pero no modifica la hoja ni envía la siguiente acción.

## 7. Revisar los registros

Cada evento aparece una sola vez y usa un texto directo:

```text
[HPV] CREADO: se creó la pestaña y se marcó la fila como Completado. | nombre: test 1 | id: HPV-01 | filaTool: 2
```

Puede revisarlos en:

- **Apps Script > Ejecuciones**, para ver cada ejecución y su detalle;
- **Registro de ejecución**, mientras ejecuta una función manualmente.

El registro indicará claramente si una pestaña fue creada, no fue creada, si un correo fue enviado y si una respuesta actualizó la hoja.

## 8. Prueba mínima recomendada

1. Use una fila de prueba en `Tool` con A marcada, B con un nombre único y C vacía.
2. Ejecute `Generar hojas` y confirme que se crea la pestaña y C cambia a `Completado`.
3. En la pestaña creada, coloque una tarea en C9 y un correo autorizado en E9.
4. Ejecute `Envío de acción`.
5. Responda el formulario con `No` y compruebe que H permanece vacía.
6. Responda nuevamente con `Sí` y compruebe H:K y el envío de la siguiente acción.
7. Repita la respuesta `Sí` y compruebe que queda como duplicada sin avanzar nuevamente.

No se requiere publicar una aplicación web para este flujo.
