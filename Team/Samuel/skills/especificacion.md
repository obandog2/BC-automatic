---
name: especificacion
description: Convierte notas de reunión o transcripciones en una especificación con alcance congelado, y registra los cambios posteriores como cambios de alcance.
---

# Skill: Especificación y control de alcance

**Agente:** Samuel
**Cuándo:** Gaby trae notas de reunión o una transcripción para redactar, o reporta un cambio sobre un alcance que ya estaba congelado.

## Objetivo

Que lo acordado en la reunión quede escrito y no se pierda, y que lo que llegue después se vea como lo que es: un cambio, no un detalle olvidado.

---

## Parte A: redactar la especificación

### 0. Identificar el tipo de entrada

Yo no asisto a reuniones. Recibo lo que se dijo en ellas, y llega de dos formas que se trabajan distinto.

**Nota escrita por Gaby.** Corta y ya filtrada. Lo que está ahí es una decisión tomada; se trata como confirmado. El riesgo es lo que se omitió: recorro las preguntas de `preparar-reunion` que la nota no toca y las devuelvo como abiertas.

**Transcripción de reunión (Google Meet).** Literal, larga y sin filtrar. No es un acuerdo, es evidencia de una conversación. Reglas:

- Extraer decisiones y compromisos, no frases. Cada requisito se atribuye a quién lo dijo.
- Lo que se discutió y se descartó va a "fuera de alcance", con la línea que lo descarta. Esta es la mayor ganancia de una transcripción sobre una nota: deja rastro de lo rechazado, y un tema descartado por escrito no vuelve como si nunca se hubiera hablado.
- Toda frase que empiece con "sería bueno", "podríamos", "a futuro" es candidata a fuera de alcance o a sugerencia, no a requisito.
- Una decisión ambigua en la transcripción se queda como pregunta abierta. No se interpreta por contexto ni por tono.
- Los nombres propios y los términos técnicos suelen venir mal transcritos. Se marcan como "posible error de transcripción, confirmar" en vez de adivinarlos.
- La transcripción nunca se copia al archivo del ticket. Se cita solo cuando la frase exacta es la que congela o descarta algo.

### 1. Vaciar las notas contra las preguntas
Toma el archivo del ticket y recorre la lista de preguntas de `preparar-reunion`. Cada una termina en uno de tres lugares:

- **Contestada** → pasa al cuerpo de la especificación como requisito confirmado.
- **Sin contestar** → se queda en "preguntas abiertas". No se rellena. Se marca para la siguiente ronda.
- **Contestada a medias** → cuenta como sin contestar. Anota lo que sí se dijo y qué falta precisar.

### 2. Congelar el alcance
El alcance congelado es la lista de lo que se va a construir. Se acompaña siempre de una sección de **fuera de alcance** con lo que se habló y se descartó.

Esa segunda sección es la que evita las "mejoras nuevas". Un tema descartado por escrito no vuelve como si nunca se hubiera hablado.

### 3. Escribir criterios de aceptación
Cada requisito necesita una forma observable de saber que quedó bien. Sin criterios no hay cierre posible.

- Mal: "que las notificaciones funcionen".
- Bien: "al enviar el formulario, los 4 destinatarios de la lista reciben el correo en menos de 2 minutos, con el asunto `[BC] Nueva solicitud #<id>`".

### 4. Insumos con dueño y fecha
Todo insumo pendiente lleva responsable y fecha comprometida. Sin dueño y sin fecha, un insumo es solo un deseo, y ahí es donde Gaby se queda esperando.

### 5. Marcar el estado
Si quedan insumos pendientes, el ticket es **esperando insumo**, no "listo para codificar", por más clara que esté la especificación. Actualiza `Proyectos/Tickets/_cola.md`.

---

## Parte B: cuando llega un cambio después del congelamiento

Este es el patrón que más le cuesta a Gaby: cada reunión reabre el ticket. La regla es simple.

**Un cambio posterior nunca se edita dentro del alcance congelado.** Se anota en el registro de cambios, y solo pasa al alcance si Gaby lo aprueba.

Para cada cambio registra: qué pidieron, quién lo pidió, cuándo, qué parte de lo ya hecho afecta, y si es aditivo o si contradice algo ya acordado.

Los cambios que contradicen algo ya acordado se marcan visiblemente. Son los que causan retrabajo y son los que justifican mandar un mensaje de congelamiento al solicitante (ver la skill `mensajes-al-solicitante`).

---

## Plantilla de salida

```markdown
# Ticket [id] - [título]

**Estado:** [esperando insumo | listo para codificar | en código | cerrado]
**Solicitante:** [nombre]
**Alcance congelado el:** [fecha]
**Última actualización:** [fecha]

## Objetivo
[Una o dos frases. Qué problema resuelve esto para el solicitante.]

## Alcance congelado
1. [Requisito confirmado]
2. ...

## Fuera de alcance
- [Lo que se habló y se descartó, con una línea de por qué]

## Criterios de aceptación
| # | Criterio observable |
|---|---|
| 1 | [Cómo se verifica que el requisito 1 quedó bien] |

## Insumos pendientes
| Insumo | Responsable | Fecha comprometida | Estado |
|---|---|---|---|

## Preguntas abiertas
- [Lo que quedó sin contestar. Si está vacío, se omite la sección.]

## Sugerencias de Samuel (pendientes de tu decisión)
- [Separadas de los requisitos. Siempre.]

## Registro de cambios
| Fecha | Quién lo pidió | Cambio | Afecta a | Tipo | Decisión de Gaby |
|---|---|---|---|---|---|
| [fecha] | [nombre] | [qué pidieron] | [req. afectado] | aditivo / contradice | pendiente |
```

## Regla que no se rompe

Nada entra al alcance congelado sin que el solicitante lo haya pedido y Gaby lo haya aceptado. Mis sugerencias viven en su propia sección hasta que Gaby las suba.

El código es una fase aparte y tiene su propia skill (`desarrollo-guiado`). Una especificación no lleva código adentro, ni siquiera de ejemplo: mezclar los dos es cómo el código no pedido termina donde nadie lo revisó.
