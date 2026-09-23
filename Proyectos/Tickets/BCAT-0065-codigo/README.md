# BCAT-0065 - Instalación y prueba

## Archivos

- `Code.gs`: lógica completa del sistema.
- `appsscript.json`: manifiesto con zona horaria y permisos.

## Antes de instalar

La cuenta que ejecutará el sistema debe tener:

- acceso de lectura a la plantilla configurada en `TEMPLATE_SPREADSHEET_ID`;
- permiso para crear archivos y carpetas en My Drive;
- permiso para crear Google Forms;
- permiso para enviar correo con Apps Script.

## Instalación

1. Crea una hoja de Google Sheets vacía. Este archivo se convertirá en `Histórico de procesos HPV`.
2. Abre `Extensiones > Apps Script`.
3. Reemplaza el contenido de `Code.gs` por el archivo entregado.
4. En Apps Script, abre `Configuración del proyecto` y activa `Mostrar el archivo de manifiesto appsscript.json en el editor`.
5. Reemplaza el manifiesto por el archivo `appsscript.json` entregado.
6. Guarda el proyecto.
7. Selecciona la función `setupSistema` y pulsa `Ejecutar`.
8. Autoriza los permisos solicitados.
9. Abre `Registro de ejecución`. `setupSistema()` muestra las direcciones del histórico de procesos, histórico de respuestas, formulario y carpeta raíz.
10. Regresa al histórico y recarga la página. Aparecerá el menú `HPV`.

`setupSistema()` se puede ejecutar nuevamente sin borrar los procesos existentes. Reinstala el trigger del formulario y reutiliza los recursos registrados en las propiedades del script.

## Configuración manual del Google Form

Apps Script puede recopilar el correo, pero la función antigua que exigía inicio de sesión para el mismo dominio está obsoleta. Por esta razón, después de ejecutar `setupSistema()`:

1. Abre la dirección `formularioEdicion` mostrada en el registro.
2. En la configuración del Form, activa la restricción para usuarios de Roche o de organizaciones confiables, según las opciones habilitadas por el administrador.
3. Confirma que pueden entrar cuentas de estos dominios:
   - `roche.com`
   - `contractors.roche.com`
   - `business.roche.com`
4. Conserva activada la recopilación del correo.
5. No actives la opción de limitar a una respuesta, porque la misma persona puede recibir más de una acción.

Aunque una cuenta externa lograra responder, el backend registra `DOMINIO_NO_PERMITIDO` y no modifica la hoja ni avanza la secuencia.

## Uso

### Crear un proceso

1. En el histórico, selecciona `HPV > Crear proceso`.
2. El sistema genera el siguiente ID, por ejemplo `HPV-01`.
3. En My Drive crea una carpeta con ese ID.
4. Dentro de la carpeta crea una copia de la plantilla con el mismo nombre.
5. En la hoja `Procesos` registra:
   - columna A: ID;
   - columna B: enlace del archivo.

### Preparar la copia

1. Abre el enlace de la columna B.
2. Revisa la hoja `Plan de acción`.
3. Desde la fila 9, confirma que cada tarea de la columna C tenga un correo válido en E.
4. Las filas sin tarea en C se ignoran.
5. La columna B no determina el orden; se usa el orden físico de las filas.

### Iniciar el flujo

1. Regresa al histórico.
2. Selecciona la fila del proceso.
3. Ejecuta `HPV > Iniciar proceso seleccionado`.
4. El sistema envía únicamente la primera acción.
5. Cuando esa acción se responde `Sí`, actualiza H:K y envía la siguiente.

## Reglas de respuesta

- `Sí`: registra la respuesta, completa H, escribe `Finalizado` en I, guarda J y K y envía la siguiente acción.
- `No`: registra la respuesta, no completa H, no cambia I a `Finalizado`, no avanza y notifica a Gaby.
- Duplicada: se registra en el histórico, pero no modifica la hoja ni envía otra acción.
- Código inválido o acción no activa: se registra como incidencia y no modifica la hoja.
- Correo fuera de los dominios permitidos: se registra y no avanza.

## Modificar el correo

El asunto se construye en `sendAction_()`:

```javascript
const subject = '[' + processId + '] Acción A' +
  String(values[5]).padStart(2, '0') + ' - ' + task;
```

El cuerpo HTML está concentrado en `buildActionEmail_()`. Puedes cambiar textos, colores y formato dentro de esa función sin modificar la lógica de la secuencia.

## Prueba recomendada

1. Usa una copia con dos acciones y correos tuyos de prueba.
2. Crea `HPV-01` e inicia el proceso.
3. Confirma que solo llegue el primer correo.
4. Responde la primera acción con `No` y confirma que:
   - aparece en el histórico de respuestas;
   - H permanece vacía;
   - no llega el segundo correo.
5. Responde nuevamente la primera acción con `Sí` y confirma que H:K se actualicen y llegue la segunda acción.
6. Vuelve a enviar la misma respuesta y confirma que se registre como `DUPLICADA` sin cambios adicionales.
7. Completa la segunda acción y confirma que llegue la notificación final.

El código está escrito y queda pendiente de que Gaby lo instale y lo pruebe contra sus permisos y datos reales de Google Workspace.
