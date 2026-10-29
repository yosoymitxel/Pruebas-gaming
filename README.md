# Pruebas-gaming — Framework reutilizable para videojuegos

El objetivo principal de este repositorio es crear un **framework de trabajo automatizado** que coordine skills de ingeniería, game development y diseño para mejorar la calidad de los juegos web.

No es una colección pasiva de prompts. El framework define un proceso obligatorio, perfiles de tarea, puertas de calidad, reglas de resolución de conflictos y evidencia necesaria para considerar un trabajo terminado.

## Empieza aquí
1. [Instrucciones obligatorias para agentes](AGENTS.md)
2. [Contrato del framework](framework/README.md)
3. [Orquestación de skills](framework/ORCHESTRATION.md)
4. [Puertas obligatorias de calidad](framework/QUALITY-GATES.md)
5. [Perfiles y selección de skills](framework/TASK-PROFILES.md)
6. [Registro persistente de skills](docs/REGISTRO-SKILLS.md)
7. [Índice de skills locales](skills/INDEX.md)
8. [Catálogo de fuentes](docs/CATALOGO.md)
9. [Catálogo de referencias por contexto](docs/CATALOGO-REFERENCIAS.md)
10. [Protocolo de evidencia visual actual](docs/EVIDENCIA-VISUAL.md)
11. [Estándares](docs/ESTANDARES.md)
12. [Estructura prevista](docs/ESTRUCTURA.md)

## Filtros obligatorios
Cada tarea debe registrar resultados para:
- **CODE_GATE:** calidad técnica, pruebas, seguridad y revisión del diff.
- **GAMEPLAY_GATE:** reglas, controles, estados y funcionamiento real.
- **DESIGN_GATE:** coherencia visual, responsive, accesibilidad y animaciones.

Si un filtro no corresponde, debe marcarse NOT_APPLICABLE con una razón. Si no se pudo probar, BLOCKED; nunca se convierte una suposición en PASS.

## Skills versionadas y persistentes
El repositorio está diseñado para mantener copias locales versionadas en .agents/skills/ y .claude/skills/, con un índice en skills/INDEX.md. Así, los agentes que tengan acceso al checkout pueden leer las skills ya guardadas sin reinstalarlas en cada tarea. Las fuentes externas y su procedencia se registran en sources/manifest.tsv y docs/CATALOGO.md.

Importante: tener las skills versionadas no hace que un chat nuevo de ChatGPT acceda automáticamente al repositorio. La sesión nueva debe abrir el repo o recibir su enlace/contexto. Cuando el agente ya está trabajando dentro del checkout, debe leer AGENTS.md e INDEX.md primero.

## Instalación y validación de skills
Requiere Node.js 22.20 o posterior para el instalador actual:

    bash scripts/install-skills.sh
    bash scripts/validate-skills.sh
    bash scripts/index-skills.sh

La descarga e instalación efectiva de las fuentes externas aún debe ejecutarse y validarse en un entorno con acceso a GitHub. No se considera completa solo por tener un instalador o una entrada en el catálogo.

## Alcance actual
Esta fase se centra exclusivamente en estabilizar el framework. La carpeta juegos/, con un subdirectorio por juego HTML, queda para una fase posterior.
