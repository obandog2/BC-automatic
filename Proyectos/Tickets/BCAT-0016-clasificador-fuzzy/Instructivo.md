# Instructivo — Clasificador fuzzy BCAT-0016

## Cambio aplicado

La clasificación y sus reglas se mantienen. La única condición agregada es:

- Si la columna `AB` de una fila está vacía, el script clasifica y puede escribir en `AA`.
- Si `AB` tiene cualquier valor, el script no toca la celda `AA` de esa fila. Esto también preserva valores o fórmulas que ya estén allí.

## Uso

1. Reemplaza el código actual del clasificador por el contenido completo de `Code.gs`.
2. Confirma que la hoja se llama exactamente `Data cobus 2026 PE`.
3. Ejecuta `clasificarDatosFuzzy`.
4. Revisa el registro de ejecución: incluye el total de filas omitidas porque `AB` tenía contenido.

## No cambiar

- Los IDs de los archivos de datos y diccionario, salvo que se migren los archivos.
- El nombre de la hoja de datos ni los nombres de las tres hojas de diccionario.
- La columna `M` (marca), `AA` (clasificación) o `AB` (bloqueo) sin actualizar primero el código.
- La hoja `update` ni el valor `update` de su celda `B2`, requerido para habilitar la ejecución.
