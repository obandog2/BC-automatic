# Clasificador ponderado IVD

Este archivo es una alternativa al clasificador anterior. No se deben mantener ambos motores activos en el mismo proyecto.

## Instalación

1. Conserva una sola función `validarConArchivoControl()` ya existente en tu proyecto.
2. Crea un archivo nuevo llamado `ClasificadorPonderadoIVD2025.gs`.
3. Copia únicamente el contenido de `ClasificadorPonderadoIVD2025.gs`.
4. No copies otra vez el archivo anterior que declara `ClasificadorRelevanciaIVD` o `ClasificadorRelevanciaIVD2`.
5. Ejecuta `clasificarIVDConPesos2025` desde el selector de funciones, sin escribir paréntesis.

Lee B:T y escribe la clasificación en V. No usa W, Y ni otra columna posterior a T.

## Pesos

| Evidencia | IVD | NO ES IVD | PHARMA |
| --- | ---: | ---: | ---: |
| Producto explícito | 9 | 9 | 12 |
| Término del diccionario de descripción | 2 | 1 | 5 |
| Comprador del diccionario | 2 | 4 | 6 |
| Partida arancelaria IVD | 2 | - | - |
| Marca IVD conocida | 2 | - | - |
| Fabricante IVD conocido | 3 | - | - |

El programa cuenta hasta tres coincidencias por grupo, para que una descripción repetitiva no infle artificialmente el puntaje.

La categoría ganadora debe alcanzar como mínimo: IVD 4, NO ES IVD 4 o PHARMA 6. Si hay empate o la diferencia es menor a un punto, devuelve `NO ES IVD` como resultado conservador.

Los pesos se ajustan en `CONFIG.pesos` dentro del código. Ejemplo: para dar mayor importancia a una partida IVD, cambia `partidaIVD: 2` por `partidaIVD: 4`.

El proceso trabaja en lotes de 2 500 filas y se continúa automáticamente cada minuto.

Revisión manual de sintaxis hecha contra el archivo. No lo ejecuté.
