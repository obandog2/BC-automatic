# Auditoría del diccionario de clasificación IVD

## Conclusión principal

La lista `KeyWordsDescriptionTraining (M)` no es actualmente un diccionario de evidencia IVD confiable. Mezcla términos clínicos específicos con palabras genéricas, partes de equipos, texto operativo, errores de extracción, insumos transversales y términos farmacéuticos. Al asignar un punto a cada coincidencia, varias palabras genéricas pueden elevar una fila a 100 % sin aportar evidencia independiente.

## Caso revisado: D-dímero HemosIL / Werfen

La fila contiene referencias a determinación de factores sanguíneos, D-dímero, HemosIL y Werfen. Con la lista entregada, el código puede encontrar al menos estos términos IVD: `determinacion`, `grupos`, `sanguineo`, `dimero d` y `hemos`. Cinco coincidencias de descripción alcanzan el máximo de 5 puntos y generan 100 %.

Desde el punto de vista del producto, D-dímero HemosIL de Werfen es normalmente un reactivo o ensayo de coagulación para diagnóstico in vitro. No se recomienda convertir este caso a `NO ES IVD` solo para que coincida con una revisión manual sin primero confirmar la fuente de esa revisión.

## Hallazgos del diccionario

### Términos IVD demasiado genéricos

Se deben quitar de la puntuación IVD o tratar como evidencia de apoyo, no como evidencia suficiente. Ejemplos detectados: `test`, `roche`, `laboratorio`, `determinacion`, `sangre`, `tubo`, `vial`, `punta`, `tip`, `reactiv`, `diagnostico`, `molecular`, `cultiv`, `plasma`, `manual`, `programa`, `material`, `producto`, `muestra`, `control`, `lectura` y variantes similares.

Un término genérico no debe sumar un punto completo. Puede aparecer tanto en IVD como en Pharma, dispositivos médicos, investigación, logística o materiales de laboratorio.

### Compradores IVD no exclusivos

No deben otorgar 1,5 puntos por sí solos: `roche`, `nipro`, `hospital`, `clinica`, `ministerio de salud`, `msp`, `iess`, `solca`, `cruz roja`, `centro de salud`, `dispensario`, `laboratori` y entidades equivalentes. Son organizaciones híbridas o compradoras de múltiples categorías.

Solo deben permanecer como compradores IVD los distribuidores cuya actividad IVD exclusiva haya sido validada por negocio.

### Conflictos entre IVD y NO ES IVD

Se observan familias que aparecen en ambas lógicas o son ambiguas: `pipeta` / `micropipeta`, `cubreobjet`, `biopsia` / `biopsy`, `autoclave`, `incubadora`, `microtomo`, `estufa`, `tubo`, `vial`, `jeringa`, `ampolla` y consumibles generales. Un término no puede funcionar como descarte absoluto y como evidencia IVD al mismo tiempo.

Los términos de descarte absoluto deben representar inequívocamente equipos o productos no diagnósticos, por ejemplo implantes ortopédicos, prótesis, odontología, imagenología y mobiliario.

### Categoría PHARMA ausente

En ambas hojas irrelevantes compartidas solo se entregó la categoría `NO ES IVD`. Por ello el código no puede escribir `PHARMA`: cualquier término farmacéutico se convierte en 0,00 %.

Se debe registrar la categoría `PHARMA` en columna A para términos farmacéuticos confirmados, especialmente nombres de medicamentos y principios activos. Ejemplos que requieren revisión y posible traslado: `trastuzumab`, `rituximab`, `atezolizumab`, `bevacizumab`, `tocilizumab`, `ocrelizumab`, `alectinib`, `ceftriaxona`, `vacuna`, `jarabe`, `tableta` y `capsulas`.

No se deben usar como descarte Pharma aislado términos transversales como `vial`, `jeringa`, `ampolla`, `inyeccion`, `intravenosa` o `concentrado`, porque también pueden aparecer en contextos IVD o de dispositivos.

## Depuración recomendada

1. Crear una copia del diccionario antes de depurarlo.
2. Eliminar de las listas IVD los términos de menos de tres caracteres, texto operativo, nombres genéricos de laboratorio y palabras de embalaje o logística.
3. Dejar en IVD únicamente ensayos, analitos, metodologías, plataformas y reactivos específicos, por ejemplo `dimero d`, `hba1c`, `hbsag`, `pcr`, `elisa`, `hemoglobina glicosilada`, `coagulacion`, `geneexpert` o `elecsys`.
4. Validar uno por uno los compradores IVD. Quitar de esa lista hospitales, instituciones sanitarias y compañías híbridas.
5. Separar los medicamentos confirmados en categoría `PHARMA` y conservar `NO ES IVD` para dispositivos, ortopedia, odontología, mobiliario e imagenología.
6. Eliminar o resolver cada término que aparezca como IVD y como irrelevante.
7. Probar el resultado con una muestra revisada manualmente antes de procesar toda la hoja.

## Ajuste de código recomendado

La siguiente versión del clasificador debe mantener la prioridad `PHARMA` → `NO ES IVD` → IVD, pero debe incorporar una salida de auditoría que indique los términos que produjeron cada decisión. Esa evidencia permitirá revisar falsos positivos antes de cambiar el diccionario o la regla de negocio.
