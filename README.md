# Pruebas-gaming — Repertorio reutilizable de skills para videojuegos

Este repositorio centraliza skills, instrucciones, criterios de selección y herramientas para desarrollar varios juegos sin reinventar el flujo en cada proyecto.

## Objetivo
- Mantener skills reutilizables dentro del repositorio.
- Documentar cuándo usar cada skill, cuándo no usarla y cómo validar su resultado.
- Separar skills de agentes, bibliotecas ejecutables, herramientas de arte y referencias.
- Priorizar cambios pequeños, reutilizar sistemas existentes y validar el juego real.

## Empieza aquí
1. Lee [la guía de selección](docs/SELECCION-DE-HERRAMIENTAS.md).
2. Consulta el [catálogo de fuentes](docs/CATALOGO.md).
3. Revisa [estándares de calidad](docs/ESTANDARES.md).
4. Ejecuta el instalador reproducible: `bash scripts/install-skills.sh`.
5. Valida el inventario: `bash scripts/validate-skills.sh`.

## Estructura
- `skills/`: skills versionadas dentro del repositorio.
- `.agents/skills/`: skills instaladas para agentes compatibles.
- `.claude/skills/`: skills instaladas para Claude Code.
- `docs/`: catálogo, instrucciones de uso, compatibilidad y estándares.
- `sources/manifest.tsv`: fuentes externas y método de incorporación.
- `scripts/`: instalación y validación repetibles.

> Una fuente no se considera instalada hasta que sus archivos estén presentes, su licencia se haya revisado y la validación local pase. Los enlaces del catálogo por sí solos no cuentan como instalación.

## Principios
- No reescribir mecánicas existentes sin necesidad.
- No añadir dependencias de runtime por mera inspiración visual.
- No dar por terminada una tarea porque compila: comprobar jugabilidad, consola, escritorio y móvil.
- No afirmar que se ejecutó una prueba si no hay evidencia.
- Respetar licencias y mantener la procedencia de skills y recursos.
