// HOUSE TYPES, VIBES and STARTER ROOMS (owned by Building).
// Onboarding (Social) asks "who is this house for?" and "which vibe?", then calls
// the service 'build.makeHouse' which uses this file.

import { uid } from '../core/store.js';
import { CATALOG_BY_ID } from './catalog.js';

export const VIBES = {
  cozy:    { label: 'Cozy cabin',  floor: '#c8a27a', wall: '#f3e6d3', accent: '#c4553a', wood: '#8b5e3c' },
  pastel:  { label: 'Pastel dream', floor: '#f1d9e6', wall: '#fff4fa', accent: '#b48ead', wood: '#e3b5a4' },
  modern:  { label: 'Modern loft',  floor: '#bfc5cc', wall: '#f5f7fa', accent: '#2a9d8f', wood: '#6c757d' },
  retro:   { label: 'Retro 70s',    floor: '#d9a441', wall: '#f7e1b5', accent: '#d1495b', wood: '#7a4a24' },
  nature:  { label: 'Green garden', floor: '#a7c4a0', wall: '#eef5e9', accent: '#5b8e55', wood: '#7b5e3b' },
  night:   { label: 'Neon night',   floor: '#3a3355', wall: '#24203a', accent: '#ff4fd8', wood: '#5a4f8a' },
};

export const HOUSE_TYPES = {
  love:    { label: 'Love Nest',    emoji: '💞', blurb: 'For couples, long-distance or not' },
  friends: { label: 'Friends Crib', emoji: '🛋️', blurb: 'For your squad and group chats' },
  family:  { label: 'Family Home',  emoji: '🏡', blurb: 'For parents, siblings, cousins' },
  solo:    { label: 'Solo Studio',  emoji: '🎨', blurb: 'Start alone, invite people later' },
};

// Starter rooms. Each room is a list of catalog ids, laid out automatically.
const ENTRANCE = { name: 'Entrance', items: ['welcome_sign', 'noticeboard', 'mailbox', 'rug', 'plant', 'lamp', 'armchair'] };
const GAME_ROOM = { name: 'Game Room', items: ['arcade', 'connect4_table', 'tictactoe_table', 'easel', 'trophy', 'beanbag', 'beanbag', 'pool_table'] };

const STARTERS = {
  love: [
    ENTRANCE, GAME_ROOM,
    { name: 'Date Night', items: ['tv', 'sofa', 'rug', 'coffee_table', 'candles', 'heart_balloon', 'lamp', 'fireplace'] },
    { name: 'Memory Room', items: ['photo_frame', 'photo_frame', 'calendar_board', 'link_board', 'armchair', 'plant', 'heart_balloon'] },
    { name: 'Dream Room', items: ['gift_box', 'globe', 'weather_window', 'checklist_board', 'bed', 'tall_plant', 'candles'] },
  ],
  friends: [
    ENTRANCE, GAME_ROOM,
    { name: 'Lounge', items: ['tv', 'sofa', 'beanbag', 'beanbag', 'coffee_table', 'jukebox', 'rug', 'lamp'] },
    { name: 'Trip HQ', items: ['globe', 'calendar_board', 'link_board', 'checklist_board', 'table', 'chair', 'chair'] },
    { name: 'Hall of Fame', items: ['trophy', 'photo_frame', 'photo_frame', 'big_button', 'bench', 'tall_plant'] },
  ],
  family: [
    ENTRANCE, GAME_ROOM,
    { name: 'Living Room', items: ['tv', 'sofa', 'armchair', 'photo_frame', 'fireplace', 'rug', 'piano'] },
    { name: 'Kitchen', items: ['fridge', 'counter', 'table', 'chair', 'chair', 'calendar_board', 'plant'] },
    { name: 'Wish Corner', items: ['gift_box', 'gift_box', 'weather_window', 'bench', 'tree'] },
  ],
  solo: [
    ENTRANCE, GAME_ROOM,
    { name: 'Studio', items: ['desk', 'chair', 'photo_frame', 'link_board', 'checklist_board', 'bookshelf', 'tall_plant', 'beanbag'] },
  ],
};

/** Build the first version of a house from the onboarding answers. */
export function makeHouseDraft({ name, type = 'love', vibe = 'cozy', cities = [] }) {
  const starter = STARTERS[type] || STARTERS.solo;
  return {
    name, type, vibe, cities,
    rooms: starter.map((r) => makeRoom({ name: r.name, vibe, kinds: r.items })),
    streak: { count: 0, lastDay: null },
  };
}

/** Make one room and lay its items out on the grid. */
export function makeRoom({ name, vibe = 'cozy', theme = null, kinds = [], size = null }) {
  const n = kinds.length;
  const w = size?.[0] || (n > 7 ? 10 : 8);
  const d = size?.[1] || (n > 7 ? 9 : 8);
  return { id: uid('r_'), name, vibe, theme: theme || { ...VIBES[vibe] || VIBES.cozy }, size: [w, d], items: layoutItems(kinds, w, d) };
}

/** Auto-layout: wall items along the back wall, the rest spread across the floor. */
export function layoutItems(kinds, w, d) {
  const occ = Array.from({ length: d }, () => Array(w).fill(false));
  const fits = (x, z, sw, sd) => {
    if (x < 0 || z < 0 || x + sw > w || z + sd > d) return false;
    for (let i = x; i < x + sw; i++) for (let j = z; j < z + sd; j++) if (occ[j][i]) return false;
    return true;
  };
  const take = (x, z, sw, sd) => { for (let i = x; i < x + sw; i++) for (let j = z; j < z + sd; j++) occ[j][i] = true; };
  const items = [];
  // keep a walkway: the front-centre cells stay free
  const reserved = new Set([`${Math.floor(w / 2)},${d - 1}`, `${Math.floor(w / 2)},${d - 2}`]);
  const ordered = [...kinds].sort((a, b) => (CATALOG_BY_ID[b]?.wall ? 1 : 0) - (CATALOG_BY_ID[a]?.wall ? 1 : 0));
  for (const kind of ordered) {
    const def = CATALOG_BY_ID[kind];
    if (!def) continue;
    const [sw, sd] = def.size;
    const spots = [];
    if (def.wall) { for (let x = 1; x < w - 1; x += 1) spots.push([x, 0]); }
    if (def.floorOnly) spots.push([Math.floor(w / 2) - 1, Math.floor(d / 2) - 1]);
    // spread the rest with a little breathing room
    for (let z = 1; z < d - 1; z += 2) for (let x = 1; x < w - 1; x += 2) spots.push([x, z]);
    for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) spots.push([x, z]);
    const spot = spots.find(([x, z]) => fits(x, z, sw, sd) && !reserved.has(`${x},${z}`));
    if (!spot) continue;
    if (!def.floorOnly) take(spot[0], spot[1], sw, sd);
    items.push({ id: uid('i_'), kind, x: spot[0], z: spot[1], rot: 0 });
  }
  return items;
}
