# Perfiles de tarea

El orquestador asigna uno o más perfiles y lee las skills seleccionadas antes de actuar. Antes de crear arte, iconos, sprites, SVGs, VFX o animaciones desde cero, debe consultar el catálogo de referencias y los assets ya existentes en el proyecto.

| Perfil | Skills candidatas | Referencias que debe consultar primero | Filtro adicional obligatorio |
|---|---|---|---|
| Gameplay/mecánicas | GameDev skills pertinentes + Anti-Slop/Ponytail | Mecánicas y assets del juego; ejemplos de patrones similares | Pruebas de reglas, controles y casos límite |
| Arquitectura/código | Ponytail + skill técnica relevante | Código existente, APIs y ejemplos oficiales compatibles | Lint/typecheck/tests/build y revisión del diff |
| Dirección visual | Taste + Anti-Slop | Referencias visuales aprobadas y assets ya existentes | Revisión de composición y coherencia con referencias |
| UI/UX | Impeccable + Web Design Guidelines | Catálogo UI clasificado por tipo de interfaz y stack | Responsive, accesibilidad, overflow y estados |
| Animación | Emil review-animations / improve-animations; Motion solo si conviene | Catálogo de motion; animaciones y timelines ya existentes | Reproducir ciclo, interrupciones, repetición y estados límite |
| SVG/iconografía | Skill de arte/UI aplicable | Primero assets SVG del proyecto; luego catálogo SVG, iconos y licencias | Revisar viewBox, proporciones, trazos, transparencia, escalado y render real |
| Pixel art/sprites | ClaudePxl y GameDev art pipeline relevante | Spritesheets, atlas, paletas y animaciones existentes; repositorio de recursos | Tamaño, paleta, transparencia, legibilidad, frames y licencia |
| Voxel/3D/2.5D web | Investigar VoxPix y renderizadores compatibles con el stack | Escenas y modelos existentes; catálogo de renderizadores/ejemplos | Demostrar volumen real, cámara, rendimiento y móvil |
| VFX/partículas | Skills de VFX pertinentes; evaluar Sprite Fusion VFX/VFX-JS | Efectos existentes y catálogo de partículas/VFX por motor | Rendimiento, limpieza y coherencia visual |
| Capturas/evidencia visual | Playwright o herramienta browser equivalente ya disponible | Entorno ejecutable más actual; local primero o deployment verificado | Evidencia ligada al SHA/versión exactos y artefactos descargables |
| Rendimiento | GameDev performance skills + herramientas del stack | Benchmarks y profiling existentes | Medición antes/después reproducible |
| Accesibilidad | Web Design Guidelines + Impeccable si aplica | Patrones accesibles para la plataforma y componentes existentes | Teclado, foco, contraste, etiquetas y reduced motion |
| Release/hosting | Skills de tooling pertinentes | Configuración real del hosting y workflow de deploy | Build de producción y prueba en hosting objetivo |
| Investigación de herramientas | LeanCTX si compatible + catálogo | Registro de referencias, licencias y compatibilidad | Licencia, actividad, compatibilidad, coste y alternativa |

## Política de selección
- P0: filtro obligatorio del perfil y sus skills esenciales cuando estén instaladas.
- P1: se activa si la tarea coincide con sus disparadores.
- Referencia: aporta criterios o inspiración, no se ejecuta ni instala por defecto.
- Runtime: solo se agrega al proyecto del juego tras demostrar necesidad y compatibilidad.

Si una skill esencial falta, el orquestador debe indicarlo y usar el procedimiento documentado disponible sin fingir que la skill se ejecutó. Si hay un recurso existente reutilizable y compatible, justificar por qué no sirve antes de crear uno equivalente desde cero.
