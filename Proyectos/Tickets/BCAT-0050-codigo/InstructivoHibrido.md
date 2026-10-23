# Clasificador híbrido IVD

## Qué hace

El motor mezcla reglas absolutas y puntajes:

1. Si encuentra un medicamento PHARMA explícito, devuelve `PHARMA` inmediatamente.
2. Para todos los demás casos suma puntajes IVD y NO ES IVD y conserva la categoría con mejor evidencia.
3. Señales fuertes como `COBAS`, `ELECSYS`, reactivos de diagnóstico, diálisis o implantes también suman puntos; no cancelan por sí solas la evidencia de la otra categoría.

Por ejemplo, `TISSEEL KIT` suma evidencia IVD fuerte y `PEGAMENTO QUIRÚRGICO` suma evidencia NO ES IVD. La decisión final depende de todos los puntos, incluida la evidencia del diccionario y del comprador.

PHARMA no se activa con términos genéricos aislados como `concentrado`, `solución`, `vial`, `ampolla` o `cápsula`. Debe encontrarse un medicamento específico o una expresión como `medicamento para uso humano`.

La hoja se lee solo de B a T. El resultado se escribe en V. El programa no utiliza la revisión humana de W o Y.

## Instalación

1. Conserva una sola función existente llamada `validarConArchivoControl()`.
2. Crea un archivo nuevo llamado `ClasificadorHibridoIVD2025.gs`.
3. Copia allí el contenido de `ClasificadorHibridoIVD2025.gs`.
4. No pegues simultáneamente el código jerárquico o el ponderado si tienen el mismo nombre de funciones o constantes.
5. Ejecuta `clasificarIVDHibrido2025` desde el selector de Apps Script, sin paréntesis.

## Puntajes para casos no resueltos por reglas absolutas

| Evidencia | Puntos IVD | Puntos NO ES IVD |
| --- | ---: | ---: |
| Término de descripción del diccionario | 4 | 1 |
| Comprador del diccionario | 2 | 3 |
| Partida de diagnóstico | 2 | - |
| Marca IVD | 2 | - |
| Fabricante IVD | 3 | - |
| Señal fuerte | 8 | 5 |

Para clasificar IVD se requieren al menos 4 puntos y una ventaja de al menos 1 punto sobre NO ES IVD. Los valores se pueden ajustar en `CONFIG.pesos`.

## Compradores similares

El comprador no necesita ser idéntico al diccionario. El código primero elimina mayúsculas, tildes, puntuación y expresiones societarias como `S.A.`, `CIA.` o `LTDA.`. Después acepta una coincidencia cuando:

1. Un nombre contiene al otro, como `MEDILABOR S.A.` y `MEDILABOR`.
2. Al menos 80% de las palabras significativas del nombre del diccionario aparecen en el comprador.
3. Los nombres compactados tienen hasta dos caracteres de diferencia y una similitud de al menos 90%.

No usa semejanzas débiles; así evita asociar empresas diferentes por compartir una palabra como `laboratorio` o `salud`.

Cada bloque interno contiene 2 500 filas, pero una ejecución procesa tantos bloques consecutivos como permita un margen seguro de cuatro minutos. Solo si queda trabajo crea una continuación automática por minuto. No necesitas ejecutar manualmente la continuación salvo que el Registro de ejecución muestre un error.

Revisión manual de sintaxis hecha contra el archivo. No lo ejecuté.
