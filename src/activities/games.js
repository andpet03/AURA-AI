// GAMES (owned by Activities). Turn-based like iMessage games: play live together,
// or make a move and your friend plays theirs later. State is saved per table.
//
// Seats: whoever starts takes seat 1; the first OTHER person to move takes seat 2.
// Alone? Use "vs bot" to practise.

// replaceChildren that skips null/false (so conditional children don't print "null")
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
const empty = (n) => Array(n).fill(null);

/** Shared turn-based helper used by Connect Four and Tic-Tac-Toe. */
function turnGame(api, { name, newBoard, render, applyMove, winnerOf, botMove }) {
  const { h, me } = api;
  let st = null;
  const root = h('div', { class: 'game' });
  const fresh = (vsBot = false) => ({ board: newBoard(), players: [me.id, vsBot ? 'bot' : null], turn: 0, winner: null, draw: false, startedAt: Date.now() });

  async function commit(next) {
    st = next; draw();
    await api.save(st);
    if (st.winner || st.draw) {
      const players = st.players.filter((p) => p && p !== 'bot');
      const winnerId = st.winner === 'bot' ? null : st.winner;
      if (players.includes(me.id)) api.result({ game: name, winnerId, players, draw: !!st.draw });
      if (st.winner === me.id) api.toast('🎉 You win!');
    }
  }

  function move(m) {
    if (!st || st.winner || st.draw) return;
    const seat = st.turn;
    const who = st.players[seat];
    if (who === 'bot') return;
    if (who && who !== me.id) return api.toast(`It's ${api.nameOf(who)}'s turn`);
    if (!who) { if (st.players[0] === me.id) return api.toast('Waiting for someone else to make the next move'); st.players[seat] = me.id; }
    const board = applyMove(st.board, m, seat);
    if (!board) return;
    let next = { ...st, board, turn: 1 - seat };
    const w = winnerOf(board);
    if (w != null) next.winner = next.players[w];
    else if (board.every((c) => c != null)) next.draw = true;
    commit(next).then(() => {
      if (next.players[next.turn] === 'bot' && !next.winner && !next.draw) setTimeout(() => {
        const b2 = applyMove(next.board, botMove(next.board), next.turn);
        const n2 = { ...next, board: b2, turn: 1 - next.turn };
        const w2 = winnerOf(b2);
        if (w2 != null) n2.winner = n2.players[w2]; else if (b2.every((c) => c != null)) n2.draw = true;
        commit(n2);
      }, 450);
    });
  }

  function status() {
    if (!st) return '';
    const [a, b] = st.players.map((p) => (p === 'bot' ? '🤖 Bot' : p ? api.nameOf(p) : 'open seat'));
    if (st.winner) return `🏆 ${st.winner === 'bot' ? 'Bot' : api.nameOf(st.winner)} wins!`;
    if (st.draw) return "🤝 It's a draw";
    const t = st.players[st.turn];
    return `${a} vs ${b} · ${t === me.id ? 'Your turn' : t ? `${t === 'bot' ? 'Bot' : api.nameOf(t)}'s turn` : 'Anyone can move next'}`;
  }

  function draw() {
    fill(root, 
      h('div', { class: 'game-status' }, status()),
      st ? render(st, move) : h('p', { class: 'muted' }, 'No game here yet.'),
      h('div', { class: 'row-btns' },
        h('button', { class: 'primary', onclick: () => commit(fresh(false)) }, st ? 'New game' : 'Start game'),
        h('button', { onclick: () => commit(fresh(true)) }, 'Practise vs bot')));
  }

  api.load().then((saved) => { st = saved; draw(); });
  api.onRemote((v) => { st = v; draw(); });
  draw();
  return root;
}

// ---------- Connect Four ----------
const C4W = 7, C4H = 6;
function c4Winner(b) {
  const at = (x, y) => (x >= 0 && x < C4W && y >= 0 && y < C4H ? b[y * C4W + x] : null);
  for (let y = 0; y < C4H; y++) for (let x = 0; x < C4W; x++) {
    const v = at(x, y); if (v == null) continue;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) if ([1, 2, 3].every((k) => at(x + dx * k, y + dy * k) === v)) return v;
  }
  return null;
}
function c4Drop(b, col, seat) {
  for (let y = C4H - 1; y >= 0; y--) if (b[y * C4W + col] == null) { const n = [...b]; n[y * C4W + col] = seat; return n; }
  return null;
}

// ---------- Tic-Tac-Toe ----------
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const tttWinner = (b) => { for (const [a, c, d] of LINES) if (b[a] != null && b[a] === b[c] && b[a] === b[d]) return b[a]; return null; };

// ---------- Draw & Guess ----------
const WORDS = ['cat', 'pizza', 'beach', 'rocket', 'guitar', 'rainbow', 'castle', 'dragon', 'coffee', 'snowman', 'bicycle', 'penguin', 'volcano', 'airplane', 'cactus', 'sushi', 'heart', 'moon', 'tree house', 'umbrella', 'robot', 'whale', 'birthday cake', 'sunflower'];
const enc = (s) => btoa(unescape(encodeURIComponent(s)));
const dec = (s) => { try { return decodeURIComponent(escape(atob(s))); } catch { return ''; } };

function drawGame(api) {
  const { h, me } = api;
  let st = null; // { drawer, word (encoded), image, solvedBy, guesses: [] }
  const root = h('div', { class: 'game' });
  const W = 320, H = 240;
  let canvas, g2, drawing = false, last = null, color = '#222';

  const stroke = (a, b, c) => { g2.strokeStyle = c; g2.lineWidth = c === '#ffffff' ? 16 : 4; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(a[0], a[1]); g2.lineTo(b[0], b[1]); g2.stroke(); };
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };

  function setupCanvas(editable) {
    canvas = h('canvas', { width: W, height: H, class: 'draw-canvas' });
    g2 = canvas.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, W, H);
    if (st?.image) { const img = new Image(); img.onload = () => g2.drawImage(img, 0, 0); img.src = st.image; }
    if (editable) {
      canvas.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pos(e); stroke(last, p, color); api.send('draw', { a: last, b: p, c: color }); last = p; });
      canvas.addEventListener('pointerup', () => { drawing = false; });
    }
    return canvas;
  }
  api.onLive('draw', (e) => { if (g2 && st?.drawer !== me.id) stroke(e.a, e.b, e.c); });

  async function newRound(word) {
    st = { drawer: me.id, word: enc(word), image: null, solvedBy: null, guesses: [], at: Date.now() };
    await api.save(st); render();
  }
  async function finish() {
    st = { ...st, image: canvas.toDataURL('image/jpeg', 0.7) };
    await api.save(st); api.toast('Drawing saved. Friends can guess now or later!'); render();
  }
  async function guess(text) {
    const word = dec(st.word);
    const ok = text.trim().toLowerCase() === word.toLowerCase();
    st = { ...st, guesses: [...st.guesses, { by: me.id, text, ok }].slice(-20), solvedBy: ok ? me.id : st.solvedBy };
    await api.save(st);
    if (ok) { api.toast('🎉 Correct!'); api.result({ game: 'Draw & Guess', winnerId: me.id, players: [me.id, st.drawer] }); }
    else api.toast('Not quite!');
    render();
  }

  function render() {
    if (!st || st.solvedBy) {
      const choices = [...WORDS].sort(() => Math.random() - 0.5).slice(0, 3);
      fill(root, 
        st?.solvedBy ? h('div', { class: 'game-status' }, `✅ ${api.nameOf(st.solvedBy)} guessed "${dec(st.word)}"`) : h('div', { class: 'game-status' }, 'Draw something, everyone else guesses.'),
        st?.image ? h('img', { src: st.image, class: 'draw-canvas' }) : null,
        h('p', {}, 'Pick a word to draw:'),
        h('div', { class: 'row-btns' }, ...choices.map((w) => h('button', { class: 'primary', onclick: () => newRound(w) }, w))));
      return;
    }
    if (st.drawer === me.id) {
      const colors = ['#222', '#e63946', '#2a9d8f', '#457b9d', '#f4a261', '#9b5de5', '#ffffff'];
      fill(root, 
        h('div', { class: 'game-status' }, `Draw: "${dec(st.word)}" (friends watching live see it too)`),
        setupCanvas(true),
        h('div', { class: 'row-btns' }, ...colors.map((c) => h('button', { class: 'swatch-btn', style: { background: c }, title: c === '#ffffff' ? 'eraser' : c, onclick: () => { color = c; } })),
          h('button', { class: 'primary', onclick: finish }, 'Done drawing')),
        st.guesses.length ? h('div', { class: 'muted small' }, 'Guesses: ' + st.guesses.map((g) => `${api.nameOf(g.by)}: ${g.text}`).join(', ')) : null);
      return;
    }
    const input = h('input', { placeholder: 'Your guess…', onkeydown: (e) => { if (e.key === 'Enter') guess(input.value); } });
    fill(root, 
      h('div', { class: 'game-status' }, `${api.nameOf(st.drawer)} is drawing… guess the word!`),
      setupCanvas(false),
      h('div', { class: 'chat-input' }, input, h('button', { class: 'primary', onclick: () => guess(input.value) }, 'Guess')),
      st.guesses.length ? h('div', { class: 'muted small' }, 'Guesses so far: ' + st.guesses.map((g) => g.text).join(', ')) : null);
  }

  api.load().then((v) => { st = v; render(); });
  api.onRemote((v) => { const redraw = !st || v.drawer !== me.id || !st.word || v.word !== st.word || v.solvedBy; st = v; if (redraw) render(); });
  render();
  return root;
}

export const GAMES = {
  connect4: {
    title: 'Connect Four', icon: '🔴',
    open: (api) => turnGame(api, {
      name: 'Connect Four',
      newBoard: () => empty(C4W * C4H),
      applyMove: c4Drop,
      winnerOf: c4Winner,
      botMove: (b) => { const cols = [...Array(C4W).keys()].filter((c) => b[c] == null); for (const c of cols) if (c4Winner(c4Drop(b, c, 1)) === 1) return c; for (const c of cols) if (c4Winner(c4Drop(b, c, 0)) === 0) return c; return cols[Math.floor(Math.random() * cols.length)]; },
      render: (st, move) => api.h('div', { class: 'c4' }, ...st.board.map((v, i) => api.h('button', { class: 'c4-cell', onclick: () => move(i % C4W) }, api.h('i', { class: v === 0 ? 'red' : v === 1 ? 'yellow' : '' })))),
    }),
  },
  tictactoe: {
    title: 'Tic-Tac-Toe', icon: '❌',
    open: (api) => turnGame(api, {
      name: 'Tic-Tac-Toe',
      newBoard: () => empty(9),
      applyMove: (b, i, seat) => (b[i] == null ? Object.assign([...b], { [i]: seat }) : null),
      winnerOf: tttWinner,
      botMove: (b) => { const free = b.map((v, i) => (v == null ? i : -1)).filter((i) => i >= 0); for (const s of [1, 0]) for (const i of free) if (tttWinner(Object.assign([...b], { [i]: s })) === s) return i; return free.includes(4) ? 4 : free[Math.floor(Math.random() * free.length)]; },
      render: (st, move) => api.h('div', { class: 'ttt' }, ...st.board.map((v, i) => api.h('button', { class: 'ttt-cell', onclick: () => move(i) }, v === 0 ? '❌' : v === 1 ? '⭕' : ''))),
    }),
  },
  draw: { title: 'Draw & Guess', icon: '🎨', open: drawGame },
  games: {
    title: 'Games', icon: '🎲',
    open: (api) => {
      const { h } = api;
      const list = [['connect4', '🔴 Connect Four', 'Drop discs, get four in a row'], ['tictactoe', '❌ Tic-Tac-Toe', 'Quick classic'], ['draw', '🎨 Draw & Guess', 'One draws, everyone guesses']];
      return h('div', { class: 'list' }, ...list.map(([id, t, d]) => h('button', { class: 'row-main', onclick: () => api.open(id, { key: `${api.room?.id || 'house'}:hub:${id}` }) }, h('b', {}, t), h('small', {}, d))),
        h('p', { class: 'muted small' }, 'More games coming: Battleship, word hunt, pool…'));
    },
  },
  leaderboard: { title: 'Scores', icon: '🏆', open: (api) => { api.ctx.use('points.open')(); return null; } },
};
