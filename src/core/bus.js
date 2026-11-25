// Tiny event bus. Areas talk to each other ONLY through this bus and through
// services (see context.js). Event names and payloads are listed in docs/CONTRACTS.md.

export function createBus() {
  const handlers = new Map();
  return {
    on(name, fn) {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name).add(fn);
      return () => handlers.get(name)?.delete(fn);
    },
    emit(name, payload) {
      for (const fn of handlers.get(name) || []) {
        try { fn(payload); } catch (err) { console.error(`[bus] handler for "${name}" failed`, err); }
      }
    },
  };
}
