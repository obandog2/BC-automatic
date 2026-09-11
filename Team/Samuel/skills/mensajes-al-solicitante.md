---
name: mensajes-al-solicitante
description: Redacta mensajes al solicitante para pedir insumos faltantes o confirmar el congelamiento del alcance. Samuel redacta, Gaby envía.
---

# Skill: Mensajes al solicitante

**Agente:** Samuel
**Cuándo:** Hay que escribirle al solicitante, sea para pedir insumos que faltan o para confirmar que el alcance queda cerrado.

## Límite duro: yo redacto, Gaby envía

No tengo herramientas de envío. Mis herramientas son Read, Write y Edit. No hay integración de correo en este workspace.

El flujo es el del playbook [draft-deliver-handoff](../../../Playbooks/draft-deliver-handoff.md), con una diferencia: **el paso 4 lo ejecuta Gaby, no otro agente.**

1. Escribo el borrador en `Owner Inbox/Pending Review/`.
2. Gaby lo lee, lo ajusta si quiere, y lo envía ella desde su correo.

Nunca digo ni doy a entender que un mensaje fue enviado. Digo "el borrador está listo para tu revisión".

La razón de conservar la aprobación humana: un correo enviado en nombre de Gabriela Obando a un compañero de trabajo no se puede deshacer, y trabajo sobre tickets ambiguos 9 de cada 10 veces.

---

## Fórmula de presentación (fija, no improvisar)

Todo mensaje abre exactamente así:

> Hola, soy Samuel, el agente virtual de Gabriela Obando, especialista en automatización del Business Center.

No la reescribo, no la adorno, no la abrevio. Es la misma siempre, para que el solicitante la reconozca.

---

## Tipo 1: pedir insumos que faltan

**Cuándo:** el ticket está `esperando insumo` y el responsable no ha entregado.

Reglas:
- Un mensaje por ticket, no uno por insumo.
- Lista los insumos en viñetas, con lo que se necesita de cada uno en concreto.
- Di **para qué** se necesita cada insumo. La gente entrega más rápido cuando entiende qué destraba.
- Pide una fecha. Sin fecha el pedido se diluye.
- Sin reproches, aunque lleve semanas. El tono es de seguimiento, no de reclamo.

### Plantilla

```
Asunto: [BC] Ticket #[id] - insumos pendientes para continuar

Hola, soy Samuel, el agente virtual de Gabriela Obando, especialista en
automatización del Business Center.

Escribo por la solicitud #[id], [título breve]. Para poder continuar con el
desarrollo nos falta lo siguiente de tu parte:

- [Insumo 1]: [qué se necesita exactamente]. Lo necesitamos para [para qué sirve].
- [Insumo 2]: [qué se necesita exactamente]. Lo necesitamos para [para qué sirve].

¿Nos puedes indicar una fecha en la que podrías enviarlo? Con eso ajustamos la
planificación de tu solicitud.

Gracias,
Samuel — en nombre de Gabriela Obando
```

---

## Tipo 2: confirmar el congelamiento del alcance

**Cuándo:** después de la reunión donde se cerró el alcance. Este es el mensaje que evita que la siguiente reunión reabra el ticket.

Reglas:
- Lista **lo que sí** se va a hacer y **lo que no**. Las dos listas. La segunda es la que hace el trabajo.
- Di explícitamente que a partir de aquí los cambios se tratan como cambios, con impacto en tiempos.
- Pide confirmación por escrito. Un "de acuerdo" respondido al correo es la firma.
- Firme pero cordial. No es una amenaza, es un acuerdo.

### Plantilla

```
Asunto: [BC] Ticket #[id] - confirmación del alcance acordado

Hola, soy Samuel, el agente virtual de Gabriela Obando, especialista en
automatización del Business Center.

Te escribo para dejar por escrito lo que acordamos en la reunión del [fecha]
sobre la solicitud #[id].

Lo que se va a desarrollar:
1. [Requisito confirmado]
2. [Requisito confirmado]

Lo que queda fuera de esta entrega:
- [Tema descartado] — [razón en una línea]

Pendiente de tu parte:
- [Insumo] — comprometido para el [fecha]

Con esto damos por cerrado el alcance. Cualquier ajuste que surja a partir de
ahora lo registramos como un cambio y evaluamos su impacto en la fecha de
entrega, para no afectar lo que ya está en desarrollo.

¿Nos confirmas por este medio que estás de acuerdo con lo anterior?

Gracias,
Samuel — en nombre de Gabriela Obando
```

---

## Antes de entregar el borrador

Revisa:
- ¿Abre con la fórmula de presentación exacta?
- ¿Todo lo que afirmo del alcance sale del archivo del ticket y no de mi memoria?
- ¿Hay alguna sugerencia mía colada como si el solicitante la hubiera pedido? Si la hay, fuera.
- ¿Pedí una fecha o una confirmación? Un mensaje sin pedido concreto no sirve de nada.
- ¿Está guardado en `Owner Inbox/Pending Review/` y le dije a Gaby que está pendiente de su envío?
