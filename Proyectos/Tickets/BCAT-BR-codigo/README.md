# BCAT-BR — Planes de acción múltiples

## Qué entrega esta versión

- Un botón `Plano de ação` en el correo de confirmación de una no conformidad.
- Una página abierta que recibe el protocolo en la URL y lo muestra bloqueado.
- Una tabla dinámica para registrar uno o más planes en un mismo envío.
- Una hoja `Planos de Ação`, con una fila por cada plan y numeración consecutiva dentro del protocolo.
- Edición del protocolo limitada a correos configurados en `PlanAction.gs`.
- Consolidación de NC internas y proveedores desde el menú `Consolidar`.

## Archivos

- `Code.gs`: cree un archivo Apps Script nuevo llamado `PlanAction.gs` y copie este contenido.
- `ActionPlan.html`: cree un archivo HTML Apps Script llamado `ActionPlan` y copie este contenido.
- `Cambios-en-Code.gs.patch`: aplique sus cambios puntuales en el `Code.gs` general que ya funciona.
- `ConsolidarNCInternas.gs`: cree un archivo Apps Script con este nombre y copie su contenido.
- `Tracking.html`: reemplace el archivo actual por esta versión para ver los planes y su avance.

## Instalación

1. Cree los tres archivos nuevos indicados arriba en el mismo proyecto de Apps Script y reemplace `Tracking.html`.
2. En el `Code.gs` general, agregue la ruta `actionplan` y el botón en el correo, según `Cambios-en-Code.gs.patch`.
3. Confirme que el archivo de control tiene el texto exacto `update` en la celda `B2` de la hoja `update`.
4. Publique una nueva versión de la Web App.

## Consolidación automática y manual

Al guardar uno o más planes, el sistema ejecuta `consolidarTudo()` y reconstruye las pestañas `NC Internas Consolidado` y `NC Fornecedores Consolidado`. La salida contiene una fila por plan, repitiendo los datos de la NC; las NC sin planes se conservan con las columnas de plan vacías.

Al abrir el Spreadsheet, también aparecerá el menú `Consolidar > Consolidar internas e fornecedores` para actualizar ambas pestañas manualmente.

## Estados y plazos

La columna `Status` de `Planos de Ação` permite `Pendente`, `Em andamento`, `Concluído` y `Cancelado`. El seguimiento clasifica los planes activos como `A tempo`, `Próximo a vencer` cuando faltan de uno a cinco días, o `Vencido` si la fecha de entrega ya pasó.

Los protocolos nuevos de proveedores usan un consecutivo diario: `SA-309.1/26`, `SA-309.2/26` y `SA-0110.1/26`.

## Prueba mínima

1. Registre una NC interna y confirme que llega el correo de confirmación.
2. Pulse `Plano de ação`: debe abrirse el formulario con el mismo protocolo, por ejemplo `NC.BR-001`.
3. Agregue dos filas de plan y envíelas.
4. Revise la hoja `Planos de Ação`: deben existir dos filas, ambas con el mismo protocolo, números 1 y 2 y estado `Pendente`.

## Verificación realizada

Revisé manualmente la estructura y delimitadores de los archivos. No ejecuté el código: la prueba real requiere tu cuenta, los permisos de Google Apps Script y la base de datos configurada.

## Propuestas de Samuel (pendientes de tu decisión)

- Incluir una columna de estado de plan en el dashboard.
- Enviar un recordatorio automático cuando se aproxime la fecha de entrega.
