// Shared UI helpers (owned by the lead). Areas build their own screens and panels
// with these, so the whole game looks consistent.
//
// ui.h('div', { class: 'x', onclick }, ...children)  -> create elements
// ui.screen(el) / ui.closeScreen()                   -> full-screen pages (login, onboarding)
// ui.panel({ title, body, wide })                    -> bottom sheet on phones, side card on desktop
// ui.toast('text')                                   -> small message
// ui.addDockButton({ id, icon, label, onClick, visible })  -> buttons in the bottom dock
// ui.setTopbar({ title, tabs, active, onTab, right }) -> the top bar

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function createUI(root) {
  const topbar = h('div', { class: 'topbar' });
  const dock = h('div', { class: 'dock' });
  const sheetLayer = h('div', { class: 'sheet-layer' });
  const screenLayer = h('div', { class: 'screen-layer hidden' });
  const toasts = h('div', { class: 'toasts' });
  root.append(topbar, dock, sheetLayer, screenLayer, toasts);

  const dockButtons = [];
  addEventListener('keydown', (e) => { if (e.key === 'Escape') ui.closePanel(); });
  let openPanel = null;

  const ui = {
    h,
    root,
    screen(el) {
      screenLayer.replaceChildren(el);
      screenLayer.classList.remove('hidden');
    },
    closeScreen() { screenLayer.classList.add('hidden'); screenLayer.replaceChildren(); },

    panel({ title, body, wide = false, onClose }) {
      ui.closePanel();
      const close = () => ui.closePanel();
      const card = h('div', { class: 'sheet' + (wide ? ' wide' : '') },
        h('div', { class: 'sheet-head' }, h('h3', {}, title), h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, '✕')),
        h('div', { class: 'sheet-body' }, body));
      const backdrop = h('div', { class: 'sheet-backdrop', onclick: close });
      sheetLayer.replaceChildren(backdrop, card);
      sheetLayer.classList.add('open');
      openPanel = { onClose };
      return { close, card };
    },
    closePanel() {
      if (!openPanel) return;
      const p = openPanel; openPanel = null;
      sheetLayer.classList.remove('open');
      sheetLayer.replaceChildren();
      try { p.onClose?.(); } catch (e) { console.error(e); }
    },
    isPanelOpen: () => !!openPanel,

    /** In-game dialog (browser prompt()/confirm() are blocked in some embeds).
     *  await ui.ask({ title, fields: [{ label, value, placeholder }], ok: 'Save' }) -> array of values, or null */
    ask({ title, text = '', fields = [], ok = 'OK', cancel = 'Cancel' }) {
      return new Promise((resolve) => {
        const inputs = fields.map((f) => h('input', { value: f.value || '', placeholder: f.placeholder || '' }));
        const done = (v) => { layer.remove(); resolve(v); };
        const layer = h('div', { class: 'modal-layer' },
          h('div', { class: 'modal' }, h('h3', {}, title), text ? h('p', { class: 'muted' }, text) : null,
            ...fields.map((f, i) => h('label', { class: 'field' }, f.label ? h('span', {}, f.label) : null, inputs[i])),
            h('div', { class: 'row-btns' }, h('button', { onclick: () => done(null) }, cancel), h('button', { class: 'primary', onclick: () => done(inputs.map((x) => x.value)) }, ok))));
        inputs.forEach((x) => x.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(inputs.map((y) => y.value)); }));
        root.append(layer);
        setTimeout(() => inputs[0]?.focus(), 30);
      });
    },
    async confirm(title, text = '', ok = 'Yes') { return (await ui.ask({ title, text, ok })) !== null; },

    toast(text, ms = 2600) {
      const t = h('div', { class: 'toast' }, text);
      toasts.append(t);
      setTimeout(() => t.classList.add('out'), ms);
      setTimeout(() => t.remove(), ms + 400);
    },

    addDockButton({ id, icon, label, onClick, visible = () => true, order = 50 }) {
      dockButtons.push({ id, icon, label, onClick, visible, order });
      dockButtons.sort((a, b) => a.order - b.order);
      ui.refreshDock();
    },
    refreshDock(state) {
      dock.replaceChildren(...dockButtons.filter((b) => b.visible(state)).map((b) =>
        h('button', { class: 'dock-btn', 'data-id': b.id, onclick: b.onClick }, h('span', { class: 'dock-icon' }, b.icon), h('span', { class: 'dock-label' }, b.label))));
    },
    setDockVisible(on) { dock.classList.toggle('hidden', !on); topbar.classList.toggle('hidden', !on); },

    setTopbar({ title = '', tabs = [], active = null, onTab, right = null }) {
      topbar.replaceChildren(
        h('div', { class: 'topbar-title' }, title),
        h('div', { class: 'tabs' }, ...tabs.map((t) => h('button', { class: 'tab' + (t.id === active ? ' active' : ''), onclick: () => onTab?.(t.id) }, t.label))),
        h('div', { class: 'topbar-right' }, right));
    },
  };
  return ui;
}
