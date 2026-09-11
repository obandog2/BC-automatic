# Playbooks - Índice

**Mantenido por:** Tuti
**Última actualización:** 2026-09-11
**Total de playbooks:** 2

> Los playbooks son definiciones de flujos reutilizables para secuencias de coordinación entre agentes que son recurrentes y bien entendidas. Un playbook = un archivo. Los agentes revisan aquí antes de coordinar trabajo multiagente.

---

## Playbooks de flujo

| Playbook | Agentes principales | Propósito |
|----------|---------------|---------|
| [draft-deliver-handoff](draft-deliver-handoff.md) | Cualquier agente redactor + cualquier agente de entrega | Traspasar un borrador aprobado para su entrega final |
| [periodic-system-audit](periodic-system-audit.md) | Tuti | Chequeo trimestral de salud del ecosistema y consolidación de memorias |

---

## Cómo proponer un playbook nuevo

Cuando un flujo se repite en tres o más instancias con la misma coordinación de agentes:

1. Cualquier agente lo propone por sub-tarea a Tuti
2. Tuti crea el archivo de playbook en `Playbooks/`
3. Tuti actualiza este índice
