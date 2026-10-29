# Pruebas-gaming — Framework reutilizable para videojuegos

El objetivo principal de este repositorio es crear un **framework de trabajo automatizado** que coordine skills de ingeniería, game development y diseño para mejorar la calidad de los juegos web.

No es una colección pasiva de prompts. El framework define un proceso obligatorio, perfiles de tarea, puertas de calidad, reglas de resolución de conflictos y evidencia necesaria para considerar un trabajo terminado.

## Empieza aquí
1. [Instrucciones obligatorias para agentes](AGENTS.md)
2. [Contrato del framework](framework/README.md)
3. [Orquestación de skills](framework/ORCHESTRATION.md)
4. [Puertas obligatorias de calidad](framework/QUALITY-GATES.md)
5. [Perfiles y selección de skills](framework/TASK-PROFILES.md)
6. [Esqueleto transversal de videojuegos](framework/BASELINE-VIDEOJUEGO.md)
7. [Fuente única de verdad y conflictos](framework/CONFLICTOS-Y-FUENTE-DE-VERDAD.md)
8. [Descubrimiento de skills](docs/DESCUBRIMIENTO-SKILLS.md)
9. [Registro persistente de skills](docs/REGISTRO-SKILLS.md)
10. [Índice de skills locales](skills/INDEX.md)
11. [Catálogo de fuentes](docs/CATALOGO.md)
12. [Catálogo de referencias por contexto](docs/CATALOGO-REFERENCIAS.md)
13. [Protocolo de evidencia visual actual](docs/EVIDENCIA-VISUAL.md)
14. [Estándares](docs/ESTANDARES.md)
15. [Estructura prevista](docs/ESTRUCTURA.md)
16. [Especificación del terrario sandbox de isópodos](docs/ESPECIFICACION-TERRARIO-ISOPODOS.md)

## Filtros obligatorios
Cada tarea debe registrar resultados para:
- **CODE_GATE:** calidad técnica, pruebas, seguridad y revisión del diff.
- **GAMEPLAY_GATE:** reglas, controles, estados y funcionamiento real.
- **DESIGN_GATE:** coherencia visual, responsive, accesibilidad y animaciones.
- **INTEGRATION_GATE:** regresión conjunta, assets, build y hosting.

Si un filtro no corresponde, debe marcarse NOT_APPLICABLE con una razón. Si no se pudo probar, BLOCKED; nunca se convierte una suposición en PASS.

## Skills versionadas y persistentes
El repositorio está diseñado para mantener copias locales versionadas en .agents/skills/ y .claude/skills/, con un índice en skills/INDEX.md. Así, los agentes que tengan acceso al checkout pueden leer las skills ya guardadas sin reinstalarlas en cada tarea. Las fuentes externas y su procedencia se registran en sources/manifest.tsv y docs/CATALOGO.md.

Importante: tener las skills versionadas no hace que un chat nuevo de ChatGPT acceda automáticamente al repositorio. La sesión nueva debe abrir el repo o recibir su enlace/contexto. Cuando el agente ya está trabajando dentro del checkout, debe leer AGENTS.md e INDEX.md primero.

## Instalación y validación de skills
Requiere Node.js 22.20 o posterior para el instalador actual:

    bash scripts/install-skills.sh
    bash scripts/validate-skills.sh
    bash scripts/index-skills.sh

Para comprobar el framework con una sola ejecución:

    bash scripts/diagnose-framework.sh

La descarga e instalación efectiva de las fuentes externas aún debe ejecutarse y validarse en un entorno con acceso a GitHub. No se considera completa solo por tener un instalador o una entrada en el catálogo.

## Alcance actual
La fase actual estabiliza el framework y cierra la especificación del terrario de isópodos. La especificación no equivale a implementación: no crear `juegos/` ni iniciar el juego completo hasta validar el spike técnico de render y cerrar los riesgos documentados.
