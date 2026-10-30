# Decisión de render: microhábitat naturalista 3D + modo Voxel

**Revisión:** 2026-10-30. **Estado:** implementación visual y simulación en revisión; CODE y build tienen checks automatizados, pero el DESIGN_GATE y el MVP siguen **NO APROBADOS** hasta revisar capturas nuevas del SHA final en los tres recipientes y ambos viewports.

## Fuente de verdad y decisión de backend

- Three.js 0.180.0 sigue siendo el backend 3D provisional, desacoplado del dominio.
- Diorama y Voxel comparten exactamente el mismo estado, reloj, entidades, necesidades, recursos y persistencia.
- Diorama representa al isópodo con una cúpula cuticular continua, siete suturas dorsales, catorce patas articuladas y antenas.
- Voxel representa al isópodo con geometría volumétrica formada por bloques instanciados. No es un sprite plano ni un modelo 3D convencional suavizado.
- Los dos modos pueden cambiar durante la partida sin reconstruir el dominio. El modo Voxel no debe convertirse en una segunda simulación.
- El interior naturalista se crea como grupo separado del recipiente. Las formas rectangular, cilíndrica y esférica comparten materiales, relieve y reglas de altura, pero el encuadre/recipiente puede adaptarse a cada forma.
- La dirección visual se puede cambiar si mejora sustancialmente la lectura del ecosistema; no se conserva una forma primitiva solo por compatibilidad histórica.

## Referencias y skills aplicadas

- [Dioramas / Bell & Moss](https://github.com/blendi-remade/dioramas): referencia para vidrio, presentación de terrario, microhábitat y corte de capas. No se afirma que sus modelos GLB estén integrados.
- [Three.js AAA Graphics Builder](https://www.skills.sh/majidmanzarpour/threejs-game-skills/threejs-aaa-graphics-builder): silueta, kit de objetos, materiales, iluminación y presupuesto.
- [Procedural Vegetation](https://www.skills.sh/scottstts/threejs-awesome-graphics-agent-skills/threejs-procedural-vegetation): jerarquía de crecimiento y frondas.
- [Procedural Materials](https://www.skills.sh/scottstts/threejs-awesome-graphics-agent-skills/threejs-procedural-materials): relación de materiales entre suelo, humus y musgo.
- [Three.js Visual Validation](https://www.skills.sh/linegel/threejs-complete-set-of-skill/threejs-visual-validation): semillas, cámaras fijas, evidencia temporal y métricas.
- [Game AI](https://github.com/gamedev-skills/awesome-gamedev-agent-skills): necesidades, selección de objetivos, navegación y pruebas deterministas.
- [Game Feel / Physics Tuning](https://github.com/gamedev-skills/awesome-gamedev-agent-skills): lectura del movimiento, separación y respuesta gradual.
- Las skills externas se consultaron; no se marcan como instaladas en `.agents/skills/`.

## Escena actual

`src/terrarium-art.js` genera una escena determinista con:
- tres estratos de sustrato, humus irregular y relieve medible;
- hojarasca individual instanciada;
- helechos con raquis curvos y frondas;
- cojines irregulares de musgo con microhojas;
- rocas pequeñas de paleta mineral;
- tronco y arco de raíces con sección irregular y taper;
- agrupaciones pequeñas de setas;
- texturas generadas localmente, sin servicios externos.

La versión de arte en desarrollo es `woodland-diorama-v11`. La pasada v11 compacta el globo con una base truncada que coincide con el radio del suelo, reforma el Voxel como un caparazón por secciones, acorta las patas laterales del Diorama, aclara la cutícula y elimina el patrón de ondas repetitivas del suelo. La revisión v9 agrupa la hojarasca, diversifica las frondas, añade rosetas de sotobosque, corrige el albedo del sustrato y elimina la mitad frontal del aro del tarro cilíndrico para que no cruce la colonia. Sus estadísticas (frondas, hojas, musgo, relieve y draw calls) se exponen al navegador para QA. No equivalen por sí solas a aprobación visual.

El tarro cilíndrico se está llevando a una proporción baja y ancha para evitar un volumen vacío de vidrio que domine al ecosistema. El vivario rectangular conserva más altura y el globo debe leerse como recipiente esférico cerrado.

## Simulación actual y límites reales

- La selección de comida/refugio usa utilidades de energía, hidratación, luz, estrés y distancia, con histéresis para que el objetivo no cambie por pequeñas fluctuaciones.
- La conglobación defensiva tiene recuperación y enfriamiento; no debe quedar como estado permanente.
- El descanso en refugio recupera energía/hidratación y las entidades se separan para evitar apilamiento.
- La navegación aplica desvío alrededor de recursos que actúan como obstáculos (piedras, setas, plantas y refugios colocados).
- La navegación todavía no usa colisionadores de cada raíz, fronda o roca generada proceduralmente en el renderer. Ese acoplamiento sigue pendiente.
- La locomoción visual es procedural; todavía necesita comparación con referencias reales de *Armadillidium vulgare*, ajustes de postura y validación a tamaño de cámara.
- No hay una biblioteca de modelos GLB integrados ni más especies vegetales/animales terminadas.
- El vidrio actual es transparente simplificado, no transmisión física completa. El globo usa una esfera truncada en la base para que el disco de sustrato no sobresalga del volumen de vidrio. No se añade transmisión costosa sin medir beneficio de legibilidad en móvil.

## Puertas de aceptación

1. **CODE:** `npm test`, build de producción, cero errores de carga y limpieza de geometrías/materiales al alternar formas/modos.
2. **GAMEPLAY:** necesidades, comida, refugio, defensa, recuperación, navegación, pausa, selección visual y guardado conservan el mismo dominio.
3. **DESIGN:** capturas reales de Diorama y Voxel en escritorio y móvil, con los tres recipientes. El terrario debe leerse como ecosistema y el isópodo debe ser reconocible a escala normal de juego.
4. **INTEGRATION:** build de producción servido bajo `/Pruebas-gaming/games/terrario-isopodos/`, incluyendo recuperación sin WebGL.
5. **PERFORMANCE:** comprobar draw calls, triángulos, memoria y tiempos en viewport móvil con colonia y recursos reales.

No se declara aprobado ningún gate hasta que la evidencia esté ligada al SHA final y haya revisión visual humana del resultado.

## Historial

- PR #17 integró una primera reconstrucción de escena, cuerpo articulado y modo Voxel volumétrico.
- El siguiente ciclo se trabaja en la misma rama de larga vida `feat/isopod-render-spike`, reanclada al commit integrado, para no duplicar cambios anteriores.
- La evidencia del SHA `914953f` mostró debilidades que el smoke no capturaba: aro frontal del tarro, repetición vegetal y sustrato oscuro. La evidencia v10 confirmó que el Voxel aún se leía como una pila de bloques y que el globo dejaba demasiada cámara vacía; la v11 corrige esos perfiles, pero sigue pendiente una nueva revisión visual humana.
- No se ha aprobado el MVP completo ni se considera terminado el arte.
