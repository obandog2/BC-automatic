# Mejora del Dashboard Business Center

## Por qué el ahorro podía diferir

El cálculo anterior usaba `parseFloat()` después de reemplazar solo la primera coma. Esto puede leer incorrectamente valores con separadores de miles, símbolos o sufijos. Además, solo sumaba valores mayores que cero, por lo que no reproducía exactamente una suma de Sheets cuando existían ajustes negativos. El caché podía conservar el cálculo anterior y el KPI de automatizaciones ignoraba los filtros activos.

## Cambios de backend

1. Sustituye `getSavingsData_()` por el contenido de `SavingsEngine.gs`, incluyendo `parseHoursValue_()` y `normalizeText_()`.
2. Conserva en `ssId` el ID privado que ya utiliza el proyecto.
3. Cambia el inicio de `updateDashboardData()` de:

```javascript
const { savingsMap, totalBrutoAuto, areaSavingsAuto } = getSavingsData_();
```

a:

```javascript
const {
  savingsMap,
  totalBrutoAuto,
  areaSavingsAuto,
  savingsAudit
} = getSavingsData_();
```

4. Agrega esta propiedad al `payload`:

```javascript
savingsAudit: savingsAudit,
```

## Cambios de frontend

1. Copia las tres secciones indicadas en `DashboardSavings.html` dentro del HTML actual.
2. En `renderDashboard()`, inmediatamente después de construir `uniqueSavings`, usa:

```javascript
const filtersActive = hasActiveFilters();

if (currentView === 'automatizaciones' && !filtersActive) {
  totalSavings = Number(db.totalAhorroDirectoAuto) || 0;
} else {
  totalSavings = Object.values(uniqueSavings).reduce((sum, value) => sum + Number(value || 0), 0);
}

renderSavingsInsights(totalSavings, filtersActive);
```

3. En la sección que dibuja la gráfica de ahorro de automatizaciones, reemplaza:

```javascript
drawBarSavingsAuto(db.areaSavingsAuto);
```

por:

```javascript
if (filtersActive) {
  drawSavingsChart(data, uniqueSavings);
} else {
  drawBarSavingsAuto(db.areaSavingsAuto);
}
```

4. Cambia el texto del KPI a `Ahorro semanal exacto (Hrs)`.

## Verificación

1. Ejecuta `updateDashboardData()` manualmente para regenerar el caché.
2. Opcionalmente ejecuta `testSavingsParser_()` para validar los formatos numéricos.
3. Abre el archivo `BC_DASHBOARD_CACHE.json` y revisa `savingsAudit.automatizaciones`.
4. Confirma que `totalFuente` coincide con `SUM(K:K)` en la pestaña `automatizacion`.
5. Si `filasInvalidas` es mayor que cero, revisa las filas indicadas en `muestrasInvalidas`.
6. Publica una nueva versión de la Web App y prueba primero sin filtros.
