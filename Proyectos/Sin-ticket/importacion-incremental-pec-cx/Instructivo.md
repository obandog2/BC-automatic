# Instructivo — Importación incremental PEC CX Recommendations

## Comportamiento

- La columna `D` es el ID único.
- Si el ID no existe en `PEC_CX Recommendations`, se agrega la fila completa al final.
- Si el ID ya existe, no se sobrescribe ninguna columna salvo `N`, cuya fecha se actualiza con el valor recibido en el CSV.
- Si una fila del CSV no contiene ID en D, se omite.
- Los correos procesados se mueven a la papelera, igual que en el código original.

## Instalación

1. Reemplaza el código anterior por el contenido completo de `Code.gs`.
2. Confirma que el proyecto está vinculado a la hoja de cálculo que contiene `PEC_CX Recommendations`.
3. Ejecuta `importCSVFromEmailAccount` y autoriza Gmail y Google Sheets si se solicita.

## No cambiar

- La hoja `PEC_CX Recommendations`.
- Columna D como ID único.
- Columna N como fecha actualizable.
- El asunto `Reporte`, salvo que también lo cambies en la configuración.
- La hoja `update` ni el valor `update` de B2 del archivo de control.
