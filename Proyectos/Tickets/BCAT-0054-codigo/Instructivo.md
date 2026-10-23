# Instructivo — BCAT-0054 Dashboard de Eventos HCP/HCO

## Uso básico

1. Abra la aplicación web del dashboard.
2. Busque por evento, HCP/HCO, proveedor, interacción o número de PO.
3. Escriba en los filtros de país, tipo de interacción, categoría o centro de costos; el sistema sugerirá valores existentes.
4. Seleccione la moneda de análisis: `Dólares (USD)` o `Francos suizos (CHF)`.
5. Use `Exportar CSV` para descargar solo los resultados visibles.

## Conversión a dólares

- Cuando la columna K `Moneda` es `USD`, el dashboard toma directamente el valor de la columna J `valor con impuestos`.
- Cuando la columna K `Moneda` es `PEN`, convierte la columna J `valor con impuestos` a dólares usando la tasa configurada en `Code.gs`: `PEN_POR_USD: 3.75` (1 USD = 3.75 PEN).
- Si se requiere otra tasa, cambie únicamente el valor `PEN_POR_USD` en `Code.gs` y vuelva a desplegar la aplicación web. Los registros con otra moneda no se suman al impacto total USD.

## No modificar

- No renombrar ni borrar la hoja `POs HCPs/HCOs 2026`.
- No mover, renombrar ni borrar los encabezados de la fila 1. El dashboard depende, entre otros, de: columna A `País`, columna B `N Interacción`, columna C `Nombre del evento`, columna D `HCP/HCO/PROVEEDOR`, columna E `Centro de costos`, columna G `Tipo de interacción`, columna H `Categoría`, columna I `Valor PO`, columna J `valor con impuestos`, columna K `Moneda`, columna L `Valor en CHF` y columna M `# PO`.
- Puede agregar nuevos registros debajo de los existentes, sin insertar filas dentro de los encabezados.
- No renombrar ni borrar la hoja `update` ni cambiar la celda `B2` del archivo de control. La celda debe contener exactamente `update` para que el dashboard funcione.
