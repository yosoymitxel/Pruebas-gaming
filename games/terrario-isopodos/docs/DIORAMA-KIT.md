# Motor compartido de dioramas

**Estado — 30-10-2026:** el terrario, los recursos de la tienda, el mapa de expedición y sus encuentros consumen la misma API de composición. El objetivo no es repetir una escena completa dentro de cada objeto: el kit distingue entre una superficie de microhábitat y piezas locales que se colocan encima.

## Contrato de escena

`createDioramaKit({ shape, radius, seed, paletteOverrides })` devuelve un kit determinista con:

- `createBase(radius, options)`: suelo orgánico con relieve procedural, corte lateral de estratos y soporte delgado. El mesh principal se identifica como `organic-diorama-surface`; la cara de tierra expuesta, como `soil-strata-cutaway`.
- `surfaceHeightAt(x, z)`: altura del terreno para colocar senderos, recursos, hotspots y actores sin que floten ni se entierren.
- `surfaceOffset`: plano base Y de la superficie. Por defecto es `.078` para los cortes de suelo de expedición; el terrario principal usa `.19`, que coincide con el piso del hábitat.
- `addAsset(parent, type, options)`: inserta una pieza y **siempre devuelve un `THREE.Group`** propietario de sus geometrías. No importa si internamente genera instancias, mallas o varios objetos.
- `addBiome(parent, id, options)`: compone un conjunto declarativo de piezas físicas y devuelve un grupo de composición.

La misma semilla produce la misma distribución. Las pantallas no deben reconstruir materiales, tamaños ni primitivas por su cuenta.

## Piezas y perfiles

| Asset | Uso |
|---|---|
| `leaf-litter`, `groundcover` | Hojarasca y cobertura vegetal; admiten dispersión global o un montón local |
| `fern-bed`, `forest-rosettes` | Helechos y rosetas; admiten piezas locales para tienda y lugares |
| `moss-bed` | Cojines irregulares y hojillas de musgo |
| `rock-scatter` | Rocas deformadas; distribución global o agrupación local |
| `fallen-log`, `bark-shelter`, `root-arch` | Tronco, refugio hueco y raíces |
| `mushroom-cluster` | Setas con tallo, láminas y sombrero |
| `fallen-fruit`, `compost-pile` | Fruta caída y materia orgánica |
| `mites`, `dew`, `web` | Detalles de microhábitat y encuentros |

Perfiles de bioma disponibles: `woodland-map`, `garden-entry`, `mossy-stone`, `rotting-log`, `rotten-fruit` y `compost-bin`.

## Ejemplo

```js
import { createDioramaKit } from "./diorama-kit.js";

const kit = createDioramaKit({
  shape: "esferico",
  radius: 2.75,
  seed: 20261030,
  surfaceOffset: 0.078,
  paletteOverrides: { moss: 0x6f8b53, rock: 0x899184 }
});

const scene = kit.createBase(2.75);
kit.addAsset(scene, "moss-bed", {
  position: [-0.4, 0, 0.2],
  groundY: kit.surfaceHeightAt(-0.4, 0.2),
  local: true,
  scale: 0.9,
  density: 0.8
});
kit.addBiome(scene, "rotting-log", {
  position: [0.25, 0, -0.1],
  scale: 1
});
```

## Parámetros

- `seed`: distribución reproducible de instancias y variaciones.
- `shape` y `radius`: límites del terreno y altura procedural.
- `surfaceOffset`: plano vertical base. Mantener `.078` en mapas/niveles de expedición y usar `.19` al renderizar recursos sobre el piso del terrario; no compensar ese desfase con offsets por asset.
- `position`: desplazamiento local `[x, y, z]`.
- `groundY`: altura real de superficie bajo el asset; debe proceder de `surfaceHeightAt` o de la geometría activa del hábitat.
- `scale`: escala uniforme del asset o del perfil.
- `density`: densidad de hojas, frondas, musgo, rocas o fragmentos.
- `local`: para helecho, roseta, musgo y rocas, usa una agrupación localizada en vez de rellenar toda la parcela.
- `paletteOverrides`: sobrescribe claves de materiales sin duplicar geometrías.

## Reglas de composición visual

1. **La superficie es el ecosistema.** No colocar cada lugar sobre una placa, pedestal, medallón o isla geométrica separada.
2. **Senderos sobre el suelo.** Son bandas planas de tierra apoyadas en `surfaceHeightAt`, no tubos gruesos flotando.
3. **El landmark es un objeto real.** Un tronco, piedra con musgo, fruta o compost identifica el lugar. El estado actual/visitado se comunica con la composición, el actor y el HUD, no con aros decorativos.
4. **Las opciones pertenecen al encuentro.** El punto clicable es una hitbox invisible sobre el objeto que representa la acción. No dibujar gemas o anillos abstractos en sustitución del objeto.
5. **El isópodo debe ser legible.** Mantener una escala suficiente respecto al refugio y a los objetos de la escena; no sacrificar al protagonista para enseñar el decorado.
6. **Un perfil local no debe rellenar toda la escena.** `addAsset("moss-bed")` o `addAsset("fern-bed")` crea una pieza local. Para cubrir el terreno se usa un perfil o una dispersión global explícita.
7. **Una sola implementación.** Los recursos comprados, el mapa y los encuentros usan estos assets. No reintroducir primitivas paralelas en `renderers.js`.

## Propiedad y limpieza

El kit comparte materiales dentro de una composición. El grupo devuelto por `addAsset`/ `addBiome` pertenece a la escena que lo recibe y debe retirarse mediante el método de limpieza del renderer que la contiene. No reutilizar grupos, geometrías, materiales ni texturas después de su limpieza. El juego conserva un único canvas WebGL al cambiar entre terrario, mapa y encuentro.

## QA mínimo

- Test unitario: piezas locales con bounds coherentes; base con relieve y estratos; senderos planos; cinco landmarks con hotspots; ninguna geometría de anillo/medallón; actor visible en cada encuentro.
- Smoke de navegador: comprar un objeto y comprobar que `data-resource-art="shared-diorama-kit"`; entrar/salir de mapa y encuentro sin reemplazar el canvas; encuadres y safe areas en móvil/escritorio.
- Revisar las capturas nuevas del SHA probado. Que el canvas renderice y que el test de geometría pase no sustituyen la inspección visual real.

No copiar este módulo a otro juego. Si una pieza se vuelve verdaderamente transversal, moverla a la biblioteca del framework en una tarea aparte.
