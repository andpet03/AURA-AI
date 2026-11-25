// Top bar: house name, room tabs, my points, menu. (Owned by the lead.)

import { canEdit } from './store.js';

export function initHud(ctx) {
  const { store, ui, bus } = ctx; const { h } = ui;
  let myPoints = 0;
  function render() {
    const s = store.get();
    if (!s.house) return;
    ui.setTopbar({
      title: s.house.name,
      tabs: s.house.rooms.map((r) => ({ id: r.id, label: r.name })),
      active: s.roomId,
      onTab: (id) => bus.emit('room:goto', { roomId: id }),
      right: h('div', { class: 'topbar-right' },
        h('button', { class: 'pill', title: 'Scores', onclick: () => ctx.use('points.open')() }, `⭐ ${myPoints}`),
        s.players.length ? h('span', { class: 'pill online' }, `🟢 ${s.players.length + 1} here`) : null,
        h('button', { class: 'icon-btn', 'aria-label': 'Menu', onclick: () => ctx.use('social.openMenu')() }, '☰')),
    });
  }
  store.subscribe((s, prev) => {
    if (s.house !== prev.house || s.roomId !== prev.roomId || s.players.length !== prev.players.length) render();
    if (s.role !== prev.role || s.house !== prev.house) ui.refreshDock(s);
  });
  bus.on('points:changed', ({ mine }) => { myPoints = mine; render(); });
  return { canEdit };
}
