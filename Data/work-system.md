# Sistema de Trabajo

**Versión:** 1.0

> Este documento es la referencia canónica de cómo fluye el trabajo por el equipo de agentes. Todos los agentes deben leerlo y seguirlo. Alfred lo hace cumplir.

---

## Panorama del sistema

```
Gaby
  │
  ├──► [Nombre del agente], haz X   Acceso directo: el agente responde de inmediato
  │                                └──► El agente hace spawn de subagentes para delegar en vivo
  │
  └──► Alfred (orquestador)     Por defecto cuando no se nombra a ningún agente
         │  rutea tareas              └──► Hace spawn del agente líder
         ▼
       Team Inbox/
         ├── To Do/     ← solo tareas asíncronas (entre sesiones)
         ├── Doing/     ← en trabajo activo
         └── Done/      ← tareas completadas

       Owner Inbox/
         ├── Pending Review/   ← esperando decisión de la owner
         ├── Approved/         ← la owner ya dio el visto bueno
         └── Output/           ← entregables terminados, sin aprobación necesaria

       Projects/
         └── [Nombre-Proyecto]/   ← trabajo multiagente, brief + estado compartidos

       Playbooks/
         └── [playbook].md     ← coordinación de flujos reutilizable

       Data/
         └── [archivos de referencia] ← conocimiento y plantillas compartidas

       Knowledge/
         ├── Inbox/   ← documentos crudos para ingest
         └── Vault/   ← base de conocimiento compilada por Joy
```

---

## Reglas centrales

1. **Auto-ejecución.** Cuando aparece una tarea en `Team Inbox/To Do/` dirigida a un agente, ese agente empieza de inmediato. No hace falta ningún "adelante".
2. **Acceso directo.** La owner puede dirigirse a cualquier agente por su nombre. Ese agente se activa y responde sin que Alfred rutee.
3. **Delegación entre agentes.** Los agentes delegan en otros agentes con spawn de subagentes en vivo (misma sesión) o con archivos de tarea (entre sesiones). Ver la Sección 3.
4. **Proyectos compartidos.** El trabajo multiagente vive en `Projects/`. Cualquier agente participante puede leer y escribir el `status.md` compartido.

---

## 1. Tareas

### Nombre del archivo de tarea
```
[YYYY-MM-DD]_[Agente(s)]_[slug-corto].md
```

### Estructura del archivo de tarea
```
# Tarea: [Título]

**Ruteado por:** Alfred | [Nombre del agente] | Owner
**Para:** [Nombre(s) del agente]
**Fecha:** [YYYY-MM-DD]

---

## Solicitud
[Qué hay que hacer]

## Contexto
[Antecedentes relevantes, proyecto vinculado, archivos relacionados en Data/]

## Salida esperada
[Qué debe producir el agente y dónde debe quedar]
```

### Ciclo de vida de la tarea
1. Se crea la tarea en `Team Inbox/To Do/` - el agente empieza de inmediato
2. El agente mueve el archivo a `Team Inbox/Doing/`
3. El agente completa el trabajo y mueve el archivo a `Team Inbox/Done/`
4. Si la salida requiere revisión de la owner, el agente crea un archivo en `Owner Inbox/Pending Review/`

---

## 2. Proyectos

Un proyecto es un cuerpo de trabajo que abarca varias sesiones, involucra a uno o más agentes a lo largo de fases, tiene un objetivo definido y produce salidas duraderas.

### Estructura de carpeta de proyecto
```
Projects/
└── [Nombre-Proyecto]/
    ├── brief.md       ← objetivo, alcance, criterios de éxito, agentes involucrados
    ├── status.md      ← estado compartido: fase actual, bloqueos, bitácora de sesiones
    └── [salidas]      ← archivos producidos por el proyecto
```

### Archivos requeridos de un proyecto

| Archivo | Cuándo | Propósito |
|------|------|---------|
| `brief.md` | Siempre | Objetivo, alcance, criterios de éxito, agentes |
| `status.md` | Mientras esté activo | Fase actual, bloqueos, bitácora de sesiones |
| `handover.md` | Al cerrar | Qué se construyó, cómo se accede, qué queda pendiente |

### Estructura de brief.md
```
# Proyecto: [Nombre]

**Iniciado por:** [Alfred | Agente | Owner]
**Agente líder:** [agente principal responsable]
**Agentes de apoyo:** [otros involucrados, y su rol]
**Inicio:** [YYYY-MM-DD]
**Objetivo:** [una frase clara]

## Alcance
[Qué entra y qué queda fuera del alcance]

## Criterios de éxito
- [ ] [resultado medible]
```

### Estructura de status.md
```
# Estado: [Nombre del proyecto]

**Última actualización:** [YYYY-MM-DD] por [Agente]
**Fase actual:** [nombre de la fase]
**Estado general:** En rumbo | En riesgo | Bloqueado | Completo

## Qué está hecho
- [elementos completados con agente y fecha]

## Qué sigue
- [próximas acciones con agente responsable y fecha objetivo]

## Bloqueos
- [lo que esté frenando el avance]

## Bitácora de sesiones
| Fecha | Agente | Qué pasó |
|------|-------|---------------|
```

---

## 3. Delegación entre agentes

| Usa subagente en vivo cuando... | Usa archivo de tarea cuando... |
|---|---|
| El trabajo puede completarse en esta sesión | El trabajo abarca varias sesiones |
| No hay compuerta de aprobación de la owner | La owner debe revisar primero |
| El resultado se necesita para continuar el trabajo actual | El resultado es un entregable independiente |

**Por defecto: delegación en vivo.** Los archivos de tarea son el respaldo para trabajo que genuinamente no puede completarse en esta sesión.

### 3.1 Delegación en vivo (subagentes)

Cuando un agente necesita la salida de otro agente durante la sesión actual, hace spawn de un subagente con la herramienta Agent de Claude Code.

**Usa el spawn nativo. No pegues el perfil.** Con `subagent_type: [nombre]`, Claude Code carga `.claude/agents/[nombre].md` automáticamente: la role card, la lista de herramientas y las instrucciones de startup. Pegar el perfil, la operating card o la memoria dentro del prompt duplica lo que el agente ya carga y desperdicia contexto en cada spawn.

**Envía solo la tarea y el contexto que esa tarea necesita:**
```
## Tarea
[Descripción específica de la actividad y criterios de aceptación]

## Contexto
[Solo lo que este agente necesita para esta tarea. Ver la regla de acotado abajo.]

## Salida
[Dónde escribir los resultados y en qué formato]
```

**Regla de acotado del contexto.** Pasa la porción más estrecha que le permita al agente terminar. Prefiere una ruta de archivo sobre el contenido del archivo: el agente puede leerlo si lo necesita, y saltárselo si no.

| En vez de | Pasa |
|---|---|
| El brief completo del proyecto | La frase del objetivo más la ruta a `brief.md` |
| El contenido de tres archivos de referencia | Las tres rutas |
| Todo lo que dijo la owner en esta sesión | La decisión que afecta a esta tarea |
| Toda la salida del agente anterior | La parte sobre la que este agente actúa |

Un agente que recibe 3.000 palabras de contexto que no usa ya gastó ese presupuesto antes de empezar. En la duda, manda menos y deja que el agente pregunte.

**Plantilla de prompt manual (solo como respaldo).** Para un agente que todavía no tiene archivo en `.claude/agents/`, haz spawn con el perfil pegado:
```
Eres [Nombre del agente]. Lee y encarna por completo el siguiente perfil:

[Contenido de Team/[Agente].md]

---
## Operating card
[Contenido de Data/agent-operating-card.md]

---
## Tu memoria
[Contenido de Team/[Agente]/memory.md]

---
## Tarea
[Descripción específica de la actividad y criterios de aceptación]

## Contexto
[Solo lo que esta tarea necesita]

## Salida
[Dónde escribir los resultados y en qué formato]
```

### 3.2 Delegación asíncrona (archivos de tarea)

Para trabajo entre sesiones. Nombre del archivo: `[YYYY-MM-DD]_[Destino]_from-[Origen]_[slug].md`

```
# Sub-tarea: [Título]

**De:** [Agente solicitante]
**Para:** [Agente destino]
**Tarea o proyecto padre:** [nombre del archivo o del proyecto]
**Fecha:** [YYYY-MM-DD]

---

## Solicitud
[Qué se necesita]

## Contexto
[Por qué se necesita]

## Salida esperada
[Qué debe producir el agente destino]

## Devolver a
[Dónde debe ir la salida]
```

---

### 3.3 Delegación spec-first

Para tareas creativas o técnicas donde la especificación determina la calidad de la salida: páginas HTML, apps, documentos complejos, componentes de UI. El archivo de tarea ES la spec, escrita por el orquestador antes de que ningún agente ejecute.

**Cuándo usarla:**
- Construir o rediseñar una UI, una página o un componente de frontend
- Escribir una app no trivial (multifunción, con datos, con interfaz)
- Cualquier tarea donde las decisiones inventadas por el agente (estructura, comportamiento, casos borde) producirían algo razonable pero equivocado

**Cómo funciona:**
1. El orquestador escribe un archivo de tarea con la spec densa en `Team Inbox/To Do/`
2. El orquestador le muestra la spec a la owner. Si eso es una compuerta o solo visibilidad lo decide la owner: que lo diga una vez y el orquestador lo respeta de ahí en adelante
3. El orquestador hace spawn del agente con la spec como contexto principal, no con la solicitud cruda de la owner
4. El agente ejecuta leyendo la spec, sin necesidad de razonar sobre la intención

**Formato del archivo de spec:**
```
# Spec: [Título]

**Ruteado por:** Alfred
**Para:** [Agente]
**Fecha:** [YYYY-MM-DD]
**Tipo:** spec-first

---

## Objetivo
[Una frase: qué construye esto y para qué]

## Componentes / Estructura
[Enumera las partes: secciones, funciones, pestañas, lo que aplique]

## Comportamiento
[Cómo interactúan las piezas; entradas, salidas, disparadores, estado]

## Restricciones de diseño
[Reglas visuales, tono, patrones existentes que seguir]

## Casos borde
[Qué manejar explícitamente -- estados vacíos, fallos, errores de permisos]

## Criterios de aceptación
[Cómo saber que está listo]

## Ubicación de salida
[Dónde van los archivos]
```

---

### 3.4 Eficiencia de ejecución

Tres hábitos que deciden si el sistema se siente rápido o lento. No cuestan nada y se acumulan sesión tras sesión.

**1. Haz spawn de agentes independientes en paralelo, no en serie.**

Cuando dos o más tareas de agente no dependen entre sí, lánzalas en un solo mensaje con varias llamadas a herramientas. Así corren en simultáneo en vez de hacer cola. Lanzarlas de una en una, esperando a que cada una vuelva, multiplica el tiempo de reloj sin ningún beneficio.

La prueba de independencia: ¿el agente B necesita algo que produce el agente A? Si no, son independientes, así que lánzalos juntos.

```
Independientes (lanzar juntos en un mensaje):
  - El Reviewer audita la estructura de carpetas
  - La Knowledge Manager hace lint del vault
  - HR redacta un perfil para el nuevo especialista

Dependientes (deben ir en secuencia):
  - El agente redactor escribe el anuncio
  - LUEGO el agente de entrega lo envía
```

Los conjuntos mixtos se parten solos: corre el grupo independiente en paralelo, y después el paso dependiente.

**2. Carga las skills bajo demanda, no en el startup.**

El startup de un agente debe leer su memoria y la operating card, siempre. Los archivos de skill son distintos: se lee uno cuando la tarea lo pide, no como ritual de calentamiento. Un agente con cinco skills que lee las cinco antes de cada tarea quema ese presupuesto en cuatro que no va a usar.

Escribe la sección Startup de cada agente como un índice con disparadores: nombra cada skill con la condición que la activa, para que el agente cargue solo lo que aplica. Ver las plantillas de agente para el patrón.

**3. Pasa el contexto más estrecho que funcione.**

Cubierto en la regla de acotado del contexto de la Sección 3.1. En corto: las rutas ganan al contenido, y la decisión gana a la transcripción.

---

## 4. Owner Inbox

### Pending Review/
Entregables que necesitan la atención de la owner. Nombre del archivo: `[YYYY-MM-DD]_[Agente]_[slug].md`

```
# [Título]

**De:** [Agente]
**Fecha:** [YYYY-MM-DD]
**Necesita:** Revisión | Aprobación | Decisión | FYI

---

## Resumen
[2-3 frases: qué es esto y qué necesita hacer la owner]

## Detalle
[Salida completa o enlace al archivo del proyecto]

## Opciones / Acción recomendada
[Si hace falta una decisión, expón las opciones con claridad]
```

### Approved/
Los archivos pasan aquí una vez que la owner los revisó y aprobó.

### Output/
Entregables terminados que no necesitan aprobación de la owner. Deja el trabajo aquí cuando sea final e informativo.

### Archive/
Almacenamiento de largo plazo para elementos del Owner Inbox que ya no están activos. Organizado en subcarpetas trimestrales: `Owner Inbox/Archive/YYYY-QN/` (por ejemplo, `2026-Q3`).

**Qué se archiva:** Solo archivos fechados que siguen la convención `YYYY-MM-DD_Agente_slug.*`. Los archivos sin fecha (documentos de referencia permanentes, artefactos fijos) nunca se archivan.

**Cuándo:** Periódicamente, mueve a la subcarpeta trimestral correspondiente los elementos de `Approved/` y `Output/` con más de 30 días. Los elementos en `Pending Review/` se quedan donde están hasta que la owner actúe sobre ellos.

---

## 5. Carpeta Data

Guarda documentos de referencia, plantillas y material de base compartidos por todos los agentes. Revísala antes de empezar una tarea para no volver a crear lo que ya existe. Después de completar trabajo que produzca referencia reutilizable, agrégala aquí.

---

## 6. Base de conocimiento

Propiedad de Joy, que también la mantiene.

```
Knowledge/
├── Inbox/        ← área de espera: documentos crudos pendientes de ingest
├── Archive/      ← documentos crudos ya procesados, registro permanente
└── Vault/
    ├── _index.md        ← índice maestro
    ├── concepts/        ← artículos de concepto, uno por tema
    ├── sources/         ← resúmenes de fuente, uno por documento ingerido
    └── outputs/         ← respuestas de Q&A, análisis, reportes de lint
```

**Lectura autoservicio:** `Knowledge/Vault/` es la primera parada de investigación del equipo. Para cualquier tarea con mucha investigación, revisa `_index.md` antes de investigar por fuera. Tiene resúmenes de una línea de cada fuente y cada concepto que ya está en el vault.

**Q&A:** Para síntesis a través de varios documentos, rutea una tarea a Joy.

**Ingest:** Deja los documentos en `Knowledge/Inbox/` siguiendo las convenciones de `Knowledge/Inbox/README.md`, y después rutea una tarea de ingest a Joy. Una vez completado el ingest, los archivos procesados se mueven de Inbox a Archive, para que el inbox siempre refleje trabajo sin procesar.

---

## 7. Playbooks

Definiciones de flujos reutilizables para coordinación de agentes recurrente y bien entendida. Cada playbook es su propio archivo en `Playbooks/`.

**Índice:** [Playbooks/_index.md](../Playbooks/_index.md)

Para usarlos: revisa el índice, lee el playbook, sigue el flujo tal cual.

Para proponer un playbook nuevo: cuando un flujo se repite en tres o más instancias con la misma coordinación de agentes, cualquier agente puede proponerlo por sub-tarea a Tuti.

---

## 8. Reglas para todos los agentes

1. **Auto-ejecuta.** Cuando una tarea en `Team Inbox/To Do/` esté dirigida a ti, empieza de inmediato.
2. **Acceso directo.** Si la owner se dirige a ti por tu nombre, responde y actúa directamente.
3. **Delega sin reparos.** Haz spawn de subagentes para trabajo de la misma sesión; crea archivos de tarea solo para trabajo que deba abarcar varias sesiones.
4. **Actualiza el estado compartido.** Antes de detener el trabajo en un proyecto, actualiza `status.md`.
5. **Las salidas que necesiten revisión de la owner** van a `Owner Inbox/Pending Review/`.
6. **Revisa `Data/`** antes de empezar. No vuelvas a crear lo que ya existe.
7. **Una sola tarea en `Doing/` por agente a la vez.**
8. **Revisa `Playbooks/`** cuando crees una tarea que implique traspasos entre agentes.
9. **Revisa `Knowledge/Vault/_index.md`** en tareas con mucha investigación, antes de investigar por fuera. El vault es tu primera parada de investigación.

---

## 9. Estándar de memoria

El `memory.md` de cada agente es un documento vivo, propiedad de ese agente.

**Presupuesto:** Máximo 800 palabras por `memory.md`.

**Estructura:**
```
---
last-consolidated: YYYY-MM-DD
---

## Hot Context
[Conocimiento activo y relevante para la sesión: proyectos en curso, decisiones recientes, bloqueos abiertos. Se poda en cada consolidación.]

## Stable Knowledge
[Patrones duraderos, rarezas de herramientas, preferencias de la owner. Enlaza hacia archivos de skill o Knowledge/Vault en vez de repetir el contenido.]
```

**Consolidación:** Trimestral, liderada por Tuti. Cuando una memoria llega a 800 palabras, los how-tos estables se gradúan a un archivo de skill, los hechos se gradúan a `Knowledge/Vault/`, y las entradas obsoletas se podan.

---

## 10. Mantenimiento

### Convención de doble archivo

Cada agente tiene dos archivos:
- `Team/[Nombre].md` - el expediente de HR: rol, alcance, voz, estilo de trabajo. Lo editan Alicia o Tuti.
- `.claude/agents/[nombre].md` - el archivo de runtime: frontmatter YAML (name, description, tools, model) más una role card concisa. Esto es lo que carga Claude Code.

Mantenlos sincronizados. Si el perfil cambia de forma significativa, el archivo nativo del agente debe reflejarlo.

### Regla de reinicio

Los cambios al frontmatter de `.claude/agents/` (name, description, tools, model) surten efecto solo después de reiniciar Claude Code. Los cambios a los archivos de memoria y al contenido de las skills surten efecto en la siguiente sesión sin reiniciar.

### Agregar herramientas a un agente

Edita la lista `tools:` en `.claude/agents/[nombre].md` y reinicia Claude Code.
