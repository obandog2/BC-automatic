# Instructivo — Llamar `general2026PE()` desde otro proyecto

## Proyecto que contiene la función

El proyecto origen es el que contiene `general2026PE()` y corresponde al identificador que aparece en esta URL:

`1RXaUnnes1VgDUlmf_jyPg0BVV17LkXgYDl0jymdh46fUIrjSjrX5KA-P`

1. Abre ese proyecto en Apps Script.
2. Confirma que `general2026PE` está declarada como una función global: `function general2026PE() { ... }`. No debe quedar encerrada dentro de un objeto, una clase o una función autoejecutable.
3. Ve a **Implementar** > **Nueva implementación**.
4. En el tipo de implementación, selecciona **Biblioteca**.
5. Crea una versión y publícala. Cada cambio posterior que quieras usar desde otros proyectos requiere crear una nueva versión de la biblioteca.

## Proyecto que hará la llamada

El proyecto llamador es el de esta URL:

`1-Mr-nmZuX9lbi-FVFdcqJwU3azfTcexDqEHvdTGOqeMzrmA-TLrNiLyP`

1. Abre el proyecto llamador.
2. En el panel izquierdo, junto a **Bibliotecas**, haz clic en **+**.
3. Pega el identificador del proyecto origen indicado arriba y pulsa **Buscar**.
4. Selecciona la versión publicada y configura el identificador como `General2026PE`.
5. Guarda la biblioteca.
6. Crea o reemplaza una función en un archivo `.gs` con el contenido de `Code.gs`.
7. Ejecuta `ejecutarGeneral2026PE()` desde el selector de funciones.

## Importante

- El proyecto que ejecuta la función consume sus propios permisos y cuota de ejecución.
- Ambos proyectos deben ser accesibles para tu misma cuenta o para la cuenta que ejecute el proceso.
- Si no aparece el tipo **Biblioteca**, revisa que tengas permisos de editor del proyecto origen y que estés usando Apps Script en una cuenta autorizada por Roche.
- No cambies el identificador `General2026PE` en el código a menos que también cambies el identificador configurado al agregar la biblioteca.
