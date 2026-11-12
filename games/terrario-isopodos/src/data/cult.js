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
    fallo: { name: 'Petición olvidada', delta: -25 },
    expedicion: { name: 'Expedición cumplida', delta: 10 },
    derrota: { name: 'Expedición perdida', delta: -10 },
    despertar: { name: 'Despertado de noche', delta: -5 },
    camas: { name: 'Faltan camas', delta: -20 },
    hambre: { name: 'Pasan hambre', delta: -10 },
    nivel: { name: 'Subió de nivel', delta: 5 },
  }),
};

export const LOYALTY = {
  mimo: 25, reunion: 15, peticion: 40, comer: 3, max: 100,
  reward: { ambar: 1 }, // al subir de nivel (en CotL: devoción y un fragmento)
  hpPerLevel: 0.04, // cada nivel suma vida en la expedición
};

// Peticiones (los «quests» de los seguidores). `every`: segundos entre peticiones; `time`: plazo.
export const WISHES = {
  every: 150, time: 300, max: 2,
  kinds: localize('wishes', {
    pieza: { name: 'Quiere', pieces: ['corcho', 'esfagno', 'piedra', 'seta', 'tronco', 'sepia', 'charca'] },
    humedad: { name: 'Quiere su humedad' },
    comer: { name: 'Quiere comer' },
    mimo: { name: 'Quiere un mimo' },
  }),
};

export const SERMON = { time: 7, ring: 1.6 };
