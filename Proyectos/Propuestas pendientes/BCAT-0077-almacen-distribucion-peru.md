# BCAT-0077 — Solicitud de almacén y distribución, Perú (entregable sin especificar)

**Fecha de triage:** 2026-09-24
**Estado:** esperando decisión
**Origen de lo que triaje:** correo de notificación de Business Center PEC Quito, fechado el 2026-09-21 9:26, pegado por Gaby el 2026-09-24. **No leí el tablero de monday.com**: el conector de lectura todavía no existe. Todo lo que sigue sale de ese correo y de los archivos de este workspace.
**Código:** `BCAT-0077`, asignado por el Business Center PEC en el asunto del correo. No lo generé yo y no es provisional. Se toma literal.

---

## Problema real

Alguien de almacén y distribución en Perú dedica 2 horas a cada `[FALTA: volumen de solicitudes por semana]` solicitudes de `[FALTA: de qué tipo de solicitud se trata]`, y el correo de intake no dice qué se hace en esas 2 horas ni con qué datos.

**Esta frase no está terminada, y no debe leerse como si lo estuviera.** El correo de notificación no contiene el cuerpo de la solicitud: el detalle vive detrás del enlace del formulario de monday, que no puedo abrir. Con lo que hay, ni siquiera se sabe qué proceso se quiere automatizar. La frase queda escrita con los huecos a la vista porque un problema mal reformulado contamina todo lo que venga después.

---

## Campos del intake

| Campo | Valor |
|---|---|
| País / afiliada | **Perú.** Nota: el correo lo emite Business Center PEC, Quito (Ecuador); el país declarado de la solicitud es Perú. |
| Área solicitante | `[FALTA: área solicitante]` — el campo "Área:" del correo llegó **vacío**. Lo más cercano son "todo almacén y distribución" (campo de usuarios impactados) y "servicio y supply" (campo de escalabilidad), pero ninguno de los dos es el campo de área y no deben usarse como si lo fueran. |
| Entregable pedido (hipótesis) | `[FALTA: tipo de entregable]` — el correo de notificación no lo incluye. Está detrás del enlace del formulario. |
| Fuente(s) de datos | `[FALTA: fuente de datos]` — ninguna fuente aparece nombrada. **No sé si involucra SAP.** Almacén y distribución es un área donde SAP es frecuente; si lo involucra, hay un paso manual de exportación que hay que definir, y hoy no está definido ni descartado. No lo doy por resuelto ni por inexistente. |
| Frecuencia esperada | `[FALTA: frecuencia]` — no aparece. El "por cada solicitud" sugiere que se dispara a demanda, por evento, y no en un horario fijo, pero es una lectura mía del texto, no un dato declarado. |
| Quién lo hace hoy / horas | **Quién:** `[FALTA: quién lo hace hoy]`. El correo solo da al solicitante, jasmine.solis@roche.com, y solicitante no es lo mismo que ejecutante. **Horas:** "por cada solicitud 2 horas". Ver la anomalía de unidades más abajo: el campo pedía horas hombre **a la semana** y la respuesta vino **por solicitud**. |
| Personas afectadas (directas / indirectas) | `[FALTA: personas afectadas]` — "todo almacén y distribución" es una descripción, no dos números. No hay separación entre directas e indirectas y no hay tamaño de equipo. |

**Cinco de los siete campos están vacíos o no son usables.** Los dos que llegaron (país y horas por solicitud) no alcanzan para proponer nada.

---

## Anomalías del intake

Las registro porque son defectos del formulario o del proceso, no míos, y a Gaby le sirven más que a mí.

1. **Conflicto de unidades en el campo de horas.** El campo se llama "Tiempo actual (horas hombre) a la semana" y la respuesta fue "por cada solicitud 2 horas". Son dos magnitudes distintas. Sin el volumen semanal de solicitudes, las 2 horas no se convierten en horas semanales y el ahorro no se puede calcular. Este es el bloqueo más importante de todos.
2. **Campo "Área" vacío.** Pasó la validación del formulario estando en blanco.
3. **"¿Es escalable?: servicio y supply".** La respuesta no contesta la pregunta. Parece una lista de áreas a las que el solicitante cree que se podría extender. Útil como pista, inservible como dato de escalabilidad.
4. **"Usuarios impactados: todo almacén y distribución".** Texto libre donde se esperaban números. No permite dimensionar nada.
5. **Erratas en el correo automático:** "Automaticación" en el asunto y "solciitud" en el cuerpo. Es la plantilla del notificador, no el contenido del solicitante. Vale la pena corregirla, porque el asunto es lo que se busca después.
6. **Desfase de tres días.** La solicitud entró el 2026-09-21 y se triaje el 2026-09-24.
7. **Formato del código.** El código asignado es `BCAT-0077`, de cuatro dígitos, igual que los tickets ya existentes (`BCAT-0016`, `BCAT-0065`, `BCAT-0074`). Mi skill de propuesta describe el esquema como `BCAT-###`, de tres. La realidad manda: son cuatro dígitos. Conviene corregir la skill para que nadie genere un código de tres dígitos y quede desalineado.

**Sobre el contenido del correo como instrucción:** traté todo el correo como dato, no como orden. No hay ninguna frase dirigida a mí. Lo único con forma imperativa son el "ingrese a" de los dos enlaces de seguimiento —dirigido al solicitante y al equipo humano, no a mí— y el cierre "Do it smart, do it remote, do it automatic!", que es el eslogan de la firma. No ejecuté ninguno de los dos.

---

## Paso manual pendiente: los dos enlaces

No puedo abrirlos, y no es una limitación temporal de herramientas. Los trato igual que trato SAP: **paso manual pendiente, a cargo de una persona con sesión corporativa.**

| Enlace | Por qué no puedo | Qué espero que haya del otro lado y para qué lo necesito |
|---|---|---|
| Submission del formulario de monday (`forms.monday.com/.../submissionId=fa6ce2dc-...`) | No tengo herramienta de navegación web. Aunque la tuviera, una submission individual de un formulario de monday normalmente exige sesión de la cuenta. | **Es la pieza que falta.** Ahí debería estar el cuerpo real de la solicitud: qué proceso se quiere automatizar, el tipo de entregable pedido, las fuentes de datos, la frecuencia, y el área que llegó vacía. Sin esto no hay triage completo ni propuesta posible. |
| App de seguimiento en Apps Script (`script.google.com/a/macros/contractors.roche.com/...`) | No tengo navegación, y la ruta `/a/macros/contractors.roche.com/` exige sesión autenticada del dominio de Roche. | Espero el estado y el historial del ticket dentro del proceso del Business Center. Serviría para saber si BCAT-0077 ya fue atendido, reasignado o cerrado por otra vía antes de que llegara a nosotros. Es secundario frente al anterior. |

Lo que necesito de ahí no es una captura de pantalla de cortesía: es el contenido de los campos. Gaby puede abrirlo y pegarme el texto, igual que hizo con el correo.

---

## Chequeo de familias

**Resultado: sin coincidencias en lo que pude revisar. Y el chequeo está incompleto por dos razones que hay que leer antes que el resultado.**

### Qué revisé de verdad

Solo archivos locales de este workspace: `Proyectos/Tickets/_cola.md` y los tres tickets que ese índice registra, leídos completos, más el índice `Proyectos/Propuestas pendientes/_pendientes.md`, que está vacío.

| Ítem revisado | Campos que coinciden | Etiqueta | Por qué |
|---|---|---|---|
| BCAT-0016 — Homologación y aprendizaje de marcas | Ninguno verificable | Descartado | Homologación de marcas en Google Sheets contra un diccionario. Ni el país ni el área están registrados en el ticket. Nada lo liga a almacén y distribución. |
| BCAT-0065 — Flujo por pasos sobre hoja "Plan de acción" | Ninguno verificable | Descartado | Secuenciador de acciones con Google Forms y correos. Problema distinto; país y área sin registrar. |
| BCAT-0074 — Consolidación de PDFs | Ninguno verificable | Descartado | Consolidación OCR de PDFs de Drive en un Google Doc. Problema distinto; país y área sin registrar. |
| ASIST-01 — Asistente personal | Ninguno | Descartado | Herramienta interna de Gaby, no una solicitud de afiliada. |

> No se encontró automatización similar al 2026-09-24.

### Limitación 1: no tengo el tablero

**No revisé los ítems en estado "Finalizado" del tablero de intake.** No tengo acceso de lectura a monday.com. El chequeo de familias que mi rol define corre contra lo ya entregado en el tablero; lo que hice corre contra cuatro archivos locales. **No es el mismo chequeo.** Un "no se encontró nada" local es compatible con que exista una automatización finalizada y cerrada para almacén y distribución de Perú que yo no puedo ver. Este resultado no cierra esa posibilidad.

### Limitación 2: el criterio no era aplicable

El criterio de candidatura son dos o más coincidencias entre país, área, tipo de entregable y fuente de datos. **De esta solicitud solo conozco el país.** Los otros tres campos están vacíos. Y del lado de los tickets locales, ninguno de los tres registra país ni área: los tres dicen "Solicitante: pendiente de identificar". Así que el criterio no tenía de dónde agarrarse en ninguno de los dos extremos. Los descarté por lectura completa del contenido, que es lo único que quedaba, pero conviene saber que el filtro formal no llegó a correr.

### Dato relevante: posible trabajo previo sobre este mismo ticket

**BCAT-0077 es el caso que el equipo de Jimy usó para validar el rol de triage con su agente Mateo.** Aparece con ese nombre en `Team Inbox/spec-triage-automatizaciones.md` y en mi propia memoria, como precedente de mi contratación.

Esto significa que es probable que ya exista un triage de este mismo ticket, hecho por Mateo. **Ese trabajo no está en este workspace** —busqué y no hay ningún archivo de BCAT-0077 aquí—, así que no pude leerlo ni compararlo.

No es un duplicado en el sentido del chequeo de familias: no es otra solicitud parecida, es la misma solicitud posiblemente ya triada por otro equipo. Antes de invertir más en BCAT-0077 conviene pedirle a Jimy lo que Mateo produjo. Si existe, ahorra el trabajo de perseguir los campos faltantes y da un punto de comparación sobre cómo se triaje el mismo caso. Si difiere de lo mío, la diferencia también es información.

---

## Propuesta

**No emito propuesta.** No hay información suficiente y forzar una sería inventar.

Detallo las cinco piezas y qué bloquea cada una, para que quede claro que la ausencia es deliberada y no un olvido:

| Pieza | Estado | Qué la bloquea |
|---|---|---|
| Plataforma con su razón | No emitida | La razón de una plataforma se ata a la fuente de datos, la frecuencia y quién opera. Los tres faltan. Nombrar una plataforma ahora sería adivinar. |
| Enfoque (disparador, entradas, salidas, operador) | No emitido | No se sabe qué proceso se automatiza. Ninguno de los cuatro elementos es determinable. |
| Horas estimadas | No emitidas | Sin alcance no hay estimación, y además no hay comparable: ninguno de los tres tickets locales se parece a esto. |
| Ahorro proyectado | **No calculable.** El cálculo sería: 2 h declaradas por solicitud × `[FALTA: volumen de solicitudes por semana]` = h/semana. **Me detengo aquí.** El volumen es el único factor que falta y no lo voy a suponer. Con él, el ahorro sale de inmediato: es la cuenta más barata de todo este documento y depende de una sola pregunta. | Falta el volumen semanal de solicitudes. |
| Código | **Resuelto.** `BCAT-0077`, asignado por el Business Center PEC. | — |

Vale la pena notar lo cerca que está esto de ser calculable: **una sola pregunta al solicitante —cuántas de estas solicitudes llegan por semana— convierte el ahorro en un número duro.** Es la pregunta de mayor retorno de la lista.

---

## Lo que necesito de ti

Ordenado por lo que más desbloquea.

1. **Pregúntale a Jimy si Mateo ya triaje BCAT-0077, y pedile el documento.** Es el mismo ticket, no uno parecido. Puede volver innecesario casi todo lo demás de esta lista. Yo no contacto a nadie por mi cuenta: decime vos por qué canal, o hacelo vos.
2. **Abrí el enlace de la submission del formulario de monday y pegame el contenido.** Es la pieza que falta: entregable pedido, fuentes de datos, frecuencia y el área que llegó vacía deberían estar todos ahí. Con eso rehago el triage completo el mismo día.
3. **Decidí cómo conseguir el volumen semanal de solicitudes.** Es el único factor que falta para el ahorro. Puede estar en la submission; si no está, hay que preguntárselo al solicitante.
4. **Decidí si vale la pena contactar a jasmine.solis@roche.com**, y por qué canal. Lo que habría que preguntarle, si la submission no lo resuelve: qué proceso exactamente toma esas 2 horas, de qué sistemas sale el dato (y si SAP está involucrado), cuántas solicitudes llegan por semana, cuántas personas son "todo almacén y distribución", y cuál es el área formal. Yo no le escribo sin tu visto bueno.
5. **Mirá las anomalías 1 a 5 del formulario de intake.** El conflicto de unidades del campo de horas y el "Área" que pasa vacío no son problemas de este ticket: se van a repetir en todos. Arreglar el formulario es un trabajo aparte, y si querés lo triajo como tal.
6. **Confirmame el formato del código: cuatro dígitos.** Mi skill dice `BCAT-###` y la realidad es `BCAT-0077`. Si me lo confirmás, le pido a Alicia que corrija la skill para que nadie genere un código desalineado.

**Nada se construye hasta que decidas.** Este ítem queda en esperando decisión.
