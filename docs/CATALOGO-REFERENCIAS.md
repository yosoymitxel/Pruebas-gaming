# Catálogo de referencias por contexto

## Objetivo

Este catálogo ayuda al orquestador a elegir **qué consultar para cada problema concreto**. No es una lista de páginas que se visitan indiscriminadamente. Primero se inspeccionan los assets, componentes, SVG, sprites, animaciones y bibliotecas que ya existen en el juego; después se busca en las fuentes externas adecuadas.

La URL en este documento significa «fuente de referencia conocida», no «recurso ya aprobado, descargado o licenciado». Antes de incorporar un recurso concreto, verificar su licencia, atribución, formato y compatibilidad.

## Orden de decisión obligatorio

1. Buscar en el proyecto actual: archivos SVG, spritesheets, atlas, frames, fuentes, shaders, VFX, componentes, animaciones y sus referencias/importadores.
2. Buscar en el repertorio local de assets aprobado por el proyecto o por el usuario.
3. Buscar en las fuentes de esta tabla según la necesidad.
4. Preferir adaptar/reutilizar un recurso compatible antes de crearlo desde cero.
5. Crear desde cero solo si no existe un recurso adecuado, la licencia no permite reutilizarlo, la calidad/estilo no encaja o modificarlo cuesta más que producirlo. Documentar el motivo.
6. Registrar URL del recurso concreto, licencia, atribución, cambios realizados y ubicación local.

## Matriz de selección

| Necesidad / disparador | Consultar primero | Útil para | No usar como solución automática |
|---|---|---|---|
| Icono, silueta o ilustración vectorial | [SVG Silh](https://svgsilh.com/es/), SVG existentes del proyecto | Siluetas, iconos y formas simples que se puedan adaptar | Copiar cualquier SVG sin revisar licencia, viewBox, trazo y estilo |
| Iconos de interfaz | Assets existentes; luego catálogo SVG/iconográfico aprobado | HUD, botones, estados y señalética | Crear iconos detallados manualmente si existe uno compatible |
| Sprite, personaje o tileset pixel art | [ClaudePxl](https://github.com/crsolver/claude-pxl), spritesheets y atlas existentes | Pipeline de pixel art, personajes y recursos por frames | Confundir herramienta de generación con una biblioteca de sprites listos |
| Animación de UI / microinteracciones web | [Emil Kowalski Skills](https://github.com/emilkowalski/skills), [Motion](https://motion.dev/) | Transiciones de interfaz, feedback, timing, easing y estados | Añadir Motion al runtime si CSS/Web Animations ya resuelven el caso |
| Animación de personajes / gameplay | Skills especializadas de GameDev, animaciones del motor y assets existentes | Ciclos, anticipación, impacto, locomoción, interrupciones y blend | Usar una guía de UI para resolver animación de esqueleto o física |
| Partículas y VFX 2D | [Sprite Fusion VFX](https://www.spritefusion.com/pixel-art-vfx), [VFX-JS](https://amagi.dev/vfx-js/) | Referencias/recursos de efectos, partículas y efectos web | Tratar un catálogo de assets como una biblioteca runtime o viceversa |
| Componentes y patrones de UI | [Lightswind UI](https://github.com/codewithMUHILAN/Lightswind-UI-Library), [SmoothUI](https://smoothui.dev/), [Componentry](https://componentry.dev/), [RareUI](https://www.rareui.com/) | Patrones concretos, componentes y estados visuales | Importar componentes incompatibles con el stack o rehacer el juego como landing |
| Dirección visual y refinamiento | Taste, Anti-Slop, Impeccable | Criterio, jerarquía, consistencia y eliminación de patrones genéricos | Sustituir la dirección artística explícita del juego por un estilo de moda |
| Diseño de HUD / UX de juego | [Justinmind: UI de juegos](https://www.justinmind.com/es/ui-diseno/juego) y juegos de referencia indicados por el usuario | HUD, menús, flujo, jerarquía de información y controles | Copiar literalmente otra interfaz o asumir que una guía es un diseño final |
| Escena voxel / 2.5D web | [VoxPix](https://github.com/andyeswong/voxpix), renderer y escenas existentes | Volumen voxel, mundo, cámara y entorno espacial | Sustituir volumen real por una textura plana o una ilustración 2D |
| Diorama específico de O3DE | [o3de-diorama](https://github.com/nickschuetz/o3de-diorama), [Dioramas](https://github.com/blendi-remade/dioramas) | Escenas/dioramas y referencias de composición | Suponer compatibilidad con navegador sin verificar el formato y motor |
| Descubrir una librería para una necesidad específica | [Libraries.dev](https://libraries.dev/) | Encontrar alternativas según tarea | Añadir una dependencia sin revisar licencia, mantenimiento y bundle |
| Probar el resultado visual actual | Playwright o herramienta browser disponible; [protocolo de evidencia](EVIDENCIA-VISUAL.md) | Capturas, viewports, interacción y regresiones | Capturas antiguas, mocks o screenshots de un deployment con SHA desconocido |

## Ficha que debe añadirse para nuevas fuentes

Cada entrada nueva debe registrar:

- Nombre y URL exacta.
- Categoría: skill, herramienta ejecutable, biblioteca runtime, catálogo de assets, referencia visual, documentación o servicio de hosting.
- Problemas concretos que resuelve y disparadores de uso.
- Stack/plataforma compatibles y casos donde no conviene.
- Si ofrece assets reutilizables, ejemplos, código, documentación o solo inspiración.
- Licencia de la herramienta y, por separado, licencia de cada asset cuando corresponda.
- Método de incorporación y ubicación local.
- Fecha de revisión, versión/commit y estado: por revisar, revisada, disponible localmente, no compatible o descartada.
- Evidencia de prueba cuando sea código o herramienta ejecutable.

## Reglas anti-creación desde cero

- No dibujar manualmente un SVG, icono, sprite o efecto antes de buscar en assets locales y fuentes pertinentes.
- Para SVG, inspeccionar primero los archivos fuente y reutilizar/modificar el SVG original cuando su licencia y estructura lo permitan. Validar el resultado en el tamaño real del juego.
- Para sprites y animaciones, revisar atlas, nombres de frames, timings y sistema de importación antes de generar sustitutos.
- No usar una referencia como recurso final sin comprobar su licencia y procedencia.
- Si se decide crear desde cero, el informe debe indicar qué se buscó y por qué los candidatos no servían.
