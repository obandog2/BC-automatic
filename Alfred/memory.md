---
last-consolidated: 2026-09-11
---

# Alfred - Working Memory

> Instructions for Alfred: Record how the owner works, what routing decisions have worked, and what the system needs next. You have the full picture. Use this file to stay oriented across sessions.

---

## Hot Context

- **Owner:** Gaby
- **Work context:** Trabaja en el área de Business Center, en automatización y mejora de flujos de trabajo mediante programas. Es programadora. Su ciclo de trabajo: llega un ticket → lo revisa → tiene una reunión con la persona solicitante → desarrolla el programa. Stack principal: Google Apps Script y Visual Studio.
- **Team:** Alicia (HR), Tuti (System Reviewer), Joy (Knowledge Manager). Specialist agents added as hired.

---

## Stable Knowledge

### Owner Working Style

- Speaks Spanish. All conversation and all new documents go in Spanish (see `Data/writing-rules.md`).
- Su trabajo llega en unidades discretas y repetibles: un ticket por solicitud. Cada ticket pasa por revisión, reunión de levantamiento con el solicitante, y desarrollo. Ese ciclo es el candidato natural para playbooks y para el primer especialista.

### Key Routing Decisions

| Date | Pattern | Decision |
|------|---------|----------|
| 2026-09-11 | Capability gap detectado al registrar el contexto: el equipo base (Alicia, Tuti, Joy) no cubre trabajo técnico. Gaby programa en Apps Script y Visual Studio. | Falta un especialista de desarrollo. Ruta: Alicia. Pendiente de que Gaby lo pida. |

### Integraciones pendientes (no existen hoy — no prometerlas como disponibles)

| Integración | Para qué | Estado |
|---|---|---|
| API de Monday.com | Los tickets de Gaby llegan a un tablero de Monday. Hoy ella los pega a mano. Con la API, la entrada se automatiza. | Esperando que Gaby consiga los accesos. |
| Envío de correo | Samuel redacta mensajes al solicitante pero no puede enviarlos. Hoy Gaby los envía. | Proyecto aparte, posterior a la contratación del desarrollador. Ruta probable: web app de Apps Script (terreno de Gaby) sobre MCP de Gmail, por permisos más acotados. Decisión tomada el 2026-09-11: conservar aprobación humana antes de cada envío, aunque exista la integración. Un correo enviado en nombre de Gabriela Obando no se puede deshacer. |

### System Decisions

| Date | Decision |
|------|----------|
| 2026-09-11 | Initial setup complete. Four base agents live. |
| 2026-09-11 | Workspace was found half-built (folders and Data/ reference files only). Alfred completed the remaining SETUP.md phases: native agents, Team profiles, memories, skills, playbooks, hook, Knowledge scaffolding. |
