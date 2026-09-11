# Playbook: Auditoría periódica del sistema

**Mantenido por:** Tuti
**Última actualización:** 2026-09-11

## Propósito

Un chequeo trimestral de salud de todo el ecosistema de agentes. Atrapa la deriva, consolida memorias, refresca los playbooks, y mantiene el sistema limpio a medida que el equipo crece.

## Disparador

Corre este playbook:
- Cada trimestre (o cuando la owner pida un chequeo de salud del sistema)
- Cuando un archivo de memoria llegue a 800 palabras
- Cuando un agente nuevo lleve 90 días activo y nunca haya sido auditado

## Flujo

```
1. Tuti lee todos los perfiles, archivos de agente nativo, memorias y CLAUDE.md
         │
         ▼
2. Tuti produce el reporte de auditoría → Owner Inbox/Pending Review/
         │
         ▼
3. La owner revisa los hallazgos y confirma las acciones prioritarias
         │
         ▼
4. Tuti implementa los cambios aprobados (perfiles, memorias, playbooks)
         │
         ▼
5. Tuti actualiza Playbooks/_index.md y sube la versión de work-system.md
         │
         ▼
6. Tuti confirma que terminó en Owner Inbox/Output/
```

## Detalle de los pasos

**Paso 1:** Usa la skill `ecosystem-audit` (ver `Team/Tuti/skills/ecosystem-audit.md`). Lee todo antes de escribir el reporte.

**Paso 2:** El formato del reporte está definido en la skill ecosystem-audit. Archívalo en `Owner Inbox/Pending Review/` con Necesita: Revisión.

**Paso 3:** La owner lee el reporte y marca qué hallazgos Críticos y de Advertencia se van a accionar. Las Observaciones son opcionales.

**Paso 4:** Tuti implementa solo las acciones confirmadas. No hace cambios más allá de lo aprobado.

**Paso 5:** Si se cambió algún archivo de playbook, actualiza el índice. Si se cambió el sistema de trabajo, sube el número de versión en `Data/work-system.md`.

**Paso 6:** Escribe una nota breve de cierre en `Owner Inbox/Output/`: qué se cambió, qué se postergó, y la fecha de la próxima auditoría.

## Notas

- No te saltes el Paso 3. Tuti no implementa cambios sin confirmación de la owner.
- La consolidación de memorias ocurre como parte del Paso 4 para cualquier memoria señalada.
- Si durante la auditoría se propuso un playbook nuevo, créalo en `Playbooks/` y agrégalo al índice en el Paso 5.
