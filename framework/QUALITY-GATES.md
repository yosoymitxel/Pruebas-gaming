# Puertas de calidad

Un cambio se da por hecho cuando pasa las cuatro. Resultado de cada una: PASS, FAIL, BLOCKED (no se pudo
probar, con motivo) o NOT_APPLICABLE (con motivo). Nunca se convierte una suposición en PASS.

| Puerta | Qué se comprueba | Cómo |
|---|---|---|
| CODE_GATE | Pruebas, registros completos, sin vulnerabilidades altas, diff revisado y sin código muerto | `npm test`, `npm run check`, `npm audit --audit-level=high` |
| GAMEPLAY_GATE | Reglas, controles y estados funcionan jugando; retos vencibles y no triviales | selfchecks del juego + `npm run smoke` |
| DESIGN_GATE | Legible y coherente con `DESIGN.md` en PC y 360×800; foco, táctil ≥ 48 px, movimiento reducido | capturas de `npm run smoke` mirándolas de verdad |
| INTEGRATION_GATE | Build de producción, sin errores de consola, publicado y abierto desde la portada | `npm run build`, CI en verde, Pages |

Las capturas y resultados se citan con el commit probado.
