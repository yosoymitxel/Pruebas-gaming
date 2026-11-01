# Índice de skills locales

Generado por scripts/index-skills.sh. Detecta archivos locales; no certifica licencia, calidad ni ejecución.

- **adopt** — "Brownfield audit — do existing artifacts actually work? Numbered migration plan. Unlike /project-stage-detect, checks compliance not existence."  
  Ruta: .agents/skills/adopt/SKILL.md
- **ai-behavior-trees-utility-ai** — >  
  Ruta: .agents/skills/ai-behavior-trees-utility-ai/SKILL.md
- **animate-expo** — Build animations in React Native and Expo, making the decisions in the order that determines whether they feel right — should it animate, which thread it runs on, which properties, spring or timing, how the gesture hands off, how it degrades. Writes the implementation with Reanimated, Gesture Handler, Expo Router and expo-haptics. Use when animating anything in an Expo app, adding gestures, sheets, screen transitions, press feedback or haptics, or fixing motion that stutters on device. For web animation use `animate`.  
  Ruta: .agents/skills/animate-expo/SKILL.md
- **animate** — Build an animation from scratch, making the decisions in the order that determines whether it feels right — should it animate at all, what purpose, which tool, which properties, which curve and duration, how it interrupts, how it exits. Writes the implementation. Use when asked to animate something, add motion, make a component feel alive, or build a transition. For critiquing existing motion use review-animations; for auditing a whole codebase use improve-animations.  
  Ruta: .agents/skills/animate/SKILL.md
- **animation-performance** — Keep web animations inside the frame budget — animate composite-only properties, keep motion off the main thread when the page is busy, and find the cause when an animation drops frames. Covers the layout/paint/composite pipeline, cheaper property swaps, CSS vs WAAPI vs requestAnimationFrame, Framer Motion's hardware-accelerated path, React re-rendering per frame, inherited CSS variable recalculation, blur cost, and when `will-change` actually helps. Use when an animation is janky, choppy, stutters, or drops frames; when choosing which property to animate; when deciding between CSS and JS animation on performance grounds; or when reaching for `will-change` or GPU layers. For choosing easing, duration, or whether to animate at all use animate; for reviewing motion as a whole use review-animations.  
  Ruta: .agents/skills/animation-performance/SKILL.md
- **animation-vocabulary** — Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term ("the bouncy thing when a popover opens" → Pop in; "the iOS rubber-band scroll" → Rubber-banding). Use when the user asks "what's it called when…", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.  
  Ruta: .agents/skills/animation-vocabulary/SKILL.md
- **antislop-code** — "Code comment hygiene for AI coding agents: remove generic AI-slop comments, keep the valuable ones, never touch the code."  
  Ruta: .agents/skills/antislop-code/SKILL.md
- **antislop-copywriting** — "Copy and text skill for antislop. Use when writing or editing prose: headlines, tone, CTAs, and anti-AI-writing patterns. Load with the core."  
  Ruta: .agents/skills/antislop-copywriting/SKILL.md
- **antislop-human** — "Human and accessibility skill for antislop. Contrast, keyboard, focus, states, and interaction affordances for real people. Includes the contrast checker."  
  Ruta: .agents/skills/antislop-human/SKILL.md
- **antislop-layoutmobile** — "Mobile layout skill for antislop. Use for layouts that reflow across screen sizes, phone to desktop: grids, overflow, tap targets. Load with the core."  
  Ruta: .agents/skills/antislop-layoutmobile/SKILL.md
- **antislop-ui** — "UI and visual skill for antislop. Use when building or editing any interface: color, layout, components, motion, and page performance. Load with the core."  
  Ruta: .agents/skills/antislop-ui/SKILL.md
- **antislop** — "Anti Slop: Rules for AI Coding Agents. The core filter. Load always to stop generic AI slop."  
  Ruta: .agents/skills/antislop/SKILL.md
- **apple-design** — Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.  
  Ruta: .agents/skills/apple-design/SKILL.md
- **architecture-decision** — "Create an ADR documenting a technical decision: context, alternatives considered, consequences."  
  Ruta: .agents/skills/architecture-decision/SKILL.md
- **architecture-review** — "Traceability matrix mapping GDD requirements to ADRs. Finds gaps, cross-ADR conflicts, engine compatibility. PASS/CONCERNS/NOT ASSESSED/FAIL."  
  Ruta: .agents/skills/architecture-review/SKILL.md
- **art-bible** — "Author the Art Bible — visual identity gating asset production. Run before /map-systems."  
  Ruta: .agents/skills/art-bible/SKILL.md
- **ask-sonner** — Guide to Sonner, the React toast library — install and wire up the Toaster, pick the right toast() call, promise and loading toasts, updating, dismissing and persisting toasts, styling, theming and icons, positioning and multiple toasters. Use when working with Sonner or troubleshooting it — toasts that don't appear, appear twice, lose their styles, ignore Tailwind classes, sit behind a modal, or don't follow dark mode.  
  Ruta: .agents/skills/ask-sonner/SKILL.md
- **asset-audit** — "Audit assets against naming conventions, file size budgets, format standards. Finds orphaned assets, missing references."  
  Ruta: .agents/skills/asset-audit/SKILL.md
- **asset-spec** — "Per-asset visual specs plus AI generation prompts from GDDs and character profiles. After the art bible."  
  Ruta: .agents/skills/asset-spec/SKILL.md
- **audio-design** — >  
  Ruta: .agents/skills/audio-design/SKILL.md
- **balance-check** — "Find balance outliers, broken progressions, degenerate strategies, economy imbalances in formulas and data. 'Check game balance'."  
  Ruta: .agents/skills/balance-check/SKILL.md
- **bevy-ecs** — >  
  Ruta: .agents/skills/bevy-ecs/SKILL.md
- **brainstorm** — "Guides the user through finding and choosing a game concept. Use when the user wants game ideas, a new concept, a game jam idea, or to explore other directions, including dropping the current idea and starting over."  
  Ruta: .agents/skills/brainstorm/SKILL.md
- **break-ui** — Try to break a piece of UI by feeding it worst-case data — long names, unbreakable emails, one-letter names, missing fields, huge counts, zero items, long labels, non-Latin text, emoji, extreme numbers — then render it behind a "Demo data / Worst case" toggle and report everything that broke, with the fix for each. Use when the user asks to stress-test, break, or find edge cases in a component or screen, or to "try the worst case". For visual design critique use emil-design-eng; for motion use review-animations.  
  Ruta: .agents/skills/break-ui/SKILL.md
- **bug-report** — "Structured bug report from a description, or analyze code for potential bugs. Reproduction steps, severity."  
  Ruta: .agents/skills/bug-report/SKILL.md
- **bug-triage** — "Re-evaluate open bugs — priority vs severity, assign to sprints, surface systemic trends. Run when the count grows."  
  Ruta: .agents/skills/bug-triage/SKILL.md
- **camera-systems** — >  
  Ruta: .agents/skills/camera-systems/SKILL.md
- **card-game** — >  
  Ruta: .agents/skills/card-game/SKILL.md
- **changelog** — "Auto-generate a changelog from git commits and sprint data. Internal and player-facing versions."  
  Ruta: .agents/skills/changelog/SKILL.md
- **code-review** — "Architectural code review — coding standards, SOLID, testability, performance concerns."  
  Ruta: .agents/skills/code-review/SKILL.md
- **consistency-check** — "Scan GDDs against the entity registry for cross-document conflicts. Grep-first approach targets conflicting sections, different stats."  
  Ruta: .agents/skills/consistency-check/SKILL.md
- **content-audit** — "Audit GDD content counts against what's implemented — planned vs built."  
  Ruta: .agents/skills/content-audit/SKILL.md
- **create-architecture** — "Author the architecture blueprint before code is written. Validates decisions against the pinned engine, flags knowledge gaps."  
  Ruta: .agents/skills/create-architecture/SKILL.md
- **create-control-manifest** — "Builds a short list of must-do and never-do coding rules per system from accepted ADRs. Use when the user wants programmer rules or a cheat sheet from the ADRs, or needs it regenerated after ADR changes."  
  Ruta: .agents/skills/create-control-manifest/SKILL.md
- **create-epics** — "Turns the GDDs and architecture into epics, one per architectural module. Use when the user wants to break the game into epics or plan the work before writing stories. Not for splitting one epic into stories."  
  Ruta: .agents/skills/create-epics/SKILL.md
- **create-game-assets** — Plan, generate, source, normalize, and validate cohesive visual game assets. Use for art direction, style bibles, sprites, tilesets, backgrounds, UI art, icons, textures, concept art, or 3D asset briefs.  
  Ruta: .agents/skills/create-game-assets/SKILL.md
- **create-stories** — "Breaks one epic into implementable stories with acceptance criteria. Use when the user wants stories for an epic or the next batch of work to build. Not for turning the whole design into epics."  
  Ruta: .agents/skills/create-stories/SKILL.md
- **day-one-patch** — "Day-one launch patch — focused fix for known issues found after gold master. Mini-sprint with QA gate and rollback."  
  Ruta: .agents/skills/day-one-patch/SKILL.md
- **defold-core** — >  
  Ruta: .agents/skills/defold-core/SKILL.md
- **design-review** — "Reviews one design document for completeness, internal consistency, implementability, and design standards. Before handing to programmers."  
  Ruta: .agents/skills/design-review/SKILL.md
- **design-system** — "Section-by-section GDD authoring for one system — walks through each required section, cross-references dependencies."  
  Ruta: .agents/skills/design-system/SKILL.md
- **design-taste-frontend** — >-  
  Ruta: .agents/skills/design-taste-frontend/SKILL.md
- **dev-story** — "Implements one story in code with tests, following its ADRs. Use when the user says to build, implement or start working on a story. Not for checking readiness beforehand or closing the story after."  
  Ruta: .agents/skills/dev-story/SKILL.md
- **dialogue-systems** — >  
  Ruta: .agents/skills/dialogue-systems/SKILL.md
- **ebitengine-game** — >  
  Ruta: .agents/skills/ebitengine-game/SKILL.md
- **emil-design-eng** — This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.  
  Ruta: .agents/skills/emil-design-eng/SKILL.md
- **estimate** — "Estimate task effort from complexity, dependencies, velocity, risk. Structured estimate with confidence levels."  
  Ruta: .agents/skills/estimate/SKILL.md
- **find-animation-opportunities** — Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-only; it proposes motion with exact values, it does not implement it. Use when the user asks "what could be animated here?" or wants to "make this feel more alive". For fixing existing animations, use improve-animations or review-animations instead.  
  Ruta: .agents/skills/find-animation-opportunities/SKILL.md
- **fps-shooter** — >  
  Ruta: .agents/skills/fps-shooter/SKILL.md
- **game-ai** — >  
  Ruta: .agents/skills/game-ai/SKILL.md
- **game-feel** — >  
  Ruta: .agents/skills/game-feel/SKILL.md
- **game-jam** — >  
  Ruta: .agents/skills/game-jam/SKILL.md
- **game-project-orchestrator** — Use at the start of a game project or substantial game task to inspect the existing repository, select only relevant skills from this toolkit, plan minimal changes, and define verifiable gameplay, visual, and regression checks.  
  Ruta: .agents/skills/game-project-orchestrator/SKILL.md
- **game-project-skeleton** — Use when starting a videogame or reviewing a prototype that lacks common systems: menus, settings, pause, localization, themes, persistence, export/import, state ownership, input, results, and QA.  
  Ruta: .agents/skills/game-project-skeleton/SKILL.md
- **game-ui-ux** — >  
  Ruta: .agents/skills/game-ui-ux/SKILL.md
- **gate-check** — "Ready to advance between development phases? PASS/CONCERNS/NOT ASSESSED/FAIL with blockers and required artifacts. 'Can we move to production?'"  
  Ruta: .agents/skills/gate-check/SKILL.md
- **godot-2d-movement** — >  
  Ruta: .agents/skills/godot-2d-movement/SKILL.md
- **godot-3d-essentials** — >  
  Ruta: .agents/skills/godot-3d-essentials/SKILL.md
- **godot-animation** — >  
  Ruta: .agents/skills/godot-animation/SKILL.md
- **godot-audio** — >  
  Ruta: .agents/skills/godot-audio/SKILL.md
- **godot-csharp** — >  
  Ruta: .agents/skills/godot-csharp/SKILL.md
- **godot-export** — >  
  Ruta: .agents/skills/godot-export/SKILL.md
- **godot-gdscript-headless-testing** — >  
  Ruta: .agents/skills/godot-gdscript-headless-testing/SKILL.md
- **godot-gdscript** — >  
  Ruta: .agents/skills/godot-gdscript/SKILL.md
- **godot-multiplayer** — >  
  Ruta: .agents/skills/godot-multiplayer/SKILL.md
- **godot-nodes-scenes** — >  
  Ruta: .agents/skills/godot-nodes-scenes/SKILL.md
- **godot-physics** — >  
  Ruta: .agents/skills/godot-physics/SKILL.md
- **godot-resources** — >  
  Ruta: .agents/skills/godot-resources/SKILL.md
- **godot-shaders** — >  
  Ruta: .agents/skills/godot-shaders/SKILL.md
- **godot-signals-groups** — >  
  Ruta: .agents/skills/godot-signals-groups/SKILL.md
- **godot-tilemap** — >  
  Ruta: .agents/skills/godot-tilemap/SKILL.md
- **godot-ui-control** — >  
  Ruta: .agents/skills/godot-ui-control/SKILL.md
- **help** — "What should I do next? Use when stuck or you don't know what to do."  
  Ruta: .agents/skills/help/SKILL.md
- **hotfix** — "Emergency fix bypassing normal sprint process — hotfix branch, approvals tracked, backport verified, full audit trail."  
  Ruta: .agents/skills/hotfix/SKILL.md
- **impeccable** — "Use when the user wants to design, redesign, shape, critique, audit, polish, simplify, harden, animate, or otherwise improve a frontend interface: websites, landing pages, dashboards, product UI, components, forms, settings, onboarding, empty states, and native iOS or Android screens. Handles UX review, hierarchy, layout, typography, color, motion, UX copy, accessibility, responsive behavior, edge cases, and capturing or documenting design systems (DESIGN.md, tokens). Also for making bland UI bolder, loud UI quieter, or ambitious visual effects. Not for backend-only or non-UI tasks."  
  Ruta: .agents/skills/impeccable/SKILL.md
- **improve-animations** — Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and self-contained implementation plans for other agents (or cheaper models) to execute. Read-only on source code — it plans improvements, it does not apply them. Use when the user asks to "improve the animations", "audit the motion", "make this app feel better", or wants a roadmap of animation fixes rather than a review of a single diff.  
  Ruta: .agents/skills/improve-animations/SKILL.md
- **input-systems** — >  
  Ruta: .agents/skills/input-systems/SKILL.md
- **itch-publish** — >  
  Ruta: .agents/skills/itch-publish/SKILL.md
- **launch-checklist** — "Launch readiness across every department: code, content, store, marketing, community, infrastructure, legal, go/no-go sign-offs."  
  Ruta: .agents/skills/launch-checklist/SKILL.md
- **level-design** — >  
  Ruta: .agents/skills/level-design/SKILL.md
- **localize** — "Localization pipeline — find hardcoded strings, extract string tables, cultural review, VO, RTL, enforce string freeze."  
  Ruta: .agents/skills/localize/SKILL.md
- **love2d-core** — >  
  Ruta: .agents/skills/love2d-core/SKILL.md
- **map-systems** — "Decompose a concept into individual systems, map dependencies, prioritize design order, create the systems index."  
  Ruta: .agents/skills/map-systems/SKILL.md
- **milestone-review** — "Milestone progress review — completeness, quality metrics, risk, go/no-go recommendation. At checkpoints or before a deadline."  
  Ruta: .agents/skills/milestone-review/SKILL.md
- **mobile-native** — Make a web app feel native on a phone — the small CSS and meta-tag fixes that separate "a website in a browser" from something that feels installed. Covers sticky hover states, tap highlight flashes, the 100vh bug, inputs that zoom the page, laggy taps, pull-to-refresh hijacking scroll, content under the notch, long-press selecting button text, carousels that scroll the wrong way, mismatched status bars, and the rule that you test on real hardware. Use when a web app is being built for or reviewed on mobile, when something "works in Chrome but feels wrong on my phone", when building a PWA, a bottom sheet, a carousel, a full-screen layout, or any touch interaction. For motion itself use animate; for React Native use animate-expo.  
  Ruta: .agents/skills/mobile-native/SKILL.md
- **onboard** — "Onboarding doc for a new contributor or agent — project state, conventions, priorities relevant to the specified role."  
  Ruta: .agents/skills/onboard/SKILL.md
- **patch-notes** — "Player-facing patch notes from git history and changelogs. Translates developer language into player communication."  
  Ruta: .agents/skills/patch-notes/SKILL.md
- **perf-profile** — "Performance profiling — find bottlenecks, measure against budgets, produce ranked optimization recommendations."  
  Ruta: .agents/skills/perf-profile/SKILL.md
- **performance-optimization** — >  
  Ruta: .agents/skills/performance-optimization/SKILL.md
- **phaser-arcade-physics** — >  
  Ruta: .agents/skills/phaser-arcade-physics/SKILL.md
- **phaser-core** — >  
  Ruta: .agents/skills/phaser-core/SKILL.md
- **physics-tuning** — >  
  Ruta: .agents/skills/physics-tuning/SKILL.md
- **pick-ui-library** — Pick the right library for a given frontend task from a curated, opinionated list — numbers, OTP inputs, charts, command menus, virtualization, drag and drop, toasts, state, styling, and more. Only runs when explicitly invoked; it does not trigger on its own.  
  Ruta: .agents/skills/pick-ui-library/SKILL.md
- **pixijs-rendering** — >  
  Ruta: .agents/skills/pixijs-rendering/SKILL.md
- **platformer** — >  
  Ruta: .agents/skills/platformer/SKILL.md
- **playtest-report** — "Structured playtest report template, or turn existing playtest notes into structured feedback."  
  Ruta: .agents/skills/playtest-report/SKILL.md
- **ponytail-audit** — >  
  Ruta: .agents/skills/ponytail-audit/SKILL.md
- **ponytail-debt** — >  
  Ruta: .agents/skills/ponytail-debt/SKILL.md
- **ponytail-gain** — >  
  Ruta: .agents/skills/ponytail-gain/SKILL.md
- **ponytail-help** — >  
  Ruta: .agents/skills/ponytail-help/SKILL.md
- **ponytail-review** — >  
  Ruta: .agents/skills/ponytail-review/SKILL.md
- **ponytail** — >  
  Ruta: .agents/skills/ponytail/SKILL.md
- **procedural-gen** — >  
  Ruta: .agents/skills/procedural-gen/SKILL.md
- **project-stage-detect** — "Analyze project state, detect stage, identify gaps, recommend next steps. 'Where are we in development?'"  
  Ruta: .agents/skills/project-stage-detect/SKILL.md
- **propagate-design-change** — "Finds architecture decisions (ADRs) made stale by a changed GDD and walks through resolving each. Use when the user changed a number or rule in a GDD and asks which ADRs or architecture decisions are now out of date."  
  Ruta: .agents/skills/propagate-design-change/SKILL.md
- **prototype-fast** — >  
  Ruta: .agents/skills/prototype-fast/SKILL.md
- **prototype** — Build multiple genuinely different versions of a UI piece you describe, rendered behind a visual picker so you can flip through them live and promote the one that feels right. Only runs when explicitly invoked; it does not trigger on its own.  
  Ruta: .agents/skills/prototype/SKILL.md
- **puzzle** — >  
  Ruta: .agents/skills/puzzle/SKILL.md
- **pygame-core** — >  
  Ruta: .agents/skills/pygame-core/SKILL.md
- **qa-plan** — "QA test plan for a sprint — classifies stories by Logic/Integration/Visual/UI, covers automated tests, manual cases, smoke scope."  
  Ruta: .agents/skills/qa-plan/SKILL.md
- **quick-design** — "Lightweight spec for small changes — tuning adjustments, minor mechanics. Embeds directly into stories; skips full GDD."  
  Ruta: .agents/skills/quick-design/SKILL.md
- **regression-suite** — "Map test coverage to GDD critical paths, find fixed bugs lacking regression tests, flag drift from new features."  
  Ruta: .agents/skills/regression-suite/SKILL.md
- **release-checklist** — "Pre-release checklist — build verification, certification requirements, store metadata, launch readiness."  
  Ruta: .agents/skills/release-checklist/SKILL.md
- **remove-animations** — Find the animations an interface doesn't need and remove them — motion on keyboard actions, high-frequency surfaces, functional data, and decoration with no purpose — then clean up what they leave behind. Edits code, but only to subtract; it never adds or retunes motion. Use when the user says the app "feels slow", "has too much animation", "feels over-animated", wants to "tone down the motion", or asks what animations to remove. For finding places that should animate, use find-animation-opportunities; for fixing animations that should stay, use improve-animations or review-animations.  
  Ruta: .agents/skills/remove-animations/SKILL.md
- **retrospective** — "Sprint or milestone retrospective from completed work, velocity, blockers. Actionable insights for the next iteration."  
  Ruta: .agents/skills/retrospective/SKILL.md
- **reverse-document** — "Generate missing design or architecture docs from existing implementation — works backwards from code and prototypes."  
  Ruta: .agents/skills/reverse-document/SKILL.md
- **review-all-gdds** — "Holistic cross-GDD review — contradictions between systems, dominant strategies, economic imbalance, cognitive overload, pillar drift."  
  Ruta: .agents/skills/review-all-gdds/SKILL.md
- **review-animations** — Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned.  
  Ruta: .agents/skills/review-animations/SKILL.md
- **roblox-characters** — >  
  Ruta: .agents/skills/roblox-characters/SKILL.md
- **roblox-datastores** — >  
  Ruta: .agents/skills/roblox-datastores/SKILL.md
- **roblox-luau** — >  
  Ruta: .agents/skills/roblox-luau/SKILL.md
- **roblox-networking** — >  
  Ruta: .agents/skills/roblox-networking/SKILL.md
- **roblox-physics** — >  
  Ruta: .agents/skills/roblox-physics/SKILL.md
- **roblox-simulator-economy** — >  
  Ruta: .agents/skills/roblox-simulator-economy/SKILL.md
- **roblox-studio-workflow** — >  
  Ruta: .agents/skills/roblox-studio-workflow/SKILL.md
- **roblox-ui** — >  
  Ruta: .agents/skills/roblox-ui/SKILL.md
- **roguelike** — >  
  Ruta: .agents/skills/roguelike/SKILL.md
- **router** — >  
  Ruta: .agents/skills/router/SKILL.md
- **rpg** — >  
  Ruta: .agents/skills/rpg/SKILL.md
- **save-systems** — >  
  Ruta: .agents/skills/save-systems/SKILL.md
- **scope-check** — "Scope creep check — current scope versus the original plan. Flags additions, quantifies bloat, recommends cuts. 'Any scope creep?'"  
  Ruta: .agents/skills/scope-check/SKILL.md
- **security-audit** — "Security audit — save tampering, cheat vectors, network exploits, data exposure, input validation. Before public or multiplayer release."  
  Ruta: .agents/skills/security-audit/SKILL.md
- **settings** — "View or change project config — effective merged values, or set locally in project.local.yaml."  
  Ruta: .agents/skills/settings/SKILL.md
- **setup-engine** — "Configure engine and version. Pins it in CLAUDE.md; WebSearch fills reference docs when the version is beyond LLM training data."  
  Ruta: .agents/skills/setup-engine/SKILL.md
- **shader-programming** — >  
  Ruta: .agents/skills/shader-programming/SKILL.md
- **skill-improve** — "Improve a skill via a test-fix-retest loop — static checks, targeted fixes, keep or revert on score change."  
  Ruta: .agents/skills/skill-improve/SKILL.md
- **skill-test** — "Validate skill files for structural compliance and behavioral correctness. Four modes: static linter, spec, category rubric, audit."  
  Ruta: .agents/skills/skill-test/SKILL.md
- **smoke-check** — "Critical-path smoke gate before QA hand-off — runs the automated suite. A failed check means the build is not QA-ready."  
  Ruta: .agents/skills/smoke-check/SKILL.md
- **soak-test** — "Soak test protocol for extended play — what to observe and log for slow leaks, fatigue, late-appearing edge cases."  
  Ruta: .agents/skills/soak-test/SKILL.md
- **sprint-plan** — "New or updated sprint plan from the current milestone, completed work, and available capacity."  
  Ruta: .agents/skills/sprint-plan/SKILL.md
- **sprint-status** — "Fast, concise sprint snapshot — burndown and emerging risks for situational awareness. 'How is the sprint going?'"  
  Ruta: .agents/skills/sprint-status/SKILL.md
- **start** — "Guides a first-time user through onboarding and picks the right workflow. Use when the user is new, just cloned or installed the studio, has no idea or engine yet, asks where to begin, or wants to bring in an existing game."  
  Ruta: .agents/skills/start/SKILL.md
- **steam-publish** — >  
  Ruta: .agents/skills/steam-publish/SKILL.md
- **story-done** — "Closes a finished story: verifies each acceptance criterion, checks for design or ADR deviations and updates its status. Use when the user says a story is done, finished or ready to close."  
  Ruta: .agents/skills/story-done/SKILL.md
- **story-readiness** — "Checks whether a story is ready to implement: clear acceptance criteria, no open questions, valid ADR and dependencies. Use when the user asks if a story, or the sprint's stories, are ready to start or build."  
  Ruta: .agents/skills/story-readiness/SKILL.md
- **survival-crafting** — >  
  Ruta: .agents/skills/survival-crafting/SKILL.md
- **team-audio** — "Orchestrate the audio team — audio-director, sound-designer, technical-artist, gameplay-programmer — direction through implementation."  
  Ruta: .agents/skills/team-audio/SKILL.md
- **team-combat** — "Orchestrate the combat team — game-designer, gameplay-programmer, ai-programmer, technical-artist, sound-designer, qa-tester — design through implement and validate."  
  Ruta: .agents/skills/team-combat/SKILL.md
- **team-level** — "Orchestrate the level team — level-designer, narrative-director, world-builder, art-director, systems-designer, qa-tester — for complete area creation."  
  Ruta: .agents/skills/team-level/SKILL.md
- **team-live-ops** — "Orchestrate the live-ops team — live-ops-designer, economy-designer, analytics-engineer, community-manager, writer — for a season or live event."  
  Ruta: .agents/skills/team-live-ops/SKILL.md
- **team-narrative** — "Orchestrate the narrative team — narrative-director, writer, world-builder, level-designer — for story, world lore, narrative-driven levels."  
  Ruta: .agents/skills/team-narrative/SKILL.md
- **team-polish** — "Orchestrate the polish team — performance-analyst, technical-artist, sound-designer, qa-tester — to optimize and harden a feature or area."  
  Ruta: .agents/skills/team-polish/SKILL.md
- **team-qa** — "Orchestrate the QA team through a full testing cycle — qa-lead strategy and test plan, qa-tester case writing, execution, sign-off."  
  Ruta: .agents/skills/team-qa/SKILL.md
- **team-release** — "Orchestrate the release team — release-manager, qa-lead, devops-engineer, producer — to execute a release from candidate to deployment."  
  Ruta: .agents/skills/team-release/SKILL.md
- **team-ui** — "Orchestrate the UI team through the UX pipeline — authoring, visual design, implementation, review, polish. Uses /ux-design, /ux-review, studio templates."  
  Ruta: .agents/skills/team-ui/SKILL.md
- **tech-debt** — "Track, categorize and prioritize technical debt across the codebase — scans for debt indicators, maintains a register."  
  Ruta: .agents/skills/tech-debt/SKILL.md
- **test-evidence-review** — "Quality review of test files and evidence — goes beyond existence, evaluates assertion coverage. ADEQUATE/INCOMPLETE/MISSING/NOT ASSESSED per story."  
  Ruta: .agents/skills/test-evidence-review/SKILL.md
- **test-flakiness** — "Find flaky tests from CI logs — aggregates pass rates, spots intermittent failures, recommends quarantine. After multiple runs."  
  Ruta: .agents/skills/test-flakiness/SKILL.md
- **test-helpers** — "Generate engine-specific test helper libraries — assertion utilities, factory functions, mocks in the engine's test folder. Reduces boilerplate."  
  Ruta: .agents/skills/test-helpers/SKILL.md
- **test-setup** — "Scaffold the test framework and CI — tests/ directory, engine test runner, GitHub Actions workflow. Once, before the first sprint."  
  Ruta: .agents/skills/test-setup/SKILL.md
- **threejs-gltf-loading** — >  
  Ruta: .agents/skills/threejs-gltf-loading/SKILL.md
- **threejs-materials-lighting** — >  
  Ruta: .agents/skills/threejs-materials-lighting/SKILL.md
- **threejs-scene-setup** — >  
  Ruta: .agents/skills/threejs-scene-setup/SKILL.md
- **tower-defense** — >  
  Ruta: .agents/skills/tower-defense/SKILL.md
- **unity-animation** — >  
  Ruta: .agents/skills/unity-animation/SKILL.md
- **unity-build-pipeline** — >  
  Ruta: .agents/skills/unity-build-pipeline/SKILL.md
- **unity-csharp-scripting** — >  
  Ruta: .agents/skills/unity-csharp-scripting/SKILL.md
- **unity-input-system** — >  
  Ruta: .agents/skills/unity-input-system/SKILL.md
- **unity-navmesh** — >  
  Ruta: .agents/skills/unity-navmesh/SKILL.md
- **unity-physics** — >  
  Ruta: .agents/skills/unity-physics/SKILL.md
- **unity-scriptableobjects** — >  
  Ruta: .agents/skills/unity-scriptableobjects/SKILL.md
- **unity-tilemap-2d** — >  
  Ruta: .agents/skills/unity-tilemap-2d/SKILL.md
- **unreal-behavior-trees** — >  
  Ruta: .agents/skills/unreal-behavior-trees/SKILL.md
- **unreal-blueprints** — >  
  Ruta: .agents/skills/unreal-blueprints/SKILL.md
- **unreal-cpp-gameplay** — >  
  Ruta: .agents/skills/unreal-cpp-gameplay/SKILL.md
- **unreal-enhanced-input** — >  
  Ruta: .agents/skills/unreal-enhanced-input/SKILL.md
- **unreal-niagara** — >  
  Ruta: .agents/skills/unreal-niagara/SKILL.md
- **unreal-packaging** — >  
  Ruta: .agents/skills/unreal-packaging/SKILL.md
- **ux-design** — "Section-by-section UX spec authoring for a screen, flow or HUD. Reads the player journey to provide context; also project-wide accessibility."  
  Ruta: .agents/skills/ux-design/SKILL.md
- **ux-review** — "Validate a UX spec, HUD design or pattern library — accessibility, GDD alignment, readiness. APPROVED / NOT ASSESSED / NEEDS REVISION / MAJOR REVISION NEEDED."  
  Ruta: .agents/skills/ux-review/SKILL.md
- **vertical-slice** — "Pre-production validation — end-to-end build to confirm the full loop is achievable before committing to Production. After GDDs, architecture, UX specs."  
  Ruta: .agents/skills/vertical-slice/SKILL.md
- **visual-novel** — >  
  Ruta: .agents/skills/visual-novel/SKILL.md
- **web-design-guidelines** — Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".  
  Ruta: .agents/skills/web-design-guidelines/SKILL.md
- **write-swift** — How to write modern Swift well — modeling with value types, Swift 6 data-race safety and approachable concurrency (@concurrent, main-actor-by-default, actors, task groups), protocols and generics (some vs any), API design, performance and ARC, Swift Testing, macros, and the modern language features agents don't know about yet. Use when writing, reviewing, or migrating Swift, or when a concurrency error, a hang, a data race, a retain cycle, or a performance problem needs fixing.  
  Ruta: .agents/skills/write-swift/SKILL.md
- **adopt** — "Brownfield audit — do existing artifacts actually work? Numbered migration plan. Unlike /project-stage-detect, checks compliance not existence."  
  Ruta: .claude/skills/adopt/SKILL.md
- **ai-behavior-trees-utility-ai** — >  
  Ruta: .claude/skills/ai-behavior-trees-utility-ai/SKILL.md
- **animate-expo** — Build animations in React Native and Expo, making the decisions in the order that determines whether they feel right — should it animate, which thread it runs on, which properties, spring or timing, how the gesture hands off, how it degrades. Writes the implementation with Reanimated, Gesture Handler, Expo Router and expo-haptics. Use when animating anything in an Expo app, adding gestures, sheets, screen transitions, press feedback or haptics, or fixing motion that stutters on device. For web animation use `animate`.  
  Ruta: .claude/skills/animate-expo/SKILL.md
- **animate** — Build an animation from scratch, making the decisions in the order that determines whether it feels right — should it animate at all, what purpose, which tool, which properties, which curve and duration, how it interrupts, how it exits. Writes the implementation. Use when asked to animate something, add motion, make a component feel alive, or build a transition. For critiquing existing motion use review-animations; for auditing a whole codebase use improve-animations.  
  Ruta: .claude/skills/animate/SKILL.md
- **animation-performance** — Keep web animations inside the frame budget — animate composite-only properties, keep motion off the main thread when the page is busy, and find the cause when an animation drops frames. Covers the layout/paint/composite pipeline, cheaper property swaps, CSS vs WAAPI vs requestAnimationFrame, Framer Motion's hardware-accelerated path, React re-rendering per frame, inherited CSS variable recalculation, blur cost, and when `will-change` actually helps. Use when an animation is janky, choppy, stutters, or drops frames; when choosing which property to animate; when deciding between CSS and JS animation on performance grounds; or when reaching for `will-change` or GPU layers. For choosing easing, duration, or whether to animate at all use animate; for reviewing motion as a whole use review-animations.  
  Ruta: .claude/skills/animation-performance/SKILL.md
- **animation-vocabulary** — Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term ("the bouncy thing when a popover opens" → Pop in; "the iOS rubber-band scroll" → Rubber-banding). Use when the user asks "what's it called when…", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.  
  Ruta: .claude/skills/animation-vocabulary/SKILL.md
- **antislop-code** — "Code comment hygiene for AI coding agents: remove generic AI-slop comments, keep the valuable ones, never touch the code."  
  Ruta: .claude/skills/antislop-code/SKILL.md
- **antislop-copywriting** — "Copy and text skill for antislop. Use when writing or editing prose: headlines, tone, CTAs, and anti-AI-writing patterns. Load with the core."  
  Ruta: .claude/skills/antislop-copywriting/SKILL.md
- **antislop-human** — "Human and accessibility skill for antislop. Contrast, keyboard, focus, states, and interaction affordances for real people. Includes the contrast checker."  
  Ruta: .claude/skills/antislop-human/SKILL.md
- **antislop-layoutmobile** — "Mobile layout skill for antislop. Use for layouts that reflow across screen sizes, phone to desktop: grids, overflow, tap targets. Load with the core."  
  Ruta: .claude/skills/antislop-layoutmobile/SKILL.md
- **antislop-ui** — "UI and visual skill for antislop. Use when building or editing any interface: color, layout, components, motion, and page performance. Load with the core."  
  Ruta: .claude/skills/antislop-ui/SKILL.md
- **antislop** — "Anti Slop: Rules for AI Coding Agents. The core filter. Load always to stop generic AI slop."  
  Ruta: .claude/skills/antislop/SKILL.md
- **apple-design** — Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.  
  Ruta: .claude/skills/apple-design/SKILL.md
- **architecture-decision** — "Create an ADR documenting a technical decision: context, alternatives considered, consequences."  
  Ruta: .claude/skills/architecture-decision/SKILL.md
- **architecture-review** — "Traceability matrix mapping GDD requirements to ADRs. Finds gaps, cross-ADR conflicts, engine compatibility. PASS/CONCERNS/NOT ASSESSED/FAIL."  
  Ruta: .claude/skills/architecture-review/SKILL.md
- **art-bible** — "Author the Art Bible — visual identity gating asset production. Run before /map-systems."  
  Ruta: .claude/skills/art-bible/SKILL.md
- **ask-sonner** — Guide to Sonner, the React toast library — install and wire up the Toaster, pick the right toast() call, promise and loading toasts, updating, dismissing and persisting toasts, styling, theming and icons, positioning and multiple toasters. Use when working with Sonner or troubleshooting it — toasts that don't appear, appear twice, lose their styles, ignore Tailwind classes, sit behind a modal, or don't follow dark mode.  
  Ruta: .claude/skills/ask-sonner/SKILL.md
- **asset-audit** — "Audit assets against naming conventions, file size budgets, format standards. Finds orphaned assets, missing references."  
  Ruta: .claude/skills/asset-audit/SKILL.md
- **asset-spec** — "Per-asset visual specs plus AI generation prompts from GDDs and character profiles. After the art bible."  
  Ruta: .claude/skills/asset-spec/SKILL.md
- **audio-design** — >  
  Ruta: .claude/skills/audio-design/SKILL.md
- **balance-check** — "Find balance outliers, broken progressions, degenerate strategies, economy imbalances in formulas and data. 'Check game balance'."  
  Ruta: .claude/skills/balance-check/SKILL.md
- **bevy-ecs** — >  
  Ruta: .claude/skills/bevy-ecs/SKILL.md
- **brainstorm** — "Guides the user through finding and choosing a game concept. Use when the user wants game ideas, a new concept, a game jam idea, or to explore other directions, including dropping the current idea and starting over."  
  Ruta: .claude/skills/brainstorm/SKILL.md
- **break-ui** — Try to break a piece of UI by feeding it worst-case data — long names, unbreakable emails, one-letter names, missing fields, huge counts, zero items, long labels, non-Latin text, emoji, extreme numbers — then render it behind a "Demo data / Worst case" toggle and report everything that broke, with the fix for each. Use when the user asks to stress-test, break, or find edge cases in a component or screen, or to "try the worst case". For visual design critique use emil-design-eng; for motion use review-animations.  
  Ruta: .claude/skills/break-ui/SKILL.md
- **bug-report** — "Structured bug report from a description, or analyze code for potential bugs. Reproduction steps, severity."  
  Ruta: .claude/skills/bug-report/SKILL.md
- **bug-triage** — "Re-evaluate open bugs — priority vs severity, assign to sprints, surface systemic trends. Run when the count grows."  
  Ruta: .claude/skills/bug-triage/SKILL.md
- **camera-systems** — >  
  Ruta: .claude/skills/camera-systems/SKILL.md
- **card-game** — >  
  Ruta: .claude/skills/card-game/SKILL.md
- **changelog** — "Auto-generate a changelog from git commits and sprint data. Internal and player-facing versions."  
  Ruta: .claude/skills/changelog/SKILL.md
- **code-review** — "Architectural code review — coding standards, SOLID, testability, performance concerns."  
  Ruta: .claude/skills/code-review/SKILL.md
- **consistency-check** — "Scan GDDs against the entity registry for cross-document conflicts. Grep-first approach targets conflicting sections, different stats."  
  Ruta: .claude/skills/consistency-check/SKILL.md
- **content-audit** — "Audit GDD content counts against what's implemented — planned vs built."  
  Ruta: .claude/skills/content-audit/SKILL.md
- **create-architecture** — "Author the architecture blueprint before code is written. Validates decisions against the pinned engine, flags knowledge gaps."  
  Ruta: .claude/skills/create-architecture/SKILL.md
- **create-control-manifest** — "Builds a short list of must-do and never-do coding rules per system from accepted ADRs. Use when the user wants programmer rules or a cheat sheet from the ADRs, or needs it regenerated after ADR changes."  
  Ruta: .claude/skills/create-control-manifest/SKILL.md
- **create-epics** — "Turns the GDDs and architecture into epics, one per architectural module. Use when the user wants to break the game into epics or plan the work before writing stories. Not for splitting one epic into stories."  
  Ruta: .claude/skills/create-epics/SKILL.md
- **create-game-assets** — Plan, generate, source, normalize, and validate cohesive visual game assets. Use for art direction, style bibles, sprites, tilesets, backgrounds, UI art, icons, textures, concept art, or 3D asset briefs.  
  Ruta: .claude/skills/create-game-assets/SKILL.md
- **create-stories** — "Breaks one epic into implementable stories with acceptance criteria. Use when the user wants stories for an epic or the next batch of work to build. Not for turning the whole design into epics."  
  Ruta: .claude/skills/create-stories/SKILL.md
- **day-one-patch** — "Day-one launch patch — focused fix for known issues found after gold master. Mini-sprint with QA gate and rollback."  
  Ruta: .claude/skills/day-one-patch/SKILL.md
- **defold-core** — >  
  Ruta: .claude/skills/defold-core/SKILL.md
- **design-review** — "Reviews one design document for completeness, internal consistency, implementability, and design standards. Before handing to programmers."  
  Ruta: .claude/skills/design-review/SKILL.md
- **design-system** — "Section-by-section GDD authoring for one system — walks through each required section, cross-references dependencies."  
  Ruta: .claude/skills/design-system/SKILL.md
- **design-taste-frontend** — >-  
  Ruta: .claude/skills/design-taste-frontend/SKILL.md
- **dev-story** — "Implements one story in code with tests, following its ADRs. Use when the user says to build, implement or start working on a story. Not for checking readiness beforehand or closing the story after."  
  Ruta: .claude/skills/dev-story/SKILL.md
- **dialogue-systems** — >  
  Ruta: .claude/skills/dialogue-systems/SKILL.md
- **ebitengine-game** — >  
  Ruta: .claude/skills/ebitengine-game/SKILL.md
- **emil-design-eng** — This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.  
  Ruta: .claude/skills/emil-design-eng/SKILL.md
- **estimate** — "Estimate task effort from complexity, dependencies, velocity, risk. Structured estimate with confidence levels."  
  Ruta: .claude/skills/estimate/SKILL.md
- **find-animation-opportunities** — Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-only; it proposes motion with exact values, it does not implement it. Use when the user asks "what could be animated here?" or wants to "make this feel more alive". For fixing existing animations, use improve-animations or review-animations instead.  
  Ruta: .claude/skills/find-animation-opportunities/SKILL.md
- **fps-shooter** — >  
  Ruta: .claude/skills/fps-shooter/SKILL.md
- **game-ai** — >  
  Ruta: .claude/skills/game-ai/SKILL.md
- **game-feel** — >  
  Ruta: .claude/skills/game-feel/SKILL.md
- **game-jam** — >  
  Ruta: .claude/skills/game-jam/SKILL.md
- **game-ui-ux** — >  
  Ruta: .claude/skills/game-ui-ux/SKILL.md
- **gate-check** — "Ready to advance between development phases? PASS/CONCERNS/NOT ASSESSED/FAIL with blockers and required artifacts. 'Can we move to production?'"  
  Ruta: .claude/skills/gate-check/SKILL.md
- **godot-2d-movement** — >  
  Ruta: .claude/skills/godot-2d-movement/SKILL.md
- **godot-3d-essentials** — >  
  Ruta: .claude/skills/godot-3d-essentials/SKILL.md
- **godot-animation** — >  
  Ruta: .claude/skills/godot-animation/SKILL.md
- **godot-audio** — >  
  Ruta: .claude/skills/godot-audio/SKILL.md
- **godot-csharp** — >  
  Ruta: .claude/skills/godot-csharp/SKILL.md
- **godot-export** — >  
  Ruta: .claude/skills/godot-export/SKILL.md
- **godot-gdscript-headless-testing** — >  
  Ruta: .claude/skills/godot-gdscript-headless-testing/SKILL.md
- **godot-gdscript** — >  
  Ruta: .claude/skills/godot-gdscript/SKILL.md
- **godot-multiplayer** — >  
  Ruta: .claude/skills/godot-multiplayer/SKILL.md
- **godot-nodes-scenes** — >  
  Ruta: .claude/skills/godot-nodes-scenes/SKILL.md
- **godot-physics** — >  
  Ruta: .claude/skills/godot-physics/SKILL.md
- **godot-resources** — >  
  Ruta: .claude/skills/godot-resources/SKILL.md
- **godot-shaders** — >  
  Ruta: .claude/skills/godot-shaders/SKILL.md
- **godot-signals-groups** — >  
  Ruta: .claude/skills/godot-signals-groups/SKILL.md
- **godot-tilemap** — >  
  Ruta: .claude/skills/godot-tilemap/SKILL.md
- **godot-ui-control** — >  
  Ruta: .claude/skills/godot-ui-control/SKILL.md
- **help** — "What should I do next? Use when stuck or you don't know what to do."  
  Ruta: .claude/skills/help/SKILL.md
- **hotfix** — "Emergency fix bypassing normal sprint process — hotfix branch, approvals tracked, backport verified, full audit trail."  
  Ruta: .claude/skills/hotfix/SKILL.md
- **impeccable** — "Use when the user wants to design, redesign, shape, critique, audit, polish, simplify, harden, animate, or otherwise improve a frontend interface: websites, landing pages, dashboards, product UI, components, forms, settings, onboarding, empty states, and native iOS or Android screens. Handles UX review, hierarchy, layout, typography, color, motion, UX copy, accessibility, responsive behavior, edge cases, and capturing or documenting design systems (DESIGN.md, tokens). Also for making bland UI bolder, loud UI quieter, or ambitious visual effects. Not for backend-only or non-UI tasks."  
  Ruta: .claude/skills/impeccable/SKILL.md
- **improve-animations** — Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and self-contained implementation plans for other agents (or cheaper models) to execute. Read-only on source code — it plans improvements, it does not apply them. Use when the user asks to "improve the animations", "audit the motion", "make this app feel better", or wants a roadmap of animation fixes rather than a review of a single diff.  
  Ruta: .claude/skills/improve-animations/SKILL.md
- **input-systems** — >  
  Ruta: .claude/skills/input-systems/SKILL.md
- **itch-publish** — >  
  Ruta: .claude/skills/itch-publish/SKILL.md
- **launch-checklist** — "Launch readiness across every department: code, content, store, marketing, community, infrastructure, legal, go/no-go sign-offs."  
  Ruta: .claude/skills/launch-checklist/SKILL.md
- **level-design** — >  
  Ruta: .claude/skills/level-design/SKILL.md
- **localize** — "Localization pipeline — find hardcoded strings, extract string tables, cultural review, VO, RTL, enforce string freeze."  
  Ruta: .claude/skills/localize/SKILL.md
- **love2d-core** — >  
  Ruta: .claude/skills/love2d-core/SKILL.md
- **map-systems** — "Decompose a concept into individual systems, map dependencies, prioritize design order, create the systems index."  
  Ruta: .claude/skills/map-systems/SKILL.md
- **milestone-review** — "Milestone progress review — completeness, quality metrics, risk, go/no-go recommendation. At checkpoints or before a deadline."  
  Ruta: .claude/skills/milestone-review/SKILL.md
- **mobile-native** — Make a web app feel native on a phone — the small CSS and meta-tag fixes that separate "a website in a browser" from something that feels installed. Covers sticky hover states, tap highlight flashes, the 100vh bug, inputs that zoom the page, laggy taps, pull-to-refresh hijacking scroll, content under the notch, long-press selecting button text, carousels that scroll the wrong way, mismatched status bars, and the rule that you test on real hardware. Use when a web app is being built for or reviewed on mobile, when something "works in Chrome but feels wrong on my phone", when building a PWA, a bottom sheet, a carousel, a full-screen layout, or any touch interaction. For motion itself use animate; for React Native use animate-expo.  
  Ruta: .claude/skills/mobile-native/SKILL.md
- **onboard** — "Onboarding doc for a new contributor or agent — project state, conventions, priorities relevant to the specified role."  
  Ruta: .claude/skills/onboard/SKILL.md
- **patch-notes** — "Player-facing patch notes from git history and changelogs. Translates developer language into player communication."  
  Ruta: .claude/skills/patch-notes/SKILL.md
- **perf-profile** — "Performance profiling — find bottlenecks, measure against budgets, produce ranked optimization recommendations."  
  Ruta: .claude/skills/perf-profile/SKILL.md
- **performance-optimization** — >  
  Ruta: .claude/skills/performance-optimization/SKILL.md
- **phaser-arcade-physics** — >  
  Ruta: .claude/skills/phaser-arcade-physics/SKILL.md
- **phaser-core** — >  
  Ruta: .claude/skills/phaser-core/SKILL.md
- **physics-tuning** — >  
  Ruta: .claude/skills/physics-tuning/SKILL.md
- **pick-ui-library** — Pick the right library for a given frontend task from a curated, opinionated list — numbers, OTP inputs, charts, command menus, virtualization, drag and drop, toasts, state, styling, and more. Only runs when explicitly invoked; it does not trigger on its own.  
  Ruta: .claude/skills/pick-ui-library/SKILL.md
- **pixijs-rendering** — >  
  Ruta: .claude/skills/pixijs-rendering/SKILL.md
- **platformer** — >  
  Ruta: .claude/skills/platformer/SKILL.md
- **playtest-report** — "Structured playtest report template, or turn existing playtest notes into structured feedback."  
  Ruta: .claude/skills/playtest-report/SKILL.md
- **ponytail-audit** — >  
  Ruta: .claude/skills/ponytail-audit/SKILL.md
- **ponytail-debt** — >  
  Ruta: .claude/skills/ponytail-debt/SKILL.md
- **ponytail-gain** — >  
  Ruta: .claude/skills/ponytail-gain/SKILL.md
- **ponytail-help** — >  
  Ruta: .claude/skills/ponytail-help/SKILL.md
- **ponytail-review** — >  
  Ruta: .claude/skills/ponytail-review/SKILL.md
- **ponytail** — >  
  Ruta: .claude/skills/ponytail/SKILL.md
- **procedural-gen** — >  
  Ruta: .claude/skills/procedural-gen/SKILL.md
- **project-stage-detect** — "Analyze project state, detect stage, identify gaps, recommend next steps. 'Where are we in development?'"  
  Ruta: .claude/skills/project-stage-detect/SKILL.md
- **propagate-design-change** — "Finds architecture decisions (ADRs) made stale by a changed GDD and walks through resolving each. Use when the user changed a number or rule in a GDD and asks which ADRs or architecture decisions are now out of date."  
  Ruta: .claude/skills/propagate-design-change/SKILL.md
- **prototype-fast** — >  
  Ruta: .claude/skills/prototype-fast/SKILL.md
- **prototype** — Build multiple genuinely different versions of a UI piece you describe, rendered behind a visual picker so you can flip through them live and promote the one that feels right. Only runs when explicitly invoked; it does not trigger on its own.  
  Ruta: .claude/skills/prototype/SKILL.md
- **puzzle** — >  
  Ruta: .claude/skills/puzzle/SKILL.md
- **pygame-core** — >  
  Ruta: .claude/skills/pygame-core/SKILL.md
- **qa-plan** — "QA test plan for a sprint — classifies stories by Logic/Integration/Visual/UI, covers automated tests, manual cases, smoke scope."  
  Ruta: .claude/skills/qa-plan/SKILL.md
- **quick-design** — "Lightweight spec for small changes — tuning adjustments, minor mechanics. Embeds directly into stories; skips full GDD."  
  Ruta: .claude/skills/quick-design/SKILL.md
- **regression-suite** — "Map test coverage to GDD critical paths, find fixed bugs lacking regression tests, flag drift from new features."  
  Ruta: .claude/skills/regression-suite/SKILL.md
- **release-checklist** — "Pre-release checklist — build verification, certification requirements, store metadata, launch readiness."  
  Ruta: .claude/skills/release-checklist/SKILL.md
- **remove-animations** — Find the animations an interface doesn't need and remove them — motion on keyboard actions, high-frequency surfaces, functional data, and decoration with no purpose — then clean up what they leave behind. Edits code, but only to subtract; it never adds or retunes motion. Use when the user says the app "feels slow", "has too much animation", "feels over-animated", wants to "tone down the motion", or asks what animations to remove. For finding places that should animate, use find-animation-opportunities; for fixing animations that should stay, use improve-animations or review-animations.  
  Ruta: .claude/skills/remove-animations/SKILL.md
- **retrospective** — "Sprint or milestone retrospective from completed work, velocity, blockers. Actionable insights for the next iteration."  
  Ruta: .claude/skills/retrospective/SKILL.md
- **reverse-document** — "Generate missing design or architecture docs from existing implementation — works backwards from code and prototypes."  
  Ruta: .claude/skills/reverse-document/SKILL.md
- **review-all-gdds** — "Holistic cross-GDD review — contradictions between systems, dominant strategies, economic imbalance, cognitive overload, pillar drift."  
  Ruta: .claude/skills/review-all-gdds/SKILL.md
- **review-animations** — Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned.  
  Ruta: .claude/skills/review-animations/SKILL.md
- **roblox-characters** — >  
  Ruta: .claude/skills/roblox-characters/SKILL.md
- **roblox-datastores** — >  
  Ruta: .claude/skills/roblox-datastores/SKILL.md
- **roblox-luau** — >  
  Ruta: .claude/skills/roblox-luau/SKILL.md
- **roblox-networking** — >  
  Ruta: .claude/skills/roblox-networking/SKILL.md
- **roblox-physics** — >  
  Ruta: .claude/skills/roblox-physics/SKILL.md
- **roblox-simulator-economy** — >  
  Ruta: .claude/skills/roblox-simulator-economy/SKILL.md
- **roblox-studio-workflow** — >  
  Ruta: .claude/skills/roblox-studio-workflow/SKILL.md
- **roblox-ui** — >  
  Ruta: .claude/skills/roblox-ui/SKILL.md
- **roguelike** — >  
  Ruta: .claude/skills/roguelike/SKILL.md
- **router** — >  
  Ruta: .claude/skills/router/SKILL.md
- **rpg** — >  
  Ruta: .claude/skills/rpg/SKILL.md
- **save-systems** — >  
  Ruta: .claude/skills/save-systems/SKILL.md
- **scope-check** — "Scope creep check — current scope versus the original plan. Flags additions, quantifies bloat, recommends cuts. 'Any scope creep?'"  
  Ruta: .claude/skills/scope-check/SKILL.md
- **security-audit** — "Security audit — save tampering, cheat vectors, network exploits, data exposure, input validation. Before public or multiplayer release."  
  Ruta: .claude/skills/security-audit/SKILL.md
- **settings** — "View or change project config — effective merged values, or set locally in project.local.yaml."  
  Ruta: .claude/skills/settings/SKILL.md
- **setup-engine** — "Configure engine and version. Pins it in CLAUDE.md; WebSearch fills reference docs when the version is beyond LLM training data."  
  Ruta: .claude/skills/setup-engine/SKILL.md
- **shader-programming** — >  
  Ruta: .claude/skills/shader-programming/SKILL.md
- **skill-improve** — "Improve a skill via a test-fix-retest loop — static checks, targeted fixes, keep or revert on score change."  
  Ruta: .claude/skills/skill-improve/SKILL.md
- **skill-test** — "Validate skill files for structural compliance and behavioral correctness. Four modes: static linter, spec, category rubric, audit."  
  Ruta: .claude/skills/skill-test/SKILL.md
- **smoke-check** — "Critical-path smoke gate before QA hand-off — runs the automated suite. A failed check means the build is not QA-ready."  
  Ruta: .claude/skills/smoke-check/SKILL.md
- **soak-test** — "Soak test protocol for extended play — what to observe and log for slow leaks, fatigue, late-appearing edge cases."  
  Ruta: .claude/skills/soak-test/SKILL.md
- **sprint-plan** — "New or updated sprint plan from the current milestone, completed work, and available capacity."  
  Ruta: .claude/skills/sprint-plan/SKILL.md
- **sprint-status** — "Fast, concise sprint snapshot — burndown and emerging risks for situational awareness. 'How is the sprint going?'"  
  Ruta: .claude/skills/sprint-status/SKILL.md
- **start** — "Guides a first-time user through onboarding and picks the right workflow. Use when the user is new, just cloned or installed the studio, has no idea or engine yet, asks where to begin, or wants to bring in an existing game."  
  Ruta: .claude/skills/start/SKILL.md
- **steam-publish** — >  
  Ruta: .claude/skills/steam-publish/SKILL.md
- **story-done** — "Closes a finished story: verifies each acceptance criterion, checks for design or ADR deviations and updates its status. Use when the user says a story is done, finished or ready to close."  
  Ruta: .claude/skills/story-done/SKILL.md
- **story-readiness** — "Checks whether a story is ready to implement: clear acceptance criteria, no open questions, valid ADR and dependencies. Use when the user asks if a story, or the sprint's stories, are ready to start or build."  
  Ruta: .claude/skills/story-readiness/SKILL.md
- **survival-crafting** — >  
  Ruta: .claude/skills/survival-crafting/SKILL.md
- **team-audio** — "Orchestrate the audio team — audio-director, sound-designer, technical-artist, gameplay-programmer — direction through implementation."  
  Ruta: .claude/skills/team-audio/SKILL.md
- **team-combat** — "Orchestrate the combat team — game-designer, gameplay-programmer, ai-programmer, technical-artist, sound-designer, qa-tester — design through implement and validate."  
  Ruta: .claude/skills/team-combat/SKILL.md
- **team-level** — "Orchestrate the level team — level-designer, narrative-director, world-builder, art-director, systems-designer, qa-tester — for complete area creation."  
  Ruta: .claude/skills/team-level/SKILL.md
- **team-live-ops** — "Orchestrate the live-ops team — live-ops-designer, economy-designer, analytics-engineer, community-manager, writer — for a season or live event."  
  Ruta: .claude/skills/team-live-ops/SKILL.md
- **team-narrative** — "Orchestrate the narrative team — narrative-director, writer, world-builder, level-designer — for story, world lore, narrative-driven levels."  
  Ruta: .claude/skills/team-narrative/SKILL.md
- **team-polish** — "Orchestrate the polish team — performance-analyst, technical-artist, sound-designer, qa-tester — to optimize and harden a feature or area."  
  Ruta: .claude/skills/team-polish/SKILL.md
- **team-qa** — "Orchestrate the QA team through a full testing cycle — qa-lead strategy and test plan, qa-tester case writing, execution, sign-off."  
  Ruta: .claude/skills/team-qa/SKILL.md
- **team-release** — "Orchestrate the release team — release-manager, qa-lead, devops-engineer, producer — to execute a release from candidate to deployment."  
  Ruta: .claude/skills/team-release/SKILL.md
- **team-ui** — "Orchestrate the UI team through the UX pipeline — authoring, visual design, implementation, review, polish. Uses /ux-design, /ux-review, studio templates."  
  Ruta: .claude/skills/team-ui/SKILL.md
- **tech-debt** — "Track, categorize and prioritize technical debt across the codebase — scans for debt indicators, maintains a register."  
  Ruta: .claude/skills/tech-debt/SKILL.md
- **test-evidence-review** — "Quality review of test files and evidence — goes beyond existence, evaluates assertion coverage. ADEQUATE/INCOMPLETE/MISSING/NOT ASSESSED per story."  
  Ruta: .claude/skills/test-evidence-review/SKILL.md
- **test-flakiness** — "Find flaky tests from CI logs — aggregates pass rates, spots intermittent failures, recommends quarantine. After multiple runs."  
  Ruta: .claude/skills/test-flakiness/SKILL.md
- **test-helpers** — "Generate engine-specific test helper libraries — assertion utilities, factory functions, mocks in the engine's test folder. Reduces boilerplate."  
  Ruta: .claude/skills/test-helpers/SKILL.md
- **test-setup** — "Scaffold the test framework and CI — tests/ directory, engine test runner, GitHub Actions workflow. Once, before the first sprint."  
  Ruta: .claude/skills/test-setup/SKILL.md
- **threejs-gltf-loading** — >  
  Ruta: .claude/skills/threejs-gltf-loading/SKILL.md
- **threejs-materials-lighting** — >  
  Ruta: .claude/skills/threejs-materials-lighting/SKILL.md
- **threejs-scene-setup** — >  
  Ruta: .claude/skills/threejs-scene-setup/SKILL.md
- **tower-defense** — >  
  Ruta: .claude/skills/tower-defense/SKILL.md
- **unity-animation** — >  
  Ruta: .claude/skills/unity-animation/SKILL.md
- **unity-build-pipeline** — >  
  Ruta: .claude/skills/unity-build-pipeline/SKILL.md
- **unity-csharp-scripting** — >  
  Ruta: .claude/skills/unity-csharp-scripting/SKILL.md
- **unity-input-system** — >  
  Ruta: .claude/skills/unity-input-system/SKILL.md
- **unity-navmesh** — >  
  Ruta: .claude/skills/unity-navmesh/SKILL.md
- **unity-physics** — >  
  Ruta: .claude/skills/unity-physics/SKILL.md
- **unity-scriptableobjects** — >  
  Ruta: .claude/skills/unity-scriptableobjects/SKILL.md
- **unity-tilemap-2d** — >  
  Ruta: .claude/skills/unity-tilemap-2d/SKILL.md
- **unreal-behavior-trees** — >  
  Ruta: .claude/skills/unreal-behavior-trees/SKILL.md
- **unreal-blueprints** — >  
  Ruta: .claude/skills/unreal-blueprints/SKILL.md
- **unreal-cpp-gameplay** — >  
  Ruta: .claude/skills/unreal-cpp-gameplay/SKILL.md
- **unreal-enhanced-input** — >  
  Ruta: .claude/skills/unreal-enhanced-input/SKILL.md
- **unreal-niagara** — >  
  Ruta: .claude/skills/unreal-niagara/SKILL.md
- **unreal-packaging** — >  
  Ruta: .claude/skills/unreal-packaging/SKILL.md
- **ux-design** — "Section-by-section UX spec authoring for a screen, flow or HUD. Reads the player journey to provide context; also project-wide accessibility."  
  Ruta: .claude/skills/ux-design/SKILL.md
- **ux-review** — "Validate a UX spec, HUD design or pattern library — accessibility, GDD alignment, readiness. APPROVED / NOT ASSESSED / NEEDS REVISION / MAJOR REVISION NEEDED."  
  Ruta: .claude/skills/ux-review/SKILL.md
- **vertical-slice** — "Pre-production validation — end-to-end build to confirm the full loop is achievable before committing to Production. After GDDs, architecture, UX specs."  
  Ruta: .claude/skills/vertical-slice/SKILL.md
- **visual-novel** — >  
  Ruta: .claude/skills/visual-novel/SKILL.md
- **web-design-guidelines** — Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".  
  Ruta: .claude/skills/web-design-guidelines/SKILL.md
- **write-swift** — How to write modern Swift well — modeling with value types, Swift 6 data-race safety and approachable concurrency (@concurrent, main-actor-by-default, actors, task groups), protocols and generics (some vs any), API design, performance and ARC, Swift Testing, macros, and the modern language features agents don't know about yet. Use when writing, reviewing, or migrating Swift, or when a concurrency error, a hang, a data race, a retain cycle, or a performance problem needs fixing.  
  Ruta: .claude/skills/write-swift/SKILL.md
- **adopt** — "Brownfield audit — do existing artifacts actually work? Numbered migration plan. Unlike /project-stage-detect, checks compliance not existence."  
  Ruta: skills/adopt/SKILL.md
- **ai-behavior-trees-utility-ai** — >  
  Ruta: skills/ai-behavior-trees-utility-ai/SKILL.md
- **animate-expo** — Build animations in React Native and Expo, making the decisions in the order that determines whether they feel right — should it animate, which thread it runs on, which properties, spring or timing, how the gesture hands off, how it degrades. Writes the implementation with Reanimated, Gesture Handler, Expo Router and expo-haptics. Use when animating anything in an Expo app, adding gestures, sheets, screen transitions, press feedback or haptics, or fixing motion that stutters on device. For web animation use `animate`.  
  Ruta: skills/animate-expo/SKILL.md
- **animate** — Build an animation from scratch, making the decisions in the order that determines whether it feels right — should it animate at all, what purpose, which tool, which properties, which curve and duration, how it interrupts, how it exits. Writes the implementation. Use when asked to animate something, add motion, make a component feel alive, or build a transition. For critiquing existing motion use review-animations; for auditing a whole codebase use improve-animations.  
  Ruta: skills/animate/SKILL.md
- **animation-performance** — Keep web animations inside the frame budget — animate composite-only properties, keep motion off the main thread when the page is busy, and find the cause when an animation drops frames. Covers the layout/paint/composite pipeline, cheaper property swaps, CSS vs WAAPI vs requestAnimationFrame, Framer Motion's hardware-accelerated path, React re-rendering per frame, inherited CSS variable recalculation, blur cost, and when `will-change` actually helps. Use when an animation is janky, choppy, stutters, or drops frames; when choosing which property to animate; when deciding between CSS and JS animation on performance grounds; or when reaching for `will-change` or GPU layers. For choosing easing, duration, or whether to animate at all use animate; for reviewing motion as a whole use review-animations.  
  Ruta: skills/animation-performance/SKILL.md
- **animation-vocabulary** — Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term ("the bouncy thing when a popover opens" → Pop in; "the iOS rubber-band scroll" → Rubber-banding). Use when the user asks "what's it called when…", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.  
  Ruta: skills/animation-vocabulary/SKILL.md
- **antislop-code** — "Code comment hygiene for AI coding agents: remove generic AI-slop comments, keep the valuable ones, never touch the code."  
  Ruta: skills/antislop-code/SKILL.md
- **antislop-copywriting** — "Copy and text skill for antislop. Use when writing or editing prose: headlines, tone, CTAs, and anti-AI-writing patterns. Load with the core."  
  Ruta: skills/antislop-copywriting/SKILL.md
- **antislop-human** — "Human and accessibility skill for antislop. Contrast, keyboard, focus, states, and interaction affordances for real people. Includes the contrast checker."  
  Ruta: skills/antislop-human/SKILL.md
- **antislop-layoutmobile** — "Mobile layout skill for antislop. Use for layouts that reflow across screen sizes, phone to desktop: grids, overflow, tap targets. Load with the core."  
  Ruta: skills/antislop-layoutmobile/SKILL.md
- **antislop-ui** — "UI and visual skill for antislop. Use when building or editing any interface: color, layout, components, motion, and page performance. Load with the core."  
  Ruta: skills/antislop-ui/SKILL.md
- **antislop** — "Anti Slop: Rules for AI Coding Agents. The core filter. Load always to stop generic AI slop."  
  Ruta: skills/antislop/SKILL.md
- **apple-design** — Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.  
  Ruta: skills/apple-design/SKILL.md
- **architecture-decision** — "Create an ADR documenting a technical decision: context, alternatives considered, consequences."  
  Ruta: skills/architecture-decision/SKILL.md
- **architecture-review** — "Traceability matrix mapping GDD requirements to ADRs. Finds gaps, cross-ADR conflicts, engine compatibility. PASS/CONCERNS/NOT ASSESSED/FAIL."  
  Ruta: skills/architecture-review/SKILL.md
- **art-bible** — "Author the Art Bible — visual identity gating asset production. Run before /map-systems."  
  Ruta: skills/art-bible/SKILL.md
- **ask-sonner** — Guide to Sonner, the React toast library — install and wire up the Toaster, pick the right toast() call, promise and loading toasts, updating, dismissing and persisting toasts, styling, theming and icons, positioning and multiple toasters. Use when working with Sonner or troubleshooting it — toasts that don't appear, appear twice, lose their styles, ignore Tailwind classes, sit behind a modal, or don't follow dark mode.  
  Ruta: skills/ask-sonner/SKILL.md
- **asset-audit** — "Audit assets against naming conventions, file size budgets, format standards. Finds orphaned assets, missing references."  
  Ruta: skills/asset-audit/SKILL.md
- **asset-spec** — "Per-asset visual specs plus AI generation prompts from GDDs and character profiles. After the art bible."  
  Ruta: skills/asset-spec/SKILL.md
- **audio-design** — >  
  Ruta: skills/audio-design/SKILL.md
- **balance-check** — "Find balance outliers, broken progressions, degenerate strategies, economy imbalances in formulas and data. 'Check game balance'."  
  Ruta: skills/balance-check/SKILL.md
- **bevy-ecs** — >  
  Ruta: skills/bevy-ecs/SKILL.md
- **brainstorm** — "Guides the user through finding and choosing a game concept. Use when the user wants game ideas, a new concept, a game jam idea, or to explore other directions, including dropping the current idea and starting over."  
  Ruta: skills/brainstorm/SKILL.md
- **break-ui** — Try to break a piece of UI by feeding it worst-case data — long names, unbreakable emails, one-letter names, missing fields, huge counts, zero items, long labels, non-Latin text, emoji, extreme numbers — then render it behind a "Demo data / Worst case" toggle and report everything that broke, with the fix for each. Use when the user asks to stress-test, break, or find edge cases in a component or screen, or to "try the worst case". For visual design critique use emil-design-eng; for motion use review-animations.  
  Ruta: skills/break-ui/SKILL.md
- **bug-report** — "Structured bug report from a description, or analyze code for potential bugs. Reproduction steps, severity."  
  Ruta: skills/bug-report/SKILL.md
- **bug-triage** — "Re-evaluate open bugs — priority vs severity, assign to sprints, surface systemic trends. Run when the count grows."  
  Ruta: skills/bug-triage/SKILL.md
- **camera-systems** — >  
  Ruta: skills/camera-systems/SKILL.md
- **card-game** — >  
  Ruta: skills/card-game/SKILL.md
- **changelog** — "Auto-generate a changelog from git commits and sprint data. Internal and player-facing versions."  
  Ruta: skills/changelog/SKILL.md
- **code-review** — "Architectural code review — coding standards, SOLID, testability, performance concerns."  
  Ruta: skills/code-review/SKILL.md
- **consistency-check** — "Scan GDDs against the entity registry for cross-document conflicts. Grep-first approach targets conflicting sections, different stats."  
  Ruta: skills/consistency-check/SKILL.md
- **content-audit** — "Audit GDD content counts against what's implemented — planned vs built."  
  Ruta: skills/content-audit/SKILL.md
- **create-architecture** — "Author the architecture blueprint before code is written. Validates decisions against the pinned engine, flags knowledge gaps."  
  Ruta: skills/create-architecture/SKILL.md
- **create-control-manifest** — "Builds a short list of must-do and never-do coding rules per system from accepted ADRs. Use when the user wants programmer rules or a cheat sheet from the ADRs, or needs it regenerated after ADR changes."  
  Ruta: skills/create-control-manifest/SKILL.md
- **create-epics** — "Turns the GDDs and architecture into epics, one per architectural module. Use when the user wants to break the game into epics or plan the work before writing stories. Not for splitting one epic into stories."  
  Ruta: skills/create-epics/SKILL.md
- **create-game-assets** — Plan, generate, source, normalize, and validate cohesive visual game assets. Use for art direction, style bibles, sprites, tilesets, backgrounds, UI art, icons, textures, concept art, or 3D asset briefs.  
  Ruta: skills/create-game-assets/SKILL.md
- **create-stories** — "Breaks one epic into implementable stories with acceptance criteria. Use when the user wants stories for an epic or the next batch of work to build. Not for turning the whole design into epics."  
  Ruta: skills/create-stories/SKILL.md
- **day-one-patch** — "Day-one launch patch — focused fix for known issues found after gold master. Mini-sprint with QA gate and rollback."  
  Ruta: skills/day-one-patch/SKILL.md
- **defold-core** — >  
  Ruta: skills/defold-core/SKILL.md
- **design-review** — "Reviews one design document for completeness, internal consistency, implementability, and design standards. Before handing to programmers."  
  Ruta: skills/design-review/SKILL.md
- **design-system** — "Section-by-section GDD authoring for one system — walks through each required section, cross-references dependencies."  
  Ruta: skills/design-system/SKILL.md
- **design-taste-frontend** — >-  
  Ruta: skills/design-taste-frontend/SKILL.md
- **dev-story** — "Implements one story in code with tests, following its ADRs. Use when the user says to build, implement or start working on a story. Not for checking readiness beforehand or closing the story after."  
  Ruta: skills/dev-story/SKILL.md
- **dialogue-systems** — >  
  Ruta: skills/dialogue-systems/SKILL.md
- **ebitengine-game** — >  
  Ruta: skills/ebitengine-game/SKILL.md
- **emil-design-eng** — This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.  
  Ruta: skills/emil-design-eng/SKILL.md
- **estimate** — "Estimate task effort from complexity, dependencies, velocity, risk. Structured estimate with confidence levels."  
  Ruta: skills/estimate/SKILL.md
- **find-animation-opportunities** — Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-only; it proposes motion with exact values, it does not implement it. Use when the user asks "what could be animated here?" or wants to "make this feel more alive". For fixing existing animations, use improve-animations or review-animations instead.  
  Ruta: skills/find-animation-opportunities/SKILL.md
- **fps-shooter** — >  
  Ruta: skills/fps-shooter/SKILL.md
- **game-ai** — >  
  Ruta: skills/game-ai/SKILL.md
- **game-feel** — >  
  Ruta: skills/game-feel/SKILL.md
- **game-jam** — >  
  Ruta: skills/game-jam/SKILL.md
- **game-ui-ux** — >  
  Ruta: skills/game-ui-ux/SKILL.md
- **gate-check** — "Ready to advance between development phases? PASS/CONCERNS/NOT ASSESSED/FAIL with blockers and required artifacts. 'Can we move to production?'"  
  Ruta: skills/gate-check/SKILL.md
- **godot-2d-movement** — >  
  Ruta: skills/godot-2d-movement/SKILL.md
- **godot-3d-essentials** — >  
  Ruta: skills/godot-3d-essentials/SKILL.md
- **godot-animation** — >  
  Ruta: skills/godot-animation/SKILL.md
- **godot-audio** — >  
  Ruta: skills/godot-audio/SKILL.md
- **godot-csharp** — >  
  Ruta: skills/godot-csharp/SKILL.md
- **godot-export** — >  
  Ruta: skills/godot-export/SKILL.md
- **godot-gdscript-headless-testing** — >  
  Ruta: skills/godot-gdscript-headless-testing/SKILL.md
- **godot-gdscript** — >  
  Ruta: skills/godot-gdscript/SKILL.md
- **godot-multiplayer** — >  
  Ruta: skills/godot-multiplayer/SKILL.md
- **godot-nodes-scenes** — >  
  Ruta: skills/godot-nodes-scenes/SKILL.md
- **godot-physics** — >  
  Ruta: skills/godot-physics/SKILL.md
- **godot-resources** — >  
  Ruta: skills/godot-resources/SKILL.md
- **godot-shaders** — >  
  Ruta: skills/godot-shaders/SKILL.md
- **godot-signals-groups** — >  
  Ruta: skills/godot-signals-groups/SKILL.md
- **godot-tilemap** — >  
  Ruta: skills/godot-tilemap/SKILL.md
- **godot-ui-control** — >  
  Ruta: skills/godot-ui-control/SKILL.md
- **help** — "What should I do next? Use when stuck or you don't know what to do."  
  Ruta: skills/help/SKILL.md
- **hotfix** — "Emergency fix bypassing normal sprint process — hotfix branch, approvals tracked, backport verified, full audit trail."  
  Ruta: skills/hotfix/SKILL.md
- **impeccable** — "Use when the user wants to design, redesign, shape, critique, audit, polish, simplify, harden, animate, or otherwise improve a frontend interface: websites, landing pages, dashboards, product UI, components, forms, settings, onboarding, empty states, and native iOS or Android screens. Handles UX review, hierarchy, layout, typography, color, motion, UX copy, accessibility, responsive behavior, edge cases, and capturing or documenting design systems (DESIGN.md, tokens). Also for making bland UI bolder, loud UI quieter, or ambitious visual effects. Not for backend-only or non-UI tasks."  
  Ruta: skills/impeccable/SKILL.md
- **improve-animations** — Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and self-contained implementation plans for other agents (or cheaper models) to execute. Read-only on source code — it plans improvements, it does not apply them. Use when the user asks to "improve the animations", "audit the motion", "make this app feel better", or wants a roadmap of animation fixes rather than a review of a single diff.  
  Ruta: skills/improve-animations/SKILL.md
- **input-systems** — >  
  Ruta: skills/input-systems/SKILL.md
- **itch-publish** — >  
  Ruta: skills/itch-publish/SKILL.md
- **launch-checklist** — "Launch readiness across every department: code, content, store, marketing, community, infrastructure, legal, go/no-go sign-offs."  
  Ruta: skills/launch-checklist/SKILL.md
- **level-design** — >  
  Ruta: skills/level-design/SKILL.md
- **localize** — "Localization pipeline — find hardcoded strings, extract string tables, cultural review, VO, RTL, enforce string freeze."  
  Ruta: skills/localize/SKILL.md
- **love2d-core** — >  
  Ruta: skills/love2d-core/SKILL.md
- **map-systems** — "Decompose a concept into individual systems, map dependencies, prioritize design order, create the systems index."  
  Ruta: skills/map-systems/SKILL.md
- **milestone-review** — "Milestone progress review — completeness, quality metrics, risk, go/no-go recommendation. At checkpoints or before a deadline."  
  Ruta: skills/milestone-review/SKILL.md
- **mobile-native** — Make a web app feel native on a phone — the small CSS and meta-tag fixes that separate "a website in a browser" from something that feels installed. Covers sticky hover states, tap highlight flashes, the 100vh bug, inputs that zoom the page, laggy taps, pull-to-refresh hijacking scroll, content under the notch, long-press selecting button text, carousels that scroll the wrong way, mismatched status bars, and the rule that you test on real hardware. Use when a web app is being built for or reviewed on mobile, when something "works in Chrome but feels wrong on my phone", when building a PWA, a bottom sheet, a carousel, a full-screen layout, or any touch interaction. For motion itself use animate; for React Native use animate-expo.  
  Ruta: skills/mobile-native/SKILL.md
- **onboard** — "Onboarding doc for a new contributor or agent — project state, conventions, priorities relevant to the specified role."  
  Ruta: skills/onboard/SKILL.md
- **patch-notes** — "Player-facing patch notes from git history and changelogs. Translates developer language into player communication."  
  Ruta: skills/patch-notes/SKILL.md
- **perf-profile** — "Performance profiling — find bottlenecks, measure against budgets, produce ranked optimization recommendations."  
  Ruta: skills/perf-profile/SKILL.md
- **performance-optimization** — >  
  Ruta: skills/performance-optimization/SKILL.md
- **phaser-arcade-physics** — >  
  Ruta: skills/phaser-arcade-physics/SKILL.md
- **phaser-core** — >  
  Ruta: skills/phaser-core/SKILL.md
- **physics-tuning** — >  
  Ruta: skills/physics-tuning/SKILL.md
- **pick-ui-library** — Pick the right library for a given frontend task from a curated, opinionated list — numbers, OTP inputs, charts, command menus, virtualization, drag and drop, toasts, state, styling, and more. Only runs when explicitly invoked; it does not trigger on its own.  
  Ruta: skills/pick-ui-library/SKILL.md
- **pixijs-rendering** — >  
  Ruta: skills/pixijs-rendering/SKILL.md
- **platformer** — >  
  Ruta: skills/platformer/SKILL.md
- **playtest-report** — "Structured playtest report template, or turn existing playtest notes into structured feedback."  
  Ruta: skills/playtest-report/SKILL.md
- **ponytail-audit** — >  
  Ruta: skills/ponytail-audit/SKILL.md
- **ponytail-debt** — >  
  Ruta: skills/ponytail-debt/SKILL.md
- **ponytail-gain** — >  
  Ruta: skills/ponytail-gain/SKILL.md
- **ponytail-help** — >  
  Ruta: skills/ponytail-help/SKILL.md
- **ponytail-review** — >  
  Ruta: skills/ponytail-review/SKILL.md
- **ponytail** — >  
  Ruta: skills/ponytail/SKILL.md
- **procedural-gen** — >  
  Ruta: skills/procedural-gen/SKILL.md
- **project-stage-detect** — "Analyze project state, detect stage, identify gaps, recommend next steps. 'Where are we in development?'"  
  Ruta: skills/project-stage-detect/SKILL.md
- **propagate-design-change** — "Finds architecture decisions (ADRs) made stale by a changed GDD and walks through resolving each. Use when the user changed a number or rule in a GDD and asks which ADRs or architecture decisions are now out of date."  
  Ruta: skills/propagate-design-change/SKILL.md
- **prototype-fast** — >  
  Ruta: skills/prototype-fast/SKILL.md
- **prototype** — Build multiple genuinely different versions of a UI piece you describe, rendered behind a visual picker so you can flip through them live and promote the one that feels right. Only runs when explicitly invoked; it does not trigger on its own.  
  Ruta: skills/prototype/SKILL.md
- **puzzle** — >  
  Ruta: skills/puzzle/SKILL.md
- **pygame-core** — >  
  Ruta: skills/pygame-core/SKILL.md
- **qa-plan** — "QA test plan for a sprint — classifies stories by Logic/Integration/Visual/UI, covers automated tests, manual cases, smoke scope."  
  Ruta: skills/qa-plan/SKILL.md
- **quick-design** — "Lightweight spec for small changes — tuning adjustments, minor mechanics. Embeds directly into stories; skips full GDD."  
  Ruta: skills/quick-design/SKILL.md
- **regression-suite** — "Map test coverage to GDD critical paths, find fixed bugs lacking regression tests, flag drift from new features."  
  Ruta: skills/regression-suite/SKILL.md
- **release-checklist** — "Pre-release checklist — build verification, certification requirements, store metadata, launch readiness."  
  Ruta: skills/release-checklist/SKILL.md
- **remove-animations** — Find the animations an interface doesn't need and remove them — motion on keyboard actions, high-frequency surfaces, functional data, and decoration with no purpose — then clean up what they leave behind. Edits code, but only to subtract; it never adds or retunes motion. Use when the user says the app "feels slow", "has too much animation", "feels over-animated", wants to "tone down the motion", or asks what animations to remove. For finding places that should animate, use find-animation-opportunities; for fixing animations that should stay, use improve-animations or review-animations.  
  Ruta: skills/remove-animations/SKILL.md
- **retrospective** — "Sprint or milestone retrospective from completed work, velocity, blockers. Actionable insights for the next iteration."  
  Ruta: skills/retrospective/SKILL.md
- **reverse-document** — "Generate missing design or architecture docs from existing implementation — works backwards from code and prototypes."  
  Ruta: skills/reverse-document/SKILL.md
- **review-all-gdds** — "Holistic cross-GDD review — contradictions between systems, dominant strategies, economic imbalance, cognitive overload, pillar drift."  
  Ruta: skills/review-all-gdds/SKILL.md
- **review-animations** — Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned.  
  Ruta: skills/review-animations/SKILL.md
- **roblox-characters** — >  
  Ruta: skills/roblox-characters/SKILL.md
- **roblox-datastores** — >  
  Ruta: skills/roblox-datastores/SKILL.md
- **roblox-luau** — >  
  Ruta: skills/roblox-luau/SKILL.md
- **roblox-networking** — >  
  Ruta: skills/roblox-networking/SKILL.md
- **roblox-physics** — >  
  Ruta: skills/roblox-physics/SKILL.md
- **roblox-simulator-economy** — >  
  Ruta: skills/roblox-simulator-economy/SKILL.md
- **roblox-studio-workflow** — >  
  Ruta: skills/roblox-studio-workflow/SKILL.md
- **roblox-ui** — >  
  Ruta: skills/roblox-ui/SKILL.md
- **roguelike** — >  
  Ruta: skills/roguelike/SKILL.md
- **router** — >  
  Ruta: skills/router/SKILL.md
- **rpg** — >  
  Ruta: skills/rpg/SKILL.md
- **save-systems** — >  
  Ruta: skills/save-systems/SKILL.md
- **scope-check** — "Scope creep check — current scope versus the original plan. Flags additions, quantifies bloat, recommends cuts. 'Any scope creep?'"  
  Ruta: skills/scope-check/SKILL.md
- **security-audit** — "Security audit — save tampering, cheat vectors, network exploits, data exposure, input validation. Before public or multiplayer release."  
  Ruta: skills/security-audit/SKILL.md
- **settings** — "View or change project config — effective merged values, or set locally in project.local.yaml."  
  Ruta: skills/settings/SKILL.md
- **setup-engine** — "Configure engine and version. Pins it in CLAUDE.md; WebSearch fills reference docs when the version is beyond LLM training data."  
  Ruta: skills/setup-engine/SKILL.md
- **shader-programming** — >  
  Ruta: skills/shader-programming/SKILL.md
- **skill-improve** — "Improve a skill via a test-fix-retest loop — static checks, targeted fixes, keep or revert on score change."  
  Ruta: skills/skill-improve/SKILL.md
- **skill-test** — "Validate skill files for structural compliance and behavioral correctness. Four modes: static linter, spec, category rubric, audit."  
  Ruta: skills/skill-test/SKILL.md
- **smoke-check** — "Critical-path smoke gate before QA hand-off — runs the automated suite. A failed check means the build is not QA-ready."  
  Ruta: skills/smoke-check/SKILL.md
- **soak-test** — "Soak test protocol for extended play — what to observe and log for slow leaks, fatigue, late-appearing edge cases."  
  Ruta: skills/soak-test/SKILL.md
- **sprint-plan** — "New or updated sprint plan from the current milestone, completed work, and available capacity."  
  Ruta: skills/sprint-plan/SKILL.md
- **sprint-status** — "Fast, concise sprint snapshot — burndown and emerging risks for situational awareness. 'How is the sprint going?'"  
  Ruta: skills/sprint-status/SKILL.md
- **start** — "Guides a first-time user through onboarding and picks the right workflow. Use when the user is new, just cloned or installed the studio, has no idea or engine yet, asks where to begin, or wants to bring in an existing game."  
  Ruta: skills/start/SKILL.md
- **steam-publish** — >  
  Ruta: skills/steam-publish/SKILL.md
- **story-done** — "Closes a finished story: verifies each acceptance criterion, checks for design or ADR deviations and updates its status. Use when the user says a story is done, finished or ready to close."  
  Ruta: skills/story-done/SKILL.md
- **story-readiness** — "Checks whether a story is ready to implement: clear acceptance criteria, no open questions, valid ADR and dependencies. Use when the user asks if a story, or the sprint's stories, are ready to start or build."  
  Ruta: skills/story-readiness/SKILL.md
- **survival-crafting** — >  
  Ruta: skills/survival-crafting/SKILL.md
- **team-audio** — "Orchestrate the audio team — audio-director, sound-designer, technical-artist, gameplay-programmer — direction through implementation."  
  Ruta: skills/team-audio/SKILL.md
- **team-combat** — "Orchestrate the combat team — game-designer, gameplay-programmer, ai-programmer, technical-artist, sound-designer, qa-tester — design through implement and validate."  
  Ruta: skills/team-combat/SKILL.md
- **team-level** — "Orchestrate the level team — level-designer, narrative-director, world-builder, art-director, systems-designer, qa-tester — for complete area creation."  
  Ruta: skills/team-level/SKILL.md
- **team-live-ops** — "Orchestrate the live-ops team — live-ops-designer, economy-designer, analytics-engineer, community-manager, writer — for a season or live event."  
  Ruta: skills/team-live-ops/SKILL.md
- **team-narrative** — "Orchestrate the narrative team — narrative-director, writer, world-builder, level-designer — for story, world lore, narrative-driven levels."  
  Ruta: skills/team-narrative/SKILL.md
- **team-polish** — "Orchestrate the polish team — performance-analyst, technical-artist, sound-designer, qa-tester — to optimize and harden a feature or area."  
  Ruta: skills/team-polish/SKILL.md
- **team-qa** — "Orchestrate the QA team through a full testing cycle — qa-lead strategy and test plan, qa-tester case writing, execution, sign-off."  
  Ruta: skills/team-qa/SKILL.md
- **team-release** — "Orchestrate the release team — release-manager, qa-lead, devops-engineer, producer — to execute a release from candidate to deployment."  
  Ruta: skills/team-release/SKILL.md
- **team-ui** — "Orchestrate the UI team through the UX pipeline — authoring, visual design, implementation, review, polish. Uses /ux-design, /ux-review, studio templates."  
  Ruta: skills/team-ui/SKILL.md
- **tech-debt** — "Track, categorize and prioritize technical debt across the codebase — scans for debt indicators, maintains a register."  
  Ruta: skills/tech-debt/SKILL.md
- **test-evidence-review** — "Quality review of test files and evidence — goes beyond existence, evaluates assertion coverage. ADEQUATE/INCOMPLETE/MISSING/NOT ASSESSED per story."  
  Ruta: skills/test-evidence-review/SKILL.md
- **test-flakiness** — "Find flaky tests from CI logs — aggregates pass rates, spots intermittent failures, recommends quarantine. After multiple runs."  
  Ruta: skills/test-flakiness/SKILL.md
- **test-helpers** — "Generate engine-specific test helper libraries — assertion utilities, factory functions, mocks in the engine's test folder. Reduces boilerplate."  
  Ruta: skills/test-helpers/SKILL.md
- **test-setup** — "Scaffold the test framework and CI — tests/ directory, engine test runner, GitHub Actions workflow. Once, before the first sprint."  
  Ruta: skills/test-setup/SKILL.md
- **threejs-gltf-loading** — >  
  Ruta: skills/threejs-gltf-loading/SKILL.md
- **threejs-materials-lighting** — >  
  Ruta: skills/threejs-materials-lighting/SKILL.md
- **threejs-scene-setup** — >  
  Ruta: skills/threejs-scene-setup/SKILL.md
- **tower-defense** — >  
  Ruta: skills/tower-defense/SKILL.md
- **unity-animation** — >  
  Ruta: skills/unity-animation/SKILL.md
- **unity-build-pipeline** — >  
  Ruta: skills/unity-build-pipeline/SKILL.md
- **unity-csharp-scripting** — >  
  Ruta: skills/unity-csharp-scripting/SKILL.md
- **unity-input-system** — >  
  Ruta: skills/unity-input-system/SKILL.md
- **unity-navmesh** — >  
  Ruta: skills/unity-navmesh/SKILL.md
- **unity-physics** — >  
  Ruta: skills/unity-physics/SKILL.md
- **unity-scriptableobjects** — >  
  Ruta: skills/unity-scriptableobjects/SKILL.md
- **unity-tilemap-2d** — >  
  Ruta: skills/unity-tilemap-2d/SKILL.md
- **unreal-behavior-trees** — >  
  Ruta: skills/unreal-behavior-trees/SKILL.md
- **unreal-blueprints** — >  
  Ruta: skills/unreal-blueprints/SKILL.md
- **unreal-cpp-gameplay** — >  
  Ruta: skills/unreal-cpp-gameplay/SKILL.md
- **unreal-enhanced-input** — >  
  Ruta: skills/unreal-enhanced-input/SKILL.md
- **unreal-niagara** — >  
  Ruta: skills/unreal-niagara/SKILL.md
- **unreal-packaging** — >  
  Ruta: skills/unreal-packaging/SKILL.md
- **ux-design** — "Section-by-section UX spec authoring for a screen, flow or HUD. Reads the player journey to provide context; also project-wide accessibility."  
  Ruta: skills/ux-design/SKILL.md
- **ux-review** — "Validate a UX spec, HUD design or pattern library — accessibility, GDD alignment, readiness. APPROVED / NOT ASSESSED / NEEDS REVISION / MAJOR REVISION NEEDED."  
  Ruta: skills/ux-review/SKILL.md
- **vertical-slice** — "Pre-production validation — end-to-end build to confirm the full loop is achievable before committing to Production. After GDDs, architecture, UX specs."  
  Ruta: skills/vertical-slice/SKILL.md
- **visual-novel** — >  
  Ruta: skills/visual-novel/SKILL.md
- **web-design-guidelines** — Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".  
  Ruta: skills/web-design-guidelines/SKILL.md
- **write-swift** — How to write modern Swift well — modeling with value types, Swift 6 data-race safety and approachable concurrency (@concurrent, main-actor-by-default, actors, task groups), protocols and generics (some vs any), API design, performance and ARC, Swift Testing, macros, and the modern language features agents don't know about yet. Use when writing, reviewing, or migrating Swift, or when a concurrency error, a hang, a data race, a retain cycle, or a performance problem needs fixing.  
  Ruta: skills/write-swift/SKILL.md

**Total de archivos SKILL.md detectados:** 548

**Skills externas identificadas para revisión, no instaladas localmente:** game-ui-ux, save-systems, input-systems. Consultar docs/DESCUBRIMIENTO-SKILLS.md.
