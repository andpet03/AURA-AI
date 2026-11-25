// The shared context every area receives in its init(ctx) function.
//
// ctx.bus      -> events between areas (on / emit)
// ctx.store    -> shared state (me, house, roomId, mode, players)
// ctx.backend  -> data + live sync (demo or Supabase, same API)
// ctx.ui       -> shared UI helpers (panels, toasts, dock buttons, screens)
// ctx.provide / ctx.use -> services: functions one area offers to the others
//
// Rule: areas never import each other's files. If World needs a furniture mesh,
// it calls ctx.use('build.itemMesh'), which the Building area provides.

import { createBus } from './bus.js';
import { createStore } from './store.js';

export function createContext({ backend, ui }) {
  const services = new Map();
  const ctx = {
    bus: createBus(),
    store: createStore(),
    backend,
    ui,
    provide(name, fn) {
      if (services.has(name)) console.warn(`[ctx] service "${name}" provided twice`);
      services.set(name, fn);
    },
    use(name) {
      const fn = services.get(name);
      if (!fn) {
        // Return a safe no-op so a missing service never crashes the game.
        return (...args) => { console.warn(`[ctx] service "${name}" is not available yet`, args); return null; };
      }
      return fn;
    },
    has(name) { return services.has(name); },
  };
  return ctx;
}
