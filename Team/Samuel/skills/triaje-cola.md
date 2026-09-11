---
name: triaje-cola
description: Clasifica la cola de tickets por estado y propone un orden de trabajo con su razón. Sugiere, nunca decide.
---

# Skill: Triaje de la cola

**Agente:** Samuel
**Cuándo:** Gaby pregunta por la cola, por qué está bloqueado, o por qué seguir.

## Objetivo

Que Gaby deje de mirar un montón indiferenciado de tickets y vea tres cosas: qué puede arrancar hoy, qué está esperando a alguien más, y qué ni siquiera se ha mirado.

## Los seis estados

| Estado | Significa | Qué necesita |
|---|---|---|
| `sin revisar` | Nadie lo ha leído con atención todavía | Que Gaby lo pegue para interrogarlo |
| `esperando insumo` | Especificación lista, falta algo del solicitante | Perseguir el insumo, no codificar |
| `listo para codificar` | Alcance congelado y todos los insumos en mano | Tiempo de Gaby, y su idea de la lógica |
| `esperando luz verde` | Presenté la revisión de la lógica y el plan; falta que Gaby apruebe | Su decisión sobre el plan |
| `en código` | Gaby o yo estamos desarrollando, con el plan ya aprobado | Avanzar según sus instrucciones; registrar cambios |
| `cerrado` | Entregado y aceptado | Nada |

Un ticket con la especificación perfecta pero un insumo faltante **no** es `listo para codificar`. Es `esperando insumo`. Esa distinción es todo el valor del triaje: evita que Gaby arranque algo que se va a frenar a mitad.

`esperando luz verde` hace visible la compuerta del contrato de código (ver la skill `desarrollo-guiado`). Un ticket que aparece `en código` sin haber pasado por `esperando luz verde` es una regla saltada, y lo señalo.

## Procedimiento

1. Lee `Proyectos/Tickets/_cola.md` y los archivos de ticket individuales.
2. Verifica el estado de cada uno contra la tabla de arriba. Si un ticket dice `listo para codificar` pero tiene insumos pendientes, corrígelo y dilo.
3. Agrupa por estado, no por número de ticket.
4. Para los `esperando insumo`, calcula cuántos días llevan esperando y quién es el responsable. Los que llevan más tiempo son candidatos a un mensaje de seguimiento.
5. Propón un orden de trabajo, con una línea de razón por cada posición.
6. Actualiza `Proyectos/Tickets/_cola.md`.

## Cómo proponer el orden

Sugiere, nunca decides. La fórmula es: **"Yo empezaría por X, porque Y. Tú decides."**

Criterios que uso para ordenar, en este orden:

1. **Desbloquear a otros primero.** Un ticket cuyo insumo lleva semanas parado necesita un mensaje hoy, aunque el desarrollo sea para después. Perseguir insumos es barato y destraba en paralelo.
2. **Un plan sin decidir es una decisión barata.** Los `esperando luz verde` cuestan minutos de Gaby y destraban horas de trabajo. Van antes que empezar algo nuevo.
3. **Cerrar antes que abrir.** Los que están `en código` avanzan; terminarlos libera capacidad real.
4. **Lo listo antes que lo ambiguo.** Un `listo para codificar` es trabajo que fluye. Meterse con un `sin revisar` cuando hay listos es cambiar trabajo fluido por trabajo con fricción.
5. **Urgencia declarada por el solicitante**, si la hay y si Gaby la confirma.

Nunca ordeno por antigüedad sola. Un ticket viejo y bloqueado no se destraba por ser viejo.

## Plantilla de salida

```markdown
# Cola de tickets

**Actualizada:** [fecha]
**Total abiertos:** [n]

## Resumen
| Estado | Cantidad |
|---|---|
| sin revisar | n |
| esperando insumo | n |
| listo para codificar | n |
| esperando luz verde | n |
| en código | n |

## Listo para codificar
| Ticket | Solicitante | Congelado el |
|---|---|---|

## Esperando luz verde
| Ticket | Plan presentado el | Días esperando decisión |
|---|---|---|

## Esperando insumo
| Ticket | Insumo que falta | Responsable | Días esperando |
|---|---|---|---|

## En código
| Ticket | Cambios registrados sin resolver |
|---|---|

## Sin revisar
| Ticket | Solicitante | Llegó el |
|---|---|---|

## Lo que yo haría (tú decides)
1. [Acción concreta] — porque [razón en una línea]
2. ...
```

## Regla que no se rompe

Propongo un orden y explico por qué. La prioridad la decide Gaby, siempre. Si me pregunta "¿cuál hago?", contesto con una recomendación y su razón, no con una instrucción.
