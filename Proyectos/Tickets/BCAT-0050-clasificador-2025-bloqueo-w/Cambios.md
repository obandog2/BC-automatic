# Cambio puntual — No sobrescribir V cuando W tiene contenido

Este ajuste conserva toda la lógica de clasificación. Solo evita escribir en la columna `V` en filas cuyo valor de `W` no esté vacío.

## 1. Agregar la columna de bloqueo en `C`

Dentro de `const C = Object.freeze({ ... })`, ubica esta línea:

```javascript
columnaSalida: 22,
```

Reemplázala por:

```javascript
columnaSalida: 22,
columnaBloqueo: 23,
```

## 2. Reemplazar por completo `procesar_()`

```javascript
function procesar_() {
  let bloqueo;
  try {
    bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(30000);
    const props = PropertiesService.getScriptProperties();
    let cursor = Number(props.getProperty(C.propiedades.cursor));
    const ultima = Number(props.getProperty(C.propiedades.ultimaFila));
    if (!cursor || cursor > ultima) return finalizar_();

    const reglas = cargarReglas_();
    const hoja = obtenerHojaDestino_();
    const conteos = leerConteos_();
    const inicio = Date.now();
    const primeraProcesada = cursor;

    while (cursor <= ultima && Date.now() - inicio < C.maxMilisegundos) {
      const hasta = Math.min(cursor + C.filasPorLote - 1, ultima);
      const cantidad = hasta - cursor + 1;
      const filas = hoja.getRange(cursor, C.columnaInicial, cantidad, C.columnasLectura).getDisplayValues();
      const valoresW = hoja.getRange(cursor, C.columnaBloqueo, cantidad, 1).getDisplayValues();
      const detalles = filas.map(function(fila, indice) {
        if (String(valoresW[indice][0] == null ? '' : valoresW[indice][0]).trim() !== '') return null;
        return evaluar_(fila, reglas);
      });

      guardarResultadosEnV_(hoja, cursor, detalles);
      detalles.forEach(function(detalle) {
        if (detalle) conteos[detalle.resultado]++;
        else conteos['OMITIDAS W']++;
      });
      cursor = hasta + 1;
      props.setProperty(C.propiedades.cursor, String(cursor));
    }

    props.setProperty(C.propiedades.conteos, JSON.stringify(conteos));
    Logger.log(C.prefijo + ' Lote procesado. | filas: ' + primeraProcesada + '-' + (cursor - 1));
    if (cursor > ultima) return finalizar_();
    programarContinuacion_();
    return { estado: 'EN PROCESO', desdeFila: primeraProcesada, hastaFila: cursor - 1, siguienteFila: cursor };
  } catch (error) {
    Logger.log(C.prefijo + ' ERROR. | ' + error.message);
    throw error;
  } finally {
    if (bloqueo && bloqueo.hasLock()) bloqueo.releaseLock();
  }
}
```

## 3. Agregar esta función debajo de `procesar_()`

```javascript
function guardarResultadosEnV_(hoja, primeraFila, detalles) {
  let primerIndiceLote = null;
  let valoresLote = [];

  function guardarLote_() {
    if (!valoresLote.length) return;
    hoja.getRange(
      primeraFila + primerIndiceLote,
      C.columnaSalida,
      valoresLote.length,
      1
    ).setValues(valoresLote).setNumberFormat('@');
    primerIndiceLote = null;
    valoresLote = [];
  }

  detalles.forEach(function(detalle, indice) {
    if (!detalle) {
      guardarLote_();
      return;
    }
    if (primerIndiceLote === null) primerIndiceLote = indice;
    valoresLote.push([detalle.resultado]);
  });
  guardarLote_();
}
```

## 4. Reemplazar `leerConteos_()`

```javascript
function leerConteos_() {
  const iniciales = { IVD: 0, 'NO ES IVD': 0, PHARMA: 0, 'OMITIDAS W': 0 };
  const guardados = JSON.parse(
    PropertiesService.getScriptProperties().getProperty(C.propiedades.conteos) || '{}'
  );
  return Object.assign(iniciales, guardados);
}
```

## Resultado esperado

- `W` vacía: se calcula la clasificación y puede actualizarse `V`.
- `W` con texto, número o fórmula con resultado visible: `V` no se escribe y se conserva exactamente como está.
- Las reglas IVD, NO ES IVD y PHARMA no se modifican.
