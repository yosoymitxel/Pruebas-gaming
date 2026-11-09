# Propuesta: lavado de cara total — «terror cozy» de isópodos

Estado: **propuesta**, no implementada. Alcance: reingeniería total (visual y código). Fecha: 09-11-2026. Base revisada: `main` en `b9174c6`.

Objetivo: convertir el terrario en un juego del género de *Cult of the Lamb* (gestionar una base acogedora + salir a
expediciones peligrosas), con combate en tiempo real con barra ATB al estilo de *FF VII Remake* contra las
**aberraciones** dibujadas a tinta por el dueño. Mecánicas y estructura de género, no copia de nombres, arte ni
interfaz de esos juegos.

## 1. Diagnóstico del estado actual

Capturas tomadas hoy en `localhost` (1280×800) sobre `b9174c6`; 0 errores de consola.

| Problema | Por qué no sirve para lo que se quiere |
|---|---|
| El terrario es una **caja de vidrio vista desde fuera** con props dispersos sobre una placa | La cámara está fuera del mundo. No hay suelo jugable, rejilla ni profundidad útil para colocar objetos, moverse o combatir. |
| Isópodos como mallas procedurales pequeñas entre helechos | No tienen cara, expresión ni silueta legible: no generan apego (la mitad «cozy») ni leen en combate. |
| El mapa de exploración es un **disco 3D con caminos dibujados** y 5 nodos | No es un mapa de ruta con ramas, capas y elección; el disco ocupa la pantalla y la información vive en una barra inferior apretada. |
| Interfaz tipo panel de administración (barra lateral de sliders, tarjetas de tienda) | Se lee como app de ajustes, no como juego. Rótulos, HUD y bandeja se pisan según el viewport. |
| Dos renderers (Diorama/Voxel) sobre el mismo estado | Duplica coste de mantenimiento y ninguno tiene identidad propia. |
| Sin combate, sin enemigos, sin tono de terror | Falta la mitad del género. |

Conclusión: **reingeniería total**, visual y de código (ver §1.1). Del código actual solo se rescatan ideas y
fórmulas sueltas (microclima de `simulation.js`, semilla de `expedition/rng.js`, textos de `expedition/content.js`)
pasándolas al nuevo registro; nada se conserva por inercia.

### 1.1 Calidad de código: por qué no se puede parchear

Medido en `src/` (6.483 líneas):

| Hallazgo | Evidencia | Principio que rompe |
|---|---|---|
| Archivo dios de render | `renderers.js` 1.428 líneas, una clase `TerrariumRenderer` con todo; Diorama y Voxel mezclados | ponytail: lo mínimo, una responsabilidad por módulo |
| Mismos datos repetidos | Nombres de objetos («Hojarasca», «Refugio», «Tronco»…) definidos en `simulation.js:378` y otra vez dos veces en `main.js:35` y `main.js:54` | Kurei: un solo registro en `src/data/`, el resto lo lee |
| Colores sueltos | 104 colores hex escritos a mano en JS, más los de `style.css` (1.657 líneas) | Kurei: paleta/tema centralizado; CSS solo con tokens |
| HTML en cadenas | Ayuda y modales como plantillas de texto en `main.js` (p. ej. `showHelp`) | Kurei: textos por `t()`, pantallas como componentes |
| `main.js` muta el dominio | Ya señalado en el plan de recuperación (P1) | Fuente única de verdad |
| Código comprimido ilegible | Funciones de una línea con nombres de 1–3 letras (`mesh(g,m,p)`, `rod(...)`) | antislop: legible antes que corto |

## 1.2 Arquitectura nueva (patrón KureiChaosChess)

```
src/
  data/        registros: aberrations.js, isopods.js (rasgos, cosméticos), items.js, buildings.js,
               rooms.js, map-nodes.js, rituals.js, palettes.js (cozy/terror), sfx.js
  game/        lógica pura y probada en Node: colony.js, combat.js (ATB, presión, aturdimiento),
               map.js (capas), run.js, base-grid.js, achievements.js, backup.js
  view/        three: stage.js (cámara+luz), ink-pass.js (shader), sprite.js (billboard+recortes),
               fx.js; nada de lógica de juego
  ui/          pantallas y HUD; leen datos de data/ y estado de game/
  i18n/        t() y catálogo
tools/
  check-registry.mjs   cada aberración con arte, patrón y entrada de bestiario; cada objeto con icono,
                       precio y texto; cada logro con quien lo otorga. Sale con 1 si falta algo.
  combat-selfcheck.mjs cada aberración vencible con el equipo inicial en las 3 dificultades
```

Reglas: añadir una aberración u objeto = **una entrada en `src/data/`** + su dibujo; nada más que tocar. Colores
solo desde `palettes.js`/tokens CSS. Ninguna función de `view/` decide daño, botín o victoria. Archivos < 400
líneas; si crecen, se parten por responsabilidad, no por tamaño.

Stack: se mantiene Vite + Three (WebGL hace falta para el shader de tinta); la UI pasa a Preact + htm como en
Kurei para poder portar pantallas (ajustes, logros, galería) casi tal cual.

## 2. Dirección visual: «cuaderno maldito»

La pieza que hace único al juego son los dibujos del dueño: tinta negra, punteado (stippling), sombreado a trama y
garabato. El juego entero debe parecer **dibujado en ese cuaderno**.

- **Mundo 2.5D**: escenario 3D low-poly (Three.js, ya en el proyecto) con cámara fija inclinada ~40°, ligeramente
  perspectiva, como un diorama visto desde arriba. Personajes, enemigos y props como **sprites planos de papel**
  (billboards) que siempre miran a cámara y proyectan sombra. Es la técnica de los juegos del género: barato,
  legible en móvil y permite usar dibujos escaneados tal cual.
- **Shader de tinta** en postproceso: contorno por profundidad/normales + sombreado por punteado (dither de puntos
  en función de la luz) + grano de papel. Con eso el suelo 3D y los sprites escaneados comparten lenguaje.
- **Dos caras del mismo mundo**:
  - *Cozy* (base): papel cálido, acuarela tenue sobre la tinta (musgo, ámbar, rosa óxido), luz de vela.
  - *Terror* (expedición): el color se retira, queda tinta y papel frío; manchas de tinta que respiran en los
    bordes de pantalla, viñeta, líneas que tiemblan (*boiling lines*, 3 fotogramas a 8 fps).
- **Isópodos**: chibi, ojos grandes, antenas expresivas, caparazón con color/patrón personalizable. Contraste
  máximo con las aberraciones, como en el género (lo tierno vs. lo grotesco).
- **Voxel** actual se retira; una versión voxel o pixel art de personajes queda abierta (§9).

Referencias aplicables: `dioramas` (composición, luz, capas), `pixelfx`/Sprite Fusion (VFX de golpes con
anticipación-impacto-recuperación; adaptar a tinta en vez de píxel), `vfx-js` (distorsión de pantalla en el modo
terror), `emil-design-eng` (curvas y duraciones de UI), Justinmind (HUD de juego).

## 3. Bucle de juego

Referencia principal: *Cult of the Lamb* (estructura, no arte ni nombres). Concepto de mundo: **islas flotantes
pequeñas**, cada una con personalidad, clima y generación procedural (patrón de climas de KureiChess). Sensación
constante de diorama: todo es pequeñito, pero legible.

```
TERRARIO (base, núcleo)  ◄──►  MAPA EXTERIOR (islas)  ──►  MAPA INTERIOR (niveles de combate)  ──►  JEFE
 colonia, construir,            viajar entre islas,          ramas por capas, salas, botín,
 decorar, rituales              minijuegos, recursos,        isópodos perdidos que se rescatan
                                comercio, eventos
```

Dos mapas distintos, como en el género:
- **Exterior**: archipiélago de islas flotantes; cada isla es un diorama con minijuegos (pesca, recolección,
  carreras…), recursos y PNJ. Se recorre libre o por saltos entre islas.
- **Interior**: el nivel de combate; mapa de ramas por capas (§3.2) que lleva sala a sala hasta el jefe.

**Recogibles**: isópodos (se rescatan/reclutan en expediciones y se suman a la colonia) y recursos (hojarasca,
musgo, esporas, cal, ámbar…) que alimentan construcción, rituales y cartas. Todo declarado en `src/data/`.

### 3.1 Base: el terrario como asentamiento
- Es el **núcleo** y debe ser **grande**: varias zonas desbloqueables (ampliar el terrario), no la caja pequeña
  actual. Las perillas de humedad/temperatura sin efecto se eliminan; el microclima sale de lo que construyes.
- **Rejilla real** (celdas, ocupación por huella de cada pieza, capas suelo/objeto/decoración) con validación
  verde/rojo y rotación en 4 pasos. La cámara va dentro del terrario; el vidrio es marco y límite físico.
- **Colisiones correctas**: mundo 2D en el plano del suelo (círculos y cajas alineadas, separación por subpasos;
  patrón de `physics.js` de KureiChess). El render 3D solo dibuja; nunca decide colisiones.
- Colocar con arrastre: refugios, comederos, hongos de cultivo, charca, altar de musgo, decoración. Validación de
  casilla (verde/rojo) y rotación en 4 pasos.
- Colonia con nombre y rasgos por isópodo; necesidades: **humedad, hambre, calma** (la calma baja con cada
  aberración vista y sube con rituales y decoración). La simulación ya existente alimenta humedad/temperatura.
- **Rituales** semanales (muda colectiva, banquete de hojarasca, vigilia) con efecto en la siguiente expedición.
- Personalización: color y patrón del caparazón, accesorios (gorritos, bufandas de líquen), nombre; nada de
  compra con dinero real.

### 3.2 Mapa de ruta (ramas por capas)
- 6–8 capas por zona, 2–4 nodos por capa, conexiones sin cruces; se ve el mapa entero y solo se avanza hacia
  arriba. Tipos: combate, élite, botín, refugio (curar), evento, tienda, jefe.
- Dibujado como **página de cuaderno** (líneas a tinta, iconos a mano, mancha donde está el jefe), en 2D/SVG.
  Barato, legible y sin el disco 3D actual.
- Generación con la semilla de `expedition/rng.js`; el contenido de `expedition/content.js` se reparte por tipo.

### 3.3 Salas
- Cada nodo abre una sala-diorama pequeña (piedra musgosa, tronco podrido, fruta caída… ya existen como biomas en
  `content.js`). El equipo se mueve libre; objetos interactuables marcados con un trazo que tiembla.

## 4. Combate (nuevo): tiempo real + ATB + pausa táctica

Inspirado en el modelo de FF VII Remake, adaptado a táctil:

- **Un isópodo principal + dos de apoyo** (decidido). Controlas al principal; los de apoyo actúan solos y sus
  habilidades se ordenan desde la pausa táctica.
- **Cartas** (sistema de KureiChess): mazo de mejoras que se gana durante la expedición y modifica ataques,
  habilidades y reglas del nivel.
- **Ataque básico** en tiempo real (toque/tecla) y **esquiva/rodar** (gesto de bola: el isópodo se enrolla,
  invulnerable breve). Cada básico llena la **barra ATB** (2 segmentos).
- Gastar ATB en **habilidades** y **objetos**. Abrir el menú de habilidades **ralentiza el tiempo al 10 %** (modo
  táctico): en móvil es lo que hace jugable el combate.
- **Presión y aturdimiento**: cada aberración tiene una barra de aturdimiento; ciertas habilidades la llenan más
  si la aberración está en estado «presionada» (p. ej. mientras carga un ataque). Aturdida, recibe daño ×1,6.
- **Afinidades** por elemento del terrario: humedad, hongo, tierra, luz. Con escaneo (habilidad «Observar») se
  revelan en el bestiario.
- **Lecturas claras**: cada ataque enemigo con anticipación visible (≥ 400 ms), zona marcada en el suelo con tinta,
  impacto con *hitstop* de 60–90 ms y sacudida leve.

### 4.1 Aberraciones (a partir de los dibujos)

| Dibujo | Nombre de trabajo | Rol | Patrón |
|---|---|---|---|
| Mujer de dos cabezas, una colgando | **La Gemela** | Jefe zona 1 | Dos cabezas con barra propia. La cabeza viva ataca con zarpas; la colgante grita (cono que baja la calma). Al caer una cabeza, la otra entra en furia. |
| Araña-boca con tentáculos que sujeta un cráneo | **El Comensal** | Jefe zona 2 | Boca central = punto débil solo al abrirse. Tentáculos agarran a un isópodo (rescatarlo pegando al tentáculo). Patas clavan el suelo y dejan charcos. |
| Cabeza de cono, garras largas, agachado | **El Bufón** | Élite | Rápido, embiste en línea recta tras agacharse (anticipación clara); queda clavado = presionado. |
| Muchos ojos, báculo-hoz, patas múltiples | **El Segador** | Élite / jefe zona 3 | Invoca larvas, guadaña en arco amplio; los ojos son puntos débiles que se apagan uno a uno. |

Hay **~19 dibujos**; el registro `src/data/aberrations.js` se diseña para ~20 entradas con rol por entrada
(`normal`, `élite`, `jefe`) y reaparición entre zonas. Cada entrada: arte, patrón, afinidades, entrada de
bestiario; `check-registry` falla si falta algo.

Arte: **de momento los dibujos se usan tal cual** (concept art en `art/aberraciones/`). Más adelante se decide la
versión integrada (voxel, pixel art o recortes del escaneo); el registro guarda la ruta del arte para cambiarla sin
tocar lógica.

## 5. Interfaz

Problemas actuales: rótulos que se pisan, bandeja móvil cortada, barra lateral de administración, información
importante en letra pequeña.

- **HUD mínimo de juego**: corazones/vida del equipo abajo-izquierda, ATB bajo cada retrato, botones de acción en
  arco abajo-derecha (táctil, ≥ 48 px), pausa arriba-derecha. Nada de barra lateral.
- **Menús como objetos del mundo**: el bestiario y la galería son el propio cuaderno; los ajustes, una hoja suelta.
- Tipografía: una manuscrita legible para títulos y una sans para datos; números tabulares.
- Animación de UI: entradas 180–240 ms con `ease-out` fuerte, nada de rebotes en menús; las manchas de tinta solo
  en transiciones de escena. Respetar `prefers-reduced-motion` (quitar boiling y temblores).
- Un solo sistema de capas (z-index por tokens) y un solo contenedor de rótulos para que no se pisen.

## 6. Qué se reutiliza de KureiChaosChess

Stack distinto (Kurei: Preact + htm sin build; terrario: Vite + Three). Se portan **módulos de lógica y datos**,
no pantallas enteras.

| Sistema en Kurei | Uso en el terrario |
|---|---|
| `src/game/achievements.js` (grupos, secretos, `bump`/`collect`) | Logros: colonia, bestiario, sin recibir daño, rituales. |
| `src/game/backup.js` (exportar/importar código, slots) | Cierra la brecha P1 de persistencia (slots, backup, import seguro). |
| `src/i18n` (`t()`, `localize()`) | Catálogo de textos; cierra la brecha «Idiomas». |
| `src/ui/sfx.js` (recetas sintetizadas, volúmenes) | Efectos con base sintetizada; luego grabados. |
| `src/ui/gamepad.js` | Mando en combate. |
| `src/ui/screens/gallery.js`, `achievements.js` | Patrón de galería/bestiario y pantalla de logros. |
| `src/ui/moments.js` | Cinemáticas de aparición de jefe. |
| `src/game/run.js`, `screens/map.js` | Lógica de run y mapa por capas (ya resuelto para el roguelike de ajedrez). |
| `src/data/themes.js`, `weather.js` | Patrón de registro central de temas/clima. |
| Ajustes (volumen, movimiento reducido, idioma, pantalla completa) | Misma pantalla y mismas claves de preferencia. |

## 7. Recursos externos revisados

| Fuente | Qué aporta | Decisión |
|---|---|---|
| `Donchitos/Claude-Code-Game-Studios` | Skills `vertical-slice`, `team-combat`, `art-bible`, `playtest-report`, `balance-check`, `smoke-check` | Usar como flujo de trabajo (biblia de arte + slice vertical antes de producir). |
| `gamedev-skills/awesome-gamedev-agent-skills` | `game-feel`, `camera-systems`, `ai-behavior-trees-utility-ai`, `procedural-gen`, `game-ui-ux`, `save-systems`, `input-systems` | Leer antes de cada pieza correspondiente. |
| `patch-gg/pixelfx` (MIT) | 244 efectos en código, «moves» con anticipación-impacto-recuperación | Tomar timings y estructura de golpes; redibujar a tinta. |
| `blendi-remade/dioramas`, `o3de-diorama` | Composición y luz de diorama | Referencia de método; O3DE no corre en navegador. |
| `vfx-js` | Shaders sobre elementos DOM | Para distorsión de pantalla en el modo terror. |
| `emilkowalski/skills` (`emil-design-eng`) | Curvas y duraciones de UI | Aplicar en todos los menús. |
| `web-design-guidelines`, `impeccable`, `taste`, `anti-slop` | Auditoría de interfaz y accesibilidad | Puerta DESIGN_GATE al cerrar cada fase. |
| Lightswind, SmoothUI, Componentry, RareUI, recent.design, interfaceingame.com | Patrones de UI | Solo referencia; React/Tailwind no entran en el runtime. |
| `svgsilh.com` | Siluetas SVG | Para iconos del mapa si no se dibujan a mano. |
| `claude-pxl` | Pixel art | No encaja con la dirección a tinta; descartado salvo tema píxel futuro. |

## 8. Fases (cada una jugable y verificable)

0. ✅ (10-11-2026, `next/`) **Esqueleto nuevo**: carpetas data/game/view/ui, registro + `check-registry`, i18n, paleta; juego viejo intacto en otra ruta hasta reemplazarlo.
1. **Slice vertical de render** (decide todo lo demás): cámara inclinada dentro del terrario, suelo
   en rejilla, shader de tinta + punteado, un isópodo chibi y El Bufón como sprites recortados, 360×800 y PC a
   ≥ 50 fps en móvil medio. Si no convence, no se avanza.
2. **Combate mínimo**: 1 isópodo, básico + esquiva + ATB + 2 habilidades + pausa táctica contra El Bufón.
   Selfcheck del combate (daño, aturdimiento, ATB) en Node.
3. **Mapa interior** por capas en 2D cuaderno; salas con 1–2 combates.
3b. **Mapa exterior**: 2–3 islas flotantes procedurales con clima y un minijuego.
4. **Terrario**: rejilla, colisiones, ampliación por zonas, recogibles, necesidades, personalización.
5. **Jefes**: La Gemela y El Comensal; cinemática de aparición.
6. **Transversales portados**: ajustes, logros, galería/bestiario, i18n, export/import, sonido.
7. **Pulido**: auditoría de interfaz y accesibilidad, rendimiento móvil, pruebas Playwright por pantalla.

## 9. Decisiones del dueño (10-11-2026)

- Equipo: 1 principal + 2 de apoyo.
- Dibujos: tal cual por ahora; versión voxel/pixel/recortes se decide después.
- ~19 aberraciones recurrentes; rol (jefe/élite/normal) por definir.
- Nombre: «Terrario de isópodos»; el terrario es el núcleo.
- Código actual: no cumple estándares ni tiene estructura fiable; no se da nada por funcionando. Referencia de
  calidad y estructura: KureiChaosChess. Reglas: ponytail, antislop, web-game-toolkit.
- Assets externos bienvenidos si encajan (licencia revisada). Skills de diorama/voxel como referencia visual, no
  de interacción.
