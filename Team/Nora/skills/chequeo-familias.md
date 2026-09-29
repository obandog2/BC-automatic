---
name: chequeo-familias
description: Busca automatizaciones ya entregadas que resuelvan el mismo problema y devuelve una familia relacionada con etiqueta de coincidencia fuerte o solo temática. Nunca un veredicto binario de duplicado.
---

# Skill: Chequeo de duplicados y familias

**Agente:** Nora
**Cuándo:** siempre, después del triage y **antes** de proponer cualquier build nuevo. Sin excepción por tamaño de la solicitud.

## Por qué existe este paso

Construir dos veces lo mismo cuesta el doble y deja dos cosas que mantener. Pero descartar una solicitud por "ya existe algo parecido" cuando en realidad era otro trabajo es peor: le cierra la puerta a quien pidió y nadie vuelve a revisarlo.

Por eso el resultado de este chequeo **no es un sí o un no**. Es una **familia relacionada** con una etiqueta que dice cuánta confianza hay.

## Procedimiento

1. **Buscar entre lo ya entregado.** Ítems en estado "Finalizado" o equivalente en el tablero de intake (Solicitud Automatización PEC/ 2026, board ID `5091208859`). También `Proyectos/Tickets/_cola.md` y los tickets cerrados, que son la memoria real de lo que el equipo construyó.
2. **Aplicar el criterio de candidatura:** una coincidencia en **dos o más** de estos cuatro campos hace candidato a un ítem:
   - país / afiliada
   - área solicitante
   - tipo de entregable
   - fuente de datos
3. **Leer el ítem completo de cada candidato antes de confirmar o descartar.** Nunca se decide desde el título ni desde la tabla de campos. Dos ítems con el mismo título pueden ser cosas distintas, y dos con títulos distintos pueden ser el mismo trabajo.
4. **Etiquetar cada candidato** con una de las dos etiquetas de abajo, y escribir la justificación en una o dos líneas.
5. Si ningún candidato sobrevive la lectura, decirlo con todas las letras.

## Las dos etiquetas

| Etiqueta | Qué significa | Qué implica para la propuesta |
|---|---|---|
| **Coincidencia fuerte** | Resuelve el mismo problema para un usuario equivalente. Hay reutilización real: el mismo código, el mismo flujo o una extensión pequeña. | La propuesta se plantea como extensión o replicación de lo existente, con las horas calibradas contra ese trabajo. |
| **Solo temática** | Comparte tema, área o fuente de datos, pero el problema es distinto. | Se construye algo nuevo. La familia se menciona igual, porque sirve para calibrar horas y para reutilizar piezas. |

Una coincidencia parcial **nunca** se reporta como duplicado confirmado. Si la lectura del ítem completo no alcanza para decidir entre las dos etiquetas, se dice eso mismo y se nombra qué información resolvería la duda.

## Cuando no hay nada

Frase exacta, no una variante:

> No se encontró automatización similar al [fecha].

Se escribe siempre, aunque parezca obvio. Un chequeo que no dejó rastro es indistinguible de un chequeo que no se hizo.

## Salida

Segunda sección del documento de propuesta:

```markdown
## Chequeo de familias

**Resultado:** [Coincidencia fuerte | Solo temática | Sin coincidencias]

| Ítem revisado | Campos que coinciden | Etiqueta | Por qué |
|---|---|---|---|
| [código y título] | país, fuente de datos | Solo temática | [una o dos líneas] |

[Si no hubo nada: "No se encontró automatización similar al [fecha]."]
```

## Regla que no se rompe

El chequeo va antes de la propuesta, siempre, y su resultado aparece en el documento aunque sea negativo. Una propuesta sin sección de chequeo de familias no está terminada.
