// Paletas: la única fuente de color. CSS (tokens en :root) y render las leen de aquí.
// cozy = terrario e islas; terror = expedición. `night` = el vacío alrededor del diorama (oscuro, como el
// bosque que enmarca la base en Cult of the Lamb); `path` = tierra pisada pintada; `grass` = verde claro del suelo.
// Lenguaje visual (como los tokens --k-* de KureiChaosChess): cada cosa del juego tiene un color fijo que se
// repite en barras, iconos, cartas y efectos. vida = verde, carga ATB = azul, daño = óxido, recursos = ámbar,
// calma = verde agua, peligro (esporas, sello) = violeta. Se publican como --sem-<nombre>.
export const SEMANTIC = { vida: '#5f9e4a', carga: '#4f8fd6', dano: '#c2412f', recurso: '#e0a03a', calma: '#4fa39b', peligro: '#9a5bc4', hambre: '#d98a3a' };

// Distintivos de los isópodos (banderín sobre la cabeza en el terrario).
export const BADGES = ['#c2412f', '#e0a03a', '#4fa39b', '#4f8fd6', '#9a5bc4', '#efe6d2'];

export const PALETTES = {
  cozy: { paper: '#efe6d2', ink: '#1d1a16', moss: '#4f8a46', amber: '#e0a03a', rust: '#c2412f', shade: '#cbbd9f', soil: '#8a6a4a', sky: '#e4dcc6', water: '#5f9e9a', bark: '#6b4a33', stone: '#b3ab9a', grass: '#9cc462', path: '#a5675a', night: '#16201f' },
  terror: { paper: '#d9d6cf', ink: '#0d0c0b', moss: '#4d574a', amber: '#8a6a45', rust: '#7a2e24', shade: '#9b978e', soil: '#5c5149', sky: '#c9c5bc', water: '#56605f', bark: '#433329', stone: '#7d7a73', grass: '#6c7d55', path: '#6e3a34', night: '#0c0b0d' },
};

