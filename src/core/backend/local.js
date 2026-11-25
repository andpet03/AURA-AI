// DEMO backend: everything lives in this browser (localStorage), and open tabs on the
// same computer see each other live through BroadcastChannel.
// It has EXACTLY the same API as supabase.js, so every feature works in both.
// Open the game in two tabs, sign in as two different users, and you can play together.

import { uid } from '../store.js';

const mem = new Map(); // fallback when localStorage is blocked
const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return mem.has(k) ? mem.get(k) : fallback; }
};
const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { mem.set(k, v); }
};
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return String(h); };
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export function createLocalBackend() {
  const users = () => read('op:users', {});
  const houses = () => read('op:houses', {});

  return {
    mode: 'demo',

    // ---------- accounts ----------
    async getSession() {
      const id = read('op:session', null);
      return id ? users()[id] ? strip(users()[id]) : null : null;
    },
    async signUp(username, password) {
      username = username.trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) throw new Error('Username: 3-20 letters, numbers or _');
      if (password.length < 6) throw new Error('Password needs at least 6 characters');
      const all = users();
      if (Object.values(all).some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new Error('That username is taken');
      const user = { id: uid('u_'), username, pw: hash(password), avatar: null };
      all[user.id] = user; write('op:users', all); write('op:session', user.id);
      return strip(user);
    },
    async signIn(username, password) {
      const user = Object.values(users()).find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (!user || user.pw !== hash(password)) throw new Error('Wrong username or password');
      write('op:session', user.id);
      return strip(user);
    },
    async signOut() { write('op:session', null); },
    async updateProfile(user) {
      const all = users();
      if (all[user.id]) { all[user.id] = { ...all[user.id], avatar: user.avatar }; write('op:users', all); }
      return user;
    },

    // ---------- houses ----------
    async listMyHouses(userId) {
      return Object.values(houses()).filter((h) => h.members?.[userId]);
    },
    async createHouse(draft, me) {
      const house = {
        ...draft,
        id: uid('h_'),
        ownerId: me.id,
        inviteCode: code(),
        guestCode: code(),
        members: { [me.id]: { role: 'owner', name: me.username } },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const all = houses(); all[house.id] = house; write('op:houses', all);
      return house;
    },
    async getHouse(id) { return houses()[id] || null; },
    async saveHouse(house) {
      const all = houses();
      // keep members from storage (they are managed by joinWithCode only)
      all[house.id] = { ...house, members: all[house.id]?.members || house.members, updatedAt: Date.now() };
      write('op:houses', all);
      return all[house.id];
    },
    async joinWithCode(rawCode, me) {
      const c = rawCode.trim().toUpperCase();
      const all = houses();
      const house = Object.values(all).find((h) => h.inviteCode === c || h.guestCode === c);
      if (!house) throw new Error('No house found with that code');
      const role = house.inviteCode === c ? 'housemate' : 'guest';
      const existing = house.members[me.id]?.role;
      if (!existing || (existing === 'guest' && role === 'housemate')) house.members[me.id] = { role, name: me.username };
      write('op:houses', all);
      return { house, role: house.members[me.id].role };
    },

    // ---------- chat ----------
    async listMessages(houseId, limit = 60) { return read(`op:msgs:${houseId}`, []).slice(-limit); },
    async sendMessage(msg) {
      const list = read(`op:msgs:${msg.houseId}`, []);
      const full = { ...msg, id: uid('m_'), at: Date.now() };
      list.push(full); write(`op:msgs:${msg.houseId}`, list.slice(-300));
      return full;
    },

    // ---------- shared activity state (key/value per house) ----------
    async getState(houseId, key) { return read(`op:kv:${houseId}:${key}`, null); },
    async setState(houseId, key, value) { write(`op:kv:${houseId}:${key}`, value); return value; },

    // ---------- points ----------
    async addPoints(houseId, userId, amount, reason) {
      const list = read(`op:pts:${houseId}`, []);
      list.push({ userId, amount, reason, at: Date.now() });
      write(`op:pts:${houseId}`, list.slice(-2000));
    },
    async listPoints(houseId) { return read(`op:pts:${houseId}`, []); },

    // ---------- live (presence + events) ----------
    connect(houseId, me, { onPresence, onEvent }) {
      let ch = null;
      try { ch = new BroadcastChannel(`op-live-${houseId}`); } catch { /* not supported */ }
      const peers = new Map();
      let mine = null;
      const publishPresence = () => onPresence([...peers.values()]);
      const post = (m) => { try { ch?.postMessage(m); } catch {} };
      if (ch) ch.onmessage = ({ data }) => {
        if (!data || data.from === me.id) return;
        if (data.t === 'presence') { peers.set(data.from, { ...data.p, seen: Date.now() }); publishPresence(); }
        else if (data.t === 'leave') { peers.delete(data.from); publishPresence(); }
        else if (data.t === 'hello') { if (mine) post({ t: 'presence', from: me.id, p: mine }); }
        else if (data.t === 'event') onEvent(data.e);
      };
      const beat = setInterval(() => {
        if (mine) post({ t: 'presence', from: me.id, p: mine });
        let changed = false;
        for (const [id, p] of peers) if (Date.now() - p.seen > 7000) { peers.delete(id); changed = true; }
        if (changed) publishPresence();
      }, 2000);
      post({ t: 'hello', from: me.id });
      return {
        updatePresence(p) { mine = { ...p, userId: me.id }; post({ t: 'presence', from: me.id, p: mine }); },
        send(e) { post({ t: 'event', from: me.id, e: { ...e, from: me.id } }); },
        leave() { post({ t: 'leave', from: me.id }); clearInterval(beat); try { ch?.close(); } catch {} },
      };
    },

    // ---------- AI + link previews (need the Supabase functions) ----------
    async generateRoom() { return null; }, // null = use the built-in keyword generator
    async linkPreview() { return null; },
  };
}

function strip(u) { const { pw, ...rest } = u; return rest; }
