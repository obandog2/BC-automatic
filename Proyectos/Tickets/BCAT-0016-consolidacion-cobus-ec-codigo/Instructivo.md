# Instructivo — Consolidación incremental Cobus EC 2026

## Cambio aplicado

La función `consolidarArchivosEC2026()` ya no borra la hoja `2026`. Conserva las filas existentes y añade únicamente los registros que no se hayan consolidado antes.

En la primera ejecución se crea una hoja técnica oculta llamada `_Control Consolidacion Cobus EC`. Guarda la huella de cada registro consolidado. No la elimines, no la renombres y no la edites manualmente.

## Instalación y ejecución

1. Reemplaza el código anterior por el contenido completo de `Code.gs`.
2. No renombres la hoja destino `2026`.
3. Ejecuta `consolidarArchivosEC2026` desde Apps Script.
4. Autoriza Drive y Google Sheets la primera vez.
5. Si el proceso excede el tiempo de Apps Script, ejecuta la misma función nuevamente; continuará desde el último archivo procesado.

## Reglas importantes

- La columna A de la hoja `2026` conserva el nombre del archivo de origen.
- La celda `U1` registra la fecha y hora de la última consolidación completa.
- Un registro se identifica por el nombre del archivo origen y los 19 valores seleccionados. Dos filas totalmente iguales dentro del mismo archivo se consideran una sola fila.
- Si cambias una fila ya consolidada en el archivo fuente, se agregará como una nueva versión; el script no modifica filas históricas.
- No cambies la lista de `columnasOrigen`, los IDs configurados ni la hoja `update` con `B2 = update` sin revisar el código.
