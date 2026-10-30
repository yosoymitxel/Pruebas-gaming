import {
  startExpedition,
  travelToNode,
  resolveExpeditionEvent,
  returnFromExpedition,
  buyExpeditionUpgrade
} from "./system.js";
import {
  EXPEDITION_NODES,
  EXPEDITION_UPGRADES,
  INVENTORY_KEYS,
  MIN_EXPLORER_ENERGY
} from "./content.js";

const MATERIAL_LABELS = Object.freeze({
  organicMatter: "Materia orgánica",
  decomposedWood: "Madera descompuesta",
  freshMoss: "Musgo fresco",
  dewDrops: "Gotas de rocío"
});

const NODE_POSITIONS = Object.freeze({
  "garden-entry": "node-garden",
  "mossy-stone": "node-moss",
  "rotting-log": "node-log",
  "rotten-fruit": "node-fruit",
  "compost-bin": "node-compost"
});

const NODE_ICONS = Object.freeze({
  "garden-entry": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9m0 4C5 13 4 8 4 5c5 0 8 2 8 8m0-2c0-6 4-8 8-8 0 4-1 9-8 10"/></svg>',
  "mossy-stone": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17c0-5 3-9 8-9s8 4 8 9c-4 3-12 3-16 0Zm4-7 1-4m4 2 2-4m1 6 3-3"/></svg>',
  "rotting-log": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8c0-2 3-4 8-4s8 2 8 4v8c0 2-3 4-8 4s-8-2-8-4V8Zm0 0c0 2 3 4 8 4s8-2 8-4m-8 4v8"/></svg>',
  "rotten-fruit": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c-2-4 1-6 4-6m-4 7c-3-3-8-1-8 4s4 9 8 8c4 1 8-3 8-8 0-5-5-7-8-4Z"/></svg>',
  "compost-bin": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18M5 8l1 12h12l1-12M4 8l2-4h12l2 4m-9 4v4m4-4v4"/></svg>'
});

const text = value => String(value ?? "");
const dayOf = state => Math.floor(state.clockMinutes / 1440) + 1;
const materialName = key => MATERIAL_LABELS[key] || key;

export function mountExpeditionScreen({
  state,
  onEnter = () => false,
  onExit = () => {},
  onSave = () => true,
  onChange = () => {}
}) {
  if (!state) throw new TypeError("Se requiere TerrariumState para montar las expediciones");

  const root = document.createElement("section");
  root.id = "screen-expedition";
  root.className = "game-screen expedition-screen";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "expedition-title");
  root.innerHTML = [
    '<div class="expedition-shell">',
      '<header class="expedition-header">',
        '<button type="button" id="expedition-close" class="expedition-back">← Volver al terrario</button>',
        '<div class="expedition-heading"><h1 id="expedition-title">Rastros del jardín</h1><p id="expedition-day">Día 01 · Preparación</p></div>',
        '<div class="expedition-wordmark"><span>MICROCOSMOS</span><strong>CUADERNO DE CAMPO</strong></div>',
      '</header>',
      '<section id="expedition-preparation" class="expedition-preparation">',
        '<div class="expedition-intro"><h2>Elige quién seguirá el rastro.</h2><p>Una salida breve al jardín. Cada recorrido consume acciones; cada decisión tiene un coste visible.</p></div>',
        '<div class="expedition-prep-layout">',
          '<section class="expedition-roster"><h3>Colonia disponible</h3><p class="expedition-muted">Solo pueden salir individuos vivos con al menos 30 de energía.</p><div id="expedition-roster-list" class="expedition-roster-list"></div></section>',
          '<aside class="expedition-resources">',
            '<section><h3>Materiales reunidos</h3><div id="expedition-prep-inventory" class="expedition-inventory"></div><p class="expedition-wallet">Bellotas disponibles <strong id="expedition-wallet">30</strong></p></section>',
            '<section><h3>Mejoras del terrario</h3><p class="expedition-muted">Los materiales recuperados se convierten en recursos reales del hábitat.</p><div id="expedition-prep-upgrades" class="expedition-upgrades"></div></section>',
          '</aside>',
        '</div>',
        '<footer class="expedition-prep-footer"><p id="expedition-prep-message" role="status" aria-live="polite">Una expedición disponible por día.</p><button id="expedition-start" type="button" class="expedition-primary">Preparar expedición</button></footer>',
      '</section>',
      '<section id="expedition-session" class="expedition-session" hidden>',
        '<div class="expedition-session-heading"><div><h2>El jardín olvidado</h2><p id="expedition-route-note">Explora un lugar conectado al sendero actual.</p></div><div class="expedition-vitals"><div><span>Acciones</span><strong id="expedition-actions">06</strong></div><div><span>Energía</span><strong id="expedition-energy-value">84</strong></div></div></div>',
        '<div class="expedition-session-layout">',
          '<section class="expedition-map-panel"><div class="expedition-map-heading"><h2>Mapa del jardín</h2><span>5 lugares · rutas conectadas</span></div>',
            '<div class="expedition-map" id="expedition-map" tabindex="-1">',
              '<svg class="expedition-map-lines" viewBox="0 0 600 480" preserveAspectRatio="none" role="img" aria-label="Rutas entre cinco lugares del jardín"><path d="M300 58 L144 190 M300 58 L456 190 M144 190 L216 360 M456 190 L216 360 M456 190 L456 380 M216 360 L456 380"/></svg>',
              '<div id="expedition-map-nodes" class="expedition-map-nodes"></div>',
            '</div>',
            '<div class="expedition-legend"><span><i class="legend-current"></i> Posición actual</span><span><i class="legend-visited"></i> Visitado</span><span><i class="legend-route"></i> Ruta disponible</span></div>',
          '</section>',
          '<aside class="expedition-event-panel"><div id="expedition-event" class="expedition-event" aria-live="polite"></div><p id="expedition-session-message" class="expedition-message" role="status" aria-live="polite"></p><div class="expedition-session-actions"><button type="button" id="expedition-save" class="expedition-secondary">Guardar recorrido</button><button type="button" id="expedition-return" class="expedition-primary">Regresar al terrario</button></div><p class="expedition-retreat-note">Puedes retirarte en cualquier momento, incluso sin acciones restantes.</p></aside>',
        '</div>',
      '</section>',
      '<section id="expedition-settlement" class="expedition-settlement" hidden>',
        '<div class="expedition-settlement-intro"><h2>De vuelta bajo la corteza.</h2><p id="expedition-settlement-copy">La colonia vuelve a su hábitat con nuevos materiales.</p></div>',
        '<div class="expedition-settlement-layout"><section><h3>Materiales del terrario</h3><div id="expedition-settlement-inventory" class="expedition-inventory"></div></section><section><h3>Mejoras disponibles</h3><div id="expedition-settlement-upgrades" class="expedition-upgrades"></div></section></div>',
        '<button type="button" id="expedition-home" class="expedition-primary expedition-home">Volver al terrario</button>',
      '</section>',
    '</div>'
  ].join("");
  document.body.append(root);

  const $ = selector => root.querySelector(selector);
  const viewHead = document.querySelector(".viewhead");
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.id = "open-expedition";
  trigger.className = "expedition-trigger";
  trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19c4-1 7-4 8-8m-1-6c4-2 7-1 9 1 2 3 0 8-4 10-3 1-6 0-7-3-1-3 0-6 2-8Zm-6 15 3-7"/></svg><span>Explorar</span>';
  trigger.setAttribute("aria-haspopup", "dialog");
  viewHead?.append(trigger);

  let selectedExplorerId = null;
  let resumeAfterClose = false;
  let settlement = null;
  let lastFocus = null;
  let feedback = "";

  function inventoryMarkup(inventory) {
    return INVENTORY_KEYS.map(key =>
      '<div class="expedition-inventory-row"><span>' + materialName(key) +
      '</span><strong>' + text(inventory?.[key] ?? 0) + '</strong></div>'
    ).join("");
  }

  function canAfford(upgrade) {
    return Object.entries(upgrade.cost).every(([key, cost]) =>
      (key === "coins" ? state.coins : state.expeditionProgress.inventory[key] ?? 0) >= cost
    );
  }

  function upgradeMarkup() {
    return Object.values(EXPEDITION_UPGRADES).map(upgrade => {
      const installed = state.expeditionProgress.upgrades.includes(upgrade.id);
      const affordable = canAfford(upgrade);
      const cost = Object.entries(upgrade.cost).map(([key, amount]) =>
        amount + " " + (key === "coins" ? "bellotas" : materialName(key).toLowerCase())
      ).join(" · ");
      return '<div class="expedition-upgrade-row"><div><strong>' + upgrade.label +
        '</strong><p>' + upgrade.description + '</p><small>' + cost +
        '</small></div><button type="button" data-expedition-upgrade="' + upgrade.id + '"' +
        (installed || !affordable ? " disabled" : "") +
        '>' + (installed ? "Instalada" : "Construir") + '</button></div>';
    }).join("");
  }

  function renderPreparation() {
    const progress = state.expeditionProgress;
    const day = dayOf(state);
    const used = progress.lastExpeditionDay >= day;
    const living = state.entities.filter(entity => entity.alive !== false);
    const eligible = living.filter(entity => Math.round(entity.energy * 100) >= MIN_EXPLORER_ENERGY);
    if (!eligible.some(entity => entity.id === selectedExplorerId)) selectedExplorerId = eligible[0]?.id ?? null;
    $("#expedition-day").textContent = "Día " + String(day).padStart(2, "0") + " · Preparación";
    $("#expedition-roster-list").innerHTML = living.map(entity => {
      const index = state.entities.indexOf(entity) + 1;
      const energy = Math.round(entity.energy * 100);
      const ready = energy >= MIN_EXPLORER_ENERGY;
      const selected = entity.id === selectedExplorerId;
      return '<button type="button" class="expedition-explorer' + (selected ? " is-selected" : "") +
        '" data-explorer-id="' + entity.id + '" aria-pressed="' + selected + '"' +
        (ready ? "" : " disabled") + '><span class="expedition-explorer-number">' +
        String(index).padStart(2, "0") + '</span><span class="expedition-explorer-copy"><strong>Isópodo ' +
        String(index).padStart(2, "0") + '</strong><small>' +
        (ready ? "Listo para salir" : "Necesita descansar") +
        '</small></span><span class="expedition-energy"><b>' + energy +
        '</b><small>energía</small><i><span style="width:' + energy + '%"></span></i></span></button>';
    }).join("") || '<p class="expedition-empty">No hay individuos vivos para explorar.</p>';
    $("#expedition-prep-inventory").innerHTML = inventoryMarkup(progress.inventory);
    $("#expedition-wallet").textContent = text(state.coins ?? 0);
    $("#expedition-prep-upgrades").innerHTML = upgradeMarkup();
    $("#expedition-start").disabled = used || !selectedExplorerId;
    $("#expedition-prep-message").textContent = used
      ? "La colonia ya salió hoy. La siguiente expedición estará disponible mañana."
      : selectedExplorerId
        ? "Seis acciones, rutas conectadas y retirada libre."
        : "No hay un explorador con energía suficiente.";
  }

  function renderMap(run) {
    const current = EXPEDITION_NODES[run.currentNodeId];
    $("#expedition-map-nodes").innerHTML = Object.values(EXPEDITION_NODES).map(node => {
      const active = node.id === run.currentNodeId;
      const visited = run.visitedNodes.includes(node.id);
      const connected = current.links.includes(node.id);
      const canTravel = !run.pendingEvent && !active && connected && run.actionPoints >= node.travelCost;
      const status = active ? "Posición actual" : visited ? "Ya visitado" : connected ? "Ruta cercana" : "Más allá del camino";
      const cost = node.travelCost === 0 ? "Inicio" : node.travelCost + (node.travelCost === 1 ? " acción" : " acciones");
      return '<button type="button" class="expedition-node ' + NODE_POSITIONS[node.id] +
        (active ? " is-current" : "") + (visited && !active ? " is-visited" : "") +
        (connected && !active ? " is-connected" : "") + '" data-node-id="' + node.id +
        '" aria-label="' + node.label + ". " + status + ". Coste " + cost + '"' +
        (active ? ' aria-current="location"' : "") + (canTravel ? "" : " disabled") +
        '><span class="expedition-node-icon">' + NODE_ICONS[node.id] +
        '</span><span class="expedition-node-copy"><strong>' + node.label +
        '</strong><small>' + status + '</small><em>' + cost + '</em></span></button>';
    }).join("");
  }

  function renderEvent(run) {
    const event = run.pendingEvent;
    if (!event) {
      $("#expedition-event").innerHTML =
        '<h2>El sendero está despejado.</h2><p>Elige un lugar conectado o regresa al terrario. Los sitios visitados no repiten sus hallazgos.</p><p class="expedition-event-summary">' +
        run.actionPoints + " acciones restantes · " + run.energy + " de energía</p>";
      return;
    }
    const labels = ["A", "B", "C"];
    $("#expedition-event").innerHTML =
      '<p class="expedition-event-location">ENCUENTRO · ' + EXPEDITION_NODES[event.nodeId].label.toUpperCase() +
      '</p><h2 id="expedition-event-title" tabindex="-1">' + event.title +
      '</h2><p class="expedition-event-description">' + event.description +
      '</p><div class="expedition-choices">' + event.options.map((option, index) => {
        const available = run.actionPoints >= option.actionCost && run.energy >= option.energyCost;
        const cost = option.actionCost + (option.actionCost === 1 ? " acción" : " acciones") +
          (option.energyCost ? " · " + option.energyCost + " energía" : "");
        return '<button type="button" class="expedition-choice" data-choice-id="' + option.id +
          '"' + (available ? "" : " disabled") + '><span class="expedition-choice-letter">' +
          (labels[index] || "·") + '</span><span class="expedition-choice-copy"><strong>' +
          option.label + '</strong><small>' + option.detail + '</small></span><span class="expedition-choice-cost">' +
          cost + '</span></button>';
      }).join("") + '</div>';
  }

  function renderSession() {
    const run = state.expeditionProgress.active;
    const node = EXPEDITION_NODES[run.currentNodeId];
    $("#expedition-day").textContent = "Día " + String(run.day).padStart(2, "0") + " · " + node.label;
    $("#expedition-actions").textContent = String(run.actionPoints).padStart(2, "0");
    $("#expedition-energy-value").textContent = String(run.energy).padStart(2, "0");
    $("#expedition-route-note").textContent = run.pendingEvent
      ? "Resuelve el encuentro para abrir nuevas rutas."
      : "Elige un lugar conectado al sendero actual.";
    renderMap(run);
    renderEvent(run);
    $("#expedition-session-message").textContent = feedback;
  }

  function renderSettlement() {
    if (!settlement) return;
    $("#expedition-day").textContent = "Día " + String(settlement.dayAfter).padStart(2, "0") + " · Regreso completado";
    $("#expedition-settlement-copy").textContent = settlement.expeditionId +
      " regresó del jardín. El terrario avanzó una jornada y los materiales ya están disponibles.";
    $("#expedition-settlement-inventory").innerHTML = inventoryMarkup(settlement.inventory);
    $("#expedition-settlement-upgrades").innerHTML = upgradeMarkup();
  }

  function render() {
    $("#expedition-preparation").hidden = true;
    $("#expedition-session").hidden = true;
    $("#expedition-settlement").hidden = true;
    if (state.expeditionProgress.active) {
      $("#expedition-session").hidden = false;
      renderSession();
    } else if (settlement) {
      $("#expedition-settlement").hidden = false;
      renderSettlement();
    } else {
      $("#expedition-preparation").hidden = false;
      renderPreparation();
    }
  }

  function persist() {
    try {
      const saved = onSave();
      if (saved === false) throw new Error("El guardado no pudo completarse.");
      return true;
    } catch (error) {
      feedback = "No se pudo guardar: " + error.message;
      return false;
    }
  }

  function finishToTerrarium(resume) {
    root.hidden = true;
    onExit({ resume: Boolean(resume), result: settlement });
    const focusTarget = lastFocus?.isConnected && !lastFocus.closest("[hidden]") ? lastFocus : trigger;
    focusTarget?.focus?.({ preventScroll: true });
    if (document.activeElement !== focusTarget) trigger.focus({ preventScroll: true });
    lastFocus = null;
  }

  function show({ resumeRunning } = {}) {
    if (typeof resumeRunning === "boolean") resumeAfterClose = resumeRunning;
    else resumeAfterClose = Boolean(onEnter());
    if (state.expeditionProgress.active) {
      resumeAfterClose = Boolean(state.expeditionProgress.active.wasRunning);
      settlement = null;
    } else {
      settlement = null;
    }
    feedback = "";
    lastFocus = document.activeElement;
    root.hidden = false;
    render();
    requestAnimationFrame(() => {
      const target = state.expeditionProgress.active
        ? ($("#expedition-event-title") || $("#expedition-map"))
        : settlement ? $("#expedition-home") : $("#expedition-close");
      target?.focus({ preventScroll: true });
    });
  }

  function closePreparation() {
    if (state.expeditionProgress.active || settlement) return;
    finishToTerrarium(resumeAfterClose);
  }

  function start() {
    try {
      startExpedition(state, selectedExplorerId, { wasRunning: resumeAfterClose });
      feedback = "El primer rastro aparece bajo las hojas.";
      persist();
      render();
      $("#expedition-event-title")?.focus({ preventScroll: true });
    } catch (error) {
      $("#expedition-prep-message").textContent = error.message;
    }
  }

  function settle() {
    try {
      settlement = returnFromExpedition(state);
      resumeAfterClose = Boolean(settlement.wasRunning);
      state.running = false;
      feedback = "";
      onChange();
      persist();
      render();
      $("#expedition-home").focus({ preventScroll: true });
    } catch (error) {
      $("#expedition-session-message").textContent = error.message;
    }
  }

  trigger.addEventListener("click", () => show());
  $("#expedition-close").addEventListener("click", closePreparation);
  $("#expedition-start").addEventListener("click", start);
  $("#expedition-save").addEventListener("click", () => {
    const saved = persist();
    $("#expedition-session-message").textContent = saved
      ? "Recorrido guardado en este navegador."
      : feedback;
  });
  $("#expedition-return").addEventListener("click", settle);
  $("#expedition-home").addEventListener("click", () => finishToTerrarium(resumeAfterClose));

  root.addEventListener("click", event => {
    const explorer = event.target.closest("[data-explorer-id]");
    if (explorer) {
      selectedExplorerId = explorer.dataset.explorerId;
      renderPreparation();
      root.querySelector('[data-explorer-id="' + selectedExplorerId + '"]')?.focus({ preventScroll: true });
      return;
    }

    const node = event.target.closest("[data-node-id]");
    if (node) {
      try {
        travelToNode(state, node.dataset.nodeId);
        feedback = "";
        persist();
        renderSession();
        ($("#expedition-event-title") || $("#expedition-map")).focus({ preventScroll: true });
      } catch (error) {
        $("#expedition-session-message").textContent = error.message;
      }
      return;
    }

    const choice = event.target.closest("[data-choice-id]");
    if (choice) {
      try {
        const result = resolveExpeditionEvent(state, choice.dataset.choiceId);
        const rewardText = Object.entries(result.rewards)
          .map(([key, amount]) => "+" + amount + " " + materialName(key).toLowerCase())
          .join(" · ");
        feedback = rewardText || (result.discoveries.length ? "Nuevo descubrimiento registrado." : "Decisión registrada.");
        if (result.discoveries.length) feedback += " · " + result.discoveries.length + " descubrimiento(s)";
        persist();
        renderSession();
        $("#expedition-map").focus({ preventScroll: true });
      } catch (error) {
        $("#expedition-session-message").textContent = error.message;
      }
      return;
    }

    const upgradeButton = event.target.closest("[data-expedition-upgrade]");
    if (upgradeButton) {
      try {
        const result = buyExpeditionUpgrade(state, upgradeButton.dataset.expeditionUpgrade);
        feedback = result.label + " instalado en el hábitat.";
        onChange();
        persist();
        render();
        const note = $("#expedition-prep-message");
        if (note) note.textContent = feedback;
      } catch (error) {
        const note = $("#expedition-prep-message");
        if (note) note.textContent = error.message;
        else $("#expedition-settlement-copy").textContent = error.message;
      }
    }
  });

  root.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!state.expeditionProgress.active && !settlement) {
        event.preventDefault();
        closePreparation();
      }
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...root.querySelectorAll('button:not(:disabled),[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return {
    show,
    render,
    close: closePreparation,
    get element() { return root; },
    get trigger() { return trigger; }
  };
}
