# Decisión de render: hábitat naturalista 3D + modo Voxel

**Revisión:** 2026-10-30. **Estado:** reconstrucción visual en curso; no declarar aprobado el DESIGN_GATE, GAMEPLAY_GATE ni el MVP hasta disponer de build, capturas reales y ejecución de Playwright asociadas al SHA exacto.

## Decisión actual

- Mantener Three.js como backend 3D provisional. El problema comprobado del resultado anterior estaba en la autoría del mundo —suelo plano, objetos primitivos dispersos, vegetación esquemática y vidrio sin lectura física— y no demuestra que Three.js sea incapaz de representar el juego.
- Mantener Diorama y Voxel como modos paralelos sobre un único estado de dominio. El modo Voxel actual todavía utiliza una textura Canvas aplicada a `THREE.Sprite`; no es voxel volumétrico ni un atlas importado.
- Se admiten estilos y pipelines adicionales. No se bloqueará la dirección artística a la versión antigua del Diorama ni se sustituirá Three.js sin comparar una escena equivalente, con mismas entidades, cámara y viewport, ejecutada en navegador.
- El Diorama prioritario es un microhábitat naturalista de escala miniatura. La lectura visual del ecosistema tiene prioridad sobre adornos de interfaz o postprocesado.

## Referencias y skills aplicadas

- [Dioramas / Bell & Moss](https://github.com/blendi-remade/dioramas): referencia de globo de vidrio, condensación, presentación de terrario, microhábitat y corte de capas de sustrato. Se reutiliza como referencia técnica; no se copia su web-app ni se afirma que sus GLB estén integrados.
- [Three.js AAA Graphics Builder](https://www.skills.sh/majidmanzarpour/threejs-game-skills/threejs-aaa-graphics-builder): autoría de silueta, kit de objetos, materiales, iluminación y presupuesto.
- [Procedural Vegetation](https://www.skills.sh/scottstts/threejs-awesome-graphics-agent-skills/threejs-procedural-vegetation): jerarquía de crecimiento vegetal y frondas.
- [Procedural Materials](https://www.skills.sh/scottstts/threejs-awesome-graphics-agent-skills/threejs-procedural-materials): identidad material y acoplamiento suelo/humus/musgo.
- [Three.js Visual Validation](https://www.skills.sh/linegel/threejs-complete-set-of-skill/threejs-visual-validation): semillas, cámaras fijas, baseline sin postprocesado, evidencia temporal y métricas.
- Estas cuatro skills son externas consultadas desde skills.sh; no se marcan como instaladas dentro de `.agents/skills/`.

## Kit visual nuevo

`src/terrarium-art.js` crea una escena determinista de bosque húmedo y la expone como un grupo de contenido independiente del recipiente:

- tres estratos físicos de sustrato y una superficie de humus con relieve;
- hojas individuales instanciadas;
- helechos con raquis curvos y frondas;
- almohadillas y brotes de musgo;
- rocas, madera hueca, raíces y arco-refugio;
- agrupaciones pequeñas de setas;
- materiales compartidos y texturas generadas localmente, sin llamadas a servicios externos.

El renderer coloca el mismo interior en el recipiente rectangular, cilíndrico o esférico. Las posiciones del isópodo y de los recursos se apoyan en la misma función de altura del terreno para no flotar sobre el suelo.

## Límites que siguen abiertos

- El isópodo sigue siendo procedural; las placas/patas actuales necesitan una pasada de anatomía, silueta y locomoción más naturalista.
- La simulación todavía no ofrece locomoción guiada por necesidades con navegación alrededor de raíces, troncos y plantas.
- El contenido interactivo del jugador todavía no comparte un catálogo de modelos de calidad con la escena decorativa.
- No hay una biblioteca de especies vegetales, otros artrópodos ni modelos GLB integrados.
- El globo utiliza geometría transparente simplificada, no transmisión física completa; no añadir transmisión cara antes de probar su beneficio frente a legibilidad y coste móvil.

## Puertas de aceptación

1. CODE: `npm test`, `npm run build`, cero errores de carga/importación y limpieza de geometrías/materiales al alternar formas/modos.
2. GAMEPLAY: entrada al terrario, colonia visible, cámara, pausa, selección de modo y guardado conservan el dominio.
3. DESIGN: capturas reales del build bajo la ruta de Pages en los tres recipientes, escritorio y móvil; la escena debe mostrar capas, hojarasca, frondas, musgo, madera y roca como volumen perceptible.
4. INTEGRATION: probar el artefacto de producción servido bajo `/Pruebas-gaming/games/terrario-isopodos/`, incluyendo recuperación cuando WebGL no está disponible.

No se afirma que estas puertas estén aprobadas hasta que el workflow genere evidencia nueva.

## Historial de implementación

- Antes de esta revisión, Diorama utilizaba esferas/hojas cónicas y helechos esquemáticos; el terreno base era plano y el recipiente solo tenía dos formas documentadas.
- El cambio visual nuevo está en la rama de larga vida `feat/isopod-render-spike`. No se ha mergeado a `main` ni se da por publicado.
- La decisión de conservar Three.js es provisional y reversible. Una comparación futura podrá añadir un modo 2.5D/voxel alternativo, pero no reducir a 2D la experiencia principal 3D.
