// Marcadores sobre el diorama (recurso listo, comedero vacío, hambre): botones de interfaz que siguen su punto 3D.
// No pasan por el pase de tinta (que los volvía manchas negras de lejos), miden lo mismo con cualquier zoom y se
// pueden tocar.
export class Markers {
  constructor(stage, onTap) {
    this.stage = stage; this.onTap = onTap; this.items = new Map();
    this.el = null;
  }

  // La capa la pone la pantalla (encima del suelo táctil, debajo de la interfaz); si cambió, se reengancha.
  host() {
    const el = document.querySelector('.markers');
    if (el !== this.el) { this.el = el; for (const it of this.items.values()) it.b.remove(); this.items.clear(); }
    return el;
  }

  // list: { id, kind, icon (url), x, y, z, data }
  sync(list) {
    if (!this.host()) return;
    const seen = new Set();
    for (const m of list) {
      seen.add(m.id);
      let it = this.items.get(m.id);
      if (!it) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = `marker m-${m.kind}`; b.setAttribute('aria-label', m.label ?? '');
        b.innerHTML = `<img alt="" src="${m.icon}">`;
        // Se recoge al soltar el dedo (no con click: en móvil el click llegaba tarde o al foco, y saltaba).
        b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); });
        b.addEventListener('pointerup', (e) => { e.stopPropagation(); e.preventDefault(); this.onTap?.(it.m); });
        this.el.append(b);
        it = { b }; this.items.set(m.id, it);
      }
      it.m = m;
    }
    for (const [id, it] of this.items) if (!seen.has(id)) { it.b.remove(); this.items.delete(id); }
  }

  // Colocar tras pintar el fotograma: así siguen a la cámara sin un fotograma de retraso al girar.
  place() {
    for (const it of this.items.values()) {
      const m = it.m, p = this.stage.project(m.x, m.y, m.z);
      it.b.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      it.b.hidden = !p.visible;
    }
  }

  dispose() { for (const it of this.items.values()) it.b.remove(); this.items.clear(); }
}
