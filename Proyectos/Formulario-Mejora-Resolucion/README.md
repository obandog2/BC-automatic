# Formulario de Gerenciamento de Melhoria e Resolucao

Esta entrega reconstruye en portugués el formulario antiguo de Smartsheet como una Web App de Google Apps Script. Guarda las respuestas en Google Sheets y los adjuntos en Google Drive.

## Archivos

- `apps-script/Code.gs`: servidor, creación de la base, validación, almacenamiento y correos.
- `apps-script/Index.html`: interfaz responsive del formulario sin campo de nombre.
- `apps-script/Portal.html`: página inicial con accesos a formularios, seguimiento y dashboards.
- `apps-script/Tracking.html`: consulta segura del estado mediante el protocolo.
- `apps-script/appsscript.json`: configuración del proyecto Apps Script.

## Activación

1. Entra en [Google Apps Script](https://script.google.com/) con la cuenta propietaria de la solución.
2. Crea un **proyecto nuevo**.
3. Reemplaza el contenido de `Code.gs` por el archivo de este proyecto.
4. Agrega tres archivos HTML llamados exactamente `Index`, `Portal` y `Tracking`, y pega el contenido del archivo correspondiente en cada uno.
5. En **Configuración del proyecto**, activa **Mostrar el archivo de manifiesto `appsscript.json` en el editor**.
6. Reemplaza el manifiesto por el archivo `appsscript.json` incluido aquí.
7. En el editor, selecciona la función `setupProject` y pulsa **Ejecutar**. Acepta los permisos solicitados. Esta función crea:
   - La hoja `Base - Gerenciamento de Melhoria e Resolução`.
   - La pestaña `Respostas` con todas las columnas.
   - La pestaña editable `Chapters`.
   - La carpeta privada de anexos en Google Drive.
8. Abre el **Registro de ejecución** para copiar las direcciones de la hoja y de la carpeta creadas.
9. Opcional: para recibir alertas internas, ejecuta desde el editor una función temporal o cambia la llamada con el correo deseado:

   ```javascript
   function configurarAlerta() {
     setAlertEmail('equipo.calidad@empresa.com');
   }
   ```

   Ejecuta `configurarAlerta` una vez y después puedes eliminarla.
10. Pulsa **Implementar > Nueva implementación**.
11. Elige **Aplicación web** y configura:
    - **Ejecutar como:** Yo.
    - **Quién tiene acceso:** Cualquier persona.
12. Pulsa **Implementar**, autoriza y copia la URL terminada en `/exec`.
13. Abre esa URL en una ventana privada para comprobar que funciona sin iniciar sesión.

La URL principal abre el portal. El formulario interno queda en `?page=form` y el seguimiento en `?page=tracking`.

## Correo del usuario

El sistema usa `Session.getActiveUser().getEmail()`. En un despliegue restringido al dominio Roche, Google normalmente entrega el correo de la sesión. Si la política de identidad no lo permite y devuelve un valor vacío, el formulario habilita el campo para que la persona lo escriba manualmente.

## Configurar el dashboard

Agrega temporalmente esta función en `Code.gs`, cambia la URL y ejecútala una vez:

```javascript
function configurarDashboard() {
  setDashboardUrl('URL_DEL_DASHBOARD');
}
```

Después puedes eliminar `configurarDashboard`. El botón del portal se habilitará automáticamente.

## Prueba recomendada

Envía una respuesta ficticia sin información sensible y comprueba:

1. Que aparece una fila nueva en `Respostas`.
2. Que el protocolo comienza por `GMR-`.
3. Que los adjuntos aparecen en la carpeta creada.
4. Que llega la confirmación si se selecciona la opción de recibir copia.
5. Que llega la alerta interna si fue configurada.
6. Que el protocolo puede consultarse desde `?page=tracking`.

## Consideraciones para acceso externo

- La cuenta administradora de Google Workspace debe permitir implementaciones accesibles para **cualquier persona**. Si esa opción no aparece, el administrador del dominio debe habilitarla o aprobar otra arquitectura.
- El formulario público escribe usando los permisos de la persona que lo implementó. No se debe compartir públicamente la hoja ni la carpeta de adjuntos.
- Antes de usar datos reales, el área correspondiente de Roche debe revisar privacidad, retención, clasificación de datos y el texto de consentimiento.
- El indicador de triage es orientativo: marca revisión prioritaria cuando existe al menos una respuesta `Sim`; no sustituye la evaluación formal de Quality, Medical, Legal o Compliance.
- La solución incluye una trampa básica contra bots y validación del servidor, pero un formulario anónimo de alto tráfico debería incorporar un control antiabuso corporativo adicional.

## Personalización

- Los Chapters se modifican directamente en la pestaña `Chapters`; no es necesario cambiar el código.
- Los colores y textos visuales se encuentran al inicio de `Index.html`.
- Los tipos y límites de adjuntos se configuran en `CONFIG` dentro de `Code.gs` y también deben mantenerse sincronizados con la validación del navegador.
