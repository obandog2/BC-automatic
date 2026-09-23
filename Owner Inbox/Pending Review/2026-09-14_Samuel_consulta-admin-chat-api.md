# Borrador: consulta al administrador de Google Workspace sobre la Chat API

**Redactado por:** Samuel
**Fecha:** 2026-09-14
**Estado:** pendiente de tu revisión y envío
**Relacionado con:** ASIST-01 — Asistente Personal, fase 2 (Google Chat)

---

## Contexto

El asistente personal ya lee Gmail y Calendar sin problema, porque Apps Script tiene servicios nativos para los dos. Google Chat no: hay que ir por la Chat API, y eso depende de tres condiciones encadenadas que no se pueden verificar desde el código.

1. El proyecto de Apps Script asociado a un proyecto estándar de Google Cloud.
2. La Chat API habilitada en ese proyecto.
3. Los scopes `chat.spaces.readonly` y `chat.messages.readonly` permitidos en el dominio.

La tercera es la única que depende de otra persona, y es la que este mensaje resuelve. Las otras dos las podés comprobar vos misma con un script desechable en diez minutos.

## Una advertencia antes de enviarlo

Este mensaje no va a un solicitante de ticket, va al administrador de Workspace de Roche. Adapté la fórmula de presentación por eso: acá quien pregunta sos vos, no yo. El texto está escrito para que lo firmes y lo envíes desde tu correo, sin mencionar al agente. Si preferís que lleve la presentación estándar, decímelo y lo ajusto.

No sé quién es el administrador ni a qué buzón va. Eso lo completás vos antes de enviar.

## Opciones / Acción recomendada

- **Recomendado:** enviarlo tal cual, en paralelo con el script de verificación. Si el admin contesta que sí y el script funciona, Chat entra en la v3.
- Si preferís no escribirle todavía, corré primero el script de verificación: si falla por otra razón que no sea permisos, el mensaje ni siquiera hace falta.
- Entrega: **la envía Gaby**. Yo no tengo herramientas de correo.

---

## Mensaje para enviar

**Asunto:** Consulta sobre acceso de solo lectura a la Chat API para una herramienta interna

Hola [nombre],

Soy Gabriela Obando, especialista en automatización del Business Center. Estoy desarrollando una herramienta interna de uso personal en Google Apps Script: un panel privado que me muestra en un solo lugar mi correo, mi agenda y mis pendientes del día. Ya funciona con Gmail y Calendar, y quisiera sumarle Google Chat.

Para eso necesito consultarles dos cosas:

- ¿Están permitidos en el dominio los scopes de OAuth `https://www.googleapis.com/auth/chat.spaces.readonly` y `https://www.googleapis.com/auth/chat.messages.readonly`? Son los que necesita la Chat API para listar mis espacios y leer mis mensajes.
- ¿Hay alguna restricción para habilitar la Chat API en un proyecto de Google Cloud propio dentro del tenant?

Algunos detalles que quizá ayuden a evaluarlo:

- Es de **solo lectura**. La herramienta no envía mensajes, no escribe en Chat y no modifica nada.
- Es de **uso personal**. Corre con mi propia cuenta y accede únicamente a mis conversaciones, no a las de terceros. El despliegue está restringido a mi usuario.
- **No sale nada del entorno de Google.** No hay integraciones externas ni envío de datos a servicios de fuera del dominio.

Si hay un procedimiento formal para pedir estos permisos, indíquenmelo y lo sigo. Y si la política no lo contempla, también me sirve saberlo para descartar esa parte del desarrollo.

¿Me podrían dar una respuesta en el transcurso de la semana? Con eso defino si sigo adelante con esa función o la dejo fuera.

Gracias,
Gabriela Obando
Especialista en Automatización — Business Center
