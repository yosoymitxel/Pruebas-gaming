# Puertas obligatorias de calidad

Cada tarea registra las tres puertas: **CODE**, **GAMEPLAY** y **DESIGN**. Para cambios acotados, las comprobaciones se pueden reducir, pero no desaparecer sin justificación.

## 1. CODE_GATE — ingeniería
Comprobar lo que aplique al stack detectado:
- Lint, typecheck, tests y build existentes.
- Manejo de errores y ausencia de errores nuevos en consola.
- Diff pequeño, sin archivos generados, secretos ni dependencias accidentales.
- Seguridad/licencia de dependencias nuevas.
- Pruebas de regresión para la lógica afectada.
- No romper convenciones, APIs ni compatibilidad existentes.

PASS exige registrar comandos reales y sus resultados. Si no hay suite de tests, crear una prueba pertinente o documentar el riesgo residual.

## 2. GAMEPLAY_GATE — reglas y experiencia jugable
Para juegos interactivos, comprobar:
- Arranque y carga de recursos.
- Input real de teclado, ratón y/o táctil según plataforma.
- Acción principal y reglas relevantes.
- Estados de pausa, reinicio, victoria/derrota y transiciones que existan en el juego.
- Animaciones, colisiones, turnos, puntuación y efectos cuando estén dentro del alcance.
- Errores runtime/consola y regresiones del flujo.
- Prueba repetible de la mecánica afectada; incluir casos límite.

En una tarea que no cambia ni puede afectar gameplay, registrar NOT_APPLICABLE y justificarlo. En un juego que no se puede ejecutar, BLOCKED; no PASS.

## 3. DESIGN_GATE — dirección visual, UX y accesibilidad
Comprobar:
- Jerarquía visual y coherencia con la dirección artística acordada.
- Tipografía, contraste, legibilidad, espaciado y alineación.
- Estados hover/focus/active/disabled/error/loading cuando existan.
- Responsive real en los viewports relevantes.
- Overflow, elementos superpuestos, clipping y z-index.
- Accesibilidad básica: foco visible, etiquetas, navegación por teclado y contraste cuando aplique.
- Movimiento: timing, easing, interrupciones, repetición y reduced motion cuando corresponda.
- Capturas reales del producto ejecutándose para cambios visuales; no mockups sustitutos.

En cambios internos sin impacto visual, registrar NOT_APPLICABLE y explicar por qué.

## 4. INTEGRATION_GATE — regresión conjunta
- Ejecutar los flujos que cruzan los sistemas modificados.
- Comprobar assets y rutas de carga.
- Verificar tamaños/formatos de build y comportamiento del hosting objetivo.
- Confirmar que no se ha duplicado un sistema existente.
- Revisar el diff final y que los criterios iniciales estén satisfechos.

## Criterio de bloqueo
No declarar la tarea terminada si una puerta aplicable está en FAIL o BLOCKED. Se puede entregar un estado parcial claramente etiquetado, con bloqueo y pasos concretos para resolverlo.
