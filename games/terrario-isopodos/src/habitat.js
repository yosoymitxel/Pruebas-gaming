/**
 * Geometría autoritativa del hábitat compartida por simulación y renderer.
 * Las posiciones de dominio usan el plano X/Z; Y es altura visual.
 */
export const HABITAT_GEOMETRY = Object.freeze({
  rectangular: Object.freeze({
    floorWidth: 3.2,
    floorDepth: 2.1,
    outerWidth: 3.35,
    outerDepth: 2.2,
    wallHeight: 1.18,
    wallThickness: 0.035
  }),
  cilindrico: Object.freeze({
    floorRadius: 1.48,
    outerRadius: 1.52,
    wallHeight: 1.18,
    wallThickness: 0.035
  })
});

/**
 * Mantiene una entidad/recurso dentro del volumen horizontal visible.
 * margin es la holgura radial o por eje, expresada en unidades del mundo.
 */
export function constrainToHabitat(x, z, shape = "rectangular", margin = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    throw new TypeError("La posición del hábitat debe ser finita");
  }
  if (!Number.isFinite(margin) || margin < 0) {
    throw new RangeError("El margen del hábitat debe ser no negativo");
  }
  const geometry = HABITAT_GEOMETRY[shape];
  if (!geometry) throw new Error("La forma del terrario no es válida");

  if (shape === "cilindrico") {
    const radius = Math.max(0, geometry.floorRadius - margin);
    const distance = Math.hypot(x, z);
    if (distance <= radius || distance === 0) return { x, z };
    const scale = radius / distance;
    return { x: x * scale, z: z * scale };
  }

  const halfWidth = Math.max(0, geometry.floorWidth / 2 - margin);
  const halfDepth = Math.max(0, geometry.floorDepth / 2 - margin);
  return {
    x: Math.max(-halfWidth, Math.min(halfWidth, x)),
    z: Math.max(-halfDepth, Math.min(halfDepth, z))
  };
}
