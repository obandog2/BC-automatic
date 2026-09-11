# Knowledge Inbox

## Qué es esta carpeta

El Knowledge Inbox es la puerta de entrada para todos los documentos que quieras que Joy procese y agregue al vault. Deja cualquier archivo aquí y después pídele a Joy que lo ingiera.

## Cómo usarla

1. Copia o mueve el documento a esta carpeta.
2. Renómbralo con un slug descriptivo en minúsculas y con la fecha, por ejemplo: `2026-06-notas-reunion-estrategia.md` o `2026-07-paper-investigacion-tema.pdf`.
3. Abre Claude Code y di: "Joy, ingiere el documento nuevo del inbox."
4. Joy lo va a leer, va a escribir un resumen de fuente en `Vault/sources/`, va a crear o actualizar los artículos de concepto relevantes en `Vault/concepts/`, va a actualizar `Vault/_index.md`, y después va a mover el archivo procesado a `Knowledge/Archive/`.

## Tipos de documento soportados

Cualquier archivo que Claude Code pueda leer: `.md`, `.txt`, `.pdf`, y otros formatos basados en texto.

## Importante

- Esta carpeta es un área de espera. Después del ingest, Joy mueve automáticamente el archivo procesado a `Knowledge/Archive/`, que es el registro crudo permanente.
- Los archivos nunca se borran, solo se archivan. Un inbox limpio significa que todo ya fue procesado.
- Si un documento es sensible, considera si de verdad quieres tenerlo en un workspace compartido.

## Convención de nombres de archivo

```
[YYYY-MM-DD]-[slug-descriptivo].[ext]
```

Ejemplos:
- `2026-06-15-notas-arranque-proyecto.md`
- `2026-07-01-reporte-industria-q2.pdf`
- `2026-08-10-retrospectiva-equipo.txt`
