---
last-consolidated: 2026-09-11
---

# Tuti - Memoria de trabajo

> Instrucciones para Tuti: Registra hallazgos de auditoría, mejoras al sistema implementadas, playbooks creados, y patrones que indiquen salud o riesgo del ecosistema.

---

## Hot Context

**2026-09-11 — Workspace unificado en español.** Traduje todo el contenido en inglés (CLAUDE.md, README, los tres archivos de `Data/` salvo SETUP.md, perfiles y memorias de Alfred/Alicia/Tuti/Joy, sus skills, sus agentes nativos, los tres playbooks, los dos archivos de Knowledge, y los mensajes del hook). Solo cambió el contenido: ningún archivo ni carpeta se renombró. La regla de escritura 3 se reescribió para hacer del español el estándar de todo el workspace.

**2026-09-29 — Consolidación de la conversación 2026-09-23 a 2026-09-29 en `CLAUDE.md`** (32 → 73 líneas). Secciones nuevas después de la tabla de ruteo; guardarraíl, reglas 1-5 y ruteo intactos. `Alfred/memory.md` corregido (integraciones, equipo, gap de desarrollo resuelto). Abiertos para Gaby: si el descarte de correo cubre también el envío vía Apps Script dentro del dominio; falta `.gitignore`; los archivos de Nora listan 3 de los 5 pasos del conector. Estructural menor sin reportar aún a fondo: existe `Projects/` vacío junto a `Proyectos/`, y la regla 8 de la operating card apunta a `Projects/_index.md`.

---

## Stable Knowledge

### Historial del sistema

| Fecha | Cambio | Razón |
|------|--------|-----------|
| 2026-09-11 | Instalación inicial | Cuatro agentes base creados desde SETUP.md |
| 2026-09-11 | Workspace unificado en español; regla de escritura 3 reescrita | Gaby anuló la regla anterior, que dejaba en inglés los archivos de la instalación inicial. El equipo había quedado mixto (Samuel en español, el resto en inglés) y una base mixta produce salidas mixtas. Única excepción conservada: `Data/SETUP.md`, kit original del proveedor y referencia histórica del instalador. |

### Patrones conocidos

- **Los nombres de ruta son infraestructura, no prosa.** En la traducción al español, el contenido se traduce y los nombres de archivos y carpetas no. `Scripts/session-start-inbox.sh` depende de la cadena literal `Team Inbox/To Do`, y todos los perfiles apuntan a esas rutas. Lo mismo aplica al campo `name:` del frontmatter de `.claude/agents/*.md` (es el identificador de invocación) y a los slugs `name:` de las skills (referenciados por ruta en las secciones Startup). El campo `description:` sí se traduce: lo lee el sistema de ruteo, y Gaby escribe en español.
- **Los nombres de sección estructurales se mantuvieron en inglés a propósito.** `## Hot Context`, `## Stable Knowledge` y `## Startup` se conservan porque el estándar de memoria de `Data/work-system.md` los define así y los archivos de Samuel, que ya estaban en español y no se tocaron, los usan tal cual. Traducirlos en unos archivos y no en otros habría partido el estándar en dos.
- **`CLAUDE.md` resume y enlaza; no duplica.** Se carga en cada sesión: una o dos líneas por punto, con el detalle en el archivo del agente. Al consolidar, `Alfred/memory.md` declara que ante diferencia manda `CLAUDE.md`.
- **Un cambio de idioma en el workspace es también un cambio de regla.** Traducir los archivos sin reescribir la regla que ordenaba lo contrario deja una contradicción que el siguiente agente resolverá a favor de la regla escrita. La fuente de la regla se actualiza primero, y en el mismo trabajo.
