# Perfiles de tarea

El orquestador asigna uno o más perfiles y lee las skills seleccionadas antes de actuar.

| Perfil | Skills candidatas | Filtro adicional obligatorio |
|---|---|---|
| Gameplay/mecánicas | GameDev skills pertinentes + Anti-Slop/Ponytail | Pruebas de reglas, controles y casos límite |
| Arquitectura/código | Ponytail + skill técnica relevante | Lint/typecheck/tests/build y revisión del diff |
| Dirección visual | Taste + Anti-Slop | Revisión de composición y coherencia con referencias |
| UI/UX | Impeccable + Web Design Guidelines | Responsive, accesibilidad, overflow y estados |
| Animación | Emil review-animations / improve-animations; Motion solo si conviene | Reproducir ciclo, interrupciones, repetición y estados límite |
| Pixel art/sprites | ClaudePxl y GameDev art pipeline relevante | Tamaño, paleta, transparencia, legibilidad y licencia |
| Voxel/3D/2.5D web | Investigar VoxPix y renderizadores compatibles con el stack | Demostrar volumen real, cámara, rendimiento y móvil |
| VFX/partículas | Skills de VFX pertinentes; evaluar Sprite Fusion VFX/VFX-JS | Rendimiento, limpieza y coherencia visual |
| Rendimiento | GameDev performance skills + herramientas del stack | Medición antes/después reproducible |
| Accesibilidad | Web Design Guidelines + Impeccable si aplica | Teclado, foco, contraste, etiquetas y reduced motion |
| Release/hosting | Skills de tooling pertinentes | Build de producción y prueba en hosting objetivo |
| Investigación de herramientas | LeanCTX si compatible + catálogo | Licencia, actividad, compatibilidad, coste y alternativa |

## Política de selección
- P0: filtro obligatorio del perfil y sus skills esenciales cuando estén instaladas.
- P1: se activa si la tarea coincide con sus disparadores.
- Referencia: aporta criterios o inspiración, no se ejecuta ni instala por defecto.
- Runtime: solo se agrega al proyecto del juego tras demostrar necesidad y compatibilidad.

Si una skill esencial falta, el orquestador debe indicarlo y usar el procedimiento documentado disponible sin fingir que la skill se ejecutó.
