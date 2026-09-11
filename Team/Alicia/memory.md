---
last-consolidated: 2026-09-11
---

# Alicia - Memoria de trabajo

> Instrucciones para Alicia: Registra decisiones de contratación, qué funcionó en los diseños de agentes, patrones que ayudan a identificar la experticia correcta, y notas sobre la composición del equipo.

---

## Hot Context

**2026-09-11 — Samuel modificado el mismo día en que fue contratado: analista + desarrollador.** Gaby levantó la prohibición de escribir código y canceló la contratación aparte de un desarrollador, plegándola dentro de Samuel. Los requisitos de desarrollo (hoy Apps Script y Java, abierto a entornos futuros, propone mejoras) ahora viven en su perfil. Aprobó sin cambios los cuatro límites que puse a su veto. Detalles abajo, en Notas de contratación.

---

## Stable Knowledge

### Roster del equipo

| Agente | Rol | Contratado |
|-------|------|-------|
| Alfred | Orquestador | 2026-09-11 (instalación inicial) |
| Alicia | Líder de HR | 2026-09-11 (instalación inicial) |
| Tuti | Revisora del Sistema | 2026-09-11 (instalación inicial) |
| Joy | Gestora de Conocimiento | 2026-09-11 (instalación inicial) |
| Samuel | Analista de Requisitos y Desarrollador | 2026-09-11 (primera contratación real; alcance ampliado el mismo día) |

### Contexto de la owner

- Nombre completo: **Gabriela Obando**. Especialista en automatización del Business Center. Programadora.
- Stack: Google Apps Script, Visual Studio. Los tickets llegan a un tablero de **Monday.com**.
- Ciclo de trabajo: ticket → revisión → reunión con el solicitante → desarrollo.
- **Ya existe capacidad de programar: Samuel.** Hoy Apps Script y Java, otros entornos según vayan llegando. No contratar a un desarrollador aparte; esa contratación se propuso y Gaby eligió plegarla dentro de Samuel.
- **No hay entorno de ejecución en este workspace.** No hay JDK, ni `clasp`, ni credenciales de Google. Apps Script corre en los servidores de Google contra los datos de ella. Cualquier agente que escriba código lo entrega; Gaby lo ejecuta.
- **No hay audio, ni asistencia a reuniones, ni envío de correo.** Son brechas de capacidad, no de permisos. El canal realista para el contenido de una reunión es una transcripción de Google Meet que Gaby pegue.

### Notas de contratación

**Samuel (2026-09-11) — primera contratación real.**

Qué funcionó:
- **La entrevista encontró un trabajo distinto al que estaba sobre la mesa.** Alfred sacó a la superficie dos candidatos: un desarrollador de Apps Script o un analista de requisitos. La pregunta 1 lo resolvió en una sola respuesta — Gaby dijo que el cuello de botella eran los tickets ambiguos, y después, sin que se lo pidieran, "no porque no codifique". Nunca diseñes desde la brecha de capacidad del organigrama. Diseña desde donde realmente le duele la semana a la owner.
- **La pregunta 3 como un menú de resultados concretos de viernes por la tarde (A/B/C/D) en vez de "cómo se ve el éxito".** Las preguntas abstractas de éxito reciben respuestas abstractas. Ella eligió A como núcleo y C y D como extras, que es exactamente la información de prioridad que hace falta para decidir qué es el trabajo y qué es una funcionalidad.
- **Repetirle los números de vuelta trajo una corrección.** Repetí "16 tickets atascados" y ella lo corrigió a 10 sin revisar + 6 activamente en código. Esa corrección encogió el problema y movió el peso del diseño hacia el triaje de la cola sin revisar. Di los números en voz alta; las owners los corrigen.

Qué hacer distinto:
- **Propuse un límite que ella vetó, y el veto mejoró el diseño.** Escribí "nunca contacta al solicitante" como default seguro. Ella lo rechazó: quiere que Samuel redacte mensajes para pedir insumos faltantes y para confirmar el congelamiento del alcance, abriendo siempre con una presentación fija. Mi instinto fue protegerla de un agente que se pasara de la raya; su instinto fue que perseguir el seguimiento es parte del dolor. **Propón los límites como borradores para vetar, no como defaults seguros incluidos en silencio.** Mostrarlos por escrito en el Paso 3 fue lo que sacó esto a la luz. Seguir haciéndolo.
- **También suavizó "nunca inventa requisitos" a "puede sugerir, yo decido".** El arreglo fue estructural, no verbal: las sugerencias viven en una sección aparte y rotulada, nunca en el cuerpo de la especificación. Cuando una owner afloja un límite, busca una forma estructural del límite en lugar de soltarlo.
- **Contrasta la realidad de las herramientas contra lo que pide la owner.** Ella dijo "quiero que le escriba al solicitante" y razonablemente podría haber esperado el envío. No hay integración de correo, así que Samuel redacta y ella envía. Lo dije explícitamente antes de la aprobación, en vez de dejar que el perfil insinuara una capacidad que no existe. Siempre reconcilia un comportamiento pedido con la lista real de herramientas antes de presentar.
- **Diseña para la integración que todavía no existe.** Los tickets viven en Monday sin acceso por API, así que la entrada se pega a mano. El híbrido — entrada pegada, salida persistida — mantiene viva la cola entre sesiones y significa que cuando llegue la API solo cambia la entrada. Patrón reutilizable para cualquier agente bloqueado por una integración pendiente.

**Samuel (2026-09-11, el mismo día) — modificación de alcance, no una contratación nueva.**

Gaby: "quiero quitar la restriccion de que construya el codigo pero quiero que sea bajo mi guia". Además estaba por contratar a un desarrollador aparte; Alfred le dio tres opciones y ella eligió un solo agente haciendo los dos trabajos.

Qué funcionó:
- **Reapliqué el patrón del límite estructural en vez de inventar uno nuevo.** Esta mañana, cuando suavizó "nunca inventa requisitos", el arreglo fue una sección de sugerencias aparte y rotulada, no una frase más blanda. La misma jugada aquí: "nunca escribe código" se convirtió en tres reglas entrelazadas — plan antes que código (una compuerta), archivos nuevos por defecto (una regla de ubicación), las ideas no pedidas van en una sección de propuestas rotulada (otra vez el mismo patrón). **Cuando una owner afloja un límite por segunda vez, mira primero cómo lo resolviste la primera.** Un patrón que ya sobrevivió a su veto es mejor punto de partida que un diseño fresco.
- **Lee el límite contra el miedo real de la owner, no contra la regla literal.** La regla era "nada de código". El miedo, en sus palabras, era "me puede causar retrocesos" — código que deshace trabajo terminado. Una vez que nombras el miedo, la regla puede cambiar de forma protegiendo lo mismo. Lo prohibido ahora es "código que ella no pidió, tocando trabajo que ella considera terminado", que está más cerca del miedo de lo que estaba la prohibición original.
- **Convertir la compuerta en un estado de cola la volvió auditable.** La compuerta de aprobación se volvió un estado `esperando luz verde` en la cola de tickets. Un ticket sentado en `en código` que nunca pasó por ahí es una regla visiblemente saltada. **Un límite que puedes ver en un campo de estado le gana a uno que solo vive en una frase del perfil.**
- **Argumenté la decisión de herramientas en vez de dejarla por default.** Alfred preguntó si Samuel necesitaba Bash. Recomendé que no y di la razón que importaba: Bash es la única herramienta que rompe el contrato de código, porque las tres reglas descansan en controlar qué archivos se tocan. Read/Write/Edit hacen que un cambio de archivo sea un acto visible y acotado; `mv`, `rm`, `git checkout` y las redirecciones no. Ella lo aceptó con ese argumento. **Las listas de herramientas son decisiones de diseño. Escribe el argumento, también en la memoria del agente, para que una revisora posterior no "arregle" la omisión.**
- **Presenté el antes/después solo de las secciones cambiadas, no del perfil completo.** Para una modificación, eso es lo que hace revisable el diff. Volver a mostrar el perfil entero esconde lo que realmente se movió.

Qué vigilar:
- **Escribe el alcance de modo que no haya que reescribirlo.** Gaby quiere lenguajes futuros. El perfil dice Apps Script y Java "hoy" y pone el procedimiento de onboarding para un entorno desconocido dentro de la skill (preguntar por ejecución, despliegue, convenciones, dependencias, pruebas; y después registrarlo en memoria). El perfil nombra el estado actual; la skill carga el mecanismo de extensión.
- **Cuando la owner pide una capacidad que no existe, ofrece el sustituto realista dentro del diseño.** Preguntó si Samuel podía sentarse en sus reuniones. No puede: no hay audio, no hay forma de unirse a una llamada, y no es un tema de permisos. El camino disponible es una transcripción de Google Meet. Así que el diseño ahora distingue dos tipos de entrada — su nota corta y filtrada, contra una transcripción larga y literal — y su memoria dice sin rodeos que no asiste a reuniones, recibe lo que se dijo. El mismo hábito de reconciliación que el del correo, esta mañana.

### Patrones reutilizables

- **Haz una pregunta por turno, y refleja la respuesta anterior antes de hacer la siguiente.** Gaby corrigió un número, vetó un límite y agregó el detalle de Monday porque cada turno le mostraba qué había entendido yo.
- **Idioma:** todo el workspace se escribe en español (regla de escritura 3). La única excepción es `Data/SETUP.md`, que se conserva en su idioma original como referencia del instalador. Samuel fue el primer perfil en español; el resto se tradujo el 2026-09-11. Antes de esa decisión la regla dejaba en inglés los archivos de la instalación inicial: ese criterio ya no aplica.
- **Las integraciones pendientes van en la memoria del agente nuevo, bajo Stable Knowledge**, redactadas como "esto no existe", para que el agente nunca las proponga como disponibles.
- **Los límites son borradores para vetar, nunca defaults seguros colados en silencio.** Confirmado ya dos veces. El veto de la mañana ("nunca contacta al solicitante") mejoró el diseño; la lista de la tarde con cuatro límites vetables volvió aprobada sin cambios, lo cual también es información — significa que viajó el razonamiento, no solo la regla.
- **Estructural por encima de verbal, siempre.** Un límite con forma (una sección aparte, una ubicación de archivo obligatoria, una compuerta de aprobación, un estado de cola) sobrevive a la presión. Un límite que es solo una frase en un perfil se erosiona la primera vez que la owner anda con prisa.
- **Una modificación no es una contratación. Sáltate la entrevista de cinco preguntas, conserva el Paso 3.** Presenta el antes/después de las secciones cambiadas y pide aprobación antes de tocar archivos.
- **Ediciones quirúrgicas en archivos compartidos.** Cuando otro agente está en cola para reescribir un archivo (Tuti sobre `CLAUDE.md`), cambia solo la línea que es mía. Las colisiones en archivos compartidos son baratas de evitar y caras de desenredar.
