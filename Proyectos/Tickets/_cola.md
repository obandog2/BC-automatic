# Cola de tickets

**Mantenida por:** Samuel
**Actualizada:** 2026-09-16
**Total abiertos:** 4

> Índice del estado de cada ticket. Un archivo por ticket en esta misma carpeta, con el formato `[id]-[slug].md`.
> Entrada pegada, salida persistida: Gaby pega el ticket en el chat, Samuel escribe aquí. Cuando exista acceso a la API de Monday, solo cambia la entrada.

---

## Resumen

| Estado | Cantidad |
|---|---|
| sin revisar | 0 |
| esperando insumo | 1 |
| esperando luz verde | 0 |
| listo para codificar | 0 |
| en código | 2 |

---

## Listo para codificar

| Ticket | Solicitante | Congelado el |
|---|---|---|
| — | — | — |

## Esperando luz verde

| Ticket | Plan presentado el | Días esperando decisión |
|---|---|---|
| — | — | — |

## Esperando insumo

| Ticket | Insumo que falta | Responsable | Días esperando |
|---|---|---|---|
| [BCAT-0065](BCAT-0065-flujo-plan-de-accion.md) | Segunda reunión para confirmar los ajustes restantes de la versión 2 | Solicitante / Gaby | 0 |

## En código

| Ticket | Cambios registrados sin resolver |
|---|---|
| ASIST-01 v2 — secciones, limpieza visual, prioridad propia | Ninguno. Plan aprobado y v2 entregada el 2026-09-14. Pendiente de que Gaby pegue los seis archivos, corra `setupAsistente()` y publique versión nueva. |
| [BCAT-0016](BCAT-0016-homologacion-marcas.md) — cuatro importadores | Código encapsulado de CPS, Molecular, Pathology y NPC entregado el 2026-09-16. Pendiente de prueba real en Apps Script para los tres módulos nuevos. |
| [BCAT-0074](BCAT-0074-consolidacion-pdfs.md) — consolidación de PDFs | Código OCR entregado el 2026-09-16. Pendiente de prueba con las carpetas reales de Plantilla. |

> v1 de ASIST-01: entregada y desplegada por Gaby el 2026-09-14, funcionando.
> v2: seis archivos reemplazados enteros en `Proyectos/Asistente-Personal/apps-script/` (`Code.gs`, `Correo.gs`, `Datos.gs`, `Dashboard.html`, `Estilos.html`, `Cliente.html`). `Agenda.gs` y `appsscript.json` sin tocar.
> Google Chat sigue fuera. Borrador de consulta al administrador de Workspace en `Owner Inbox/Pending Review/2026-09-14_Samuel_consulta-admin-chat-api.md`, pendiente de que Gaby lo envíe.

## Sin revisar

| Ticket | Solicitante | Llegó el |
|---|---|---|
| — | — | — |

---

## Lo que yo haría (tú decides)

1. **Terminar la v2 de ASIST-01**, que está a un paso de cerrar: pegar los tres HTML que faltan, correr `setupAsistente()` y **publicar versión nueva**, que es el paso que más fácil se olvida.
2. **Probar Molecular, Pathology y NPC de BCAT-0016** con un correo real y confirmar que cada uno crea su índice y evita duplicados.
3. **Probar BCAT-0074** con dos carpetas, incluyendo un PDF repetido por nombre, para confirmar el orden y la exclusión de duplicados.
4. **Mantener BCAT-0065 en pausa** hasta la segunda reunión con el solicitante; la creación de pestañas y el envío inicial ya funcionan.
4. **Enviar el borrador al administrador sobre los scopes de Chat**, que es lo único que no depende de nosotros y por eso conviene que empiece a correr ya.
5. Usar la v2 del asistente una semana antes de sumarle nada. Google Tasks y los extras siguen propuestos, sin decidir.

BCAT-0065 v2 está preparado en `Proyectos/Tickets/BCAT-0065-codigo-v2/` y queda en pausa hasta la segunda reunión. La versión anterior queda conservada y no debe instalarse como versión final.

BCAT-0016 tiene el módulo de marcas en `Proyectos/Tickets/BCAT-0016-codigo/` y cuatro importadores encapsulados: CPS, Molecular, Pathology y NPC. La prueba real de los tres últimos queda pendiente.
