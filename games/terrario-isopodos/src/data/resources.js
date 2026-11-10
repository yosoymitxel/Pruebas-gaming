// Recursos recogibles. Fuente única: construcción, rituales, cartas y botín leen de aquí.
import { localize } from '../i18n/index.js';

export const RESOURCES = localize('resources', {
  hojarasca: { name: 'Hojarasca', desc: 'Hojas secas: comida y abrigo de la colonia.' },
  musgo: { name: 'Musgo', desc: 'Guarda la humedad; base de casi toda construcción.' },
  esporas: { name: 'Esporas', desc: 'Siembran hongos y alimentan rituales.' },
  cal: { name: 'Cal', desc: 'Endurece el caparazón en la muda.' },
  ambar: { name: 'Ámbar', desc: 'Resina antigua; moneda entre islas.' },
});
