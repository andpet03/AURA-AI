// Picks the backend: Supabase when the keys are set, demo (local) otherwise.
// Add ?demo=1 to the URL to force demo mode even when Supabase is configured.

import { createLocalBackend } from './local.js';
import { createSupabaseBackend } from './supabase.js';

export function pickBackend() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const forceDemo = new URLSearchParams(location.search).has('demo');
  if (url && key && !forceDemo) return createSupabaseBackend(url, key);
  return createLocalBackend();
}
