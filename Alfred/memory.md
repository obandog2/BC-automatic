---
last-consolidated: 2026-09-11
---

# Alfred - Memoria de trabajo

> Instrucciones para Alfred: Registra cómo trabaja la owner, qué decisiones de ruteo han funcionado, y qué necesita el sistema a continuación. Tienes el panorama completo. Usa este archivo para mantenerte orientado entre sesiones.

---

## Hot Context

- **Owner:** Gaby
- **Contexto de trabajo:** Trabaja en el área de Business Center, en automatización y mejora de flujos de trabajo mediante programas. Es programadora. Su ciclo de trabajo: llega un ticket → lo revisa → tiene una reunión con la persona solicitante → desarrolla el programa. Stack principal: Google Apps Script y Visual Studio.
- **Equipo:** Alicia (HR), Tuti (Revisora del Sistema), Joy (Gestora de Conocimiento), Samuel (Analista de Requisitos y Desarrollador). Se agregan agentes especialistas según se vayan contratando.

---

## Stable Knowledge

### Estilo de trabajo de la owner

- Habla español. Toda la conversación y todos los documentos van en español (ver `Data/writing-rules.md`).
- Su trabajo llega en unidades discretas y repetibles: un ticket por solicitud. Cada ticket pasa por revisión, reunión de levantamiento con el solicitante, y desarrollo. Ese ciclo es el candidato natural para playbooks y para el primer especialista.

### Decisiones clave de ruteo

| Fecha | Patrón | Decisión |
|------|---------|----------|
| 2026-09-11 | Capability gap detectado al registrar el contexto: el equipo base (Alicia, Tuti, Joy) no cubre trabajo técnico. Gaby programa en Apps Script y Visual Studio. | Falta un especialista de desarrollo. Ruta: Alicia. Pendiente de que Gaby lo pida. |

### Integraciones pendientes (no existen hoy — no prometerlas como disponibles)

| Integración | Para qué | Estado |
|---|---|---|
| API de Monday.com | Los tickets de Gaby llegan a un tablero de Monday. Hoy ella los pega a mano. Con la API, la entrada se automatiza. | Esperando que Gaby consiga los accesos. |
| Envío de correo | Samuel redacta mensajes al solicitante pero no puede enviarlos. Hoy Gaby los envía. | Proyecto aparte, posterior a la contratación del desarrollador. Ruta probable: web app de Apps Script (terreno de Gaby) sobre MCP de Gmail, por permisos más acotados. Decisión tomada el 2026-09-11: conservar aprobación humana antes de cada envío, aunque exista la integración. Un correo enviado en nombre de Gabriela Obando no se puede deshacer. |

### Decisiones de sistema

| Fecha | Decisión |
|------|----------|
| 2026-09-11 | Instalación inicial completa. Cuatro agentes base en operación. |
| 2026-09-11 | El workspace se encontró a medio construir (solo carpetas y archivos de referencia en Data/). Alfred completó las fases restantes de SETUP.md: agentes nativos, perfiles de Team, memorias, skills, playbooks, hook, andamiaje de Knowledge. |
| 2026-09-11 | Workspace unificado en español. Gaby anuló la antigua regla de escritura 3, que dejaba en inglés los archivos de la instalación inicial. Todo el contenido se tradujo, salvo `Data/SETUP.md`, que se conserva en su idioma original como referencia del instalador. Los nombres de archivos y carpetas no cambiaron. Ejecutado por Tuti. |
