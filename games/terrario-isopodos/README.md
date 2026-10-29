# Terrario de isópodos

Sandbox ecológico de navegador centrado inicialmente en *Armadillidium vulgare*.

## Estado

**Fase:** especificación y preparación del spike técnico. El juego todavía no está implementado.

## Documentación del juego

- [Especificación técnica y criterios de aceptación](docs/ESPECIFICACION-TERRARIO-ISOPODOS.md)

## Reglas de organización

- Todo el código, assets, pruebas y documentación específicos del juego deben vivir en esta carpeta.
- No colocar documentación de este juego en el `docs/` raíz del framework.
- No modificar ni duplicar las skills compartidas para implementar funcionalidades del juego.
- El framework compartido se consume desde la raíz del repositorio; no se copia dentro de este juego.
- Antes de implementar el runtime, validar el spike: Three.js, cámara, formas de terrario y sprites voxelizados en escena 3D; el mismo estado debe sobrevivir al cambio Diorama/Voxel.
