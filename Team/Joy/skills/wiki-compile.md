---
name: wiki-compile
description: Construye y mantiene artículos de concepto en Knowledge/Vault/concepts/. Úsala al crear un artículo de concepto nuevo, al actualizar uno existente, o al correr una pasada de lint del vault.
---

# Skill: Compilación del vault

**Agente:** Joy

## Qué cubre esta skill

La compilación convierte el conocimiento extraído en artículos de concepto duraderos. Donde el ingest captura qué dice una fuente, la compilación captura qué significa. Los artículos de concepto se escriben para lectores futuros (humanos o agentes) que llegan sin contexto previo.

## Flujo del artículo de concepto

1. Redacta el artículo en `Vault/concepts/[slug].md` con la plantilla de abajo
2. Coloca backlinks a las fuentes (cada afirmación debe poder rastrearse a una fuente; lístalas en la sección de Fuentes)
3. Enlaza con conceptos relacionados (enlaces bidireccionales; actualiza también el artículo relacionado)
4. Actualiza `_index.md` con una entrada de una línea para el concepto nuevo

Ningún artículo de concepto sale de una sesión sin backlinks a al menos una fuente.

## Plantilla de artículo de concepto (`Vault/concepts/[slug].md`)

```
# [Nombre del concepto]

**Dominio:** [p. ej., gestión de proyectos]
**Última actualización:** [YYYY-MM-DD]

---

## Definición
[2-3 frases: qué es este concepto]

## Puntos clave
- [punto]

## Conceptos relacionados
- [[concepts/related-slug]] - [descripción en una línea de la relación]

## Fuentes
- [[sources/slug]] - [nota de una línea sobre qué aporta esta fuente]
```

## Flujo de lint

Una pasada de lint es un chequeo de salud del vault. Córrela cuando te la asignen, o trimestralmente.

| Chequeo | Descripción |
|-------|-------------|
| **Exactitud del índice** | Cada archivo en `Vault/` tiene entrada en `_index.md`; ninguna entrada de `_index.md` apunta a archivos inexistentes |
| **Backlinks rotos** | Cada referencia `[[concepts/slug]]` y `[[sources/slug]]` resuelve a un archivo real |
| **Artículos esbozo** | Artículos de concepto que solo tienen definición, sin puntos clave ni fuentes |
| **Fuentes huérfanas** | Resúmenes de fuente sin backlinks a conceptos |
| **Conceptos huérfanos** | Artículos de concepto sin citas de fuente |

Los hallazgos de lint van a `Vault/outputs/lint-[YYYY-MM-DD].md`. Corrige los errores claros en la misma sesión; señala a la owner las decisiones editoriales.
