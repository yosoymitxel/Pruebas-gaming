# Hoja de ruta de agentes — Terrario principal

**Proyecto:** `games/terrario-isopodos/`  
**Actualizado:** 2026-10-30  
**Rama:** `feat/isopod-render-spike` · **PR activa:** #21

Este archivo registra el trabajo solicitado sobre el terrario principal. Complementa, no sustituye, `AGENTS.md`, `docs/ESPECIFICACION-TERRARIO-ISOPODOS.md` y `docs/PLAN-RECUPERACION-MVP.md`.

## Reglas obligatorias
1. Continuar en la rama activa del juego; no crear ramas paralelas.
2. Auditar y reutilizar Three.js, el kit de dioramas, dominio, economía, persistencia y tests existentes.
3. La simulación/dominio es fuente única de verdad. Renderer y HUD representan estado; no crean reglas.
4. No duplicar cámara, selección, inventario, economía ni física.
5. Probar el juego real. No dar por terminado un cambio por compilar.
6. Actualizar estados y evidencias en cada cierre. Sin pruebas reproducibles no hay estado Completada.

## Skills

### Locales y leídas
| Skill | Aplicación |
|---|---|
| `game-project-orchestrator` | Auditoría, selección mínima de capacidades, secuencia de dependencias y verificación. |
| `game-project-skeleton` | Fuente única de verdad, separación estado/UI/presentación, persistencia y puertas de QA. |

### Referencias catalogadas, no instaladas como skills locales validadas
| Skill / referencia | Aplicación prevista |
|---|---|
| `game-ui-ux` | HUD, controles, jerarquía, pausa y responsive. |
| `input-systems` | Cámara, gestos, selección y arrastre. |
| `save-systems` | Inventario y persistencia transaccional. |
| `Ponytail` | Cambios acotados, contratos y mantenibilidad. |
| `Anti-Slop` | Evitar UI genérica y controles redundantes. |
| `Impeccable` | Composición, legibilidad, consistencia y accesibilidad. |
| `Taste` | Dirección artística y proporciones del microhábitat. |

Las referencias externas no se declararán instaladas/ejecutadas hasta validar su `SKILL.md`. Se aplican mientras tanto los estándares documentados en el framework.

### Capacidades técnicas que deben consultarse
- Three.js: raycasting, transformaciones, mallas, profundidad, oclusión y outline.
- Física/simulación: separación, resolución de penetraciones, navegación y límites.
- Playwright: interacción en canvas, consola, responsive y capturas ligadas al SHA probado.

## Sistemas existentes auditados
| Sistema | Archivos | Uso |
|---|---|---|
| UI/bootstrap | `index.html`, `src/main.js`, `src/style.css` | Cabecera, barra de herramientas, panel, eventos. |
| Render y cámara | `src/renderers.js` | Three.js, cámara orbital, picking, escena y recursos. |
| Arte procedural | `src/diorama-kit.js`, `src/terrarium-art.js` | Geometría y recursos compartidos. |
| Estado/simulación | `src/state.js`, `src/simulation.js` | Individuos, movimiento, economía y reglas. |
| Persistencia | `src/persistence.js` | Guardado/restauración. |
| Exploración | `src/expedition/ui.js`, `src/expedition/*` | Entrada a expediciones sin crear un renderer paralelo. |
| Pruebas | `tests/*.test.js`, `tests/browser-smoke.mjs` | Dominio, tienda, interacción y navegador. |

## Orden y estado de tareas

El orden va de menor a mayor esfuerzo y respeta las dependencias: escala/geometría antes de navegación y colisiones.

| Orden | ID | Tarea | Esfuerzo | Estado |
|---:|---|---|---|---|
| 1 | UI-01 | Quitar textos redundantes de cabecera y pausa | Bajo | Completada · Playwright PASS, desktop/móvil |
| 2 | UI-02 | Dar más jerarquía a Explorar | Bajo | Completada · Playwright PASS, desktop/móvil |
| 3 | UI-03 | Barra móvil sin solapamiento; cuatro herramientas accesibles | Bajo | Completada · Playwright PASS, 390×844 |
| 4 | INV-01 | Contadores de coste y recursos colocados | Bajo–medio | Completada · contadores, compra y guardado PASS |
| 5 | INPUT-01 | Separar herramienta Cámara de Mano | Medio | Completada · órbita, pinch y bloqueo de giro en Mano PASS |
| 6 | INPUT-02 | Seleccionar con primer toque y mover después; contorno 3D | Medio–alto | En progreso · halo dorado sobre vegetación; captura real pendiente |
| 7 | INV-02 | Unificar tienda, inventario, colocación y retirada | Alto | Pendiente |
| 8 | SPACE-01 | Ampliar el volumen útil del terrario | Alto | En progreso · refugio ampliado, huella y alturas sincronizadas |
| 9 | SPACE-02 | Tronco diagonal con límites de vidrio | Alto | En progreso · orientación 36°, huella compartida y migración de guardados; CI pendiente |
| 10 | BIO-01 | Permitir entrada y tránsito bajo el tronco | Alto | En progreso · pose inferior durante aproximación/descanso; corredor físico y salida pendientes |
| 11 | BIO-02 | Eliminar colisiones/solapamientos inestables | Muy alto | En progreso · separación simétrica y determinista; prueba exacta PASS |
| 12 | QA-01 | Validación integral y regresiones | Continuo | En progreso · CI completo PASS en c766; nueva revisión visual pendiente |

## Especificaciones de ejecución

### UI-01 — Cabecera y pausa
- [x] Quitar `DIORAMA 3D` de la cabecera; el selector del panel ya identifica el modo.
- [x] Convertir pausa en botón de icono, conservando `aria-label` y tooltip.
- [x] Verificar Playwright, captura real desktop/móvil y consola en SHA c76600e.
- No quitar las etiquetas Diorama/Voxel de configuración, selector ni ayuda: son funcionales.

### UI-02 — Explorar
- [x] Elevar tamaño táctil, contraste, borde, tipografía y profundidad visual.
- [x] Reutilizar el botón y callback existentes; no duplicar navegación.
- [x] Verificar dimensiones/accesibilidad en Playwright desktop/móvil y consola sin errores en SHA c76600e.

### UI-03 — Herramientas móviles
- [x] Hojarasca y Refugio están disponibles únicamente en la barra rápida; la tienda muestra los otros cinco artículos, sin duplicarlos.
- [x] Reservar espacio para el botón de cámara sin tapar Refugio.
- [x] Mantener Cámara, Mano, Hojarasca y Refugio accesibles mediante desplazamiento horizontal.
- [x] Mantener objetivos táctiles de al menos 44 px.
- [x] Validar 390×844 con Playwright; Refugio alcanzable por scroll, Cámara no solapa la barra y no hay overflow horizontal.

### INV-01 — Contadores
- [x] Auditar `SHOP_ITEMS`, `purchaseItem`, `resources`, monedas y guardado.
- [x] Documentar el modelo actual: no existe stock/almacén; las compras colocan el objeto inmediatamente y descuentan `coins` una vez.
- [x] Diferenciar visualmente el coste en bellotas de la cantidad de objetos colocados; no llamar stock a los recursos existentes en el mundo.
- [x] Derivar los contadores de `state.resources`, sin estado UI paralelo.
- [ ] Stock disponible, compra a almacén, cancelación y devolución quedan para INV-02; no inventar estas operaciones antes de migrar dominio y guardados.
- [x] Probar contadores iniciales, compra, colocación y restauración en Playwright/CI (SHA c76600e).
- El stock real queda separado en INV-02; no se infiere de recursos colocados.

### INPUT-01 — Cámara y Mano
- [x] Agregar herramienta Cámara antes de Mano, con Cámara como estado inicial explícito.
- [x] Cámara: arrastrar fondo orbita; zoom/pinch permanece; no hace picking ni mueve entidades.
- [x] Mano: solo interactúa con objetivos; arrastrar el fondo no rota la cámara.
- [ ] Selección en primer toque y gesto posterior de movimiento corresponde a INPUT-02.
- [x] Verificar mouse/touch, cambio de herramienta, órbita, pinch y capturas en CI (SHA c76600e).

### INPUT-02 — Selección y contorno
- [x] Picking 3D combinado sobre las mallas reales de isópodos y recursos; el primer impacto visible determina el objetivo.
- [x] Primer toque selecciona sin iniciar movimiento; un segundo gesto sobre el mismo objetivo permite arrastrar.
- [x] Outline 3D por silueta con hull invertido sobre una copia visual de la malla seleccionada.
- [x] No se usa rectángulo 2D; el marcador respeta profundidad y no participa en picking.
- [x] Deseleccionar con espacio vacío/cambio de herramienta; limpiar selección al reconstruir malla/modelo.
- [x] Highlight no modifica geometría fuente, collider ni reglas del dominio.
- [x] Validar primer toque, segundo gesto, persistencia y selección de recursos con Playwright (SHA c76600e).
- [x] La primera captura de isopod-004 confirmó que la vegetación oculta el halo con depthTest activado; ahora se renderiza por encima sin modificar la profundidad del animal.
- [ ] Confirmar el halo dorado en capturas reales de Diorama y Voxel.

### INV-02 — Tienda y economía
- [ ] Catalogar artículos reales (hongos, plantas, musgo, piedras, tronco, refugios, comida y hojarasca).
- [ ] Metadatos estables: ID, categoría, precio, stack, colocable, movible, retirable y política de devolución.
- [ ] Centralizar compra, almacenamiento, selección, colocación, cancelación y retirada como operaciones transaccionales.
- [ ] Renderer entrega intención/posición; el dominio valida coste, stock y límites.
- [ ] Persistir cantidad, identidad, ubicación y rotación; migrar guardados existentes sin duplicación.

### SPACE-01 — Espacio
- [x] Aumentar el refugio normal a 1,22×0,32 (escala 1,10) y Tronco hueco a 1,18×0,24 (escala 1,08).
- [x] Unificar perfil visual, factor vertical del arco, altura de encaramado y huella del modelo.
- [x] Limitar compra/arrastre de refugios y troncos completos; migrar posiciones de guardados antiguos.
- [x] Recolocar refugios especiales al cambiar entre recipiente rectangular, cilíndrico y esférico.
- [x] Añadir mediciones reales de bounding box del refugio para Playwright.
- [ ] Validar capturas reales de dimensiones 3D y circulación de varios isópodos sobre el refugio ampliado (CI en curso).
- [ ] Ampliar el volumen útil de suelo y reservar corredores de circulación.

### SPACE-02 — Tronco diagonal
- [x] Auditar la malla y su pivote: la cáscara convierte el eje local Y en X; la rotación se aplica al grupo completo.
- [x] Girar Tronco hueco 36° con una constante compartida entre renderer y dominio.
- [x] Calcular huella X/Z y reservarla en el vidrio rectangular; usar radio envolvente conservador en recipientes circulares.
- [x] Aplicar los mismos límites a compra, arrastre y migración de guardados antiguos.
- [ ] Validar captura real desktop/móvil y comprobar que no invade el suelo ni el vidrio.
- [ ] Validar el corredor inferior transitable y entrada/salida; corresponde a BIO-01.

### BIO-01 — Bajo el tronco
- [x] El isópodo se representa bajo el arco cuando busca específicamente Tronco hueco y también al excavar/descansar.
- [ ] Distinguir el corredor transitable real de las paredes laterales y la tapa de madera.
- [ ] Definir entradas/salidas y altura libre para los isópodos.
- [ ] Integrar colliders con navegación, sin ocultar la malla como atajo.
- [ ] Resolver profundidad/sombras/oclusiones para que la madera tape donde debe.
- [ ] Probar entrar, girar, permanecer y salir con varios individuos; los tests actuales cubren la llegada a Tronco hueco y la pose bajo el arco.

### BIO-02 — Colisiones de isópodos
- [x] Comparar dimensiones del modelo 3D con la distancia de separación; 0,09 era menor que el radio visual aproximado.
- [x] Aumentar distancia mínima a 0,205 y resolver cada pareja por mitades al final del tick.
- [x] Resolver coincidencias exactas con una dirección derivada de IDs, sin azar.
- [x] Aplicar límites del recipiente después de separar.
- [x] Validar coincidencia exacta de dos individuos, determinismo y distancia mínima en unit tests (SHA c76600e).
- [ ] Validar grupos densos, bordes, recursos, locomoción y coste de CPU.
- [ ] Medir estabilidad y coste de CPU en población objetivo.

## Puertas de aceptación
| Puerta | Criterios |
|---|---|
| CODE_GATE | `npm test`, `npm run build`, sin errores de consola/importación. |
| GAMEPLAY_GATE | Interacciones, economía, movimiento, refugios y cámara reproducibles. |
| DESIGN_GATE | Capturas reales desktop/móvil, sin overflow y jerarquía/escala correctas. |
| INTEGRATION_GATE | Guardado/carga, tienda, renderer compartido y expediciones sin regresión. |

Las capturas se generan con Playwright y se vinculan al SHA siguiendo `docs/EVIDENCIA-VISUAL.md`. Un mockup no prueba el juego.

## Registro obligatorio por tarea

```md
### [ID] Nombre de tarea
- Estado: Pendiente | En progreso | Bloqueada | Completada
- Responsable:
- SHA:
- Archivos:
- Skills leídas/aplicadas:
- Pruebas ejecutadas:
- Evidencia:
- Resultado y pendientes:
```

**Cierre:** solo pasar a Completada tras cumplir aceptación y puertas aplicables en un mismo SHA. Un cambio enviado a CI permanece En progreso hasta conocer su resultado.