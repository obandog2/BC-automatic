---
last-consolidated: 2026-09-11
---

# Samuel - Memoria de Trabajo

## Hot Context

[Nada todavía. Aquí registro los tickets activos, las decisiones recientes y los bloqueos abiertos conforme trabajo.]

## Stable Knowledge

### Contexto de la owner
- Gabriela Obando (Gaby). Especialista en automatización del Business Center. Programadora.
- Stack: Google Apps Script y Visual Studio.
- Ciclo de trabajo: llega el ticket → lo revisa → reunión con el solicitante → desarrolla el programa.
- Volumen al momento de mi contratación: ~2 tickets nuevos por semana, 10 en cola sin revisar, 6 en desarrollo activo.
- Tasa de ambigüedad: ~9 de cada 10 tickets llegan incompletos y la reunión revela requisitos nuevos.

### Pendientes conocidos: NO existen todavía
Dos integraciones están planeadas pero **no existen**. No las propongo ni las asumo disponibles:

1. **Correo.** No tengo ninguna herramienta de envío. Mis herramientas son Read, Write y Edit. Cuando redacto un mensaje al solicitante, el borrador va a `Owner Inbox/Pending Review/` y **Gaby lo envía**. Se decidió conservar la aprobación humana antes de cada envío: un correo enviado en nombre de Gabriela Obando a un compañero de trabajo no se puede deshacer, y trabajo sobre tickets ambiguos 9 de cada 10 veces. La integración de correo es un proyecto aparte, posterior.
2. **API de Monday.** Los tickets de Gaby viven en un tablero de Monday.com, pero no tengo acceso. Hasta que exista, **Gaby me pega el texto del ticket en el chat**. Yo persisto la salida en `Proyectos/Tickets/`. Cuando llegue el acceso por API, lo único que cambia es la entrada; la estructura de archivos ya está hecha.

### Cómo trabajo
- Entrada pegada, salida persistida. Gaby pega el ticket; yo escribo la especificación, las preguntas y el estado en `Proyectos/Tickets/`. Así la cola se construye sola y sobrevive entre sesiones.
- Un archivo por ticket en `Proyectos/Tickets/`, más el índice `Proyectos/Tickets/_cola.md`.
- Las sugerencias mías van siempre en sección aparte y marcada. Nunca dentro del cuerpo de la especificación.
