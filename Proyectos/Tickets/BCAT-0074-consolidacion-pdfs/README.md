# BCAT-0074 — Consolidación de PDFs

Ejecuta únicamente `consolidarPDFsEnDoc()` desde el proyecto Apps Script vinculado a la hoja que contiene `Plantilla`.

La función revisa la columna A desde la fila 2. Acepta enlaces de Drive insertados como hipervínculo, fórmula `HYPERLINK` o URL visible; las celdas vacías, incluyendo las partes no ancla de una celda combinada, se omiten.

Por cada carpeta se toman únicamente PDFs. Si dos archivos tienen exactamente el mismo nombre, se incorpora solo el primero encontrado. El documento destino se reconstruye en cada ejecución con fecha, cantidad, nombres y el texto OCR de los PDFs.

Para evitar repetir OCR, el script crea una carpeta de Drive llamada `BCAT-0074 - Cache OCR PDFs` y una hoja oculta `_Control OCR PDFs`. Si un PDF conserva el mismo ID, nombre y fecha de modificación, se reutiliza su OCR. Los PDFs que ya no figuran en Plantilla dejan de aparecer en el documento final. Si un PDF cambió, se vuelve a procesar y se reemplaza su caché.

Se requiere habilitar **Drive API v2** en Servicios avanzados de Google. La salida es un Google Doc con texto OCR; no conserva el diseño visual ni genera un PDF binario combinado.

## Acceso a Quality Advisor

Pega también Menu.gs en el mismo proyecto Apps Script. Al volver a abrir la hoja aparecerá el menú **Quality Advisor (QA)**. Selecciona **Actualizar PDFs y abrir Quality Advisor**: primero se ejecuta la consolidación y, si termina correctamente, se muestra un botón para abrir la gema.
