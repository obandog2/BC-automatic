# Importador Molecular EC

Pega Code.gs en el proyecto Apps Script correspondiente y ejecuta solamente `importarArchivo_MolecularEC()`.

Configuración incluida: libro `1mzAcwGngRut4o6WjD3GMjy71had0qq5H2-Y6z8AD5c4`, hoja `2026 MOLECULAR EC ` y correo con asunto `2026 MOLECULAR EC`.

Lee CSV, XLS, XLSX o ZIP desde el enlace del correo, agrega filas nuevas A:CO, registra la actualización en CP1 y evita duplicados comparando toda la fila. La hoja técnica oculta se llama `_Control Importaciones Molecular EC`.

Si el índice histórico no termina en la primera ejecución, ejecuta exactamente la misma función otra vez. Habilita **Drive API** en Servicios avanzados de Google para procesar Excel.
