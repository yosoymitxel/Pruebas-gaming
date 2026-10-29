# Esqueleto transversal de un videojuego

## Objetivo

Todo juego nuevo debe comenzar con un inventario explícito de sistemas comunes y una decisión documentada sobre cada uno. No se impone implementar funciones que no correspondan al género, pero tampoco se permite olvidarlas silenciosamente. Esta guía se inspira en sistemas presentes en Kure'iChaosChess sin copiar su estética ni asumir que su arquitectura es universal.

## Tabla de verdad inicial obligatoria

Cada proyecto debe registrar para cada sistema uno de estos estados: INCLUIR, NO APLICA (con motivo), PENDIENTE (con criterio de aceptación) o BLOQUEADO (con causa).

| Sistema | Criterio mínimo cuando aplica |
|---|---|
| Arranque y menú principal | Iniciar, continuar si hay partida, configuración y ayuda/créditos cuando correspondan |
| Flujo de pantallas | Máquina de estados o router explícito; transiciones válidas |
| HUD | Mostrar el estado real, derivado de una fuente autoritativa |
| Pausa/reanudación | Pausar simulación e input de gameplay; reanudar sin avance oculto |
| Configuración | Guardar y restaurar ajustes soportados |
| Idiomas | Catálogo de traducciones, fallback definido y preferencia persistente |
| Temas | Catálogo, selección centralizada y fallback, si existen temas |
| Guardado/carga | Esquema versionado, validación, migración y recuperación |
| Exportar/importar | Formato versionado y validación antes de alterar el estado, cuando corresponda |
| Autoguardado | Puntos seguros; separado del guardado manual si hay slots |
| Victoria/derrota/fin | Resultado decidido por las reglas, no por la presentación |
| Nueva partida/reinicio | Reinicio limpio; confirmar pérdida de progreso cuando corresponda |
| Ayuda/tutorial | Instrucciones claras según complejidad |
| Input | Dispositivos objetivo, navegación de menús y foco accesible |
| Audio | Controles de volumen/mute cuando haya sonido |
| Responsive/safe areas | Adaptación a los dispositivos objetivo |
| Accesibilidad | Foco, contraste, legibilidad, teclado y movimiento reducido cuando aplique |
| Errores/diagnóstico | Fallos de carga y guardado visibles y registrables |
| Build/exportación | Comando y artefacto reproducibles para el destino |
| QA | Pruebas de lógica y flujo real; evidencia visual actual cuando corresponda |

## Fuente única de verdad

- Un modelo autoritativo posee el estado de la partida y las reglas.
- La configuración persistente es independiente del estado de una sesión.
- Catálogos de entidades, personajes, objetos, habilidades, temas e idiomas usan IDs estables.
- HUD y UI se derivan del modelo o de eventos; no mantienen copias mutables competidoras.
- Guardado y exportación serializan datos simples, no objetos vivos del motor ni elementos DOM.
- Cargar pasa por validación y reconstrucción del modelo.
- Las acciones de gameplay pasan por un punto de validación definido.
- Audio, VFX y animaciones reaccionan a eventos; no alteran las reglas por su cuenta.

## Precedencia ante conflictos

1. Requisitos explícitos del usuario y del producto.
2. Reglas canónicas documentadas del juego.
3. Modelo autoritativo y validadores de dominio.
4. Máquina de estados y contrato de input.
5. UI/HUD como representación derivada.
6. Animaciones, sonidos y efectos cosméticos.
7. Defaults visuales y aleatoriedad.

La capa inferior nunca invalida la superior. Una animación no decide si hubo captura, daño, recompensa o victoria. Si dos modificadores se contradicen y no existe precedencia documentada, registrar un caso reproducible y pedir decisión; no improvisar.

Cada modificador/objeto/habilidad debe declarar ID, activación, duración, campos que modifica, prioridad o regla de composición, acumulación/reemplazo, orden determinista, impacto en guardado/UI y pruebas de conflicto.

## Contrato mínimo de guardado

- Separar configuración, perfil/progreso y partida activa cuando corresponda.
- Guardar versión de esquema e identificador del juego.
- Migrar versiones antiguas; rechazar con seguridad versiones futuras desconocidas.
- Validar tamaño, estructura y rangos; preservar copia válida o recuperación equivalente.
- Autoguardar en puntos consistentes y no sobrescribir slots manuales.
- Validar la importación completa antes de cambiar el estado existente.
- Mostrar error si falla guardar/cargar; no simular éxito.
- Probar guardar, cerrar/reiniciar y cargar; importar archivo inválido sin modificar el estado; migrar un fixture antiguo.

## Flujo de pantallas

Modelo conceptual: BOOT → MAIN_MENU → SETUP → PLAYING ↔ PAUSED → RESULT → RETRY/NEXT/MAIN_MENU. Solo incluir los estados pertinentes al juego. Settings, ayuda y confirmaciones pueden ser pantallas o overlays, según la arquitectura. Evitar booleanos independientes que permitan estados imposibles.

## Reutilizar contratos, no la personalidad visual

Se pueden reutilizar contratos y patrones de menú, ajustes, guardado, localización, input, pausa, resultados y QA. Cada juego conserva su propia dirección artística, ritmo, reglas y layout. No copiar CSS ni componentes de Kure'iChaosChess sin una razón concreta, y no portar un sistema entero si basta un módulo pequeño.

## Criterio de aceptación del esqueleto

Demostrar los flujos aplicables: arranque y menú; configuración persistente; pausa/reanudación; resultado terminal; guardar y restaurar; exportar/importar y caso inválido; cambio de idioma/tema persistente; responsive; coherencia modelo/HUD/resultado; y capturas actuales vinculadas a la revisión exacta. Registrar todos los NO APLICA y por qué.
