# Especificación técnica — Terrario sandbox de isópodos

**Estado:** especificación normativa del juego; la implementación inicial está en progreso y sus criterios siguen vigentes.  
**Juego:** `games/terrario-isopodos/`  
**Alcance de esta fase:** diseño, contratos y criterios de aceptación. No implementar todavía el runtime hasta validar el spike técnico.

## 1. Visión y límites

Crear un terrario interactivo de navegador para observar y gestionar una colonia de isópodos. La especie inicial es *Armadillidium vulgare*. El producto es un **sandbox libre**, sin campaña obligatoria ni condición de victoria/derrota.

La experiencia debe permitir:
- observar animales y el entorno en una escena 3D;
- alternar en el mismo terrario entre representación **Diorama** y **Voxel**;
- elegir terrario rectangular o cilíndrico;
- pausar, avanzar normalmente y acelerar la simulación;
- modificar variables básicas del hábitat y observar sus consecuencias;
- descubrir comportamientos mediante observación y consultar fichas de especie;
- guardar y recuperar el terrario en el navegador.

La biología es deliberadamente simplificada y orientada al juego. No presentar sus valores como un modelo científico validado ni como asesoramiento de cría real.

## 2. Decisiones cerradas

| Área | Decisión |
|---|---|
| Plataforma inicial | Navegador de escritorio y móvil; instalación local sin backend obligatorio |
| Render | Three.js/WebGL con una capa de render independiente del modelo de simulación |
| Modos visuales | Diorama y Voxel, conmutables durante una sesión |
| Animales en Diorama | Modelos 3D con animaciones simples |
| Animales en Voxel | Sprites voxelizados desde atlas/spritesheets; no sustituirlos por modelos 3D convencionales |
| Contenedor | Terrario rectangular y cilíndrico |
| Cámara | Cámara orbital con rotación y zoom; encuadre inicial automático según la forma del terrario |
| Tiempo | Pausa, velocidad normal y aceleración; el tiempo de simulación no depende de la tasa de render |
| Progresión | Sandbox libre; descubrimientos informativos, sin bloqueo de funciones esenciales |
| Persistencia | Guardado local versionado y recuperación segura |
| Idioma inicial | Español; textos centralizados para permitir añadir otros idiomas sin modificar la lógica |
| Conectividad | El núcleo jugable funciona sin servicios remotos ni APIs de pago |
| Alcance inicial | Una especie jugable: *Armadillidium vulgare* |
| Autoridad | Un modelo de dominio es la fuente única de verdad; render, HUD y audio no deciden reglas |

La integración de VoxPix u otra herramienta externa **no se da por aprobada** por estar en el catálogo: solo se incorporará tras verificar API, licencia, compatibilidad y necesidad. La decisión de usar Three.js como base no impide evaluar un adaptador de render alternativo si una prueba técnica demuestra una ventaja real.

## 3. Experiencia y flujo de pantallas

Flujo principal:

`BOOT → MAIN_MENU → TERRARIUM_SETUP → PLAYING ↔ PAUSED`

Los ajustes, ayuda, ficha de especie, descubrimientos, guardar/cargar y confirmaciones pueden mostrarse como paneles o pantallas dentro de un router explícito. No usar booleanos independientes que permitan estados imposibles.

### Pantallas/paneles

1. **Inicio:** Nuevo terrario, Continuar si existe guardado válido, Ajustes y Cómo se juega.
2. **Configuración inicial:** nombre opcional, forma rectangular/cilíndrica, tamaño inicial dentro de límites definidos, colonia inicial y modo visual.
3. **Terrario:** escena 3D, controles de tiempo, cámara, hábitat, colonia, observación y menú.
4. **Pausa:** congela simulación e input de gameplay, pero permite volver, guardar, ajustar opciones y salir.
5. **Observación:** ficha de animal, estado visible y comportamientos observados; la selección no altera por sí sola el modelo.
6. **Descubrimientos:** registro persistente de observaciones desbloqueadas por condiciones reproducibles; no bloquea la simulación.
7. **Ajustes:** volumen/mute si hay audio, idioma, calidad gráfica, sensibilidad de cámara, modo visual y preferencias de accesibilidad.
8. **Guardar/cargar:** guardar, continuar y crear/renombrar/borrar terrarios con confirmación destructiva.
9. **Ayuda:** controles, significado de indicadores y explicación de que la biología es simplificada.

No hay pantalla de derrota ni victoria. Los eventos biológicos (incluida la extinción de la colonia) se muestran como estados recuperables del sandbox, no como fin forzado de la aplicación.

## 4. Arquitectura lógica

Mantener módulos pequeños con contratos explícitos. Los nombres son responsabilidades previstas, no obligación de crear un monolito por módulo.

- `app/`: bootstrap, router de pantallas y composición de dependencias.
- `domain/`: entidades, reglas biológicas simplificadas, comandos y eventos.
- `simulation/`: reloj fijo, pasos de simulación, aceleración y semilla RNG.
- `habitat/`: geometría lógica, sustrato, humedad, temperatura, refugios, hojarasca y alimento.
- `rendering/contracts/`: interfaz común de escena, cámara, selección y sincronización visual.
- `rendering/diorama/`: escena, materiales, modelos 3D e iluminación.
- `rendering/voxel/`: escena visual y sprites voxelizados con atlas/spritesheets.
- `ui/`: HUD derivado del estado, menús, controles, fichas y accesibilidad.
- `persistence/`: esquema versionado, validación, migración y almacenamiento local.
- `i18n/`: catálogo de cadenas y fallback.
- `assets/`: modelos, sprites, texturas, audio y manifiesto de procedencia/licencias.
- `tests/`: pruebas de dominio, simulación, persistencia, integración y render.

La estructura física del juego vive exclusivamente bajo `games/terrario-isopodos/`; los módulos de la arquitectura lógica se concretarán al implementar.

### Fuente única de verdad

- `TerrariumState` contiene ID, versión de esquema, nombre, forma/tamaño, parámetros del hábitat, entidades, reloj, RNG y descubrimientos.
- `SettingsState` contiene preferencias de interfaz, cámara, audio, idioma y calidad; no forma parte de la biología del terrario.
- Los comandos modifican el estado mediante reglas del dominio. Ejemplos: `SetHabitatParameter`, `AddFood`, `AddShelter`, `SelectIsopod`, `SetSimulationSpeed`, `SwitchVisualMode`.
- El HUD deriva sus valores del estado o de eventos; no mantiene contadores biológicos propios.
- El renderer solo representa estado y envía intención de interacción. Una animación no puede crear alimento, nacimiento, muerte ni reproducción.
- La cámara y el modo visual son presentación. Cambiarlos no reinicia el RNG, reloj, colonia, condiciones ni descubrimientos.
- La geometría visual y la lógica del recipiente comparten una descripción de forma y dimensiones para que los límites de movimiento coincidan con el contenedor mostrado.

## 5. Modelo de simulación MVP

### Entidades

- **Isópodo:** ID estable, especie, etapa de vida, posición lógica, energía, hidratación, estrés y estado vital.
- **Hábitat:** forma/dimensiones, humedad, temperatura, sustrato, hojarasca, alimento y refugios.
- **Recurso:** tipo, cantidad, posición y degradación cuando aplique.
- **Descubrimiento:** ID, condición que lo activa, instante de primera observación y versión del catálogo.
- **Terrario:** estado agregado y configuración persistente de la sesión.

### Ciclo

La simulación utiliza pasos fijos de tiempo de juego independientes de los frames renderizados. La aceleración ejecuta más tiempo simulado por segundo real; pausa equivale a cero pasos. Debe existir un límite de pasos por frame para evitar congelaciones al volver de una pestaña suspendida.

Cada paso actualiza, en orden determinista:
1. condiciones del hábitat y degradación de recursos;
2. necesidades simplificadas del animal;
3. búsqueda/movimiento hacia comida, refugio o zonas preferidas;
4. interacciones básicas entre animales;
5. eventos de ciclo vital habilitados por el modelo;
6. agregados, descubrimientos y eventos de UI.

La simulación debe poder ejecutarse sin render para probar reglas. La misma semilla y las mismas entradas deben producir la misma secuencia de resultados en el mismo build. El orden determinista no exige idénticos resultados entre versiones de reglas distintas.

### Variables y comportamientos

El MVP simula, como mínimo:
- humedad ambiental/sustrato y temperatura como indicadores controlables;
- presencia y consumo de alimento/hojarasca;
- refugios y preferencia de los isópodos por microhábitats;
- movimiento, descanso, alimentación y búsqueda de refugio;
- estado vital visible y eventos de colonia;
- nacimientos y muertes si el ciclo reproductivo está habilitado en la configuración inicial.

Los rangos, umbrales y tasas serán constantes documentadas del modelo lúdico, no afirmaciones de precisión científica. Deben tener pruebas de límite y estar centralizados; no repetir fórmulas en HUD, IA y renderer.

No incluir en el MVP: genética detallada, química del sustrato, simulación física de fluidos, red/multijugador, comercio, campaña, monetización ni APIs externas.

## 6. Dos modos visuales sobre el mismo mundo

### Diorama
- Escena 3D en miniatura, perspectiva ortográfica o perspectiva débil configurable si la prueba visual lo justifica.
- Isópodos representados con modelos 3D y animaciones simples de desplazamiento/descanso.
- Iluminación y sombras controladas para conservar legibilidad en móvil.
- Sustrato, hojarasca, refugios, alimento y paredes deben tener volumen perceptible y escala consistente.

### Voxel
- Mantiene el mismo terrario, geometría, cámara lógica y entidades.
- Isópodos dibujados con sprites voxelizados desde atlas/spritesheets. La orientación del sprite y la oclusión deben ser consistentes con la cámara.
- El recipiente, sustrato, refugios y recursos pueden usar estética voxel/low-poly coherente; no degradar todo a una captura 2D plana.
- El cambio de modo reemplaza solo la representación visual, no las entidades ni la simulación.
- Si no hay sprite para una etapa/estado, usar fallback explícito y visible en desarrollo; nunca un cuadrado vacío silencioso.

### Cámara y formas
- Cámara orbital con rotación, zoom acotado y botón de restablecer vista.
- En móvil: gestos táctiles sin interferir con botones; zoom con pinza y rotación con gesto documentado.
- En escritorio: ratón y controles de teclado accesibles.
- El encuadre automático debe mostrar el recipiente completo en ambas formas y modos.
- Rectangular: límites de movimiento dentro de un prisma/volumen rectangular.
- Cilíndrico: límites de movimiento dentro del radio y altura configurados; sin esquinas invisibles ni animales atravesando la pared.
- Cambiar forma solo al crear un terrario nuevo en el MVP. Convertir un terrario existente queda fuera de alcance para evitar migraciones ambiguas.

## 7. Controles y accesibilidad

- Un botón visible de pausa/reanudar.
- Selector de velocidad con opciones Pausa, Normal y Acelerado; mostrar la velocidad activa.
- Controles visibles para modo Diorama/Voxel y cámara.
- Acciones principales utilizables con teclado, ratón y tacto.
- Botones con etiquetas accesibles, foco visible, orden de tabulación razonable y estados deshabilitados explicados.
- Opción de reducir movimiento/efectos cuando corresponda.
- La pausa debe impedir que la simulación avance, aunque sigan funcionando menús y cámara.
- En móviles, respetar safe areas y evitar scroll/zoom accidental sobre el canvas cuando se interactúa con el terrario; no bloquear accesibilidad de la página completa sin necesidad.

## 8. Persistencia y errores

- Guardado local con esquema versionado y migraciones explícitas.
- Separar datos de terrario y ajustes de usuario.
- Validar el archivo/registro completo antes de reemplazar un guardado existente.
- Rechazar datos corruptos, IDs duplicados, valores fuera de límites y versiones futuras desconocidas sin destruir el último guardado válido.
- Guardado manual y autoguardado en puntos seguros; no escribir en cada frame.
- Indicar visualmente éxito o fallo real de guardado.
- Incluir exportación/importación JSON validada si puede implementarse sin comprometer el alcance; en caso contrario, dejarla como PENDIENTE con criterios antes de declarar el MVP completo.
- Sin backend ni cuenta de usuario en el MVP. Los guardados quedan en el navegador y deben explicarse al usuario; borrar datos del navegador puede borrarlos.

## 9. Rendimiento y compatibilidad

- Objetivo: navegadores modernos con WebGL en escritorio y móvil; detectar pérdida/no disponibilidad de contexto y mostrar mensaje recuperable.
- No exigir tasa fija de 60 FPS en todo móvil. Definir y medir dispositivos de referencia al empezar la implementación.
- Separar frecuencia de render y pasos de simulación.
- Limitar densidad de sombras, partículas y detalle según calidad gráfica.
- Usar instancing/batching cuando se justifique por profiling, no prematuramente.
- No cargar modelos/sprites no usados por el modo activo si su coste afecta la carga inicial.
- La escena debe redimensionarse al cambiar viewport/orientación sin distorsionar la geometría.
- No aprobar rendimiento solo por impresión subjetiva: registrar dispositivo, navegador, tamaño de colonia, modo visual y medición.

## 10. Matriz de sistemas transversales

| Sistema | Estado MVP | Criterio/razón |
|---|---|---|
| Arranque y menú | INCLUIR | Nuevo, continuar, ajustes y ayuda |
| Flujo de pantallas | INCLUIR | Router/estados explícitos |
| HUD | INCLUIR | Derivado del estado real |
| Pausa/reanudación | INCLUIR | Congela el reloj de simulación |
| Configuración | INCLUIR | Persistencia separada del terrario |
| Idioma | INCLUIR | Español inicial y catálogo extensible |
| Modos visuales | INCLUIR | Diorama/Voxel en la misma sesión |
| Formas de terrario | INCLUIR | Rectangular/Cilíndrico al crear |
| Guardado/carga | INCLUIR | Local, versionado, validado |
| Exportar/importar | PENDIENTE | Decidir tras validar UX y formato JSON; no sobrescribir datos válidos ante importación inválida |
| Autoguardado | INCLUIR | Solo en puntos seguros y con feedback |
| Victoria/derrota | NO APLICA | Sandbox sin objetivo final obligatorio |
| Reiniciar/borrar | INCLUIR | Confirmación antes de perder estado |
| Ayuda/tutorial | INCLUIR | Controles, indicadores y límites del modelo |
| Input | INCLUIR | Ratón, teclado y tacto |
| Audio | PENDIENTE | No bloquear MVP; si se añade, mute/volumen y preferencias persistentes |
| Responsive/safe areas | INCLUIR | Escritorio y móvil, ambos modos |
| Accesibilidad | INCLUIR | Foco, etiquetas, contraste, movimiento reducido |
| Diagnóstico de errores | INCLUIR | Guardado, recursos y WebGL con errores recuperables |
| Build/exportación | INCLUIR | Build reproducible para hosting estático |
| QA | INCLUIR | Pruebas de dominio, integración y evidencia visual trazable |

## 11. Criterios de aceptación verificables

### A. Arranque y flujo
- [ ] La aplicación abre sin error fatal en un navegador objetivo y muestra menú de inicio.
- [ ] Nuevo terrario crea exactamente un estado inicial válido y abre la escena seleccionada.
- [ ] Continuar solo aparece cuando hay un guardado válido; un guardado corrupto no bloquea Nuevo terrario.
- [ ] Pausar detiene los pasos de simulación; reanudar continúa desde el mismo estado.
- [ ] No existen botones visibles sin acción implementada; las funciones pendientes aparecen deshabilitadas o claramente marcadas.

### B. Tiempo y simulación
- [ ] Pausa produce cero pasos de simulación durante una espera controlada.
- [ ] Normal y Acelerado avanzan el reloj según sus factores configurados, con tolerancia documentada.
- [ ] La simulación no se acelera por tener más FPS ni se rompe al volver de una pestaña suspendida.
- [ ] Una semilla fija y una secuencia fija de comandos producen el mismo resultado en dos ejecuciones del mismo build.
- [ ] Las variables del hábitat afectan al menos un comportamiento observable mediante pruebas de dominio, sin depender del renderer.
- [ ] Los valores fuera de rango se rechazan o normalizan por una única regla documentada.

### C. Dos renderers
- [ ] Cambiar Diorama ↔ Voxel repetidamente conserva ID y cantidad de animales, reloj, hábitat, recursos y descubrimientos.
- [ ] Diorama muestra animales como modelos 3D animados; Voxel los muestra como sprites voxelizados desde assets verificables.
- [ ] Ningún modo presenta animales invisibles por falta de asset sin fallback/error de desarrollo.
- [ ] La escena no se reconstruye de forma que duplique entidades o listeners al alternar modos.
- [ ] Ambos modos permiten seleccionar un animal y ver la misma información de dominio.

### D. Geometría y cámara
- [ ] Los dos tipos de recipiente se ven completos en escritorio y móvil al entrar.
- [ ] Los animales no atraviesan paredes ni salen de los límites lógicos en pruebas de borde.
- [ ] Rotación, zoom y restablecimiento de cámara funcionan con ratón y tacto.
- [ ] Redimensionar/orientar el dispositivo no deforma el recipiente ni oculta controles esenciales.

### E. Interfaz y accesibilidad
- [ ] HUD y fichas coinciden con el estado de dominio tras alimentación, muerte, nacimiento o cambios del hábitat.
- [ ] Se puede recorrer el menú y ajustes con teclado y el foco es visible.
- [ ] Controles táctiles tienen área suficiente, no se solapan y respetan safe areas.
- [ ] Modo visual, velocidad, ajustes y estados activos son distinguibles sin depender solo del color.
- [ ] Los textos de interfaz proceden del catálogo de idioma, no de cadenas dispersas en la lógica.

### F. Persistencia
- [ ] Guardar, recargar la página y continuar restaura forma, animales, recursos, hábitat, reloj y descubrimientos.
- [ ] Los ajustes de interfaz no contaminan el estado biológico guardado.
- [ ] Un guardado inválido no sobrescribe un guardado válido.
- [ ] Las versiones conocidas se migran mediante pruebas con fixtures; una versión futura desconocida se rechaza con mensaje.
- [ ] Un fallo de almacenamiento se comunica y no se muestra como éxito.

### G. Calidad e integración
- [ ] Pruebas de dominio cubren límites y al menos un caso por comportamiento biológico implementado.
- [ ] Las pruebas de integración verifican pausa, cambio de modo, cambio de cámara y guardado en una misma sesión.
- [ ] Build de producción termina correctamente y se sirve desde el hosting estático previsto.
- [ ] Se registran errores de consola/red relevantes y no quedan errores nuevos sin explicar.
- [ ] Capturas reales de escritorio y móvil proceden del commit exacto probado; incluir ambos modos visuales y ambas formas del terrario.
- [ ] CODE_GATE, GAMEPLAY_GATE, DESIGN_GATE e INTEGRATION_GATE tienen PASS con evidencia, o bloqueo explícito. No se acepta PASS por compilación solamente.

## 12. Plan de ejecución por fases

1. **Cerrar especificación y riesgos:** aprobar este documento; confirmar que no se necesita backend ni más especies para el MVP.
2. **Spike técnico de render:** prototipo desechable fuera de `games/` o rama técnica aislada para verificar Three.js, sprite voxelizado en escena 3D, cámara orbital y formas de recipiente. No construir gameplay completo durante este spike.
3. **Modelo de dominio y reloj:** entidades, RNG, comandos, reglas, pruebas deterministas y límites.
4. **Persistencia:** esquema, validación, migración y pruebas de recuperación.
5. **Renderer Diorama:** recipiente, entorno, modelos provisionales licenciados/propios y selección.
6. **Renderer Voxel:** atlas de sprites voxelizados, sincronización con la misma simulación y cambio de modo.
7. **HUD, menús, ajustes e input:** responsive, accesibilidad y controles de velocidad.
8. **Biología MVP y descubrimientos:** comportamientos mínimos y pruebas de límites.
9. **Integración y pulido:** profiling, QA independiente, capturas actuales, build y reporte.
10. **Implementar dentro de `games/terrario-isopodos/`** solo después de que el diseño quede cerrado y el spike confirme el riesgo técnico principal.

## 13. Riesgos abiertos y reglas de bloqueo

- **Sprites voxelizados en escena 3D:** validar transparencia, orientación, escala, oclusión y rendimiento en móvil durante el spike.
- **Forma cilíndrica:** validar límites lógicos y colisión visual; no implementar una caja invisible dentro de un cilindro.
- **Biología:** publicar los parámetros como simplificación lúdica y evitar falsa precisión científica.
- **Licencias:** registrar procedencia y licencia de cada modelo, sprite, textura, fuente y audio antes de distribuir.
- **Rendimiento:** fijar dispositivos de referencia antes de prometer FPS o un máximo de animales.
- **Persistencia local:** explicar que los datos son propios de ese navegador/perfil y pueden perderse si se borran sus datos.
- **No se bloquea por audio ni por multijugador:** no son requisitos del MVP.
- **No se inicia el juego completo** si el spike no demuestra cambio de renderer sin pérdida de estado, o si no existe un plan viable para sprites voxelizados móviles.
