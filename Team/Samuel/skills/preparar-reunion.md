---
name: preparar-reunion
description: Convierte un ticket ambiguo en una lista de preguntas específicas y una checklist de insumos, antes de la reunión con el solicitante.
---

# Skill: Preparar la reunión

**Agente:** Samuel
**Cuándo:** Gaby pega un ticket nuevo o ambiguo y hay una reunión con el solicitante por delante.

## Objetivo

Que Gaby entre a la reunión con las preguntas ya hechas y salga con el alcance cerrado. Si en la siguiente reunión aparecen "mejoras nuevas", es que esta skill no se aplicó bien.

## Procedimiento

### 1. Leer el ticket buscando huecos, no buscando entenderlo
El ticket casi siempre se entiende. El problema es lo que no dice. Recorre estas ocho categorías y anota qué falta en cada una:

| Categoría | Qué buscar |
|---|---|
| Disparador | ¿Qué hace que el proceso arranque? ¿Manual, calendario, un evento, un formulario? |
| Datos de entrada | ¿De dónde salen? ¿Qué formato? ¿Quién es el dueño? ¿Existen ya? |
| Transformación | ¿Qué se hace con esos datos? ¿Reglas, filtros, cálculos, excepciones? |
| Salida | ¿Qué se produce? ¿Dónde queda? ¿Qué formato exacto? |
| Destinatarios | ¿Quién recibe? ¿Lista fija o dinámica? ¿De dónde sale la lista? |
| Frecuencia | ¿Cada cuánto corre? ¿Qué pasa si falla una corrida? |
| Permisos y accesos | ¿Qué cuentas, carpetas, hojas o sistemas hay que tocar? ¿Quién los otorga? |
| Casos borde | ¿Qué pasa si no hay datos, si hay duplicados, si alguien sale de la empresa? |

### 2. Separar preguntas de insumos
Son dos listas distintas y no se mezclan.

- **Preguntas:** cosas que el solicitante debe **decidir o aclarar**. Se resuelven hablando.
- **Insumos:** cosas que el solicitante debe **entregar**. No se resuelven hablando; alguien tiene que mandar un archivo o dar un acceso.

Esta separación es el corazón de la skill. Los bloqueos históricos de Gaby (la base de datos que no llegaba, la lista de correos que faltaba) son insumos que nadie pidió por adelantado porque se trataron como si fueran preguntas.

### 3. Redactar las preguntas para que se puedan contestar
Cada pregunta debe ser cerrada o casi. Nada de "cuéntame más del proceso".

- Mal: "¿Cómo quieres las notificaciones?"
- Bien: "¿La notificación se manda al enviar el formulario o en un resumen diario a las 8:00?"

Cuando puedas, ofrece dos o tres opciones concretas. Es más rápido elegir que redactar desde cero, y evita respuestas vagas.

### 4. Marcar tus sugerencias como sugerencias
Si detectas algo que el ticket no pide pero probablemente hace falta, va en la sección **"Sugerencias de Samuel (pendientes de tu decisión)"**. Nunca dentro de los requisitos. Gaby decide cuáles suben.

### 5. Escribir el archivo
Crea o actualiza `Proyectos/Tickets/[id]-[slug].md` con esta estructura, y actualiza `Proyectos/Tickets/_cola.md`.

## Plantilla de salida

```markdown
# Ticket [id] - [título]

**Estado:** sin revisar
**Solicitante:** [nombre]
**Última actualización:** [fecha]

## Lo que dice el ticket
[Resumen fiel. Solo lo que el solicitante escribió, sin interpretar.]

## Preguntas para la reunión
1. [Pregunta cerrada, con opciones si aplica]
2. ...

## Insumos que debe entregar el solicitante
| Insumo | Responsable | Fecha comprometida | Estado |
|---|---|---|---|
| [ej. lista de correos de destinatarios] | [nombre] | [pendiente de acordar] | pendiente |

## Sugerencias de Samuel (pendientes de tu decisión)
- [Cosa que el ticket no pide pero probablemente hace falta, con su razón en una línea]

## Riesgos que veo
- [Solo si son reales y concretos. Si no hay, se omite la sección.]
```

## Regla que no se rompe

Si el ticket no lo dice, no lo escribo como requisito. Va a preguntas o va a sugerencias. Un supuesto razonable metido en el cuerpo de la especificación es exactamente el problema que Gaby ya tiene, pero escondido dentro de un documento que parece completo.
