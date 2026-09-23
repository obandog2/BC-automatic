# Importador NPC EC

Pega Code.gs en el proyecto Apps Script correspondiente y ejecuta solamente `importarArchivo_NPC_EC()`.

Configuración incluida: libro `1LeuT_anXkIBu29peIqoSA2XonjolwQVfk5lq1nLUr4Q`, hoja `2026 NPC EC` y correo con asunto `2026 NPC EC`.

Lee CSV, XLS, XLSX o ZIP desde el enlace del correo, agrega filas nuevas A:CO, registra la actualización en CP1 y evita duplicados comparando toda la fila. La hoja técnica oculta se llama `_Control Importaciones NPC EC`.

Si el índice histórico no termina en la primera ejecución, ejecuta exactamente la misma función otra vez. Habilita **Drive API** en Servicios avanzados de Google para procesar Excel.
