---
name: propuesta-automatizacion
description: Redacta la propuesta de plataforma, enfoque, horas, ahorro y código BCAT para una solicitud ya triada. El código se lee de la solicitud, nunca se genera. Marca todo dato faltante en vez de estimarlo.
---

# Skill: Propuesta de automatización

**Agente:** Nora
**Cuándo:** una solicitud ya pasó el triage (`triage-solicitud`) y el chequeo de familias (`chequeo-familias`).

## Las cinco piezas

### 1. Recomendación de plataforma, con la razón

No basta el nombre de la plataforma. Va la razón detrás, en una o dos líneas, atada a algo del triage: la fuente de datos, la frecuencia, quién va a operarla, el volumen.

> **Plataforma:** Google Apps Script sobre Sheets. La fuente ya vive en Drive, la frecuencia es semanal y quien opera es la misma analista que hoy hace el reporte a mano.

Si hay más de una opción razonable, se presentan las dos con su trade-off. Nora propone; Gaby decide.

### 2. Enfoque en un párrafo

Un solo párrafo con cuatro cosas, en este orden:

- **Disparador:** qué hace que la automatización corra (hora fija, llegada de un correo, envío de un formulario, ejecución manual).
- **Entradas:** de dónde sale el dato, incluyendo cualquier paso manual de exportación.
- **Salidas:** qué produce y dónde queda.
- **Quién la opera una vez viva:** persona o rol. Una automatización sin dueño declarado es una automatización que se rompe en silencio.

### 3. Horas de desarrollo estimadas

**Toda estimación nombra su comparable.** El formato es fijo:

> **Horas estimadas:** 18. Calibrado contra [código del comparable], que tenía la misma fuente y un flujo de salida equivalente.

Si no hay comparable, se dice: *"Sin comparable directo en lo entregado; la estimación es gruesa y conviene confirmarla con Gaby antes de comprometerla."* Un número sin comparable y sin esa advertencia es un número inventado.

### 4. Ahorro proyectado

Se calcula **con los campos que ya existen en el propio tablero de intake**. El caso típico: "tiempo de ahorro" declarado por solicitud × volumen de solicitudes. No se usa ninguna fórmula externa cuya fuente ya no exista.

Se muestra el cálculo, no solo el resultado:

> **Ahorro proyectado:** 3 h por corrida × 4 corridas al mes = **12 h/mes**, según el tiempo declarado en el ítem.

Cuando falta un factor, se marca y se detiene el cálculo ahí:

> **Ahorro proyectado:** `[FALTA: volumen mensual de solicitudes]` × 3 h declaradas por corrida. **No calculable hasta obtener el volumen** — habría que pedírselo al área solicitante.

**Nunca se rellena el hueco con un supuesto.** Un ahorro a medias con el hueco visible es información útil; un ahorro completo con un hueco tapado contamina la decisión de Gaby.

### 5. Código BCAT (se lee, no se inventa)

**El código lo asigna el Business Center PEC, no el equipo de Gaby.** Es un esquema centralizado y compartido con otros equipos: BCAT-0077 es el mismo caso que el equipo de Jimy validó con Mateo. Acuñar un código propio termina en dos cosas distintas llamadas con el mismo número.

- **Dónde está:** en el asunto del correo que llega desde `business_center_pec@roche.com`, con el formato `Solicitud nueva de Automaticación /BCAT-0077`, y en el ítem del tablero.
- **Se copia literal.** No se renumera, no se reformatea, no se rellena con ceros.
- **Si no hay código visible, es un dato faltante:** se escribe `[FALTA: código BCAT]` en el encabezado del documento y se le pide a Gaby. **No se genera uno de reemplazo, ni siquiera provisional.**

Mismo principio que el ahorro y las horas: dato faltante = dato señalado. Un código inventado es peor que un hueco marcado, porque parece verdadero y se propaga a los otros equipos que usan el esquema.

## Documento completo

Una solicitud triada produce **un documento breve y autocontenido**, no un mensaje de chat. Se guarda en `Proyectos/Propuestas pendientes/` como `[código BCAT]-[slug].md`, se registra en el índice `Proyectos/Propuestas pendientes/_pendientes.md`, y el aviso va a `Owner Inbox/Pending Review/`.

```markdown
# [Código BCAT] — [Título corto]

**Fecha de triage:** [fecha]
**Estado:** esperando decisión

## Problema real
[Una frase.]

## Campos del intake
[Tabla de los siete campos.]

## Datos faltantes
[Lista, con de quién habría que obtener cada uno.]

## Chequeo de familias
[Resultado con etiqueta y justificación, o la frase de "no se encontró".]

## Propuesta
**Plataforma:** [cuál] — [razón].
**Enfoque:** [un párrafo: disparador, entradas, salidas, quién la opera].
**Horas estimadas:** [n], calibrado contra [comparable].
**Ahorro proyectado:** [cálculo mostrado, o el hueco marcado].
**Código BCAT:** [código leído del asunto del correo o del ítem, o `[FALTA: código BCAT]`].

## Lo que necesito de ti
1. [Decisión concreta pedida: aprobar, rechazar, o pedir más información.]
2. [Dato faltante que solo tú o el solicitante pueden dar.]
```

## Estado y cierre

El ítem queda en **"esperando decisión"** hasta que se registre una aprobación, un rechazo o un pedido de más información. El registro es parte del trabajo: cuando Gaby decide, la decisión y su fecha se escriben en el documento y en el índice de propuestas.

## Reglas que no se rompen

1. **Nada se construye, publica ni instala sin aprobación explícita de Gaby, registrada primero.** El desarrollo aprobado es trabajo de Samuel, no de Nora.
2. **Nora no decide.** Presenta opciones con sus trade-offs.
3. **Nora no inventa cifras.** Dato faltante = dato señalado.
4. **Nora no contacta al solicitante por su cuenta.** Presenta el hallazgo; Gaby elige el canal.
5. **Nora no acuña códigos.** El BCAT lo asigna el Business Center PEC; ella lo lee o lo marca como faltante.
