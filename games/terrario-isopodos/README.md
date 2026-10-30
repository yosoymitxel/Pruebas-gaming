# Terrario de isópodos

Sandbox ecológico de navegador centrado inicialmente en *Armadillidium vulgare*.

## Estado actual — 30-10-2026

**PR #19 integrada en `main`** mediante squash. Commit: `2f5dbe1c63f644f820d7897e022aabda0b7533c3`.

La integración añade el mapa de exploración y los encuentros como dioramas 3D interactivos, además de un kit procedural compartido entre el terrario y las expediciones. Se conserva la instancia del renderer/canvas al entrar, navegar y regresar.

Validación previa al squash sobre `99e860ad05bb06553bd29c5360dea17ab1638edd`:
- [Terrario MVP checks — run 41089329251](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251): PASS.
- [Terrario game checks — run 41089338122](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338122): PASS.
- [Framework checks — run 41089338312](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338312): PASS.
- [Evidencia Playwright — artefacto 12993906214](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251/artifacts/12993906214): capturas reales de escritorio, móvil, mapa, encuentros y liquidación. Chromium 156.0.8078.4; 1440×1000, 390×844 y 360×640; cero errores de consola y sin overflow horizontal.

GitHub Pages publicó el merge SHA mediante [pages build and deployment — run 41091166831](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091166831). La URL del sitio es https://yosoymitxel.github.io/Pruebas-gaming/. La validación post-deployment adicional terminó PASS en [run 41091167637](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091167637), también sobre el merge SHA.

**El MVP completo sigue NO APROBADO.** El mapa y los encuentros ya funcionan y son seleccionables, pero la composición todavía es demasiado despejada: falta densidad orgánica en el terreno, aumentar algunos props/hotspots y revisar solapamientos visuales del HUD. Las brechas del esqueleto siguen en el plan de recuperación.

## Lo que contiene

- Escena Three.js con recipientes rectangular, cilíndrico y esférico.
- Representaciones Diorama y Voxel sobre el mismo estado de dominio.
- Kit de dioramas procedural basado en los generadores naturales de `src/terrarium-art.js`, reutilizado en el terrario y las expediciones.
- Cámara orbital/táctil, simulación ecológica lúdica, controles ambientales y guardado local.
- Expediciones opcionales por turnos, con cinco nodos, eventos, botín, mejoras, persistencia de run y liquidación de una jornada.

## Arranque

Desde esta carpeta:

```sh
npm install
npm test
npm run dev
```

Verificación de producción:

```sh
npm run build
```

**Pendiente P0:** no hay `package-lock.json` versionado. CI usa `npm install`; falta pasar a instalación reproducible con `npm ci` tras generar y revisar el lockfile.

## Dioramas reutilizables

El juego incluye un kit procedural para configurar biomas, piezas, semillas, densidades, formas, escalas y paletas en el terrario y las expediciones: [Kit de dioramas](docs/DIORAMA-KIT.md). La API aún es específica de este juego; no está extraída como biblioteca común para los demás juegos del repositorio.

## Documentación

- [Expediciones por turnos](docs/EXPEDICIONES-POR-TURNOS.md)
- [Especificación técnica y criterios de aceptación](docs/ESPECIFICACION-TERRARIO-ISOPODOS.md)
- [Decisión de render](docs/DECISION-RENDER.md)
- [Spike de render](docs/SPIKE-RENDER.md)
- [Informe de calidad](docs/QUALITY-REPORT.md)
- [Plan de recuperación del MVP](docs/PLAN-RECUPERACION-MVP.md)

## Límites vigentes

- Fuente única de verdad todavía parcial: separar dominio, preferencias, sesión y estado de UI.
- Persistencia general incompleta: faltan autoguardado, slots, backup, exportación/importación y recuperación integral.
- Observación/ciclo vital incompletos: selección/ficha, nacimientos/reproducción y descubrimientos.
- Fallback por falta de WebGL probado; la recuperación tras pérdida de contexto real necesita cobertura adicional.
- Accesibilidad, movimiento reducido y dispositivos físicos aún requieren más validación.
- El microclima y las tasas biológicas son simplificaciones lúdicas, no un modelo científico validado.
