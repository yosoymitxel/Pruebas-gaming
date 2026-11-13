// Consejos de primera vez, como los avisos que Cult of the Lamb muestra al descubrir cada cosa: salen una sola
// vez (se guardan en meta.tips), uno a la vez, cortos y con icono. `when(s)`: la sesión cumple la condición.
import { localize } from '../i18n/index.js';

export const TIPS = localize('tips', {
  obra: { icon: 'build', text: 'Lo que construyes queda en obra: los isópodos libres la levantan.', when: (s) => s.mode === 'home' && Object.values(s.game.home.grid.pieces).some((p) => p.site) },
  tapa: { icon: 'lid', text: 'Demasiada humedad: abre la tapa en el panel Terrario.', when: (s) => s.mode === 'home' && s.game.home.moist > 0.82 },
  seco: { icon: 'items', text: 'Muy seco: rocía o pon agua de un lado (charca, esfagno).', when: (s) => s.mode === 'home' && s.game.home.moist < 0.4 },
  peticion: { icon: 'heart', text: 'Un globito es una petición: cúmplela antes de que se acabe el plazo.', when: (s) => s.mode === 'home' && s.game.home.isopods.some((i) => i.wish) },
  noche: { icon: 'refugio', text: 'De noche duermen en su cama asignada; los que no tienen, al raso y nerviosos. Asígnales cama en su ficha.', when: (s) => s.mode === 'home' && s.phase === 'noche' },
  mercader: { icon: 'snail', text: 'Llegó el caracol mercader a la esquina: tócalo para cambiar.', when: (s) => s.mode === 'home' && s.view?.merchant },
  musgo: { icon: 'plant', text: 'El musgo crece donde el suelo se mantiene húmedo. Tócalo para arrancarlo.', when: (s) => s.mode === 'home' && (s.game.home.moss ?? []).some((m) => m >= 0.8) },
  rociar: { icon: 'items', text: 'Rociar: toca el suelo donde quieras mojar. Se seca con el tiempo.', when: (s) => s.mode === 'home' && s.sprayMode },
  trabajo: { icon: 'recoleccion', text: 'Pon a alguien a Trabajar en una pieza: produce más y lleva lo hecho al almacén.', when: (s) => s.mode === 'home' && Object.values(s.game.home.stock).some((x) => x.ready >= 3) },
  arma: { icon: 'attack', text: 'Cada arma cambia el combo de todo el equipo. Elige.', when: (s) => s.mode === 'dungeon' && s.run?.state === 'weapon' },
  combate: { icon: 'roll', text: 'Ataca, mantén para el golpe fuerte y rueda cuando el enemigo brilla.', when: (s) => s.mode === 'combat' },
  salas: { icon: 'nido', text: 'Las salas laterales esconden botín, rescates, tiendas y fuentes.', when: (s) => s.mode === 'dungeon' && !!s.run?.floor },
  pacto: { icon: 'eye', text: 'Una seta extraña: carta rara a cambio de vida. Es opcional.', when: (s) => s.run?.last?.type === 'maldito' },
});
