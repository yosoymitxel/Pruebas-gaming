# Spike técnico de render — Terrario de isópodos

**Estado:** plan de prueba; aún no ejecutado en navegador. No declarar integración ni compatibilidad demostradas.

## Objetivo

Demostrar que una única instancia de `TerrariumState` puede representarse con Diorama y Voxel, y cambiar de modo sin reiniciar, duplicar ni perder entidades.

## Base técnica verificada en documentación oficial

- Three.js documenta instalación con npm y bundler (Vite), `WebGLRenderer` y addons importados explícitamente.
- `OrbitControls` cubre órbita, zoom y controles táctiles; requiere llamar `update()` en el bucle cuando se usa damping o auto-rotación.
- Fuentes: [instalación oficial de Three.js](https://threejs.org/manual/pages/installation.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer), [OrbitControls](https://threejs.org/docs/pages/OrbitControls).

## VoxPix: estado de verificación

El enlace indicado es [andyeswong/voxpix](https://github.com/andyeswong/voxpix). La búsqueda web realizada no permitió recuperar de forma fiable el README, API, licencia ni un ejemplo ejecutable de ese repositorio. Por tanto, **no se aprueba ni se descarta la integración** y no se incorpora dependencia todavía. Antes de decidir, inspeccionar el repositorio directamente: licencia en raíz, package metadata, exports públicos, método de render, manejo de cámara, requisitos de runtime y demo mínima. Si no ofrece una API compatible, el renderer voxel se implementará sobre Three.js sin forzar una dependencia.

## Prototipo mínimo (sin gameplay completo)

1. Crear una app Vite dentro de esta carpeta con dependencia Three.js fijada en `package.json` y lockfile.
2. Renderizar un recipiente rectangular con sustrato volumétrico, un isópodo provisional y cámara orbital.
3. Implementar recipiente cilíndrico usando la misma descripción lógica de límites que la vista 3D.
4. Definir `TerrariumState` como objeto independiente del renderer con IDs estables, reloj, hábitat, recursos y posiciones.
5. Crear dos adaptadores de presentación: `DioramaRenderer` con representación 3D y `VoxelRenderer` con sprite/atlas voxelizado con transparencia dentro de la escena 3D.
6. Cambiar de renderer mediante una única función que destruya únicamente recursos de presentación; no reemplazar ni mutar el estado de dominio.
7. Ejecutar en escritorio y viewport móvil, inspeccionar consola y WebGL, y guardar capturas reales vinculadas al commit.

## Pruebas de aceptación del spike

- [ ] Arranca con `npm ci` y `npm run dev`; build con `npm run build`.
- [ ] Rectangular y cilíndrico se ven completos con cámara orbital.
- [ ] El modo Diorama muestra un organismo con volumen 3D.
- [ ] El modo Voxel muestra un sprite voxelizado con transparencia y profundidad/oclusión coherentes; no es una captura 2D plana de todo el campo.
- [ ] Tras alternar Diorama → Voxel → Diorama 20 veces, el snapshot de estado de dominio permanece idéntico salvo preferencias explícitas de presentación.
- [ ] No aumentan la cantidad de entidades, listeners ni instancias de simulación al cambiar modo.
- [ ] Pausa y reloj de prueba demuestran que el renderer no controla el tiempo de simulación.
- [ ] Ratón y tacto permiten rotar y hacer zoom sin bloquear los controles de UI.
- [ ] Capturas reales desktop/móvil y logs se adjuntan al reporte con el SHA exacto probado.

## Decisión tras la prueba

- **PASS:** continuar con modelo de dominio/reloj y pruebas deterministas.
- **FAIL de VoxPix:** usar adaptador voxel propio sobre Three.js, documentar causa y licencia.
- **FAIL de WebGL o rendimiento móvil:** investigar degradación/restricciones antes de ampliar alcance; no construir el juego completo todavía.

## Límite de alcance

No añadir reproducción, mortalidad, IA ecológica completa, guardado, menús definitivos ni assets finales durante este spike. No declarar la aplicación jugable basándose solo en que la escena renderice.
