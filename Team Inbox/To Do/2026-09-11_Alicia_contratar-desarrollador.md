# Task: Contratar especialista en desarrollo de código

**Routed by:** Alfred
**For:** Alicia
**Date:** 2026-09-11

---

## Request

Gaby pidió un segundo especialista, además de Samuel: un agente que **escriba código**. Sus palabras textuales:

> "otra cosa tambien quiero un especialista en crear codigos puede ser en java en app script por el moemnto pero quiero que ha futuro se entrente en otro entornos y que proponga mejoras o ideas de como solventar situaciones"

Tres requisitos que ya dejó claros:

1. **Escribe código.** Java y Google Apps Script por ahora.
2. **Extensible a futuro.** Debe poder trabajar en otros entornos más adelante. El diseño del perfil no debe amarrarlo a dos lenguajes.
3. **Propone.** No solo ejecuta: sugiere mejoras e ideas sobre cómo resolver situaciones.

Ejecuta tu Hiring Procedure completa. **Empieza solo después de que los archivos de Samuel estén creados y aprobados.**

## Context

- Contexto de trabajo de Gaby: ver `Alfred/memory.md`. Área de Business Center, automatización de flujos de trabajo. Ciclo: ticket → revisión → reunión con el solicitante → desarrollo. Stack: Google Apps Script y Visual Studio. Los tickets llegan por un tablero de Monday.
- Volumen: ~2 tickets nuevos por semana. Al 2026-09-11 tenía 10 sin revisar y 6 en desarrollo activo.
- **Relación con Samuel (crítica para el diseño):** Samuel es el analista de requisitos contratado el mismo día. Se detiene exactamente donde empieza el código. Este nuevo agente es quien recoge desde ahí. La frontera entre los dos tiene que quedar limpia y sin solapamiento: Samuel entrega una especificación con el alcance congelado; el desarrollador la implementa.
- Un límite que Gaby puso en Samuel y que conviene revisar aquí, porque el motivo cambia de sentido: a Samuel le prohibió escribir código porque "me puede causar retrocesos", es decir, código no pedido que deshace trabajo suyo ya hecho. Ese riesgo no desaparece con un agente que sí programa — vale la pena preguntarle a Gaby cómo quiere controlarlo (por ejemplo, que el desarrollador no toque código existente sin pedirlo, o que entregue en archivos aparte).
- Interrogante abierto para la entrevista: ¿este agente trabaja sobre las especificaciones que produce Samuel en `Proyectos/Tickets/`, o Gaby le pega el trabajo directamente? Es la misma decisión de acceso que se resolvió para Samuel con el híbrido entrada-pegada / salida-persistida.

## Expected Output

Los archivos estándar de una contratación:

1. `Team/[Nombre].md` — perfil completo
2. `.claude/agents/[nombre].md` — definición nativa con frontmatter
3. `Team/[Nombre]/memory.md` — semilla estándar
4. `Team/[Nombre]/skills/` — si el rol lo amerita
5. Línea nueva en la tabla de ruteo de `CLAUDE.md`

Presenta todo a Gaby para aprobación antes de crear ningún archivo, como manda tu Paso 3.
