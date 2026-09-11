---
name: ecosystem-audit
description: Auditoría estructurada de todo el ecosistema de agentes. Úsala cuando pidan una auditoría del sistema, un chequeo de salud, o al preparar la consolidación trimestral de memorias.
---

# Skill: Auditoría del ecosistema

**Agente:** Tuti

## Qué cubre esta skill

Una auditoría completa examina cada perfil de agente, cada archivo de memoria, la tabla de ruteo de CLAUDE.md, el índice de Playbooks y la estructura de carpetas. El objetivo es atrapar la deriva antes de que cause problemas: perfiles que ya no coinciden con sus archivos de agente nativo, memorias que se inflaron, playbooks obsoletos, y huecos estructurales.

## Checklist de auditoría

### 1. Sincronía de perfiles
- Leer cada `Team/[Nombre].md`
- Leer cada `.claude/agents/[nombre].md`
- Señalar: perfil y archivo nativo desincronizados en rol, alcance o voz
- Señalar: agente en Team/ sin archivo nativo (usará spawn de respaldo)
- Señalar: archivo nativo sin perfil en Team/

### 2. Salud de las memorias
- Leer cada `Team/[Nombre]/memory.md` y `Alfred/memory.md`
- Señalar: memoria de más de 800 palabras (toca consolidar)
- Señalar: entradas de Hot Context con más de 90 días (probablemente obsoletas)
- Señalar: memorias sin entradas (el agente estuvo activo pero no registró nada)

### 3. Tabla de ruteo
- Leer `CLAUDE.md`
- Verificar que cada agente de la tabla de ruteo tenga archivo nativo en `.claude/agents/`
- Señalar: agentes en Team/ que no aparecen en la tabla de ruteo

### 4. Playbooks
- Leer `Playbooks/_index.md`
- Verificar que exista cada archivo de playbook listado
- Señalar: playbooks referenciados en perfiles de agente que no están en el índice

### 5. Estructura de carpetas
- Usar Bash para listar los directorios clave
- Señalar: archivos inesperados en la raíz
- Señalar: agentes sin carpeta `skills/` cuando el rol la amerita

## Formato del reporte

```
# Auditoría del ecosistema - [YYYY-MM-DD]

**Alcance:** [qué se revisó]
**Resumen de salud:** [Verde | Amarillo | Rojo] - [una frase]

## Hallazgos

### Críticos (arreglar ya)
1. [Hallazgo] - [archivo] - [acción]

### Advertencias (arreglar pronto)
1. [Hallazgo] - [archivo] - [acción]

### Observaciones (mejoras opcionales)
1. [Hallazgo] - [archivo] - [acción]

## Próximas acciones recomendadas
1. [Acción prioritaria]
```

## Procedimiento de consolidación

Cuando un archivo de memoria llega a 800 palabras:
1. Identificar los how-tos estables que pertenecen a un archivo de skill
2. Identificar los hechos que pertenecen a `Knowledge/Vault/`
3. Moverlos a su destino
4. Podar las entradas obsoletas de Hot Context
5. Reescribir el archivo de memoria por debajo del presupuesto
6. Registrar la fecha de consolidación en el frontmatter
