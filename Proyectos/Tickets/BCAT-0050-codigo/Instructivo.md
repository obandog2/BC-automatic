# Instructivo de uso

## Antes de ejecutar

1. La hoja de datos debe llamarse `2025`.
2. El proceso lee solo hasta la columna T. Usa B, C, D, F, G, H y T; escribe exclusivamente en V (`Clasificación IVD`). No requiere ni modifica W ni columnas posteriores.
3. La revisión humana puede mantenerse en W para comparar resultados; el programa no la lee.
4. Las cuatro hojas de diccionario deben conservar categoría en A y término o entidad en B.
5. La hoja `update` del archivo de control debe conservar `update` en B2.

## Ejecución para más de 50 000 filas

1. Ejecute únicamente `calcularRelevanciaIVD2025()`.
2. El primer lote procesa 2 500 filas y escribe V.
3. El script crea un disparador temporal para continuar cada minuto. No ejecute manualmente `continuarClasificacionIVD2025()` salvo que un disparador falle.
4. Puede cerrar la hoja: las siguientes ejecuciones continúan mientras el proyecto conserve autorización.
5. El Registro de ejecución muestra el rango procesado en cada lote y, al final, los totales de `PHARMA`, `NO ES IVD` e `IVD`.
6. Para reiniciar desde la fila 2, ejecute nuevamente `calcularRelevanciaIVD2025()`. Esto cancela la continuación anterior y vuelve a clasificar todo.

## Lógica de decisión

1. `PHARMA`: medicamentos de uso humano y principios/productos farmacéuticos explícitos.
2. `IVD` fuerte: frases inequívocas como diagnóstico in vitro, reactivos de diagnóstico, analizadores hematológicos/química clínica, COBAS, Accu-Chek, pruebas, calibradores y controles diagnósticos.
3. `NO ES IVD` fuerte: diálisis, dializadores, líneas arterio-venosas, odontología, implantes, catéteres, esterilizadores y otros equipos clínicos no diagnósticos.
4. Casos restantes: se asigna `IVD` con dos o más señales independientes (término del diccionario, partida de diagnóstico, marca, comprador o fabricante IVD); de lo contrario queda como `NO ES IVD`.

Las palabras ambiguas como `tubo`, `medidor`, `equipo`, `laboratorio`, `reactivo` o `kit` no descartan IVD por sí solas. Esto corrige los falsos negativos observados en COBAS, Accu-Chek, reactivos, analizadores y accesorios de laboratorio.

## Correcciones obligatorias al diccionario

En `IrrelevantWordsTraining (M)`, cambie la categoría de estos términos a `PHARMA` o agréguelos si aún no existen:

`ocrevus`, `ocrelizumab`, `hemlibra`, `emicizumab`, `kadcyla`, `trastuzumab emtansina`, `perjeta`, `pertuzumab`, `phesgo`, `avastin`, `bevacizumab`, `herceptin`, `trastuzumab`, `actemra`, `tocilizumab`, `alecensa`, `alectinib`, `zelboraf`, `vemurafenib`, `mabthera`, `rituximab`, `evrysdi`, `risdiplam`, `pulmozyme`, `dornasa alfa`, `vabysmo`, `faricimab`, `tecentriq`, `atezolizumab`, `recormon`, `epoetina beta`, `rozlytrek`, `entrectinib`.

No registre `ROCHE`, `SIMED`, `NIPRO`, hospitales ni clínicas como compradores PHARMA o NO ES IVD absolutos: son entidades híbridas. La descripción del producto debe decidir esos casos.

## Revisión de una fila

Ejecute `diagnosticarFilaIVD2025(numeroFila)`. La función no modifica la hoja y deja en el Registro la regla, coincidencias y criterios aplicados.

Revisión manual de sintaxis hecha contra el archivo. No lo ejecuté.
