# Instructivo — Orquestador PE, EC y Dashboard

## Dónde colocar el código

Pega el contenido de `Code.gs` en el proyecto que contiene la función local `REPARAR_DASHBOARD()`:

`1-Mr-nmZuX9lbi-FVFdcqJwU3azfTcexDqEHvdTGOqeMzrmA-TLrNiLyP`

No reemplaces la función `REPARAR_DASHBOARD()` existente.

## Configurar la biblioteca de Perú

1. Abre el proyecto de Perú: `1RXaUnnes1VgDUlmf_jyPg0BVV17LkXgYDl0jymdh46fUIrjSjrX5KA-P`.
2. Publica una versión como **Biblioteca**.
3. En el proyecto del dashboard, junto a **Bibliotecas**, pulsa **+**.
4. Agrega el ID de Perú, selecciona la versión publicada y usa exactamente el identificador `General2026PE`.

## Configurar la biblioteca de Ecuador

1. Abre el proyecto de Ecuador: `1YGyzzP9NuAfTC6H9_ujtJFgWbzFcqg7fdYDBjqtqvXyESy8Mx_KWH4QV`.
2. Publica una versión como **Biblioteca**.
3. En el proyecto del dashboard, agrega el ID de Ecuador como biblioteca, selecciona la versión publicada y usa exactamente el identificador `General2026EC`.

## Requisito en los proyectos de Perú y Ecuador

Las funciones deben estar declaradas de forma global:

- `function general2026PE() { ... }`
- `function general2026EC() { ... }`

No pueden estar dentro de una función, clase, objeto o bloque autoejecutable.

## Ejecutar

1. En el proyecto del dashboard, selecciona `ejecutarActualizacionPE_EC_Dashboard`.
2. Haz clic en **Ejecutar**.
3. Autoriza los permisos solicitados en la primera ejecución.
4. Revisa el registro: primero se procesa Perú, luego Ecuador y al final el dashboard.

Si Perú o Ecuador genera un error, el proceso se detiene y no ejecuta los pasos posteriores. Esto evita reparar el dashboard con datos incompletos.

## No cambiar

- Los identificadores de biblioteca `General2026PE` y `General2026EC` sin modificar también el código.
- El nombre de la función local `REPARAR_DASHBOARD()`.
- La hoja `update` ni el valor `update` de `B2` del archivo de control.
