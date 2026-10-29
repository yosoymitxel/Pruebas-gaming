# Protocolo de evidencia visual actual

## Objetivo

Toda afirmación del tipo «así quedó el juego» debe estar respaldada por capturas o grabaciones **reales, recientes y trazables al código probado**. Una captura antigua, un mockup, un screenshot de otra rama o una página de producción aún no desplegada no demuestra el resultado del cambio actual.

## Fuente de verdad: orden preferido

1. **Checkout local exacto** que contiene los cambios: iniciar el juego con su servidor de desarrollo/build real y automatizar el navegador con Playwright o una herramienta equivalente disponible.
2. **Preview de PR o deployment preview** cuya URL y commit asociado se hayan verificado.
3. **GitHub Pages / producción** solo después de comprobar que el deployment corresponde al SHA que se quiere demostrar y que la página carga esa versión.
4. Si no hay entorno ejecutable, informar BLOCKED y entregar lo que sí se comprobó. No usar una captura vieja como sustituto.

No basta con abrir la URL pública: Pages puede ir retrasado, servir caché o apuntar a otra rama. Verificar el SHA desplegado con el workflow/deployment o con un identificador de build visible y fiable. Si no se puede verificar, decirlo.

## Procedimiento obligatorio con Playwright

1. Identificar repositorio, rama, commit actual y cambios sin commit. Registrar `git rev-parse HEAD`, `git status --short` y, si hay cambios sin commit, un hash del diff o un patch archivado.
2. Arrancar la aplicación desde ese checkout con el comando real del proyecto. Esperar a que esté lista y confirmar la URL local exacta.
3. Abrir esa URL con Playwright. Registrar versión de Playwright/browser cuando esté disponible, errores de consola, errores de página y fallos de red relevantes.
4. Esperar a que el juego haya terminado de cargar: fuentes, sprites, SVG, texturas, escena/canvas y animaciones. No capturar durante una pantalla de carga salvo que esa sea la prueba.
5. Ejecutar interacciones reales del escenario probado: inicio, controles, estado o animación pertinente. Una captura estática por sí sola no demuestra que los controles funcionen.
6. Capturar cada viewport relevante con nombres inequívocos. Ejemplo: `artifacts/visual/<sha-corto>/desktop-1440x900-gameplay.png` y `mobile-390x844-gameplay.png`.
7. Guardar un manifiesto de evidencia junto a los artefactos, con SHA, estado del árbol, URL/origen, timestamp, viewport, navegador, ruta/escena, pasos, resultado y nombres de archivo.
8. Revisar visualmente las capturas recién creadas. Confirmar que reflejan el cambio solicitado y que no muestran una versión anterior, una pantalla vacía o un error oculto.
9. Si hay diferencias entre local y deployment, conservar ambas evidencias y explicar la diferencia; no mezclar capturas como si fueran el mismo build.

## Metadatos mínimos por captura

- Repositorio y rama/PR.
- SHA del commit probado.
- Estado del árbol de trabajo; si hay cambios sin commit, identificar el diff exacto.
- Origen completo: URL local o URL de preview/Pages.
- Prueba de correspondencia entre deployment y SHA, si se usa URL remota.
- Fecha y hora con zona horaria.
- Navegador/herramienta y versión, cuando esté disponible.
- Viewport y dispositivo simulado.
- Ruta, escena o estado del juego.
- Pasos de reproducción y resultado esperado/observado.
- Nombre/ruta del archivo original y confirmación de que existe.

## Regla contra evidencia obsoleta

- Capturar **después** de implementar, construir y levantar el entorno final de la tarea.
- No reutilizar capturas de conversaciones anteriores, de otra rama, de otro commit ni de una build anterior.
- Si el código cambia después de la captura, volver a ejecutar las pruebas visuales afectadas.
- No retocar, recomponer ni generar con IA las capturas usadas como prueba del producto. Se permiten anotaciones explicativas solo como copia adicional claramente marcada; conservar siempre el original.
- Las capturas deben mostrar el juego real, no solo el menú si se modificó gameplay, ni una escena distinta si se modificó otra.
- Cuando una animación sea el objetivo, una captura fija no basta: adjuntar vídeo/trace o una secuencia de frames que demuestre el movimiento, además de la captura de estado.

## Entrega de imágenes y ZIP

1. Priorizar artefactos reales adjuntos al informe o almacenados como artefactos de CI.
2. Si no se puede adjuntar directamente, dar el **enlace directo exacto** al archivo descargable; no enlazar a la portada del repo si se necesita el ZIP.
3. Para un archivo publicado en GitHub, usar la URL de descarga/release/artefacto real que se haya comprobado. No inventar nombres de ZIP ni rutas sandbox.
4. Si el proyecto no tiene un artefacto descargable, crear uno desde el build actual cuando el entorno lo permita, comprobar que existe y que abre, y publicar/enlazar ese artefacto. Si no se dispone de herramientas para crearlo o adjuntarlo, indicarlo claramente.
5. Registrar tamaño y SHA-256 del ZIP cuando se genere; comprobar que incluye el build probado y no secretos, cachés o dependencias innecesarias.
6. No declarar «descarga lista» hasta verificar el enlace y el archivo.

## Cuándo bloquear DESIGN_GATE

Marcar BLOCKED si el cambio visual requiere comprobación real y no hay entorno, navegador o deployment verificable. Marcar FAIL si la captura demuestra una regresión. No marcar PASS solo porque Playwright haya terminado sin excepciones: revisar el resultado visual y los criterios de aceptación.
