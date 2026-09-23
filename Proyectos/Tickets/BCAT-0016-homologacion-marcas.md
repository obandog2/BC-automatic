# Ticket BCAT-0016 - Homologación y aprendizaje de marcas

**Estado:** en código (cuatro importadores entregados; pendiente de prueba)
**Solicitante:** pendiente de identificar
**Origen:** código compartido por Gaby
**Última actualización:** 2026-09-16

## Objetivo

Homologar las marcas de la columna H de la pestaña `2026` usando el diccionario `Marcas Homologadas` y reconocer variantes como `Rch` o `Roch` como `ROCHE`. El sistema debe aprender de las correcciones confirmadas y mejorar en ejecuciones posteriores.

## Archivos y estructura recibidos

- Archivo destino: `1iqn2M5Z_iJcM-D9oN95xoV0qVfjjDv8XBHNZ8apCb7Q`.
- Pestaña destino: `2026`.
- Columna de marcas: H.
- Archivo de diccionario: `1fSKIi1za_nTEnQSQSD-tlMT9RDuJs9B2yvXY3DVoy5o`.
- Pestaña de marcas: `Marcas Homologadas`.
- Columna A del diccionario: variante tal como llega en los datos.
- Columna B del diccionario: marca oficial por la que debe homologarse.
- La columna H del archivo destino se sobrescribirá con la marca homologada.

## Revisión de la lógica actual

El enfoque base funciona para equivalencias conocidas, pero todavía no constituye aprendizaje automático:

1. El match exacto solo normaliza mayúsculas y espacios. No elimina tildes, signos, guiones, dobles espacios ni otros cambios frecuentes.
2. El match parcial puede producir falsos positivos porque reemplaza toda la celda cuando encuentra una clave incluida dentro de un texto mayor.
3. La distancia Levenshtein fija en `2` no representa la misma confianza para nombres cortos y largos. Dos cambios en una palabra de cuatro letras son mucho más importantes que dos cambios en una de veinte.
4. Las marcas desconocidas se agregan al diccionario, pero el sistema no guarda la sugerencia, el nivel de confianza, la frecuencia ni una confirmación humana.
5. Una predicción equivocada se escribe directamente sobre la columna H y puede perder el valor original.
6. Si dos alias apuntan a marcas diferentes, el último registro leído reemplaza al anterior sin avisar.

## Arquitectura propuesta

Se propone aprendizaje supervisado y auditable:

1. Normalizar el texto de entrada en memoria: minúsculas, tildes, signos, espacios y variantes de presentación. La columna H se sobrescribirá únicamente cuando exista una homologación segura.
2. Resolver automáticamente coincidencias exactas contra marcas y alias ya confirmados.
3. Para textos no exactos, calcular una confianza combinando similitud proporcional, prefijo y firma consonántica. Esto permitirá reconocer casos como `Rch` y `Roch` cuando exista un único candidato claro.
4. Aplicar automáticamente solo coincidencias de confianza alta y con suficiente diferencia respecto del segundo candidato.
5. Cuando la coincidencia no sea segura, agregar la variante en A de `Marcas Homologadas`, dejar B vacía y pintar de rojo esa fila. La columna H conservará el valor recibido para evitar una homologación falsa.
6. Gaby o el responsable del diccionario completará manualmente B con la marca oficial. Desde la siguiente ejecución, esa relación A → B será una coincidencia confirmada y reutilizable.
7. Evitar duplicar pendientes: una misma variante desconocida aparecerá una sola vez en el diccionario.
8. El aprendizaje aplica únicamente a marcas. La homologación de proveedores queda fuera de esta versión.
9. Cada celda de H contiene una sola marca; no se implementará separación de múltiples marcas.

Este diseño “aprende” porque cada corrección humana se convierte en una regla reutilizable. No necesita un servicio externo de inteligencia artificial ni enviar datos fuera de Google Workspace.

## Plan de implementación propuesto

**Archivo que se crearía después de la luz verde:**

- `Proyectos/Tickets/BCAT-0016-codigo/Code.gs` — versión nueva, separada del código entregado por Gaby.
- `Proyectos/Tickets/BCAT-0016-codigo/README.md` — instalación, estructura del diccionario y prueba controlada.

| Función | Responsabilidad |
|---|---|
| `homologarMarcas()` | Orquestar carga, aprendizaje, homologación y resumen |
| `normalizarMarca_()` | Crear una representación comparable sin modificar el original |
| `crearModeloMarcas_()` | Cargar las relaciones confirmadas A → B y detectar conflictos |
| `clasificarMarca_()` | Devolver marca sugerida, método y confianza |
| `calcularSimilitud_()` | Comparar por distancia proporcional y patrones aprobados |
| `firmaConsonantica_()` | Reconocer abreviaciones por omisión de vocales cuando el resultado sea único |
| `registrarPendientes_()` | Agregar casos dudosos en A, dejar B vacía y pintar la fila de rojo |

## Lo que no se tocará

- El código original compartido por Gaby.
- Los IDs y nombres de hojas recibidos, salvo instrucción posterior.
- La homologación de proveedores; queda fuera del alcance confirmado.
- Las demás columnas de la pestaña `2026`.

## Decisiones confirmadas por Gaby

1. La marca homologada sobrescribe la columna H.
2. El diccionario utiliza A como variante recibida y B como marca oficial.
3. Una coincidencia no segura se agrega al diccionario y su fila se pinta de rojo para revisión.
4. El aprendizaje aplica solamente a marcas.
5. Cada celda contiene una sola marca.

## Supuestos incluidos en el plan

- Una fila roja nueva se crea con la variante en A y B vacía. Completar B equivale a aprobar y enseñar esa relación.
- Una coincidencia dudosa no modifica H en esa ejecución. Se homologará después de que B sea completada y el proceso vuelva a ejecutarse.
- No se usará el color rojo como única fuente de verdad: B vacía significa pendiente y B llena significa relación confirmada.
- Si una variante de A aparece asociada a dos marcas distintas en B, se registrará el conflicto y no se aplicará automáticamente.

## Estado del desarrollo

**Luz verde recibida y código preparado el 2026-09-15.** Se crearon `Code.gs` y `README.md` en `Proyectos/Tickets/BCAT-0016-codigo/`. El código original compartido por Gaby no fue modificado. La sintaxis y los casos puros `Roche`, `Roch`, `Rch` y marca dudosa fueron revisados localmente; la ejecución contra los archivos reales queda pendiente de la prueba de Gaby en Google Apps Script.

**Primera ejecución informada por Gaby:** 38.913 filas revisadas, 38.884 homologadas mediante coincidencia exacta, 12 variantes pendientes con 29 apariciones y 4 variantes en conflicto. Después de esta ejecución se ajustó el código para pintar también de rojo las pendientes preexistentes y todas las filas participantes en conflictos; antes solo se pintaban las pendientes nuevas.

## Segundo alcance: importación mensual desde correo

Gaby incorporó al mismo ticket la corrección de `importarArchivo_CPS_EC()`. La función busca un correo con asunto `2026 CPS EC`, toma un enlace de descarga, procesa un ZIP o Excel y agrega la información mensual a una hoja destino sin copiar el encabezado.

### Problema reproducido

La importación agregó declaraciones HTML como `<!ATTLIST td>` en lugar de la tabla esperada. La causa técnica está en dos decisiones del código actual:

1. Detecta cualquier firma `PK` como ZIP común, aunque los archivos XLSX también son contenedores ZIP.
2. Si no encuentra un CSV/XLS/XLSX dentro del ZIP, utiliza `archivos[0]` sin validar su contenido.
3. La protección contra HTML depende del `Content-Type`, pero un servidor puede entregar HTML como `text/plain`, `application/octet-stream` o con extensión XLS.
4. No se valida la estructura del archivo antes de escribir en la hoja destino.

### Requisitos confirmados

- El archivo llega mediante un enlace incluido en el correo, no como adjunto.
- La primera fila del archivo entrante es un encabezado y no debe copiarse.
- La información válida se agrega al final de la base existente.
- No deben agregarse filas duplicadas.
- La deduplicación será por el contenido completo de la fila.

### Diseño propuesto para duplicados

Cada fila se normalizará de manera estable y se convertirá en una huella SHA-256. Una hoja técnica guardará una huella por fila importada. De esta manera, cada fila entrante se compara contra un `Set` de huellas y no contra todas las celdas de todas las filas.

Para incorporar el histórico ya existente será necesaria una inicialización única que calcule las huellas de las filas actuales. Después, cada importación leerá únicamente las huellas almacenadas y calculará las del archivo nuevo.

Si cambia cualquier valor de una fila, su huella será distinta y se considerará una fila nueva. Este módulo no actualizará versiones anteriores de una fila porque todavía no se ha definido una clave de negocio única.

### Plan de implementación del importador

**Archivos nuevos después de la luz verde específica:**

- `Proyectos/Tickets/BCAT-0016-importacion-codigo/Code.gs` — descarga, detección real de formato, lectura, validación, deduplicación y escritura.
- `Proyectos/Tickets/BCAT-0016-importacion-codigo/README.md` — instalación, inicialización de huellas, recuperación y prueba.

| Función | Responsabilidad |
|---|---|
| `inicializarHuellasExistentes()` | Crear una vez las huellas de la base histórica |
| `importarArchivo_CPS_EC()` | Orquestar una importación segura e idempotente |
| `obtenerDescargaDesdeCorreo_()` | Seleccionar y decodificar el enlace correcto |
| `detectarFormatoReal_()` | Diferenciar ZIP, XLSX, XLS, CSV y HTML por contenido |
| `extraerArchivoValidoDeZip_()` | Aceptar solo un archivo de datos compatible dentro del ZIP |
| `leerArchivoTabular_()` | Convertir el archivo y devolver una matriz normalizada |
| `validarDatosAntesDePegar_()` | Rechazar HTML y estructuras incompatibles antes de escribir |
| `calcularHuellaFila_()` | Crear la huella estable de una fila completa |
| `filtrarDuplicados_()` | Separar filas nuevas y duplicadas usando un `Set` de huellas |

### Protección propuesta

- Un XLSX se procesará como Excel sin descomprimir sus XML internos.
- Un ZIP sin CSV/XLS/XLSX válido generará error; nunca se usará el primer archivo arbitrariamente.
- Se revisará la firma y el contenido inicial para rechazar HTML aunque el MIME sea incorrecto.
- No se escribirá ninguna fila hasta que todo el archivo haya sido leído y validado.
- El correo solo se moverá a la papelera después de una importación completa y exitosa.
- Los IDs existentes no se cambiarán sin confirmación expresa de Gaby.

### Decisiones confirmadas para el importador

1. Se conserva el ID productivo del código original: `18owZa7X4dh1keiH-0t0iKyJkHUh6VeX3QcgBAvEHcS4`.
2. La data ocupa exactamente A:CN, equivalente a 92 columnas.
3. CO1 guardará la fecha y hora de la última actualización.
4. La primera fila del archivo entrante se descarta y no se agrega como encabezado.
5. La deduplicación compara las 92 columnas de la fila.
6. Si cualquier valor cambia, la huella cambia y la fila se considera nueva.
7. El índice de huellas se construirá por bloques para limitar el uso de memoria; las ejecuciones normales leerán solo la columna de huellas.
8. No se guarda el asunto del correo; `CO1` queda reservado para la fecha de actualización y ningún encabezado de A:CN será sobrescrito.
9. Cada lote se escribirá desde la primera fila libre posterior a los datos existentes.
10. La descarga puede ser ZIP, CSV, XLS o XLSX según el volumen del mes. El formato se detectará por firma y contenido, no únicamente por nombre o `Content-Type`.

### Flujo técnico aprobado para presentar a luz verde

1. Buscar el correo más reciente con asunto `2026 CPS EC`.
2. Extraer los enlaces reales de los atributos `href`, desenvolver Microsoft Safe Links y descartar imágenes, firmas y redes sociales.
3. Probar los enlaces candidatos hasta encontrar una descarga válida; exigir respuesta HTTP correcta.
4. Si la firma `PK` corresponde a un XLSX, conservar el blob completo. Si es un ZIP común, extraer sus archivos tabulares válidos. Nunca usar `archivos[0]` como alternativa.
5. Rechazar HTML, páginas de autenticación y archivos sin estructura tabular antes de escribir.
6. Leer CSV, XLS o XLSX; descartar siempre la primera fila de encabezados y exigir 92 columnas A:CN.
7. Calcular la huella de cada fila normalizando fechas, números, vacíos y texto. Comparar contra el índice histórico y contra las filas del mismo lote.
8. Agregar únicamente las filas nuevas después de la última fila con datos.
9. Guardar las huellas nuevas, actualizar `CO1` y mover el correo a la papelera solo después de completar correctamente el proceso.
10. Si todas las filas son duplicadas, no agregar datos; registrar el resultado, actualizar `CO1` y considerar el correo procesado correctamente.

### Supuestos para aprobación

- Si un ZIP contiene varios archivos CSV/XLS/XLSX, se procesarán todos y la deduplicación evitará repetir filas entre ellos.
- Un archivo HTML no forma parte de los formatos válidos, aunque tenga extensión `.xls`; se rechazará para evitar repetir la contaminación observada.
- Antes de inicializar las huellas históricas deben retirarse las filas HTML/XML que ya fueron agregadas por la ejecución defectuosa.
- La hoja técnica de huellas se creará dentro del archivo destino y permanecerá oculta.

El enlace compartido requiere una sesión corporativa y no pudo inspeccionarse desde el entorno de Samuel. Las definiciones funcionales quedaron cerradas y el módulo de importación se entregó después de recibir luz verde de Gaby.

### Entrega del módulo de importación

**Código preparado el 2026-09-16.** Se crearon `Code.gs` y `README.md` en `Proyectos/Tickets/BCAT-0016-importacion-codigo/`. El módulo conserva el ID original, no guarda el asunto, exige 92 columnas A:CN y usa CO1 como fecha de actualización. Después de la primera prueba, Gaby pidió que todo el uso quede centralizado en `importarArchivo_CPS_EC()`; esa función reconstruye automáticamente el índice de huellas con el ancho correcto cuando sea necesario. La sintaxis y reglas puras de deduplicación, CSV, HTML y ancho de datos se revisaron localmente. La ejecución real queda pendiente de prueba por Gaby en Google Apps Script.

## Tercer alcance: importadores Molecular, Patología y NPC

Gaby entregó las tres funciones originales y pidió actualizar cada una con el mismo comportamiento seguro de CPS, sin cambiar los nombres, IDs, rutas ni hojas de destino.

| Módulo | Función que se conserva | ID destino | Hoja destino | Asunto de correo |
|---|---|---|---|---|
| Molecular | `importarArchivo_MolecularEC()` | `1mzAcwGngRut4o6WjD3GMjy71had0qq5H2-Y6z8AD5c4` | `2026 MOLECULAR EC ` | `2026 MOLECULAR EC` |
| Patología | `importarArchivo_PathologyEC()` | `1UDDuP-VYXEhG1Q5RdoYPxmTf4wSy-DP6X8DBF78kveY` | `2026 pathology ec` | `2026 pathology EC` |
| NPC | `importarArchivo_NPC_EC()` | `1LeuT_anXkIBu29peIqoSA2XonjolwQVfk5lq1nLUr4Q` | `2026 NPC EC` | `2026 NPC EC` |

### Configuración confirmada

1. En los tres módulos, la data ocupa A:CO, equivalente a 93 columnas.
2. CP1 se reserva para fecha y hora de última actualización.
3. No se guardará el asunto del correo en CO1 porque CO pertenece a la data.
4. La primera fila de cada archivo entrante se descarta como encabezado.
5. Los formatos permitidos son ZIP, CSV, XLS y XLSX.
6. La deduplicación compara la fila completa de 93 columnas; una modificación en cualquier campo se considera una fila nueva.
7. Cada función será autónoma y encapsulará su configuración y helpers internos. La única función que Gaby deberá ejecutar será la que ya usa para su módulo.

### Plan de implementación propuesto

**Archivos nuevos después de la luz verde:**

- `Proyectos/Tickets/BCAT-0016-molecular-codigo/Code.gs` — importador encapsulado de Molecular.
- `Proyectos/Tickets/BCAT-0016-pathology-codigo/Code.gs` — importador encapsulado de Patología.
- `Proyectos/Tickets/BCAT-0016-npc-codigo/Code.gs` — importador encapsulado de NPC.
- Un `README.md` en cada carpeta con instalación y prueba.

Cada importador:

1. Reconstruirá automáticamente su índice de huellas si es la primera ejecución o cambia el formato del índice.
2. Distinguirá XLSX de ZIP real, aceptará archivos tabulares válidos y rechazará HTML antes de escribir.
3. Agregará únicamente filas no duplicadas después de la última fila existente.
4. Actualizará CP1 y enviará el mensaje a la papelera solo al completar con éxito.

### Entrega: cuatro importadores encapsulados

**Luz verde recibida y código preparado el 2026-09-16.** Se entregaron los módulos de CPS, Molecular, Pathology y NPC. Cada archivo tiene una única función pública y encapsula su configuración y helpers internos; no se modificaron los IDs, hojas ni nombres de función confirmados.

| Módulo | Carpeta | Función que se ejecuta |
|---|---|---|
| CPS | `BCAT-0016-importacion-codigo` | `importarArchivo_CPS_EC()` |
| Molecular | `BCAT-0016-molecular-codigo` | `importarArchivo_MolecularEC()` |
| Pathology | `BCAT-0016-pathology-codigo` | `importarArchivo_PathologyEC()` |
| NPC | `BCAT-0016-npc-codigo` | `importarArchivo_NPC_EC()` |

En cada proyecto se debe habilitar Drive API en Servicios avanzados de Google. La primera ejecución puede dedicar tiempo a crear el índice técnico de huellas; si el log pide continuar, se vuelve a ejecutar la misma función. La validación funcional contra los tres correos nuevos sigue pendiente de Gaby en Apps Script.

## Cuarto alcance: importadores Perú

**Código preparado el 2026-09-16.** Se crearon cuatro importadores encapsulados para Perú, con los nombres de función, archivos y hojas confirmados. Los cuatro validan A:BO (67 columnas), deduplican por la fila completa, escriben el asunto del correo en BO1 y la fecha de última actualización en BP1. Esta decisión sobrescribe intencionalmente BO1, confirmada por Gaby.

| Módulo | Carpeta | Función |
|---|---|---|
| CPS PE | `BCAT-0016-cps-pe-codigo` | `importarArchivo_CPS_PE()` |
| Molecular PE | `BCAT-0016-molecular-pe-codigo` | `importarArchivo_MolecularPE()` |
| Pathology PE | `BCAT-0016-pathology-pe-codigo` | `importarArchivo_PathologyPE()` |
| NPC PE | `BCAT-0016-npc-pe-codigo` | `importarArchivo_NPC_PE()` |
