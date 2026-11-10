// Especies de isópodos, sacadas de las que se crían de verdad (guías de cría: The Tye-Dyed Iguana, NEHERP).
// Solo Armadillidium y Cubaris se hacen bolita (conglobación); los Porcellio corren en vez de enrollarse y
// tienen las dos colitas (urópodos) a la vista. `body`: forma del dibujo; `pattern`: dibujo del caparazón;
// `colors`: [base, dibujo, borde]. `humidity`: clima del terrario que prefiere (CLIMATES); `breed`: crías.
// En combate: `rolls` cambia la esquiva (bolita: más invulnerable; carrera: más lejos). hp/speed multiplican
// la clase.
import { localize } from '../i18n/index.js';

export const SPECIES = localize('species', {
  vulgare: { name: 'Cochinilla común', latin: 'Armadillidium vulgare', rolls: true, body: 'domo', pattern: 'bandas',
    colors: ['#626a70', '#8d969c', '#2c3034'], humidity: 'ideal', hp: 1.1, speed: 0.95, breed: 1,
    desc: 'La de los jardines: se hace bolita al menor susto y aguanta casi todo.' },
  cebra: { name: 'Cebra', latin: 'Armadillidium maculatum', rolls: true, body: 'domo', pattern: 'rayas',
    colors: ['#ece6d6', '#1d1a16', '#1d1a16'], humidity: 'seco', hp: 1, speed: 1, breed: 0.9,
    desc: 'Rayas blancas y negras; quiere un lado seco y otro húmedo bien marcados.' },
  pocion: { name: 'Poción mágica', latin: 'A. vulgare «Magic Potion»', rolls: true, body: 'domo', pattern: 'motas',
    colors: ['#efe7cf', '#d9a43a', '#4b3a2a'], humidity: 'seco', hp: 0.95, speed: 1, breed: 0.7,
    desc: 'Translúcida con motas amarillas y oscuras; prefiere el terrario más bien seco.' },
  vaca: { name: 'Vaca lechera', latin: 'Porcellio laevis', rolls: false, body: 'plano', pattern: 'manchas',
    colors: ['#ece6d6', '#24201c', '#24201c'], humidity: 'humedo', hp: 1.15, speed: 1.05, breed: 1.5,
    desc: 'Grande, glotona y sin miedo; cría como un reloj. No se enrolla: corre.' },
  lava: { name: 'Lava', latin: 'Porcellio scaber «Lava»', rolls: false, body: 'plano', pattern: 'lava',
    colors: ['#d4532f', '#f0a23a', '#2a1410'], humidity: 'ideal', hp: 1, speed: 1.1, breed: 1.2,
    desc: 'Rojo y naranja con borde negro; dura y come de todo.' },
  polvo: { name: 'Azul polvo', latin: 'Porcellionides pruinosus', rolls: false, body: 'fino', pattern: 'polvo',
    colors: ['#8fa9c2', '#d8e4ee', '#3a4a5a'], humidity: 'seco', hp: 0.8, speed: 1.3, breed: 1.6,
    desc: 'Pequeña, cubierta de un polvillo ceroso y rapidísima.' },
  pato: { name: 'Patito de goma', latin: 'Cubaris sp. «Rubber Ducky»', rolls: true, body: 'pato', pattern: 'liso',
    colors: ['#f2c63a', '#fbe8a0', '#5a4410'], humidity: 'humedo', hp: 1.05, speed: 0.85, breed: 0.4,
    desc: 'Amarilla y con cara de pato; tímida, de cueva muy húmeda y pocas crías.' },
});

// Comportamiento en el terrario (segundos de juego).
export const BEHAVIOR = {
  ballTime: 3.5,      // bolita al tocarla o asustarse
  moltEvery: [140, 260], // cada cuánto muda (en dos mitades: primero la de atrás)
  moltTime: 10,       // vulnerable y quieta mientras muda; deja una muda que se recoge como cal
  growTime: 120,      // una cría (manca) tarda esto en ser adulta y unirse a la colonia
  breedEvery: 90,     // cada cuánto puede nacer una cría si la colonia está tranquila
};

export const speciesOf = (id) => SPECIES[id] ?? SPECIES.vulgare;
