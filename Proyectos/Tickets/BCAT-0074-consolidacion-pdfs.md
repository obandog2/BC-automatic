# Ticket BCAT-0074 — Consolidación de PDFs

**Estado:** en código (entregado; pendiente de prueba)
**Solicitante:** pendiente de identificar
**Última actualización:** 2026-09-16

## Objetivo

Leer los enlaces a carpetas de Drive en la columna A de la hoja `Plantilla`, localizar sus PDFs y consolidar su contenido en el Google Doc `1mjd9o4gzIRop7zMAFdophHIqQQL1PUH146JcPQI417E`.

## Decisiones confirmadas

1. La columna A puede contener celdas combinadas; las celdas vacías que no sean el ancla se omiten.
2. Se procesan solamente archivos PDF de cada carpeta.
3. Un PDF con exactamente el mismo nombre se incorpora una sola vez, aunque figure en varias carpetas.
4. En cada ejecución se reconstruye el documento destino con fecha, cantidad y nombres de archivos antes de su contenido.
5. La consolidación se realiza como texto OCR dentro de Google Docs, siguiendo el comportamiento del código base. No es una unión binaria de páginas PDF.

## Entrega

- `BCAT-0074-consolidacion-pdfs/Code.gs`: única función pública `consolidarPDFsEnDoc()` y helpers encapsulados.
- `BCAT-0074-consolidacion-pdfs/README.md`: instalación y limitaciones.

Se necesita habilitar Drive API en Servicios avanzados de Google para usar OCR. La prueba contra las carpetas reales queda pendiente de Gaby.

## Mejora de rendimiento confirmada

El documento destino se reconstruye en cada ejecución para reflejar las carpetas actuales. Sin embargo, el OCR se reutiliza cuando el PDF conserva el mismo ID de Drive, nombre y fecha de modificación. La caché se compone de una carpeta creada en Drive y la hoja oculta `_Control OCR PDFs` dentro del archivo que contiene `Plantilla`. Un PDF modificado se procesa de nuevo; una entrada que ya no aparece en Plantilla deja de mostrarse en el documento final.
