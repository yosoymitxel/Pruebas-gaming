# Guía de selección: qué utilizar y cuándo

## Flujo obligatorio
1. Reconocer el proyecto: README, instrucciones, package manifests, motor, estructura, pruebas y estado de Git.
2. Elegir skills por tarea; activar solo las pertinentes.
3. Definir una prueba verificable antes de modificar código.
4. Hacer el cambio mínimo suficiente, reutilizando sistemas, assets y patrones existentes.
5. Validar comportamiento real: pruebas automatizadas, consola, capturas y móvil/escritorio cuando aplique.
6. Informar evidencia y pendientes; nunca inventar resultados.

## Matriz de decisión

| Tarea | Priorizar | Uso | No usar para |
|---|---|---|---|
| Evitar diseño genérico/código inflado | Anti-Slop + Ponytail | Simplicidad, calidad y revisión | Sustituir dirección artística o pruebas |
| Definir identidad visual | Taste | Composición, jerarquía, personalidad | Cambiar mecánicas sin motivo |
| Pulir interfaz existente | Impeccable + Emil Design Engineering | Espaciado, tipografía, estados, curvas | Rehacer todo sin auditar |
| Desarrollar mecánicas | GameDev Agent Skills | Mecánicas, game feel, IA, niveles, física, rendimiento | Cargar todo para un arreglo pequeño |
| Coordinar producción grande | Claude Code Game Studios | Roles y flujos de producción | Cambios triviales |
| Corregir animaciones | Emil review-animations / improve-animations | Timings, curvas, interrupciones | Tapar regresiones con otra librería |
| Auditar UI y accesibilidad | Vercel Web Design Guidelines | Patrones, accesibilidad y buenas prácticas | Dictar la estética |
| Crear sprites pixel art | ClaudePxl | Sprites y recursos 2D compatibles | Generar 3D sin verificar capacidad |
| Crear entorno voxel web | VoxPix como candidato; comparar renderizadores | Profundidad, volumen y entorno | Confundir sombras CSS con voxels |
| Diorama 2.5D con O3DE | o3de-diorama | Solo si se usa Open 3D Engine | Instalar como paquete HTML genérico |
| Efectos de impacto/partículas | Sprite Fusion VFX / VFX-JS | Recursos y efectos tras validar compatibilidad | Añadir antes de perfilar |
| Componentes animados React | Lightswind, SmoothUI, Componentry, RareUI | Componentes compatibles concretos | Importar colecciones enteras |
| Animaciones web | Motion | Movimiento si el stack lo justifica | Reemplazar algo funcional sin beneficio |
| Referencias de movimiento | Prompt Motion, Justinmind | Inspiración y planificación UX | Tratar referencias como dependencias |
| Descubrir bibliotecas | Libraries.dev | Comparar alternativas | Añadirlo al runtime |
| Siluetas SVG | SVG Silh | Assets vectoriales con licencia revisada | Usar recursos sin verificar licencia |
| Gestión de contexto | LeanCTX | Flujos compatibles con agentes | Reemplazar documentación |
| Auditoría final | Anti-Slop + Web Design Guidelines + pruebas | Checklist, accesibilidad y evidencia | Aprobar sin ejecutar verificaciones |

## Casos prácticos

### El caballo dejó de animarse
1. Reproducirlo en el juego real.
2. Revisar disparador, máquina de estados, ciclo de vida e interrupciones.
3. Consultar Emil review-animations e improve-animations.
4. Corregir la causa; no instalar Motion automáticamente.
5. Probar inicio, final, cancelación y movimientos consecutivos.

### Los rótulos se pisan
1. Identificar viewport y estado exactos.
2. Inspeccionar contenedores, overflow, stacking context, textos largos y breakpoints.
3. Aplicar Impeccable y Web Design Guidelines.
4. Validar en móvil y escritorio con capturas reales.

### El campo debe verse voxel/3D
1. Separar escena, lógica del juego y HUD.
2. Confirmar que el renderizador produce volumen real y no solo sombras CSS.
3. Probar cámara, iluminación, rendimiento y controles táctiles.
4. Mantener intactas las reglas mientras cambia la representación.

### Compila, pero no funciona
Una build verde no prueba jugabilidad. Probar inicio, controles, acción principal, pausa/reinicio, victoria/derrota y consola. Adjuntar capturas del juego ejecutado, no mockups.

## Antes de añadir una dependencia
Comprobar licencia, actividad, compatibilidad, tamaño, mantenimiento, API y si la arquitectura actual ya resuelve el problema. Skills y bibliotecas de runtime son categorías distintas.
