# Consolidé en CLAUDE.md lo de la última conversación larga con Alfred

**De:** Tuti
**Fecha:** 2026-09-29
**Archivos tocados:** `CLAUDE.md`, `Alfred/memory.md`

---

Gaby, ya quedó todo lo de la conversación del 23 al 29 de septiembre dentro de `CLAUDE.md`. Pasó de 32 a 73 líneas. No toqué el guardarraíl, las reglas de operación ni la tabla de ruteo; agregué secciones nuevas después de la tabla: contexto del proyecto, estado de los especialistas, integraciones y credenciales, reglas transversales, aprendizajes de método, propuestas abiertas y tu preferencia de tono.

La idea fue que cada punto ocupe una o dos líneas y enlace al archivo que tiene el detalle. Por ejemplo, la convención de código de Samuel quedó resumida en un párrafo que apunta a su memoria, en lugar de copiarla entera. Así, cuando algo cambie, se cambia en un solo lugar y no se desincroniza, que es justo lo que pasó con el formato de los códigos BCAT.

En la memoria de Alfred corregí lo que estaba viejo: decía que la API de monday estaba "esperando accesos" y que el correo era un proyecto pendiente por MCP de Gmail. Ahora refleja lo que decidiste: monday va por un usuario Viewer y falta ejecutarlo, y el conector de correo está descartado por política. También sumé a Nora al equipo y marqué como resuelta la vieja nota de que faltaba un desarrollador.

Hay tres cosas que necesitan que las mires tú:

1. El envío de correo quedó en una zona gris. El descarte por política habla de conectar un buzón desde afuera. Pero la nota vieja de Alfred mencionaba otra ruta para que Samuel envíe correos: una web app de Apps Script, que corre dentro del dominio de Roche (tus propios scripts ya usan GmailApp). Esas razones no aplican igual ahí. No lo di por descartado ni por vivo; dejé escrito que no se proponga sin preguntarte. ¿El descarte cubre también el envío?

2. El repo no tiene `.gitignore`. Cuando configures el conector de monday va a existir un `.mcp.json`. Si apunta a una variable de entorno como está previsto, no pasa nada, pero hoy no hay nada que frene un commit accidental de un archivo con un secreto adentro. Te recomiendo agregar un `.gitignore` antes de ese paso. Si quieres, lo preparo yo.

3. Los archivos de Nora nombran tres pasos pendientes para el conector, y el plan completo tiene cinco: faltan instalar Node.js (verifiqué que hoy no hay `node` ni `npx`) y el `.mcp.json` con variable de entorno. No contradicen nada, pero si quieres que Nora tenga el plan entero, se lo agrego.

Nada de esto frena el trabajo del día a día. Nora sigue en modo entrada pegada y BCAT-0077 sigue esperando tus cuatro pendientes.
