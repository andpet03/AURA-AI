// WORLD AREA - entry point. Owner: World.
// The 3D scene: room rendering, camera, my avatar, other players, tapping and walking.
// Furniture meshes come from the Building area through ctx.use('build.itemMesh').

import * as THREE from 'three';
import { buildAvatar, animateAvatar, nameTag, randomAppearance } from './avatar.js';
import { initWardrobe } from './wardrobe.js';
import { currentRoom } from '../core/store.js';

export function initWorld(ctx) {
  const { bus, store, ui } = ctx;

  // ---------- renderer + scene ----------
  const host = document.getElementById('world');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#cfe8ff');
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9a48a', 1.4));
  const sun = new THREE.DirectionalLight('#fff3df', 1.6);
  sun.position.set(6, 12, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  scene.add(sun);

  function resize() {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------- room ----------
  let roomGroup = null; let roomRef = null; let floorMesh = null; let grid = null;
  const itemMeshes = []; // for tapping
  let bounds = { w: 8, d: 8 };

  const cellToWorld = (x, z, sw = 1, sd = 1) => new THREE.Vector3(x + sw / 2 - bounds.w / 2, 0, z + sd / 2 - bounds.d / 2);
  const worldToCell = (p) => ({ x: Math.floor(p.x + bounds.w / 2), z: Math.floor(p.z + bounds.d / 2) });

  function buildRoom(room) {
    if (roomGroup) scene.remove(roomGroup);
    itemMeshes.length = 0;
    roomGroup = new THREE.Group(); roomRef = room;
    const [w, d] = room.size; bounds = { w, d };
    const t = room.theme;
    scene.background = new THREE.Color(t.wall).lerp(new THREE.Color('#9fc9ff'), 0.55);
    // floor: checker tiles
    const cv = document.createElement('canvas'); cv.width = w * 32; cv.height = d * 32;
    const g = cv.getContext('2d');
    const c1 = new THREE.Color(t.floor), c2 = c1.clone().offsetHSL(0, 0, -0.04);
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { g.fillStyle = '#' + ((i + j) % 2 ? c1 : c2).getHexString(); g.fillRect(i * 32, j * 32, 32, 32); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
    floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), [null, null, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), null, null, null].map((x) => x || new THREE.MeshStandardMaterial({ color: c2 })));
    floorMesh.position.y = -0.1; floorMesh.receiveShadow = true; roomGroup.add(floorMesh);
    // two cut-away walls (back and left), like The Sims
    const wallMat = new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.95 });
    const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wall).offsetHSL(0, 0, -0.18) });
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 2.6, 0.2), wallMat); back.position.set(0, 1.3, -d / 2 - 0.1); back.receiveShadow = true;
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, d), wallMat); left.position.set(-w / 2 - 0.1, 1.3, 0); left.receiveShadow = true;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.22, 0.18, 0.24), trim); b1.position.set(0, 0.09, -d / 2 - 0.1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, d), trim); b2.position.set(-w / 2 - 0.1, 0.09, 0);
    roomGroup.add(back, left, b1, b2);
    // items
    for (const item of room.items) {
      const mesh = ctx.use('build.itemMesh')(item, t);
      if (!mesh) continue;
      const [sw, sd] = ctx.use('build.footprint')(item) || [1, 1];
      mesh.position.copy(cellToWorld(item.x, item.z, sw, sd));
      mesh.rotation.y = -item.rot * Math.PI / 2;
      mesh.traverse((o) => { o.userData.itemId = item.id; });
      roomGroup.add(mesh); itemMeshes.push(mesh);
    }
    grid = new THREE.GridHelper(Math.max(w, d), Math.max(w, d), '#ffffff', '#ffffff');
    grid.material.opacity = 0.35; grid.material.transparent = true; grid.position.y = 0.01;
    grid.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    grid.visible = store.get().mode === 'build';
    roomGroup.add(grid);
    scene.add(roomGroup);
    syncRemotes();
  }

  // ---------- my avatar ----------
  const me = { holder: new THREE.Group(), av: null, target: null, pos: new THREE.Vector3(0, 0, 2), moving: false, keys: new Set() };
  scene.add(me.holder);
  function rebuildMyAvatar() {
    const s = store.get();
    if (me.av) me.holder.clear();
    me.av = buildAvatar(s.me?.avatar || randomAppearance());
    me.holder.add(me.av, nameTag(s.me?.username || 'me', '#ffe08a'));
  }
  function spawn() {
    me.pos.set((Math.random() - 0.5) * Math.min(4, bounds.w - 2), 0, bounds.d / 2 - 1 - Math.random());
    me.target = null;
    me.holder.position.copy(me.pos);
    sendPresence(true);
  }

  // ---------- other players ----------
  const remotes = new Map(); // userId -> { holder, av, pos, target, avatarKey }
  function syncRemotes() {
    const s = store.get();
    const here = s.players.filter((p) => p.roomId === s.roomId);
    const ids = new Set(here.map((p) => p.userId));
    for (const [id, r] of remotes) if (!ids.has(id)) { scene.remove(r.holder); remotes.delete(id); }
    for (const p of here) {
      let r = remotes.get(p.userId);
      const key = JSON.stringify(p.avatar || {}) + p.name;
      if (!r || r.key !== key) {
        if (r) scene.remove(r.holder);
        const holder = new THREE.Group();
        const av = buildAvatar(p.avatar || randomAppearance());
        holder.add(av, nameTag(p.name || 'friend'));
        holder.position.set(p.x ?? 0, 0, p.z ?? 0);
        scene.add(holder);
        r = { holder, av, key, target: new THREE.Vector3(p.x ?? 0, 0, p.z ?? 0), bubble: null };
        remotes.set(p.userId, r);
      }
      r.target.set(p.x ?? 0, 0, p.z ?? 0);
    }
  }

  // speech bubbles from chat
  function bubble(holder, text) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d'); g.font = '34px system-ui, sans-serif';
    const msg = text.length > 32 ? text.slice(0, 30) + '…' : text;
    const w = Math.min(500, g.measureText(msg).width + 44);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect((512 - w) / 2, 10, w, 80, 30); g.fill();
    g.beginPath(); g.moveTo(246, 88); g.lineTo(266, 88); g.lineTo(256, 112); g.fill();
    g.fillStyle = '#222'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(msg, 256, 50);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(2.6, 0.65, 1); sp.position.y = 3.1; sp.renderOrder = 11;
    holder.add(sp); setTimeout(() => holder.remove(sp), 4500);
  }
  bus.on('chat:message', (m) => {
    if (m.kind === 'system') return;
    const s = store.get();
    if (m.userId === s.me?.id) bubble(me.holder, m.text);
    else { const r = remotes.get(m.userId); if (r) bubble(r.holder, m.text); }
  });

  // ---------- presence ----------
  let lastSent = 0;
  function sendPresence(force) {
    const now = performance.now();
    if (!force && now - lastSent < 120) return;
    lastSent = now;
    const s = store.get();
    if (!s.me || !s.house) return;
    ctx.use('live.presence')({ roomId: s.roomId, x: +me.pos.x.toFixed(2), z: +me.pos.z.toFixed(2), name: s.me.username, avatar: s.me.avatar });
  }

  // ---------- input: tap / click ----------
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) { down = null; return; }
    down = null;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const room = currentRoom(store.get());
    if (!room) return;
    const hitItem = ray.intersectObjects(itemMeshes, true)[0];
    if (hitItem) {
      const item = room.items.find((i) => i.id === hitItem.object.userData.itemId);
      const cell = worldToCell(hitItem.point);
      bus.emit('world:tap', { target: 'item', item, cell, room });
      if (store.get().mode === 'play' && item) {
        walkTo(hitItem.point.clone().setY(0), 1.0);
        bus.emit('item:activate', { item, room });
      }
      return;
    }
    const hitFloor = floorMesh && ray.intersectObject(floorMesh)[0];
    if (hitFloor) {
      const cell = worldToCell(hitFloor.point);
      bus.emit('world:tap', { target: 'floor', cell, room });
      if (store.get().mode === 'play') walkTo(hitFloor.point.clone().setY(0));
    }
  });
  function walkTo(p, stopShort = 0) {
    const dir = p.clone().sub(me.pos);
    if (stopShort && dir.length() > stopShort) p = me.pos.clone().add(dir.setLength(dir.length() - stopShort));
    me.target = clampToRoom(p);
  }
  const clampToRoom = (p) => { p.x = Math.max(-bounds.w / 2 + 0.3, Math.min(bounds.w / 2 - 0.3, p.x)); p.z = Math.max(-bounds.d / 2 + 0.3, Math.min(bounds.d / 2 - 0.3, p.z)); return p; };

  // keyboard (desktop): WASD / arrows
  addEventListener('keydown', (e) => { if (e.target.closest?.('input,textarea,select')) return; me.keys.add(e.key.toLowerCase()); });
  addEventListener('keyup', (e) => me.keys.delete(e.key.toLowerCase()));

  // zoom: wheel + pinch
  let zoom = 1;
  renderer.domElement.addEventListener('wheel', (e) => { zoom = Math.max(0.55, Math.min(1.6, zoom + e.deltaY * 0.001)); e.preventDefault(); }, { passive: false });
  const touches = new Map(); let pinch0 = null;
  renderer.domElement.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) touches.set(t.identifier, t); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch0 = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoom }; } }, { passive: true });
  renderer.domElement.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) touches.set(t.identifier, t); if (pinch0 && touches.size === 2) { const [a, b] = [...touches.values()]; zoom = Math.max(0.55, Math.min(1.6, pinch0.z * pinch0.d / Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY))); } }, { passive: true });
  renderer.domElement.addEventListener('touchend', (e) => { for (const t of e.changedTouches) touches.delete(t.identifier); if (touches.size < 2) pinch0 = null; }, { passive: true });

  // ---------- loop ----------
  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3();
  const SPEED = 3.2;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    // keyboard movement (camera looks from +x,+z, so "up" is toward -x-z)
    const k = me.keys; const kv = new THREE.Vector3(
      (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0), 0,
      (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0));
    let moving = false;
    if (kv.lengthSq() && !ui.isPanelOpen()) {
      kv.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(0.62, 0.78));
      me.pos.addScaledVector(kv, SPEED * dt); clampToRoom(me.pos); me.target = null; moving = true;
      me.holder.rotation.y = Math.atan2(kv.x, kv.z);
    } else if (me.target) {
      const d = me.target.clone().sub(me.pos);
      if (d.length() < 0.05) me.target = null;
      else { const step = Math.min(d.length(), SPEED * dt); me.pos.addScaledVector(d.normalize(), step); moving = true; me.holder.rotation.y = Math.atan2(d.x, d.z); }
    }
    me.holder.position.copy(me.pos);
    if (me.av) animateAvatar(me.av, dt, moving);
    if (moving) sendPresence();
    else if (me.wasMoving) sendPresence(true);
    me.wasMoving = moving;

    for (const r of remotes.values()) {
      const d = r.target.clone().sub(r.holder.position);
      const mv = d.length() > 0.03;
      if (mv) { r.holder.position.lerp(r.target, Math.min(1, dt * 8)); r.holder.rotation.y = Math.atan2(d.x, d.z); }
      animateAvatar(r.av, dt, mv);
    }

    // camera follows me, Sims-style angle
    camTarget.lerp(new THREE.Vector3(me.pos.x * 0.6, 0.6, me.pos.z * 0.6), Math.min(1, dt * 4));
    const dist = Math.max(bounds.w, bounds.d) * 1.25 * zoom * (camera.aspect < 0.8 ? 1.45 : 1);
    camera.position.set(camTarget.x + dist * 0.62, camTarget.y + dist * 0.85, camTarget.z + dist * 0.78);
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
  });

  // ---------- react to state ----------
  store.subscribe((s, prev) => {
    if (s.me !== prev.me && (s.me?.avatar !== prev.me?.avatar || s.me?.username !== prev.me?.username)) { rebuildMyAvatar(); sendPresence(true); }
    const room = currentRoom(s);
    if (room && (room !== roomRef)) {
      const changedRoom = !roomRef || room.id !== roomRef.id;
      buildRoom(room);
      if (changedRoom) spawn();
    }
    if (!room && roomGroup) { scene.remove(roomGroup); roomGroup = null; roomRef = null; }
    if (s.players !== prev.players) syncRemotes();
    if (grid && s.mode !== prev.mode) grid.visible = s.mode === 'build';
  });

  bus.on('room:goto', ({ roomId }) => { store.set({ roomId }); });
  rebuildMyAvatar();

  initWardrobe(ctx);
}
