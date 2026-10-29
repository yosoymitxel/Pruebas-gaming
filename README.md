# Pruebas-gaming — Framework reutilizable para videojuegos

El objetivo principal de este repositorio es crear un **framework de trabajo automatizado** que coordine skills de ingeniería, game development y diseño para mejorar la calidad de los juegos web.

No es una colección pasiva de prompts. El framework define un proceso obligatorio, perfiles de tarea, puertas de calidad, reglas de resolución de conflictos y evidencia necesaria para considerar un trabajo terminado.

## Empieza aquí
1. [Contrato del framework](framework/README.md)
2. [Orquestación de skills](framework/ORCHESTRATION.md)
3. [Puertas obligatorias de calidad](framework/QUALITY-GATES.md)
4. [Perfiles y selección de skills](framework/TASK-PROFILES.md)
5. [Plantilla de informe](framework/REPORT-TEMPLATE.md)
6. [Catálogo de fuentes](docs/CATALOGO.md)
7. [Estándares](docs/ESTANDARES.md)
8. [Estructura prevista](docs/ESTRUCTURA.md)

## Filtros obligatorios
Cada tarea debe registrar resultados para:
- **CODE_GATE:** calidad técnica, pruebas, seguridad y revisión del diff.
- **GAMEPLAY_GATE:** reglas, controles, estados y funcionamiento real.
- **DESIGN_GATE:** coherencia visual, responsive, accesibilidad y animaciones.

Si un filtro no corresponde, debe marcarse NOT_APPLICABLE con una razón. Si no se pudo probar, BLOCKED; nunca se convierte una suposición en PASS.

## Skills y herramientas
- `skills/`: skills propias/adaptaciones curadas.
- `.agents/skills/`: skills de proyecto para agentes compatibles.
- `.claude/skills/`: skills de proyecto para Claude Code.
- `sources/manifest.tsv`: origen, método y estado de cada fuente.
- `scripts/`: instalación y validación de skills.

Las skills se activan según la tarea, no todas indiscriminadamente. Bibliotecas de runtime, generadores de arte y sitios de referencia se evalúan por separado.

## Instalación y validación de skills
Requiere Node.js 22.20 o posterior para el instalador actual:

```bash
bash scripts/install-skills.sh
bash scripts/validate-skills.sh
```

La instalación todavía debe ejecutarse y validarse en un entorno con acceso a GitHub. No se considera completa solo por tener un instalador.

## Alcance actual
Esta fase se centra exclusivamente en estabilizar el framework. La carpeta `juegos/`, con un subdirectorio por juego HTML, queda para una fase posterior.
