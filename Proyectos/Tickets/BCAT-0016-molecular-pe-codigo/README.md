# Importador Molecular PE

Pega Code.gs en el proyecto de Apps Script y ejecuta solo `importarArchivo_MolecularPE()`.

Lee CSV, XLS, XLSX o ZIP desde el correo con asunto `Molecular PE`. La data debe tener 67 columnas A:BO; el asunto del correo sobrescribe BO1 y BP1 guarda la última actualización. Evita duplicados comparando toda la fila.

La hoja técnica oculta se llama `_Control Importaciones Molecular PE`. Si el índice histórico no termina en la primera ejecución, corre la misma función nuevamente. Activa **Drive API** en Servicios avanzados de Google para procesar Excel.
