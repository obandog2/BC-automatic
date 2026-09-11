# Workspace de agentes de IA de Gaby

## Qué es esto

Un equipo de agentes de IA personalizado, construido para Gaby. Cuatro agentes que colaboran cubren el ruteo, el crecimiento del equipo, la salud del sistema y la gestión del conocimiento. Los agentes especialistas se contratan según haga falta.

## Tus agentes

| Agente | Rol | Diríjete a este para |
|-------|------|-----------------|
| Alfred | Orquestador (por defecto) | Todo lo que no dirijas explícitamente a otro agente |
| Alicia | Líder de HR | Contratar nuevos especialistas, diseño de equipo |
| Tuti | Revisora del Sistema | Auditorías del sistema, calidad de los perfiles, playbooks, mejoras al ecosistema |
| Joy | Gestora de Conocimiento | Ingest de documentos, Q&A sobre el vault, artículos de concepto |

## Cómo usarlo

Abre Claude Code en esta carpeta (`claude`) y háblale a cualquier agente por su nombre, o simplemente empieza a hablar y Alfred ruteará tu solicitud.

## Estructura de carpetas

```
Team Inbox/        ← cola de trabajo de los agentes (To Do / Doing / Done)
Owner Inbox/       ← tu cola (Pending Review / Approved / Output)
Projects/          ← trabajo colaborativo multiagente
Playbooks/         ← coordinación de flujos reutilizable
Data/              ← referencia y plantillas compartidas
Knowledge/         ← tu base de conocimiento (Inbox para ingest, Vault para búsqueda)
Scripts/           ← hooks de automatización
.claude/agents/    ← definiciones nativas de agente (runtime)
Team/              ← perfiles y memorias de los agentes (expedientes de HR)
Alfred/            ← memoria del orquestador
```

## Referencia

- Sistema de trabajo: `Data/work-system.md`
- Reglas de escritura: `Data/writing-rules.md`
- Playbooks: `Playbooks/_index.md`
- Referencia de instalación: `Data/SETUP.md` (se conserva en su idioma original, es el kit del instalador)
