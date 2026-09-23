# BCAT-0016 — homologación y aprendizaje de marcas

## Instalación

1. Abra el proyecto de Apps Script donde actualmente ejecuta `homologarMarcas()`.
2. Cree un archivo nuevo llamado `MarcasV2.gs`.
3. Copie allí el contenido de `Code.gs` de esta carpeta.
4. Para evitar nombres duplicados, cambie temporalmente el nombre de la función antigua `homologarMarcas()` o guarde el código anterior fuera del proyecto.
5. Guarde el proyecto.

Esta versión utiliza únicamente estos archivos y hojas:

- Destino: archivo `1iqn2M5Z_iJcM-D9oN95xoV0qVfjjDv8XBHNZ8apCb7Q`, pestaña `2026`, columna H.
- Diccionario: archivo `1fSKIi1za_nTEnQSQSD-tlMT9RDuJs9B2yvXY3DVoy5o`, pestaña `Marcas Homologadas`.
- Diccionario A: variante recibida.
- Diccionario B: marca oficial confirmada.

La versión no procesa proveedores.

## Funcionamiento

Al ejecutar `homologarMarcas()`:

1. Las relaciones confirmadas A → B se cargan como conocimiento disponible.
2. Una coincidencia exacta, por prefijo, por firma consonántica única o por similitud alta sobrescribe H con la marca oficial de B.
3. Una coincidencia dudosa no modifica H.
4. La variante dudosa se agrega una sola vez al final del diccionario, en A; B queda vacía y A:B se pinta de rojo. Las pendientes que ya existían también se marcan en rojo.
5. Cuando una persona complete B, la siguiente ejecución utilizará esa relación y quitará el rojo de A:B.
6. Si una misma variante de A apunta a dos marcas oficiales distintas, ambas filas se marcan en rojo y esa variante no se aplica hasta corregir el conflicto.

Ejemplos esperados cuando `ROCHE` ya existe como marca oficial:

- `Roch` puede reconocerse por prefijo único.
- `Rch` puede reconocerse por firma consonántica única.
- Si dos marcas pudieran producir el mismo patrón, el sistema no decide: registra el valor para revisión.

## Prueba controlada

Antes de usarlo sobre todos los datos productivos:

1. Conserve una copia de respaldo de la pestaña `2026`.
2. Agregue al diccionario una relación confirmada, por ejemplo A `Roche` y B `ROCHE`.
3. Coloque en unas filas de prueba de H: `Roche`, `Roch`, `Rch` y una marca inexistente.
4. Ejecute `homologarMarcas()`.
5. Verifique que las coincidencias seguras cambien a `ROCHE`.
6. Verifique que la marca desconocida conserve su valor en H y aparezca al final del diccionario con B vacía y color rojo.
7. Complete B para esa marca y vuelva a ejecutar. Confirme que H se homologue y que el rojo desaparezca.

## Registros

Los registros aparecen una sola vez y usan mensajes directos, por ejemplo:

```text
[MARCAS] PENDIENTE: se agregó una marca al diccionario para revisión. | marcaRecibida: Ejemplo | sugerencia: EJEMPLO OFICIAL | confianza: 75%
[MARCAS] Homologación terminada. | filasRevisadas: 100 | homologadas: 94 | pendientesNuevas: 3
```

Los valores de confianza están agrupados al inicio de `Code.gs` para poder ajustarlos después de la prueba real.
