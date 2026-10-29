# Perfiles de tarea

El orquestador asigna uno o más perfiles y lee las skills seleccionadas antes de actuar. Antes de crear arte, iconos, sprites, SVGs, VFX o animaciones desde cero, debe consultar el catálogo de referencias y los assets ya existentes en el proyecto.

| Perfil | Skills candidatas | Referencias que debe consultar primero | Filtro adicional obligatorio |
|---|---|---|---|
| Esqueleto de videojuego nuevo | game-project-skeleton + game-ui-ux + save-systems; input/localización/skill del motor según el proyecto | framework/BASELINE-VIDEOJUEGO.md; Kure'iChaosChess como referencia de sistemas, no de estilo | Tabla de verdad, fuente única de estado, persistencia, flujo de pantallas y pruebas de restauración |
| Gameplay/mecánicas | GameDev skills pertinentes + Anti-Slop/Ponytail | Mecánicas y assets del juego; ejemplos de patrones similares | Pruebas de reglas, controles y casos límite |
| Arquitectura/código | Ponytail + skill técnica relevante | Código existente, APIs y ejemplos oficiales compatibles | Lint/typecheck/tests/build y revisión del diff |
| Dirección visual | Taste + Anti-Slop | Referencias visuales aprobadas y assets ya existentes | Revisión de composición y coherencia con referencias |
| UI/UX | Impeccable + Web Design Guidelines + game-ui-ux para UI de juego | Catálogo UI clasificado por tipo de interfaz y stack | Responsive, accesibilidad, overflow, foco y estados |
| Guardado/importación/exportación | save-systems + skill específica de almacenamiento/motor | Persistencia existente y esquema actual | Reinicio real, migración, importación inválida sin corrupción |
| Localización | Skill i18n/localización y UI del motor | Catálogos existentes y checker de traducciones | Sin claves ausentes ni texto de jugador fuera del sistema |
| Animación | Emil review-animations / improve-animations; Motion solo si conviene | Catálogo de motion; animaciones y timelines existentes | Ciclo, interrupciones, repetición y estados límite |
| SVG/iconografía | Skill de arte/UI aplicable | Primero assets SVG del proyecto; luego catálogo SVG, iconos y licencias | viewBox, proporciones, trazos, transparencia, escalado y render real |
| Pixel art/sprites | ClaudePxl y GameDev art pipeline relevante | Spritesheets, atlas, paletas y animaciones existentes | Tamaño, paleta, transparencia, legibilidad, frames y licencia |
| Voxel/3D/2.5D web | Investigar VoxPix y renderizadores compatibles | Escenas/modelos existentes y catálogo de renderizadores | Demostrar volumen real, cámara, rendimiento y móvil |
| VFX/partículas | Skills VFX pertinentes; evaluar Sprite Fusion VFX/VFX-JS | Efectos existentes y catálogo de VFX por motor | Rendimiento y coherencia visual |
| Capturas/evidencia visual | Playwright o herramienta browser equivalente | Checkout actual o deployment con SHA verificado | Evidencia ligada al SHA y artefactos descargables |
| Rendimiento | GameDev performance skills + herramientas del stack | Benchmarks y profiling existentes | Medición antes/después reproducible |
| Accesibilidad | Web Design Guidelines + Impeccable si aplica | Patrones accesibles y componentes existentes | Teclado, foco, contraste, etiquetas y reduced motion |
| Release/hosting | Skills de tooling pertinentes | Configuración real de hosting y workflow de deploy | Build de producción y prueba en destino |
| Investigación de herramientas/skills | Skills CLI de Vercel + catálogo | Skills locales primero; después búsqueda upstream y docs oficiales | Compatibilidad, licencia, mantenimiento, coste y alternativa |

## Política de selección
- P0: filtro obligatorio del perfil y skills esenciales disponibles.
- P1: se activa si la tarea coincide con sus disparadores.
- Referencia: aporta criterios/inspiración, no se ejecuta ni instala por defecto.
- Runtime: solo se agrega al juego tras demostrar necesidad y compatibilidad.

Si una skill esencial falta, indicarlo y usar el procedimiento documentado sin fingir que se ejecutó. Si un recurso compatible ya existe, justificar por qué no sirve antes de crear otro equivalente.
