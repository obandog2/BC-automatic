# Playbook: Traspaso de borrador a entrega

**Mantenido por:** Tuti
**Última actualización:** 2026-09-11

## Propósito

Una cadena de dos agentes donde uno redacta una pieza de comunicación o un entregable y un segundo se encarga de la entrega final después de la aprobación de la owner. Úsalo siempre que un borrador requiera revisión antes de salir.

## Disparador

Usa este playbook cuando:
- Un agente produjo un borrador (correo, mensaje, documento, reporte) que requiere aprobación de la owner antes de entregarse
- Un segundo agente maneja el canal de entrega o el formato final

## Flujo

```
1. El agente redactor crea el borrador
         │
         ▼
2. El borrador va a Owner Inbox/Pending Review/
         │
         ▼
3. La owner revisa y aprueba (mueve el archivo a Owner Inbox/Approved/ o señala la aprobación en sesión)
         │
         ▼
4. El agente de entrega toma el borrador aprobado y ejecuta la entrega
         │
         ▼
5. El agente de entrega confirma que terminó en Owner Inbox/Output/ o reporta en línea
```

## Detalle de los pasos

**Paso 2:** El agente redactor escribe el archivo en `Owner Inbox/Pending Review/` con el formato estándar de Pending Review. Anota en el campo "Opciones / Acción recomendada" qué agente de entrega debe encargarse del paso 4 y cuál es el canal de entrega.

**Paso 3:** La owner aprueba en sesión (le dice al orquestador "aprobado, entrégalo") o mueve el archivo a `Owner Inbox/Approved/`.

**Paso 4:** El agente de entrega lee el archivo aprobado, confirma el canal de entrega y el destinatario, y ejecuta. Si algo es ambiguo, pregunta antes de entregar.

**Paso 5:** El agente de entrega escribe una confirmación breve: qué se entregó, a quién y cuándo.

## Cadenas directas

Este playbook autoriza al agente de entrega a ejecutar directamente una vez que la owner aprueba. No hace falta volver a involucrar al orquestador en el paso 4 si la aprobación fue explícita.

## Notas

- Si el agente de entrega todavía no está contratado, haz una pausa en el paso 2 y pídele a Alicia que diseñe al especialista correcto.
- Si la owner quiere editar el borrador antes de la entrega, el agente redactor se encarga de las revisiones antes de que el archivo pase a Approved/.
