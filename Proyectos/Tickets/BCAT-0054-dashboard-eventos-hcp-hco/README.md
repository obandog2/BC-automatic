# BCAT-0054 — Dashboard de Eventos HCP/HCO

Dashboard de Google Apps Script para la hoja `POs HCPs/HCOs 2026` del archivo indicado en el ticket.

## Incluye

- Búsqueda directa por evento, HCP/HCO, proveedor, interacción o PO.
- Filtros de país, tipo de interacción, categoría, centro de costos, moneda y workflow.
- Impacto económico en CHF, valor PO y valor con impuestos.
- Gráficos por categoría, país, tipo de interacción, evento y HCP/HCO/proveedor.
- Seguimiento de POs no enviadas y workflows pendientes.
- Exportación de la selección actual a CSV.

## Instalación

1. Crea un proyecto de Google Apps Script.
2. Copia `Code.gs`, crea el archivo HTML `Index` y copia `Index.html`.
3. Implementa como aplicación web y concede acceso de lectura al spreadsheet fuente.
