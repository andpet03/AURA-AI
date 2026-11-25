// Shared helper: is this file allowed for this area? (owned by the lead)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const cfg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'areas.json'), 'utf8'));
export const AREAS = Object.keys(cfg.areas);

/** "world/better-walk" -> "world"; anything else -> null */
export function areaFromBranch(branch = '') {
  const prefix = branch.split('/')[0];
  return AREAS.includes(prefix) ? prefix : null;
}

/** true if `file` (repo-relative, forward slashes) may be changed by `area` */
export function allowed(area, file) {
  const paths = [...(cfg.areas[area] || []), ...cfg.shared];
  return paths.some((p) => p === '*' || file === p || (p.endsWith('/') && file.startsWith(p)));
}

export function allowedList(area) { return [...(cfg.areas[area] || []), ...cfg.shared]; }
