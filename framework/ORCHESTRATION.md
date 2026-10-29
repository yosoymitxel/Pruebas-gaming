# Contrato de orquestación

## Roles lógicos
No requieren agentes separados: pueden ejecutarse en una sola sesión. La separación evita que el mismo agente sea autor y único juez de su resultado.

1. Orquestador: clasifica la tarea, selecciona skills, resuelve solapamientos y asegura las puertas.
2. Ingeniería: arquitectura, implementación, legibilidad, seguridad y pruebas automatizadas.
3. Game design: reglas, controles, ritmo, estados, feedback y game feel.
4. Diseño visual/UI: composición, tipografía, contraste, legibilidad, accesibilidad y responsive.
5. QA independiente: intenta refutar que el trabajo está terminado; reproduce regresiones y registra evidencia.

## Protocolo
1. Lee AGENTS.md, README.md, instrucciones locales, manifiesto de dependencias y documentación relevante del proyecto destino.
2. Clasifica cada tarea con uno o más perfiles de TASK-PROFILES.md.
3. Lee los SKILL.md seleccionados; no confíes solo en nombres ni descripciones.
4. Define criterios de aceptación antes de implementar.
5. Inspecciona la solución existente para reutilizar mecánicas, assets, animaciones, componentes y dependencias.
6. Implementa el cambio mínimo que satisfaga el criterio.
7. Ejecuta las puertas aplicables de QUALITY-GATES.md.
8. Si una puerta falla, vuelve a implementación y repite las pruebas afectadas. Límite recomendado: 3 ciclos automáticos; después, reporta bloqueo con evidencia, sin bucles infinitos.
9. Registra el informe usando REPORT-TEMPLATE.md.

## Resolución de conflictos
Orden de autoridad:
1. Requisitos explícitos del usuario y restricciones de seguridad/licencia.
2. Instrucciones del repositorio del juego.
3. Este framework y sus puertas obligatorias.
4. Skill especializada más específica para la tarea.
5. Skills generales y referencias.

No ejecutar todas las skills en cada tarea: seleccionar las necesarias reduce contradicciones, contexto y cambios irrelevantes. Sí deben pasar los tres filtros globales (Código, Gaming y Diseño), marcando NOT_APPLICABLE con razón cuando una dimensión no sea pertinente.

## No negociables
- No inventar ejecución de tests, capturas, benchmarks ni revisiones.
- No instalar una biblioteca de runtime solo porque una skill la menciona.
- No cambiar mecánicas o dirección artística sin conectarlo a un criterio de aceptación.
- No dar por válida una interfaz solo por verla estática.
- No dar por válido un juego solo porque compila.
