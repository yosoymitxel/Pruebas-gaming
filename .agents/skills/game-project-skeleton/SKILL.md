---
name: game-project-skeleton
description: Use when starting a videogame or reviewing a prototype that lacks common systems: menus, settings, pause, localization, themes, persistence, export/import, state ownership, input, results, and QA.
---

# Game Project Skeleton

## Required reading
Read framework/BASELINE-VIDEOJUEGO.md and framework/CONFLICTOS-Y-FUENTE-DE-VERDAD.md. Inspect the existing game before proposing replacements.

## Workflow
1. Identify genre, engine/runtime, target platforms, session model, offline/online needs and delivery target.
2. Inspect current screens, state model, settings, localization, themes, persistence, export/import, input, results, tests and build/deploy scripts.
3. Create the baseline table. Every system must be INCLUDE, NOT APPLICABLE with reason, PENDING with acceptance criteria, or BLOCKED with cause.
4. Search the local skill index first. Discover missing capabilities using the skills CLI/search tool and read relevant skills; never assume one skill solves the whole skeleton.
5. Define authoritative state, separate settings/progression/session data, stable IDs, explicit screen transitions and conflict policy.
6. Reuse compatible systems/assets. Do not copy another game's styling or port its architecture wholesale without justification.
7. Define acceptance tests before implementation.
8. Implement applicable systems in dependency order: domain/state contracts, persistence/settings, screen flow/input, presentation, then export/build integration.
9. Test save/load across restart, invalid import without state damage, settings persistence, pause/resume, terminal results, responsive menus and model/HUD consistency when applicable.
10. Run CODE_GATE, GAMEPLAY_GATE, DESIGN_GATE and INTEGRATION_GATE. Follow the current visual-evidence protocol for visual work.
11. Report the baseline table, skills actually read/applied, reusable systems found, tests/evidence and exceptions.

## Non-negotiable rules
- Never start a new game with only its core mechanic and silently omit common infrastructure.
- Never add every possible feature blindly; assess applicability and record decisions.
- Never let HUD, animation, sound or a save file become a competing source of truth.
- Never let an animation decide whether a move, hit, reward, victory or defeat happened.
- Never overwrite a valid save with an invalid import.
- Never claim persistence, export/import, settings or localization works without a test exercising it.
- Do not install runtime libraries merely because a skill recommends them.
- Keep the game's personality in its visual language, not in inconsistent architecture.
