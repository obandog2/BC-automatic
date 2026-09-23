# Importador Pathology EC

Pega Code.gs en el proyecto Apps Script correspondiente y ejecuta solamente `importarArchivo_PathologyEC()`.

Configuración incluida: libro `1UDDuP-VYXEhG1Q5RdoYPxmTf4wSy-DP6X8DBF78kveY`, hoja `2026 pathology ec` y correo con asunto `2026 pathology EC`.

Lee CSV, XLS, XLSX o ZIP desde el enlace del correo, agrega filas nuevas A:CO, registra la actualización en CP1 y evita duplicados comparando toda la fila. La hoja técnica oculta se llama `_Control Importaciones Pathology EC`.

Si el índice histórico no termina en la primera ejecución, ejecuta exactamente la misma función otra vez. Habilita **Drive API** en Servicios avanzados de Google para procesar Excel.
