// HOUSE CHAT + NUDGES (owned by Social).

export function initChat(ctx) {
  const { ui, store, backend, bus } = ctx; const { h } = ui;
  let messages = [];
  let unread = 0;
  let listEl = null;

  const fmt = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const line = (m) => m.kind === 'nudge'
    ? h('div', { class: 'msg nudge' }, `${m.name} ${m.text}`)
    : m.kind === 'system' ? h('div', { class: 'msg system' }, m.text)
    : h('div', { class: 'msg' + (m.userId === store.get().me?.id ? ' mine' : '') }, h('b', {}, m.name), h('span', {}, m.text), h('small', {}, fmt(m.at)));

  function renderList() {
    if (!listEl) return;
    listEl.replaceChildren(...messages.slice(-80).map(line));
    listEl.scrollTop = listEl.scrollHeight;
  }

  async function load() {
    const house = store.get().house;
    messages = house ? await backend.listMessages(house.id) : [];
    renderList();
  }

  async function send(text, kind = 'text') {
    const s = store.get();
    text = text.trim(); if (!text) return;
    const msg = await backend.sendMessage({ houseId: s.house.id, userId: s.me.id, name: s.me.username, text, kind });
    receive(msg);
    ctx.use('live.send')({ type: 'chat', msg });
    bus.emit('points:award', { amount: kind === 'nudge' ? 3 : 1, reason: kind === 'nudge' ? 'nudge' : 'chat' });
  }

  function receive(msg) {
    if (messages.some((m) => m.id === msg.id)) return;
    messages.push(msg);
    renderList();
    bus.emit('chat:message', msg);
    if (!listEl && msg.userId !== store.get().me?.id) {
      unread++;
      ui.toast(msg.kind === 'nudge' ? `💌 ${msg.name} ${msg.text}` : `💬 ${msg.name}: ${msg.text.slice(0, 60)}`);
      ui.refreshDock(store.get());
    }
  }

  function nudgeText() {
    const love = store.get().house?.type === 'love';
    return love ? 'is thinking of you 💞' : 'says hi 👋';
  }

  function open() {
    unread = 0; ui.refreshDock(store.get());
    const input = h('input', { placeholder: 'Message the house…', maxlength: 300, onkeydown: (e) => { if (e.key === 'Enter') { send(input.value); input.value = ''; } } });
    listEl = h('div', { class: 'chat-list' });
    renderList();
    ui.panel({ title: '💬 House chat', body: h('div', { class: 'chat' }, listEl,
      h('div', { class: 'chat-input' }, input, h('button', { class: 'primary', onclick: () => { send(input.value); input.value = ''; } }, 'Send')),
      h('button', { class: 'nudge-btn', onclick: () => send(nudgeText(), 'nudge') }, store.get().house?.type === 'love' ? '💌 Send a "thinking of you"' : '👋 Send a wave')),
      onClose: () => { listEl = null; } });
    setTimeout(() => input.focus(), 50);
  }

  ctx.provide('chat.open', open);
  ctx.provide('chat.send', send);
  ctx.provide('chat.nudge', () => send(nudgeText(), 'nudge'));
  bus.on('live:chat', (e) => receive(e.msg));
  bus.on('house:entered', load);
  ui.addDockButton({ id: 'chat', icon: '💬', label: 'Chat', onClick: open, order: 40 });
  return { unread: () => unread };
}
