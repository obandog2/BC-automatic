# Instructivo — Consolidación incremental Cobus PE

## Qué cambia

La función `consolidarArchivosPE()` ya no limpia la hoja destino. Conserva las filas existentes y agrega solo los registros que no estén registrados previamente.

En la primera ejecución se crea una hoja técnica oculta llamada `_Control Consolidacion Cobus PE`. Esta hoja guarda una huella de cada registro para evitar duplicados. No la elimines, no cambies su nombre y no la edites manualmente.

## Antes de ejecutar

1. Pega todo el contenido de `Code.gs` en el archivo `.gs` del proyecto que ejecuta la consolidación.
2. Mantén accesibles la carpeta fuente y el archivo destino configurados en el código.
3. No renombres la hoja destino `Data cobus 2026 PE`.
4. La primera pestaña visible de cada archivo fuente debe contener las columnas configuradas. No cambies la lista `columnasOrigen` sin revisar el proceso.
5. En el archivo de control, la hoja `update` debe tener `update` en la celda `B2`; en caso contrario la función se detiene sin modificar datos.

## Cómo ejecutar

1. En Apps Script, selecciona la función `consolidarArchivosPE`.
2. Haz clic en **Ejecutar**.
3. La primera vez, autoriza los permisos solicitados para Drive y Google Sheets.
4. Si el registro histórico o la consolidación supera el tiempo máximo de Apps Script, vuelve a ejecutar la misma función. Continuará automáticamente desde donde quedó.

## Reglas importantes

- No borra filas ni encabezados de `Data cobus 2026 PE`.
- La columna A sigue indicando el nombre del archivo de origen.
- La celda `AA1` se actualiza al completar todos los archivos.
- Un registro se considera repetido cuando coinciden el nombre del archivo de origen y los 25 valores seleccionados. Por ello, dos filas totalmente idénticas dentro del mismo archivo se consolidan una sola vez.
- Si se modifica una fila ya consolidada en el archivo fuente, se considera una nueva versión y se agregará como una fila adicional.
