# Fuente única de verdad y conflictos del juego

## Regla central

Una sola autoridad decide el estado. El resto lo representa o lo consume. No mantener estado de partida duplicado en motor, HUD, menú y guardado sin un contrato de sincronización.

| Dato | Autoridad | No permitido |
|---|---|---|
| Posición, vida, inventario, piezas, turno | Modelo de dominio/partida | UI con una copia mutable competidora |
| Reglas, captura, daño, victoria/derrota | Validador/casos de uso de gameplay | Determinar resultados por duración de una animación |
| Ajustes | Repositorio de configuración | Cada pantalla guardando valores contradictorios |
| Tema | Preferencia + catálogo de temas | Cambiar solo CSS y dejar assets en otro tema |
| Idioma | Preferencia + catálogo i18n | Textos de jugador dispersos sin localizar |
| Progreso/logros | Repositorio de progreso | Premiar dos veces por renders duplicados |
| Save/export | Serializador versionado del modelo | Serializar DOM, nodos u objetos vivos |
| Pantalla/overlay | Router o máquina de estados | Booleanos independientes que crean estados imposibles |
| Aleatoriedad | RNG/seed por partida cuando importa | RNG disperso si se necesita reproducibilidad |
| Animación/audio/VFX | Presentación que escucha eventos | Mutar reglas o confirmar una acción |

## Resolución de contradicciones

1. Requisitos del producto y reglas documentadas.
2. Modelo autoritativo y validación de dominio.
3. Máquina de estados y contrato de input.
4. Vista/HUD derivada.
5. Animación y VFX.
6. Defaults y preferencias no críticas.

Si la contradicción no está resuelta por las reglas, crear un caso reproducible y pedir decisión. No elegir silenciosamente.

## Modificadores, cartas, objetos y habilidades

Cada uno declara ID estable, activación, duración, datos modificados, prioridad/regla de composición, si acumula/reemplaza/bloquea, orden determinista, impacto en persistencia/UI y pruebas de compatibilidad. La regla vive en el dominio; no se duplica en el renderizador, bot y menú.

## Referencia inspeccionada: Kure'iChaosChess

El árbol de la rama main incluye:
- src/ui/app.js: coordinación de pantalla, configuración y flujo.
- src/ui/screens/menu.js, setup.js y overlays.js: menú, ajustes y overlays.
- src/game/run.js: carga/guardado de partida, configuración y progreso.
- src/game/backup.js: exportación/importación local con formatos KCC1/KCC2 y validación de formato.
- src/i18n/index.js y src/i18n/en.js: idioma, catálogo y fallback.
- src/data/themes.js: temas y aplicación de apariencia.
- src/game/rules.js, match.js y cards.js: reglas, estado y cartas.
- src/ui/gamepad.js y src/ui/fullscreen.js: mando y pantalla completa.

Esta inspección confirma módulos de referencia y algunos patrones, no una auditoría completa de calidad. Antes de portar cualquier sistema, volver a leer su implementación actual, dependencias y pruebas.

## Skills que cubren partes del problema

- game-ui-ux: menús, HUD, overlays, pila de pantallas, responsive y navegación por teclado/mando.
- save-systems: estado serializable, slots, autosave, versiones, migraciones y recuperación.
- input-systems: acciones, dispositivos, remapeo y buffering.
- Skill de localización y skill concreta del motor para UI/persistencia.

No asumir que una única skill proporciona el esqueleto completo. Combinar las relevantes con este contrato y la arquitectura real del juego.
