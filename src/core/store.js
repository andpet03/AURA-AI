// Shared state. Read with store.get(), change with store.set({...}),
// react with store.subscribe(fn). Keep it small: only what several areas need.
//
// me       -> the signed-in user { id, username, avatar }
// house    -> the current house (see docs/CONTRACTS.md for the shape)
// role     -> my role in this house: 'owner' | 'housemate' | 'guest'
// roomId   -> the room I'm in
// mode     -> 'play' | 'build'
// players  -> live presence list [{ userId, name, avatar, roomId, x, z }]

export function createStore() {
  let state = { me: null, house: null, role: null, roomId: null, mode: 'play', players: [] };
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      const prev = state;
      state = { ...state, ...patch };
      for (const fn of subs) {
        try { fn(state, prev); } catch (err) { console.error('[store] subscriber failed', err); }
      }
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}

// Helpers used everywhere
export const canEdit = (role) => role === 'owner' || role === 'housemate';
export const currentRoom = (state) => state.house?.rooms?.find((r) => r.id === state.roomId) || state.house?.rooms?.[0] || null;
export const uid = (prefix = '') => prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const today = () => new Date().toISOString().slice(0, 10);
