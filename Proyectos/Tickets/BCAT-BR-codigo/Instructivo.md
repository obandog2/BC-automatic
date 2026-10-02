# Instructivo básico del sistema de no conformidades

## Antes de usar el monitor

El monitor consulta únicamente las hojas consolidadas. Antes de buscar una solicitud nueva, usa el menú `Consolidar` y selecciona `Consolidar internas e fornecedores`.

Si no haces esta consolidación, una no conformidad recién creada puede no aparecer todavía en el monitor.

## Hojas que no debes renombrar

Mantén estos nombres exactamente como están:

- `NC Internas`
- `NC Fornecedores`
- `Planos de Ação`
- `NC Internas Consolidado`
- `NC Fornecedores Consolidado`

## Encabezados que no debes modificar

En las hojas de origen, no cambies los títulos de estas columnas:

- `Protocolo`
- `Número do plano`
- `Descrição do plano de ação`
- `Responsável`
- `E-mail responsável`
- `Data de entrega`
- `Status`

El sistema usa esos nombres para relacionar cada plan con su no conformidad. Si cambias un título, el monitor o la consolidación pueden mostrar un error.

## Cómo registrar planes de acción

1. Abre el botón `Plano de ação` desde el correo de confirmación o desde el monitor.
2. Agrega una o más filas de plan.
3. Completa descripción, responsable, correo y fecha de entrega.
4. Envía los planes.

Cada fila queda guardada como un plan diferente para el mismo protocolo.

## Estados de los planes

Actualiza la columna `Status` en la hoja `Planos de Ação` con uno de estos valores:

- `Pendente`
- `Em andamento`
- `Concluído`
- `Cancelado`

El monitor mostrará:

- `A tempo`: faltan más de cinco días.
- `Próximo a vencer`: faltan entre uno y cinco días.
- `Vencido`: la fecha de entrega ya pasó y el plan sigue pendiente o en curso.
- `Concluído` o `Cancelado`: según el estado que actualices.

## Protocolo de proveedores

Los protocolos de proveedores se generan por día y con consecutivo diario. Ejemplo: si entran tres solicitudes el mismo día, se generan `SA-309.1/26`, `SA-309.2/26` y `SA-309.3/26`.
