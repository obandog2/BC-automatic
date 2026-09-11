---
name: knowledge-ingest
description: Procesa documentos crudos de Knowledge/Inbox/ y los convierte en resúmenes de fuente estructurados y candidatos a concepto dentro del Knowledge Vault. Úsala siempre que llegue un documento nuevo al inbox.
---

# Skill: Ingest de conocimiento

**Agente:** Joy

## Qué cubre esta skill

El ingest es la puerta de entrada de todo el conocimiento nuevo. Cada documento que aterriza en `Knowledge/Inbox/` pasa por este flujo antes de que algo entre al vault. El objetivo es hacer que el conocimiento del documento sea encontrable y enlazable.

## Flujo de ingest

### Paso 1: Leer el documento fuente
Lee el documento completo en `Knowledge/Inbox/`. No lo hojees. Registra el dominio, el origen y la fecha mientras lees.

### Paso 2: Escribir el resumen de fuente
Crea `Vault/sources/[slug].md` con la plantilla de abajo. El slug debe ir en minúsculas con guiones y ser descriptivo.

### Paso 3: Identificar candidatos a concepto
Mientras escribes el resumen, lista todos los conceptos en la sección de conceptos clave. Para cada uno:
- Si ya existe un artículo de concepto en `Vault/concepts/` → agrega un backlink desde el resumen de fuente hacia el artículo existente
- Si el concepto es nuevo → decide si crear el artículo ahora (ver Reglas de decisión)

### Paso 4: Enlazar la fuente con los conceptos
Para cada artículo de concepto que ya exista y sea relevante, agrega un backlink en la sección de Fuentes de ese artículo apuntando a este resumen de fuente.

### Paso 5: Actualizar `_index.md`
Agrega una entrada de una línea para la fuente nueva en `Vault/_index.md`, bajo la sección de Fuentes:
```
- [[sources/slug]] - [una línea: qué es esta fuente y por qué importa]
```
Sin excepciones. El índice debe reflejar el estado real del vault al final de cada sesión de ingest.

### Paso 6: Archivar el archivo fuente
Una vez que el resumen de fuente, los enlaces a conceptos y la actualización del índice estén todos completos, mueve el archivo original de `Knowledge/Inbox/` a `Knowledge/Archive/`, conservando su nombre. Esto mantiene el inbox limpio y señala que el documento está totalmente procesado. Nunca borres; solo mueve. Si se ingirieron varios archivos en una sesión, archiva cada uno a medida que se complete.

## Plantilla de resumen de fuente (`Vault/sources/[slug].md`)

```
# Fuente: [Título]

**Archivo:** [nombre original del archivo en Inbox/]
**Fecha de alta:** [YYYY-MM-DD]
**Dominio:** [p. ej., gestión de proyectos / investigación / notas de reunión]
**Fuente original:** [URL o "interno"]

---

## Resumen
[3-5 frases: qué contiene este documento y por qué importa]

## Conceptos clave
- [concepto] → [[concepts/slug]] (enlazar si el artículo existe)

## Relevancia
[Una frase: qué preguntas ayuda a responder esta fuente]
```

## Reglas de decisión

**Crea un artículo de concepto nuevo cuando:**
- El concepto no aparece en `Vault/_index.md`
- El concepto es lo bastante distinto de los artículos existentes
- Es probable que futuras fuentes lo referencien varias veces

**Actualiza un artículo de concepto existente cuando:**
- La fuente aporta detalle, matiz o evidencia nuevos
- El artículo existente es apenas un esbozo y esta fuente lo completa

**Posterga cuando:**
- El concepto aparece una sola vez y es poco probable que se repita
- Ya hay contexto suficiente en otros artículos
