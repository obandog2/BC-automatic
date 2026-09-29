# BCAT-0077 — triado, sin propuesta: falta el cuerpo de la solicitud

**De:** Nora (triage de solicitudes de automatización)
**Fecha:** 2026-09-24
**Documento:** `Proyectos/Propuestas pendientes/BCAT-0077-almacen-distribucion-peru.md`
**Estado:** esperando decisión

---

## En una línea

El correo que me pasaste es la **notificación** de la solicitud, no la solicitud. El contenido real está detrás del enlace del formulario de monday, que no puedo abrir: **cinco de los siete campos del intake están vacíos y no hay base para proponer nada.**

## Problema real, con los huecos a la vista

> Alguien de almacén y distribución en Perú dedica 2 horas a cada `[FALTA: volumen de solicitudes por semana]` solicitudes de `[FALTA: de qué tipo de solicitud se trata]`, y el correo de intake no dice qué se hace en esas 2 horas ni con qué datos.

La frase está incompleta a propósito. No sé qué proceso se quiere automatizar.

## Lo que sí llegó

País: Perú. Horas: 2 por solicitud. Nada más utilizable.

Faltan: área (el campo llegó **vacío**), tipo de entregable, fuentes de datos (**no sé si involucra SAP** — ni lo asumo ni lo descarto), frecuencia, quién lo hace hoy, y personas afectadas en números.

## Chequeo de familias: sin coincidencias, y el chequeo está incompleto

Revisé `Proyectos/Tickets/_cola.md` y los tres tickets completos (BCAT-0016, BCAT-0065, BCAT-0074), más el índice de propuestas. Ninguno se parece.

> No se encontró automatización similar al 2026-09-24.

**Dos advertencias que pesan más que el resultado:**

1. **No leí el tablero.** Sin conector de monday no pude revisar los ítems en estado "Finalizado". Lo que corrí es un chequeo contra cuatro archivos locales, no el chequeo que mi rol define. Podría existir algo finalizado para almacén y distribución de Perú que no veo.
2. **El criterio formal no llegó a correr.** Pide dos coincidencias entre país, área, entregable y fuente. De esta solicitud solo conozco el país, y los tickets locales no registran ni país ni área. Descarté por lectura completa del contenido, que era lo único disponible.

## Dato que probablemente te ahorre todo el resto

**BCAT-0077 es el caso que el equipo de Jimy usó para validar el rol con Mateo.** Es el mismo ticket, no uno parecido. Es probable que ya exista un triage hecho por él. Ese trabajo no está en este workspace: busqué y no hay nada de BCAT-0077 aquí.

## Por qué no hay propuesta

Plataforma, enfoque y horas dependen de datos que no tengo, y no hay comparable en lo entregado. El ahorro se queda a una pregunta de distancia: **2 h por solicitud × `[FALTA: volumen semanal]`**. No relleno el hueco.

El código no hace falta generarlo: `BCAT-0077` viene asignado por el Business Center en el asunto. Se toma literal.

## Lo que necesito de ti

1. **Preguntarle a Jimy si Mateo ya triaje BCAT-0077 y pedir ese documento.** Puede volver innecesario casi todo lo demás.
2. **Abrir el enlace de la submission de monday y pegarme el contenido.** Necesita tu sesión corporativa. Es la pieza que falta.
3. **Definir cómo conseguir el volumen semanal de solicitudes.** Único factor que falta para el ahorro.
4. **Decidir si contacto a jasmine.solis@roche.com y por qué canal.** Yo no le escribo sin tu visto bueno. Las preguntas ya están listas en el documento.
5. **Mirar las anomalías del formulario de intake.** El campo de horas pide semanales y la gente responde por solicitud; el campo "Área" pasa vacío. Se van a repetir en cada ticket.
6. **Confirmarme que el código es de cuatro dígitos**, para que Alicia corrija mi skill, que dice tres.

Nada se construye hasta que decidas.
