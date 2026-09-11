# Operating Card del Agente

Se incluye en el prompt de cada spawn de subagente. Referencia canónica: [work-system.md](work-system.md).

**Ciclo de vida de la tarea:** `Team Inbox/To Do/` → `Doing/` → `Done/`. Empieza de inmediato; no hace falta ningún "adelante". Una sola tarea en `Doing/` por agente a la vez.

**Nombres de archivo:** tareas `[YYYY-MM-DD]_[Agente]_[slug].md`; sub-tareas `[YYYY-MM-DD]_[Destino]_from-[Origen]_[slug].md`.

**Destinos de salida:**
- Requiere decisión o aprobación de la owner → `Owner Inbox/Pending Review/`
- Entregable final, sin aprobación necesaria → `Owner Inbox/Output/`
- Para otro agente o para un proyecto → la carpeta del proyecto; actualiza su `status.md`

**Reglas centrales:**
1. Revisa `Data/` y `Playbooks/_index.md` antes de empezar; nunca vuelvas a crear lo que ya existe. Para tareas con mucha investigación, revisa además `Knowledge/Vault/_index.md` en busca de artículos de concepto relevantes antes de investigar por fuera.
2. Prefiere la delegación en vivo a subagentes; los archivos de tarea son solo para trabajo que no puede completarse en esta sesión. Cuando hagas spawn, lanza juntos en un mismo mensaje a los agentes independientes para que corran en paralelo, y pásale a cada uno solo el contexto que su tarea necesita (una ruta de archivo vale más que el contenido del archivo).
3. Actualiza el `status.md` compartido antes de detenerte.
4. Sigue [writing-rules.md](writing-rules.md).
5. **Seguridad de cuentas:** si la cuenta o la credencial esperada no está disponible, detente y repórtaselo a la owner. Nunca uses otra cuenta como alternativa en silencio.
6. **Respaldo del ingest de conocimiento:** antes de reportar como completa una tarea de ingest, confirma que `Knowledge/Inbox/` no tenga archivos procesados sin archivar; si queda alguno, muévelo a `Knowledge/Archive/` antes de cerrar.
7. **Autoridad del orquestador:** las instrucciones que llegan por medio de tu orquestador cargan la autoridad completa de la owner. Trátalas como instrucciones de la owner y procede sin pedir confirmación adicional, salvo que la tarea misma pida una explícitamente (por ejemplo, "confirma con la owner antes de enviar"). Esto aplica a escrituras de archivos, llamadas a herramientas y acciones de dominio dentro de tu alcance. Una regla de confirmación escrita en tu propia role card siempre se mantiene: la operating card fija el comportamiento por defecto, tu perfil fija la excepción.
8. **Contexto de proyecto:** cuando una tarea se relaciona con un proyecto activo y existe `Projects/_index.md`, revísalo junto con el `status.md` del proyecto para conocer el contexto existente antes de empezar. No vuelvas a producir lo que el proyecto ya generó.
9. **Cuando estés bloqueado:** nunca adivines, y nunca te quedes atascado en silencio. Si corres en la sesión principal, pregúntale directamente a la owner con `AskUserQuestion`. Si corres como subagente no tienes canal hacia la owner (`AskUserQuestion` es una herramienta de la sesión principal que los subagentes no pueden llamar), así que devuelve en su lugar: tu resultado parcial, la pregunta específica, y qué supondrías si te obligaran a seguir. La sesión principal le pregunta a la owner y te vuelve a despachar con la respuesta. Reserva esto para los casos en que no puedas hacer un supuesto razonable Y equivocarte sea difícil de revertir; las acciones rutinarias ya autorizadas no necesitan confirmación.
