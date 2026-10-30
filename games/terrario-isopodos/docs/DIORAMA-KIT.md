# Kit de dioramas compartido

El terrario principal y Expediciones reutilizan los mismos generadores naturales de src/terrarium-art.js. src/diorama-kit.js los expone como una API de composición; no mantiene una segunda implementación de helechos, musgo, rocas, raíces, troncos o setas.

## Crear una escena

```js
import { createDioramaKit } from "./diorama-kit.js";

const kit = createDioramaKit({
  shape: "esferico",       // rectangular | cilindrico | esferico
  radius: 1.48,
  seed: 20261030,
  paletteOverrides: {
    moss: 0x6f8b53,
    rock: 0x899184,
    bark: 0x735438
  }
});

const scene = new THREE.Group();

kit.addAsset(scene, "moss-bed", {
  position: [-0.4, 0, 0.2],
  groundY: 0.078,
  scale: 0.7,
  density: 0.45
});

kit.addBiome(scene, "rotting-log", {
  position: [0.25, 0, -0.1],
  groundY: 0.078,
  scale: 1.1
});
```

## Piezas y perfiles disponibles

| API | Uso |
|---|---|
| leaf-litter, groundcover | Hojarasca y cobertura vegetal instanciada |
| fern-bed, forest-rosettes | Helechos y rosetas con frondas procedurales |
| moss-bed | Cojines irregulares con hojillas |
| rock-scatter | Conjunto de rocas deformadas |
| fallen-log, root-arch | Tronco con corteza, raíces y arco |
| mushroom-cluster | Setas con tallos, láminas y sombreros |
| fallen-fruit, compost-pile | Fruta caída y materia orgánica |
| mites, dew, web | Detalles de microhábitat |

Los perfiles de DIORAMA_BIOMES son woodland-map, garden-entry, mossy-stone, rotting-log, rotten-fruit y compost-bin.

## Parámetros

- seed: repite las mismas posiciones y variaciones procedurales.
- shape y radius: limitan la distribución a la geometría del suelo.
- position: desplazamiento local [x, y, z].
- groundY: altura real de la superficie sobre la que se coloca el asset.
- scale: escala uniforme de la pieza o del bioma.
- density: cantidad de instancias para vegetación y detalles.
- paletteOverrides: sobrescribe materiales por clave sin duplicar geometrías.

addAsset(group, type, options) añade una pieza; addBiome(group, id, options) compone un conjunto de piezas configurado. Ambos devuelven el objeto/grupo generado.

## Propiedad y limpieza

El kit comparte materiales dentro de una composición para reducir duplicación. El grupo resultante es propietario de sus geometrías y materiales; debe eliminarse usando el ciclo de limpieza del renderer que contiene la escena. No se debe reutilizar un grupo ya limpiado. El renderer del juego sigue usando un único canvas WebGL para el terrario y las expediciones.

## Regla para nuevos escenarios

Añadir un perfil de bioma o una combinación declarativa de assets antes de crear una nueva implementación geométrica. Si una pieza se necesita en otro juego, mover su lógica a la biblioteca transversal del framework en una tarea separada; no copiar este módulo entre juegos.
