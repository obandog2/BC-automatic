/**
 * REEMPLAZO COMPLETO de getSavingsData_().
 * Mantén en ssId el ID que ya utiliza tu proyecto; no lo publiques.
 */
function getSavingsData_() {
  const savingsMap = {};
  const PRECISION = 1000000;
  let totalAutoUnits = 0;
  const areaUnits = {};
  const audit = {
    automatizaciones: {
      filasConValor: 0,
      filasLeidas: 0,
      filasInvalidas: 0,
      filasNegativas: 0,
      idsDuplicados: 0,
      totalFuente: 0,
      muestrasInvalidas: []
    }
  };

  try {
    const ssId = 'ID_DE_TU_HISTORICO_BC';
    const ss = SpreadsheetApp.openById(ssId);

    ss.getSheets().forEach(function(sheet) {
      const sheetName = normalizeText_(sheet.getName());
      const isAuto = sheetName === 'automatizacion';
      const isOrder = sheetName === 'ordenes de compra';
      const isEvent = sheetName === 'eventos internos';
      if (!isAuto && !isOrder && !isEvent) return;

      const range = sheet.getDataRange();
      const values = range.getValues();
      const displayValues = range.getDisplayValues();
      if (values.length < 2) return;

      const columns = isAuto
        ? { id: 0, year: 2, month: 3, country: 6, area: 8, savings: 10 }
        : isOrder
          ? { id: 3, year: 0, month: 1, country: 2, area: 5, savings: 6 }
          : { id: 3, year: 0, month: 1, country: 2, area: 6, savings: 12 };

      for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex];
        const displayRow = displayValues[rowIndex];
        const rawValue = row[columns.savings];
        const displayedValue = displayRow[columns.savings];
        const hasValue = rawValue !== '' && rawValue !== null &&
          String(displayedValue == null ? '' : displayedValue).trim() !== '';
        const hours = parseHoursValue_(rawValue, displayedValue);
        const rawId = String(row[columns.id] || '')
          .trim().toLowerCase().replace(/\.0$/, '');

        if (isAuto && hasValue) {
          audit.automatizaciones.filasConValor++;
          if (hours === null) {
            audit.automatizaciones.filasInvalidas++;
            if (audit.automatizaciones.muestrasInvalidas.length < 8) {
              audit.automatizaciones.muestrasInvalidas.push({
                fila: rowIndex + 1,
                valor: String(displayedValue || rawValue)
              });
            }
          } else {
            audit.automatizaciones.filasLeidas++;
            if (hours < 0) audit.automatizaciones.filasNegativas++;
            const units = Math.round(hours * PRECISION);
            totalAutoUnits += units;

            let area = String(row[columns.area] || '').trim();
            if (!area || area === '0') area = 'Sin Especificar';
            areaUnits[area] = (areaUnits[area] || 0) + units;
          }
        }

        if (rawId && hours !== null && hours !== 0) {
          if (isAuto && savingsMap[rawId]) audit.automatizaciones.idsDuplicados++;
          savingsMap[rawId] = {
            value: hours,
            area: String(row[columns.area] || '').trim(),
            year: String(row[columns.year] || '').trim(),
            month: String(row[columns.month] || '').trim(),
            pais: String(row[columns.country] || '').trim()
          };
        }
      }
    });
  } catch (error) {
    audit.error = error.message;
    console.error('Error leyendo datos del Histórico BC: ' + error.message);
  }

  const areaSavingsAuto = {};
  Object.keys(areaUnits).forEach(function(area) {
    areaSavingsAuto[area] = areaUnits[area] / PRECISION;
  });

  const totalBrutoAuto = totalAutoUnits / PRECISION;
  audit.automatizaciones.totalFuente = totalBrutoAuto;
  audit.automatizaciones.cuadra = audit.automatizaciones.filasInvalidas === 0;

  return {
    savingsMap: savingsMap,
    totalBrutoAuto: totalBrutoAuto,
    areaSavingsAuto: areaSavingsAuto,
    savingsAudit: audit
  };
}

/**
 * Usa el número real de Sheets cuando existe. Para textos acepta 1,5; 1.5;
 * 1.234,56; 1,234.56; símbolos y sufijos como "hrs".
 * @return {number|null}
 */
function parseHoursValue_(rawValue, displayValue) {
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  let text = String(displayValue == null ? rawValue : displayValue).trim();
  if (!text) return null;
  text = text.replace(/\s/g, '').replace(/[^0-9,\.\-+]/g, '');
  if (!text || !/[0-9]/.test(text)) return null;

  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    if (comma > dot) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (comma >= 0) {
    text = text.replace(',', '.');
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function normalizeText_(value) {
  return String(value || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function testSavingsParser_() {
  const cases = [
    [43.41, '43,41', 43.41],
    ['', '43,41 hrs', 43.41],
    ['', '1.234,56', 1234.56],
    ['', '1,234.56', 1234.56],
    ['', '-0,75', -0.75]
  ];
  cases.forEach(function(item) {
    const result = parseHoursValue_(item[0], item[1]);
    if (Math.abs(result - item[2]) > 0.000001) {
      throw new Error('Falha no parser para ' + item[1] + ': ' + result);
    }
  });
  console.log('Parser de horas validado corretamente.');
}
