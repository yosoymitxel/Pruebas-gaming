// La colonia como el culto de Cult of the Lamb (wiki: Faith, Loyalty, Followers, Rituals):
// - Fe: sube y baja con lo que pasa (cada evento con su cifra, como en el juego) y se va apagando sola.
//   Se suma a la calma: así cuidar se nota en el momento y no solo por lo que hay construido.
// - Lealtad de cada isópodo: barra de 0 a 100; al llenarse sube de nivel y deja una recompensa.
// - Peticiones: cada tanto uno pide algo (una pieza, su humedad, comer, un mimo); cumplirlo da mucha fe.
// - Reunión diaria (el sermón): la colonia se junta en círculo, una vez por día, y gana lealtad y fe.
// - De noche duermen solos en las camas que haya; si faltan camas, baja la fe al anochecer.
import { localize } from '../i18n/index.js';

// Cifras de fe (0–100 como en CotL; en la calma pesan /250, o sea ±0,4 como mucho).
export const FAITH = {
  start: 0, min: -60, max: 60, decay: 1 / 60, // por segundo, hacia 0
  events: localize('faith', {
    comer: { name: 'Comió', delta: 1 },
    miembro: { name: 'Nueva cría', delta: 5 },
    pieza: { name: 'Pieza nueva', delta: 2 },
    deco: { name: 'Decoración nueva', delta: 4 },
    mimo: { name: 'Mimo', delta: 5 },
    reunion: { name: 'Reunión', delta: 10 },
    peticion: { name: 'Petición cumplida', delta: 20 },
    fallo: { name: 'Petición olvidada', delta: -10 },
    expedicion: { name: 'Expedición cumplida', delta: 10 },
    derrota: { name: 'Expedición perdida', delta: -10 },
    despertar: { name: 'Despertado de noche', delta: -5 },
    camas: { name: 'Faltan camas', delta: -20 },
    hambre: { name: 'Pasan hambre', delta: -10 },
    nivel: { name: 'Subió de nivel', delta: 5 },
    obediente: { name: 'Llegó alguien obediente', delta: 10 },
    esceptico: { name: 'Llegó alguien escéptico', delta: -10 },
    devoto: { name: 'Mimo a un devoto', delta: 3 },
    ritual: { name: 'Ritual', delta: 15 },
    vigilia: { name: 'Vigilia', delta: 25 },
  }),
};

export const LOYALTY = {
  mimo: 25, reunion: 15, peticion: 40, comer: 3, max: 100,
  reward: { ambar: 1 }, // al subir de nivel (en CotL: devoción y un fragmento)
  hpPerLevel: 0.04, // cada nivel suma vida en la expedición
};

// Peticiones (los «quests» de los seguidores). `every`: segundos entre peticiones; `time`: plazo.
export const WISHES = {
  every: 200, time: 300, max: 2,
  kinds: localize('wishes', {
    pieza: { name: 'Quiere', pieces: ['corcho', 'esfagno', 'piedra', 'seta', 'tronco', 'sepia', 'charca'] },
    humedad: { name: 'Quiere su humedad' },
    comer: { name: 'Quiere comer' },
    mimo: { name: 'Quiere un mimo' },
  }),
};

export const SERMON = { time: 7, ring: 1.6 };

// Rituales del templo (como los de la iglesia de Cult of the Lamb): se hacen en el altar con la colonia en
// círculo, cuestan recursos y cada uno se puede repetir pasados `every` días. `icon`: nombre en src/ui/icons.js.
export const RITUALS = localize('rituals', {
  festin: { name: 'Festín', desc: 'Toda la colonia come hasta llenarse.', icon: 'eat', cost: { hojarasca: 8 }, every: 2 },
  lluvia: { name: 'Danza de la lluvia', desc: 'Sube la humedad del terrario de golpe.', icon: 'items', cost: { musgo: 4 }, every: 1 },
  cosecha: { name: 'Bendición de cosecha', desc: 'Las piezas producen un 50 % más durante un día.', icon: 'plant', cost: { esporas: 3, hojarasca: 2 }, every: 3 },
  vigilia: { name: 'Vigilia', desc: 'Se acaban los sustos y la fe sube mucho.', icon: 'moon', cost: { ambar: 1 }, every: 2 },
  vinculo: { name: 'Lazo de la colonia', desc: 'Todos ganan mucha lealtad.', icon: 'care', cost: { ambar: 2, cal: 3 }, every: 3 },
});
export const HARVEST = { mul: 1.5, time: 240 };

// Obras (como en CotL, los seguidores levantan lo que pones): segundos por celda; ritmo solo y por ayudante.
export const SITE = { perCell: 6, alone: 0.35, perWorker: 1, maxWorkers: 2 };
// Trabajos: cada isópodo asignado a una pieza que produce la acelera (hasta dos).
export const JOBS = { boost: 0.75, max: 2 };
