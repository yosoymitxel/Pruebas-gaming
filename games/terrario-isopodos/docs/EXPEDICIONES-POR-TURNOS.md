# Expediciones por turnos

**Estado:** dominio v0.1 implementado; presentación de exploración convertida a dioramas 3D navegables. La aprobación final depende de CODE/GAMEPLAY/DESIGN/INTEGRATION en el SHA que se integre.
**Modo:** opcional. El terrario libre sigue siendo el modo principal y no necesita completar expediciones.
**Versión de alcance:** 0.1, cinco nodos, cinco familias de eventos, cuatro materiales y tres mejoras permanentes.

## 1. Propósito y principios

Añadir exploración por turnos como segundo bucle de juego, conectado a la gestión diaria del terrario. El jugador prepara un isópodo, visita lugares del jardín, toma decisiones sobre riesgos ambientales, recoge materiales y regresa para mejorar el hábitat.

Principios no negociables:

- No hay combate, armas, enemigos con vida ni acción en tiempo real.
- La expedición no sustituye ni reescribe las reglas de `stepSimulation`.
- El sandbox existente sigue funcionando aunque nunca se abra una expedición.
- Un solo `TerrariumState` conserva colonia, recursos, reloj y mejoras para Diorama y Voxel.
- Los eventos, recompensas y el mapa se derivan de una semilla persistida. No se usa `Math.random()` dentro del dominio de expedición.
- Cada decisión es un comando de dominio validado; el DOM solo muestra opciones y resultados.

## 2. Bucle diario

```text
TERRARIO / DÍA N
  |
  +--> Revisar colonia y condiciones del hábitat
  |
  +--> Preparar expedición
         |
         +--> Elegir un isópodo vivo con energía suficiente
         +--> Crear run determinista (semilla, 6 acciones, energía actual)
         |
         v
      MAPA DE NODOS
         |
         +--> Viajar a un nodo conectado (1 o 2 acciones)
         +--> Resolver su evento (elección A/B)
         +--> Recoger materiales o descubrimientos
         +--> Repetir mientras haya acciones
         |
         v
      REGRESO VOLUNTARIO
         |
         +--> Liquidar el botín una sola vez
         +--> Aplicar descanso al explorador
         +--> Ejecutar una vez stepSimulation(state, 1440)
         +--> El reloj entra en DÍA N+1
         |
         v
TERRARIO / DÍA N+1
  |
  +--> Aplicar mejoras con materiales y bellotas
  +--> Observar los recursos físicos incorporados al diorama
  +--> Nueva expedición disponible
```

El desplazamiento y cada resolución de evento consumen acciones discretas. No consumen minutos de simulación ni ejecutan pasos ecológicos intermedios. El tiempo biológico avanza una jornada al regresar, mediante la función de simulación ya existente. La llamada a `stepSimulation(state, 1440)` es el único punto donde la expedición hace avanzar la ecología; no se replica su lógica.

### Parámetros iniciales de balance

| Parámetro | Valor v0.1 | Regla |
|---|---:|---|
| Acciones por expedición | 6 | Entero; nunca puede ser negativo |
| Energía inicial | Energía actual del isópodo × 100 | Redondeada a entero entre 0 y 100 |
| Energía mínima para salir | 30 | No se puede seleccionar un animal agotado |
| Expediciones | 1 por día de terrario | Se consume el cupo al iniciar |
| Viaje normal | 1 acción | Se paga al entrar en el nodo |
| Viaje exigente | 2 acciones | Se paga al entrar en el nodo |
| Resolución de evento | 1 acción base | Cada opción declara su coste; algunas requieren 2 |
| Retirada | 0 acciones | Siempre disponible, incluso con 0 acciones |
| Regreso | Avanza 1 día | Usa el paso existente de 1440 minutos |

La energía de expedición es una representación entera de la energía biológica existente, no una segunda barra independiente. Los costes se acumulan en el run y se escriben sobre el isópodo cuando regresa. El descanso aplica:

`energía_regreso = min(100, energía_restante + 30 + bonus_humedad - penalización_estrés)`

- `bonus_humedad = 10` si la humedad del hábitat es al menos 0.65; en otro caso, 0.
- `penalización_estrés = 10` si el estrés del explorador es al menos 0.70; en otro caso, 0.
- El resultado se normaliza a 0..1 y después sigue el día ecológico ordinario.

El valor se debe ajustar con pruebas de balance, no presentarse como biología científica.

## 3. Mapa v0.1

Grafo lógico fijo, corto y legible; la representación visual sí se genera proceduralmente por semilla. La posición fina de los lugares, la distribución de hojas, piedras, musgo y restos varía de forma determinista sin romper la topología ni crear rutas desconectadas.

| Nodo | Acceso / coste | Conexiones | Temática y botín esperado |
|---|---:|---|---|
| Jardín húmedo | Inicio | Piedra musgosa, Tronco podrido | Rocío y primeras señales |
| Piedra musgosa | 1 | Jardín húmedo, Fruta caída | Musgo fresco y humedad |
| Tronco podrido | 1 | Jardín húmedo, Fruta caída, Compostero | Madera descompuesta y telarañas |
| Fruta caída | 1 | Piedra musgosa, Tronco podrido, Compostero | Materia orgánica y hongos |
| Compostero | 2 | Tronco podrido, Fruta caída | Materia orgánica concentrada |

Reglas del grafo:

1. El primer nodo es Jardín húmedo y no cuesta acciones.
2. Solo se puede viajar por una conexión declarada.
3. Los nodos ya visitados se pueden recorrer otra vez pagando su coste, pero no vuelven a generar evento ni botín.
4. Cada nodo tiene un único evento por expedición.
5. Se comprueba conectividad desde Jardín húmedo antes de aceptar el mapa.
6. Cuando no quedan acciones, siempre se puede regresar.

## 4. Eventos de elección

Un evento contiene `id`, nodo, título, descripción y dos o más opciones. Cada opción declara su coste de acciones, energía, materiales concedidos y descubrimientos. La UI enseña el coste antes de confirmar y el resultado después.

| Evento | Opción A | Opción B |
|---|---|---|
| Telaraña | Romper: 1 acción y 25 energía; recuperar madera/restos | Rodear: 2 acciones; conservar energía y recuperar materia orgánica |
| Fruta descompuesta | Recolectar: 1 acción; +3 materia orgánica | Investigar: 1 acción; +1 musgo o descubrimiento |
| Colonia de ácaros | Observar: 1 acción; registrar descubrimiento | Buscar restos: 1 acción y 10 energía; +2 materia orgánica |
| Bolsillo de rocío | Recoger: 1 acción; +2 gotas | Inspeccionar el musgo: 1 acción; +1 musgo |
| Compost maduro | Recoger: 1 acción; +4 materia orgánica | Remover: 2 acciones; +2 materia orgánica y +1 gota |

Los valores son de balance inicial. Los eventos nunca resuelven combate y una opción no puede dejar acciones o energía por debajo de cero.

## 5. Determinismo y reproducción de una run

- Cada terrario persiste `worldSeed` y `expeditionCount`.
- La semilla de expedición se deriva de ambas variables y queda guardada en el run activo.
- Se emplea un PRNG pequeño propio, versionado por el juego, con una secuencia de prueba fijada. No se depende del algoritmo RNG de una librería ni del orden de otros sistemas.
- La selección de eventos se calcula con `seed + nodeId + eventSlot`; una visita repetida no vuelve a tirar.
- El run activo persiste posición, acciones, energía, visitados, evento pendiente, decisiones y botín provisional.
- La misma semilla y la misma secuencia de comandos reproducen exactamente la misma partida.

## 6. Estado y máquina de transiciones

`ExpeditionProgress` vive dentro de `TerrariumState` y contiene:
- `worldSeed`, `expeditionCount`, `lastExpeditionDay`;
- inventario permanente de materiales;
- mejoras instaladas y descubrimientos;
- `active`, nulo o una expedición reanudable.

La run activa contiene:
- identificador, día, semilla y explorador;
- acciones y energía restantes;
- nodo actual y lista de visitados;
- evento pendiente y eventos ya resueltos;
- botín provisional;
- si la simulación estaba corriendo antes de entrar.

```text
IDLE
  -> PREPARATION
  -> ACTIVE_MAP
       -> TRAVEL
       -> EVENT_PENDING
       -> EVENT_RESOLVED
       -> ACTIVE_MAP
       -> RETURNING
  -> SETTLEMENT
  -> IDLE (DÍA N+1)
```

Contrato de comandos:

| Comando | Precondiciones | Mutación |
|---|---|---|
| `startExpedition(explorerId)` | Sin run activa, día disponible, animal vivo y energía >= 30 | Consume cupo y crea run con evento inicial |
| `travelToNode(nodeId)` | Run activa, evento actual resuelto, conexión válida, acciones suficientes | Gasta acciones, cambia nodo y prepara evento si no fue visitado |
| `resolveEvent(choiceId)` | Evento pendiente, opción conocida, acciones y energía suficientes | Gasta costes, añade botín provisional y registra resolución una sola vez |
| `returnFromExpedition()` | Run activa | Liquida botín, aplica descanso, avanza un día ecológico y cierra run |
| `buyExpeditionUpgrade(upgradeId)` | Sin run activa, materiales y bellotas suficientes, mejora aún no instalada | Descuenta coste e incorpora recurso físico al terrario |

No hay una transición que destruya o reconstruya el renderer. La UI cambia de pantalla y el objeto Three.js permanece en memoria.

## 7. Materiales, economía y mejoras

Los materiales no son moneda. Se acumulan en el inventario de expedición; las bellotas existentes siguen siendo la única divisa.

| Material | Fuente | Uso |
|---|---|---|
| Materia orgánica | Fruta, ácaros, compost | Capa de humus |
| Madera descompuesta | Tronco y telarañas | Refugio de corteza |
| Musgo fresco | Piedra y fruta húmeda | Jardín de musgo |
| Gotas de rocío | Jardín y bolsillos húmedos | Requisito para jardín de musgo |

Mejoras v0.1, una instalación de cada una:

| Mejora | Coste | Efecto en el terrario |
|---|---|---|
| Capa de humus | 10 materia orgánica + 5 bellotas | Añade hojarasca funcional, reutilizando el recurso que ya consume la simulación |
| Refugio de corteza | 8 madera + 5 bellotas | Añade recurso `bark`, que el renderer y el microclima ya reconocen como refugio |
| Jardín de musgo | 8 musgo + 4 gotas + 5 bellotas | Añade recurso `moss`, que el renderer y el microclima ya reconocen |

La instalación es atómica: primero valida todos los costes y el estado; después descuenta y añade el recurso. Si falta un material, no hay mutación parcial. Las mejoras son permanentes y sus recursos se colocan dentro de los límites del recipiente. No se crea una moneda paralela.

Nuevas especies, comercio, sistema de combate y minijuegos quedan fuera de v0.1. Los descubrimientos de ácaros son registros informativos y no habilitan especies incompatibles.

## 8. Persistencia y compatibilidad

El esquema actual del guardado pasa a versión 3. Los guardados v1 y v2 se migran asignando progreso vacío con una semilla por defecto estable. Los campos nuevos se validan antes de hidratar el estado.

Un guardado activo debe poder restaurar exactamente el mismo nodo, energía, acciones, semilla y evento pendiente. Liquidar botín se hace únicamente al cerrar el run; guardar, recargar o volver a abrir la pantalla no duplica recompensas.

La pantalla de expedición es una vista, no un estado paralelo. Si se carga una partida con run activa, se restaura directamente la pantalla de expedición y se conserva la misma autoridad de dominio.

## 9. Alcance excluido

- Combate, daño a enemigos, armas, vida de monstruos y acción en tiempo real.
- Procedural generation de un mapa libre; el grafo v0.1 es autorado y sus eventos sí son deterministas.
- Permadeath y derrota.
- Nuevas especies jugables.
- Minijuegos de reflejos o minijuegos obligatorios.
- Backend, multijugador o APIs remotas.
- Reescritura de `stepSimulation` o de los renderers.

## 10. Archivos previstos

- `src/expedition/rng.js`: hash de semilla, PRNG y selección ponderada.
- `src/expedition/diorama.js`: construcción procedural determinista del diorama del jardín y de los cinco dioramas de encuentro, con hitboxes 3D por nodo y opción.
- `src/expedition/content.js`: nodos, conexiones, eventos, opciones y mejoras como datos.
- `src/expedition/state.js`: fábrica y normalización estricta del progreso/run.
- `src/expedition/system.js`: comandos de inicio, viaje, elección, liquidación y mejoras.
- `src/state.js`: integrar el progreso en el estado autoritativo y su snapshot.
- `src/persistence.js`: migración y validación de esquema 3.
- `index.html`, `src/main.js`, `src/style.css`: pantalla de preparación, mapa, evento, inventario y retorno.
- `tests/expedition.test.js`, `tests/state.test.js`, `tests/browser-smoke.mjs`: reglas, persistencia y flujo real.

No se añaden dependencias runtime. Se reutilizan `stepSimulation`, `constrainToHabitat`, tipos de recurso `leaf-litter`, `bark` y `moss`, y el renderer persistente.

## 11. Criterios de aceptación

### CODE_GATE
- EXP-C01: todos los comandos rechazan IDs, costes, opciones y estados inválidos sin mutar parcialmente el dominio.
- EXP-C02: PRNG reproducible; sus primeros outputs y las selecciones ponderadas están fijados por tests.
- EXP-C03: migraciones v1/v2 -> v3 y rechazo de versiones futuras.
- EXP-C04: run activa y evento pendiente se guardan/restauran sin perder datos ni duplicar botín.
- EXP-C05: upgrades consumen materiales y bellotas de forma atómica; no se instalan dos veces.
- EXP-C06: tests unitarios y build pasan sin nueva dependencia runtime.

### GAMEPLAY_GATE
- EXP-G01: sandbox libre se inicia y juega sin abrir expediciones.
- EXP-G02: una expedición diaria; segundo inicio el mismo día se rechaza.
- EXP-G03: solo animales vivos con energía mínima pueden explorar.
- EXP-G04: solo se puede viajar por conexiones del mapa; todos los nodos son alcanzables.
- EXP-G05: viaje y evento consumen acciones; las elecciones consumen energía cuando corresponde; nunca valores negativos.
- EXP-G06: cada nodo entrega como máximo un evento por expedición; no se puede resolver dos veces.
- EXP-G07: misma semilla y comandos producen el mismo mapa/eventos/recompensas.
- EXP-G08: retirada siempre disponible; el botín provisional se liquida una sola vez.
- EXP-G09: el regreso avanza exactamente 1440 minutos mediante `stepSimulation`; acciones intermedias no avanzan el reloj ni la colonia.
- EXP-G10: guardar y recargar una run activa reanuda el mismo evento y permite continuar.
- EXP-G11: cada mejora deja un recurso real visible y útil para la simulación del terrario.
- EXP-G12: cambiar Diorama/Voxel o entrar/salir de expedición no crea un segundo estado ni reinicia el renderer.

### DESIGN_GATE
- EXP-D01: el mapa es un diorama 3D de terreno, senderos y lugares físicos; cada lugar tiene hotspot por raycast y alternativa accesible por botón.
- EXP-D02: cada nodo abre un diorama contextual con objetos coherentes con el encuentro; cada opción tiene un objeto/hotspot 3D seleccionable y un control equivalente con coste visible.
- EXP-D03: mapa y escenas de encuentro dominan el viewport; el HUD no tapa la escena ni convierte la exploración en formulario o cuadrícula de tarjetas.
- EXP-D04: usable a 1440x1000, 390x844 y 360x640; navegación por mouse/touch y teclado, hitboxes suficientes, foco visible y sin overflow.
- EXP-D05: el mapa conserva una distribución procedural reproducible por semilla; el movimiento reducido no impide entender estado, opciones o recompensas.

### INTEGRATION_GATE
- EXP-I01: el mismo canvas y la misma instancia de WebGLRenderer se reubican entre terrario, mapa y escenas de nodo; al regresar se restituye el grupo, cámara y host del terrario sin recrearlo.
- EXP-I02: guardado antiguo v1/v2 sigue continuable.
- EXP-I03: no hay errores de consola, requests fallidos o regresiones en flujos anteriores.
- EXP-I04: evidencia Playwright actual vinculada al SHA y revisada visualmente.

### Estado de implementación
Todos los criterios EXP-C/G/D/I se encuentran **PENDIENTES** antes de la fase de implementación. El diseño de esta especificación no equivale a aprobación del MVP.


## 12. Presentación diegética por dioramas

La exploración no se presenta como una página de administración ni como un grafo de tarjetas. El terrario sigue siendo el diorama principal; al abrir Explorar, el mismo renderer muestra un diorama panorámico del jardín. Los cinco lugares se representan físicamente en el terreno (piedra con musgo, tronco, fruta y compost), conectados por raíces y senderos.

La semilla de la expedición controla pequeños desplazamientos y el dressing procedural del terreno. La topología lógica permanece fija en v0.1 para garantizar conectividad y pruebas reproducibles. Tocar un elemento físico usa raycasting sobre un collider 3D; la lista de nombres del sendero es una alternativa accesible, no la interacción primaria.

Al entrar a un nodo, el mapa se sustituye temporalmente por un diorama contextual del encuentro. Telarañas, fruta, ácaros, gotas y compost se representan en escena. Los objetos/zonas de acción tienen hotspots 3D y una alternativa accesible con el mismo comando de dominio. La resolución devuelve al mapa y actualiza acciones, energía, rutas, recompensas y feedback.

La transición no crea un segundo renderer ni un segundo estado ecológico. El canvas existente se mueve al host de expedición y vuelve al host del terrario. El grupo 3D del terrario se oculta durante la exploración y se restaura junto con su cámara al regresar.
