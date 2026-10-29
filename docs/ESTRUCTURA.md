# Estructura prevista del repositorio

```text
Pruebas-gaming/
├── AGENTS.md
├── README.md
├── framework/                 # contrato de orquestación y puertas obligatorias
│   ├── README.md
│   ├── ORCHESTRATION.md
│   ├── QUALITY-GATES.md
│   ├── TASK-PROFILES.md
│   └── REPORT-TEMPLATE.md
├── skills/                    # skills propias/adaptaciones curadas
├── .agents/skills/             # skills de proyecto para agentes compatibles
├── .claude/skills/             # skills de proyecto para Claude Code
├── docs/                      # catálogo y normas del repertorio
├── sources/manifest.tsv        # procedencia/estado de fuentes
├── scripts/                    # instalación y validación
└── juegos/                     # fase posterior: un directorio por juego
```

La carpeta juegos/ es parte de la estructura prevista, pero **no se crea en esta fase**. Primero se estabiliza y valida el framework, tal como se acordó.
