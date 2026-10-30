---
name: game-project-orchestrator
description: Use at the start of a game project or substantial game task to inspect the existing repository, select only relevant skills from this toolkit, plan minimal changes, and define verifiable gameplay, visual, and regression checks.
---

# Game Project Orchestrator

## Trigger when
- Starting work in a new or existing game repository.
- A task spans gameplay, visuals, animation, assets, performance, or UI.
- Several installed skills appear relevant and need prioritization.

## Procedure
1. Inspect repository instructions, README, engine/runtime, dependencies, asset folders, tests, current Git state, and recent relevant changes.
2. Classify the task: gameplay/logic, art direction, UI, animation, voxel/3D scene, VFX, performance, accessibility, or release QA.
3. Select the smallest relevant skill set using docs/DESCUBRIMIENTO-SKILLS.md. Read the selected skills' full instructions before using them.
4. Check whether the project already has a system, asset, animation, component, or dependency that solves the problem. Prefer fixing/reusing it over creating a parallel implementation.
5. Write a short plan with expected behavior, files likely to change, risks, and concrete tests.
6. Implement in small increments; do not combine unrelated redesigns and gameplay changes.
7. Run relevant automated tests and a real browser/game validation where applicable. Inspect console errors and real screenshots on desktop and mobile.
8. Report changed files, commands, actual results, evidence, and unresolved issues. Distinguish verified results from assumptions.

## Quality gates
- Build success alone is not proof that the game works.
- A visual mockup is not proof that the implementation matches it.
- A new animation library is not the default fix for a broken existing animation.
- A 2D board with shadows is not a voxel scene.
- Do not claim tests or screenshots that were not actually produced.
- Review third-party skill scripts and license before execution or redistribution.

## Deliverables
For substantial work, provide:
- Task summary and implementation plan.
- Relevant skill names and why they were selected.
- Tests run with pass/fail evidence.
- Screenshots or reproduction steps for visual/gameplay changes.
- Remaining risks and next steps.
