---
last-consolidated: 2026-09-11
---

# Alfred - Memoria de trabajo

> Instrucciones para Alfred: Registra cómo trabaja la owner, qué decisiones de ruteo han funcionado, y qué necesita el sistema a continuación. Tienes el panorama completo. Usa este archivo para mantenerte orientado entre sesiones.

---

## Hot Context

- **Owner:** Gaby
- **Contexto de trabajo:** Trabaja en el área de Business Center, en automatización y mejora de flujos de trabajo mediante programas. Es programadora. Su ciclo de trabajo: llega un ticket → lo revisa → tiene una reunión con la persona solicitante → desarrolla el programa. Stack principal: Google Apps Script y Visual Studio.
- **Equipo:** Alicia (HR), Tuti (Revisora del Sistema), Joy (Gestora de Conocimiento), Samuel (Analista de Requisitos y Desarrollador), Nora (Triage de Solicitudes de Automatización, desde 2026-09-24). Se agregan agentes especialistas según se vayan contratando.
- **Contexto de proyecto, reglas transversales e integraciones:** la versión vigente vive en `CLAUDE.md` (consolidado el 2026-09-29). Si esta memoria y `CLAUDE.md` difieren, manda `CLAUDE.md`.

---

## Stable Knowledge

### Estilo de trabajo de la owner

- Habla español. Toda la conversación y todos los documentos van en español (ver `Data/writing-rules.md`).
- **Tono: más empático y menos máquina.** Lo pidió explícitamente el 2026-09-14. Menos tablas, menos negritas, menos estructura de reporte; más conversación de persona a persona. La franqueza y el criterio no se negocian — lo que cambia es la forma, no el fondo. Aplica a todos los agentes que le escriban a ella.
- Su trabajo llega en unidades discretas y repetibles: un ticket por solicitud. Cada ticket pasa por revisión, reunión de levantamiento con el solicitante, y desarrollo. Ese ciclo es el candidato natural para playbooks y para el primer especialista.

### Decisiones clave de ruteo

| Fecha | Patrón | Decisión |
|------|---------|----------|
| 2026-09-11 | Capability gap detectado al registrar el contexto: el equipo base (Alicia, Tuti, Joy) no cubre trabajo técnico. Gaby programa en Apps Script y Visual Studio. | Falta un especialista de desarrollo. Ruta: Alicia. *Resuelto el mismo día: la contratación aparte se canceló y el desarrollo lo absorbió Samuel.* |
| 2026-09-24 | Solicitudes de automatización del tablero de intake de monday. | Ruta: Nora (triage y propuesta). Gaby decide; lo aprobado pasa a Samuel. |

### Integraciones (actualizado 2026-09-29; la versión vigente está en `CLAUDE.md`)

| Integración | Para qué | Estado |
|---|---|---|
| Lectura de monday.com | Tablero **Solicitud Automatización PEC/ 2026** (board `5091208859`). Hoy Gaby pega el contenido a mano. | **Decidida, pendiente de ejecución.** Vía: usuario dedicado con permiso de Viewer y su token (el token personal de Gaby quedó descartado: no admite solo lectura). Falta, dueña Gaby y sin fecha: crear el usuario, sacar el token desde su sesión, instalar Node.js, configurar `.mcp.json` con variable de entorno, sumarlo a las herramientas de Nora. No prometerla como disponible. |
| Conector de correo | Leer las notificaciones del Business Center. | **Descartado por política, no pendiente.** Cuenta corporativa de Roche en dominio regulado, apps OAuth de terceros casi seguro bloqueadas, `gmail.readonly` da todo el buzón, y reenviar correo corporativo afuera viola la política de datos. Si hace falta un correo, Gaby lo pega. |
| Envío de correo | Samuel redacta mensajes al solicitante pero no puede enviarlos. | Hoy Gaby los envía. La ruta anotada el 2026-09-11 (MCP de Gmail) cae bajo el descarte de arriba. Queda sin confirmar si una web app de Apps Script dentro del dominio de Roche sigue siendo opción; no proponerla sin preguntarle a Gaby. Vigente en cualquier caso: aprobación humana antes de cada envío, porque un correo enviado en nombre de Gabriela Obando no se puede deshacer. |

### Decisiones de sistema

| Fecha | Decisión |
|------|----------|
| 2026-09-11 | Instalación inicial completa. Cuatro agentes base en operación. |
| 2026-09-11 | El workspace se encontró a medio construir (solo carpetas y archivos de referencia en Data/). Alfred completó las fases restantes de SETUP.md: agentes nativos, perfiles de Team, memorias, skills, playbooks, hook, andamiaje de Knowledge. |
| 2026-09-11 | Workspace unificado en español. Gaby anuló la antigua regla de escritura 3, que dejaba en inglés los archivos de la instalación inicial. Todo el contenido se tradujo, salvo `Data/SETUP.md`, que se conserva en su idioma original como referencia del instalador. Los nombres de archivos y carpetas no cambiaron. Ejecutado por Tuti. |
| 2026-09-29 | Consolidado en `CLAUDE.md` lo que salió de la conversación del 2026-09-23 al 2026-09-29: contexto del proyecto, estado de Nora y de BCAT-0077, convención de código de Samuel (resumen con enlace), integraciones decididas, reglas transversales (tokens, contenido no confiable, verificar antes de afirmar, restos en correcciones), aprendizajes de método y la propuesta abierta del formulario de intake. Ejecutado por Tuti. |
