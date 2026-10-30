# Decisión de render: diorama web + representación voxelizada

**Fecha de revisión:** 2026-10-29. **Estado:** renderer integrado; validación de rendimiento pendiente de la última corrección.

## Referencias consultadas

- [Dioramas](https://github.com/blendi-remade/dioramas): referencia de composición de escena, iluminación y materiales. No se copia el framework de landing pages ni sus assets.
- [Diorama para O3DE](https://github.com/nickschuetz/o3de-diorama): referencia específica de O3DE; no se importa como dependencia porque este proyecto es web y usa Three.js.
- [Three.js](https://threejs.org/): runtime 3D web.
- El catálogo del proyecto requiere consultar primero `docs/CATALOGO-REFERENCIAS.md` y los assets locales antes de añadir un pipeline visual o generar sustitutos.

## Cómo está implementado realmente

- **Diorama:** el isópodo se construye con geometría orgánica Three.js.
- **Voxel:** el renderer dibuja una textura pixelada en un Canvas 2D y la aplica a `THREE.Sprite` dentro de la misma escena Three.js. Por tanto, el sprite participa de la escena/cámara 3D, pero **no es un modelo de vóxeles volumétricos ni un atlas/spritesheet importado**. El pipeline de assets especificado permanece pendiente.
- Ambos modos comparten IDs, posiciones y estado de dominio. Cambiar de modo reconstruye la presentación y no debería reiniciar ni duplicar la colonia.
- Las formas rectangular y cilíndrica comparten dimensiones/límites definidos en `src/habitat.js`. El renderer construye las paredes de vidrio y los bordes superiores; la simulación restringe las entidades al suelo interior.
- La cámara permite órbita por arrastre, zoom por rueda/gesto táctil y botones. La rotación automática es opcional.
- Las paredes usan sombreado estándar transparente, no transmisión física. El panel inferior se coloca debajo del sustrato y las paredes rectangulares usan menor opacidad para que el vidrio no vele la escena. La cámara adapta su distancia a la forma y al viewport; el rango de niebla sigue esa distancia para no fundir el contenido con el fondo en móvil.

## Decisiones explícitas

No se agrega una librería de runtime, postprocesado ni assets externos por defecto. Antes de usar modelos, sprites o efectos nuevos, se deben revisar recursos locales, compatibilidad, procedencia y licencia. La dirección visual del juego sigue siendo la de un terrario naturalista, no una landing page genérica.

## Estado de validación

En la revisión actual, tests unitarios, build y smoke de Playwright pasan: [run 40979376927](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979376927). Se revisaron capturas reales nuevas en escritorio y móvil; ambas formas caben en el viewport y el rectángulo ya no queda lavado por la niebla. Se conserva como pendiente el uso de atlas/spritesheets versionados para Voxel.

El inventario de sistemas pendientes y las cuatro puertas de calidad se mantienen en [PLAN-RECUPERACION-MVP.md](PLAN-RECUPERACION-MVP.md) y [QUALITY-REPORT.md](QUALITY-REPORT.md).
