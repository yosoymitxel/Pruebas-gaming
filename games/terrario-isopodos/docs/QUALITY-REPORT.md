# Informe de calidad — Terrario de isópodos

**Fecha de revisión:** 30-10-2026  
**Rama única de trabajo:** `feat/isopod-render-spike`  
**main:** `2f5dbe1c63f644f820d7897e022aabda0b7533c3`  
**Integración:** [PR #19](https://github.com/yosoymitxel/Pruebas-gaming/pull/19), squash merge.  
**Estado del producto:** vertical jugable con expediciones 3D integradas; **MVP completo NO APROBADO**.

## Evidencia vigente

El SHA probado antes del squash fue `99e860ad05bb06553bd29c5360dea17ab1638edd`; el merge squash conserva ese árbol de cambios en `main`.

| Comprobación | Resultado |
|---|---|
| [Terrario MVP checks — 41089329251](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251) | PASS |
| [Terrario game checks — 41089338122](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338122) | PASS |
| [Framework checks — 41089338312](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338312) | PASS |
| [Artefacto visual — 12993906214](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251/artifacts/12993906214) | Generado e inspeccionado |
| [Pages build and deployment — 41091166831](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091166831) | Build y deploy PASS sobre el merge SHA |

El manifiesto del artefacto registra Chromium 156.0.8078.4, origen local del checkout probado, captura a las 2026-10-30T16:29:11.706Z, viewports 1440×1000, 390×844 y 360×640, cero errores de consola y `horizontalOverflow: false`.

Métricas del renderer del terrario en el smoke: 96 draw calls, 118.601 triángulos, 88 geometrías, 5 texturas, 570 instancias de hojarasca/cobertura, 645 hojas de helecho y 32 almohadillas de musgo. Son métricas de esa escena/build, no un benchmark de todos los dispositivos.

## Alcance de PR #19

- Mapa del jardín y encuentros convertidos a dioramas 3D.
- Hotspots físicos por raycast para nodos y elecciones; botones accesibles alternativos.
- Picking limitado a las hitboxes explícitas, para que los props decorativos no intercepten el clic.
- Coordenadas de hotspot proyectadas por la cámara activa, compartidas con la prueba de navegador.
- Un único `WebGLRenderer` y canvas al entrar al mapa, pasar a un encuentro y regresar al terrario.
- Reanudación de una run activa después de guardar/recargar y liquidación de una jornada al regresar.
- Kit procedural reutilizable dentro del juego, basado en los generadores de `terrarium-art.js`, sin duplicar helechos, musgo, rocas, raíces, troncos o setas.

## Puertas de calidad

| Puerta | Estado | Alcance demostrado / límite |
|---|---|---|
| CODE_GATE | PASS | Auditoría de dependencias, tests Node y build de producción completados en los workflows del SHA probado. |
| GAMEPLAY_GATE | PASS para el alcance probado | Inicio del sandbox, selección 3D de nodo, elección, guardado/reanudación, retorno y avance diario; tests de dominio de expediciones. No certifica funciones ecológicas aún ausentes. |
| DESIGN_GATE | PARCIAL | El layout 3D, interacción y responsive se probaron y las capturas fueron inspeccionadas. El mapa sigue visualmente vacío en zonas amplias, varios props son pequeños y hay que pulir composición/HUD antes de considerar cerrada la dirección visual. |
| INTEGRATION_GATE | PASS para PR #19 | El renderer/canvas se conserva; el sitio se construyó y publicó con el merge SHA. El workflow adicional post-deployment aún puede añadir validación, pero no revoca el deploy confirmado. |

La integración se realizó como avance funcional bajo la petición de merge; **no implica que el DESIGN_GATE del arte general ni el MVP completo estén cerrados**.

## Matriz resumida del esqueleto transversal

| Sistema | Estado | Pendiente principal |
|---|---|---|
| Inicio / menú / nueva partida | PASS en smoke | Ampliar casos de recuperación y reinicio. |
| Flujo de pantallas | PARCIAL | Formalizar transiciones y evitar estados UI duplicados. |
| HUD / autoridad del estado | PARCIAL | Extraer mutaciones de dominio de la UI. |
| Pausa / reanudación | PASS en smoke | Ampliar regresiones combinadas. |
| Configuración persistente | PARCIAL | Separar preferencias de datos biológicos. |
| Idioma / i18n | PENDIENTE | Catálogo español y fallback centralizados. |
| Temas | NO APLICA | Diorama/Voxel son renderers, no temas. |
| Guardado / carga | PARCIAL | Backup válido, migraciones completas y recovery. |
| Exportar / importar | PENDIENTE | Formato versionado y validación atómica. |
| Autoguardado | PENDIENTE | Guardado en puntos seguros con feedback. |
| Victoria / derrota | NO APLICA | Sandbox ecológico sin condición terminal obligatoria. |
| Ayuda | PARCIAL | Ampliar instrucciones y límites del modelo. |
| Input | PARCIAL | Alternativas de teclado y cobertura de dispositivos físicos. |
| Audio | PENDIENTE, no bloqueante | No forma parte del MVP actual. |
| Responsive / safe areas | PASS en viewports de CI | Falta Safari/iOS y Android físico. |
| Accesibilidad | PARCIAL | Foco/teclado integral, contraste y reduced-motion. |
| Diagnóstico | PARCIAL | WebGL no disponible tiene aviso; pérdida de contexto requiere más cobertura. |
| Build / publicación | PASS del SHA integrado | La instalación reproducible sigue pendiente por ausencia de lockfile. |
| QA | PASS para PR #19 | El MVP global mantiene brechas. |

## Deuda priorizada vigente

### P0
1. Versionar `package-lock.json`, migrar CI/Pages a `npm ci` y probar instalación limpia.
2. Definir fuente única de verdad: comandos de dominio, preferencias persistentes y estado de presentación/UI separados; eliminar mutaciones directas desde `main.js`.

### P1
3. Observación: selección por ID estable y ficha del isópodo; después reproducción/nacimientos y catálogo de descubrimientos.
4. Persistencia integral: autosave, múltiples slots, renombrado/borrado, backup del último guardado válido, migraciones y export/import atómico.
5. Pulido del diorama: rellenar los vacíos del mapa con cobertura natural escalonada, dar escala legible a refugios/rocas/setas y mejorar la separación entre caminos, hotspots y vegetación. Mantener clics libres y presupuesto móvil.
6. Revisar la decisión Voxel contra la especificación: el renderer actual usa geometría volumétrica por bloques instanciados; no es un sprite plano/Canvas. Mantener esta arquitectura solo con evidencia visual y de rendimiento suficiente.
7. Validar navegación del isópodo frente a colisionadores del dressing procedural, no solo obstáculos de recursos.

### P2
8. Respetar `prefers-reduced-motion` en la cámara y todas las animaciones continuas.
9. Teclado, foco, contraste, safe areas y pruebas en dispositivos reales.
10. Recuperación tras pérdida de contexto WebGL, más allá de simular que WebGL no está disponible al arranque.
11. Revisar recursos adquiridos/colocados y su ciclo completo de persistencia.

## Skills y fuentes

- **Disponibles localmente, leídas en esta revisión:** `game-project-orchestrator` y `game-project-skeleton`.
- **Contratos leídos:** `AGENTS.md`, `framework/README.md`, `framework/ORCHESTRATION.md`, `framework/QUALITY-GATES.md`, `framework/TASK-PROFILES.md`, `framework/BASELINE-VIDEOJUEGO.md`, `framework/CONFLICTOS-Y-FUENTE-DE-VERDAD.md`.
- **Fuentes catalogadas, no instaladas localmente:** Anti-Slop, Ponytail, Taste, Impeccable, GameDev Agent Skills y Emil skills. No se afirma que hayan sido leídas o ejecutadas desde el checkout en esta revisión.
- `game-ui-ux`, `save-systems` e `input-systems` siguen identificadas, pero sin copia local validada.

El estado de esta auditoría supersede los snapshots históricos anteriores del archivo y de `PLAN-RECUPERACION-MVP.md`.
