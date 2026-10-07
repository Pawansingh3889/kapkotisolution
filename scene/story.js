// The scroll story behind the hero: a low-poly shop that goes from a messy 9 PM to a tidy morning.
// Source for /story.js. Bundle with `pnpm build:story` after editing (three.js is inlined and minified).
// The chapters are plain HTML that scrolls over a sticky canvas, so the text works without this file.
import * as THREE from 'three';

const story = document.querySelector('.scrolly');
const canvas = document.getElementById('scene');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

const C = {
  cream: 0xf5f2e9, lime: 0xd9ed9d, ink: 0x16281f, wood: 0xb8754f, terracotta: 0xe39a6f,
  wall: 0x2f5244, wallSide: 0x294a3d, floor: 0x3c6353, base: 0x1a2e25, rug: 0xd8d2bd,
  honey: 0xe8b96a, mist: 0x9fc3cf, rose: 0xe3aaa0, leaf: 0xb9d98a, alarm: 0xe0604e,
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const outBack = (t) => { const p = clamp01(t) - 1; return 1 + 2.70158 * p * p * p + 1.70158 * p * p; };
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; // same shop every visit

function build() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

  // three flat tones per surface gives the illustrated look
  const ramp = new THREE.DataTexture(new Uint8Array([120, 195, 255]), 3, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: ramp });
  const flat = (color) => new THREE.MeshBasicMaterial({ color });

  // a rounded label drawn on a 2D canvas, shown as a sprite that always faces the camera
  const tile = (text, bg, fg, parent, x, y, z) => {
    const art = document.createElement('canvas');
    art.width = 256; art.height = 80;
    const g = art.getContext('2d');
    g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, 248, 72, 36); g.fill();
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 34;
    do { g.font = `800 ${size}px Inter, system-ui, sans-serif`; size -= 2; } while (g.measureText(text).width > 212);
    g.fillText(text, 128, 42);
    const texture = new THREE.CanvasTexture(art);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.position.set(x, y, z);
    parent.add(sprite);
    return sprite;
  };

  const room = new THREE.Group();
  scene.add(room);
  const add = (geometry, material, x, y, z, parent = room) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = !(material instanceof THREE.MeshBasicMaterial);
    parent.add(mesh);
    return mesh;
  };
  const box = (w, h, d, color, x, y, z, parent) => add(new THREE.BoxGeometry(w, h, d), toon(color), x, y, z, parent);

  // shell: floating floor, two walls, rug
  box(6.9, 0.5, 5.1, C.base, 0, -0.55, 0);
  box(6.6, 0.3, 4.8, C.floor, 0, -0.15, 0);
  box(3.6, 0.02, 2.2, C.rug, -0.7, 0.01, 1.0);
  box(6.6, 3.4, 0.2, C.wall, 0, 1.7, -2.5);
  box(0.2, 3.4, 4.8, C.wallSide, -3.4, 1.7, 0);

  // window: night sky and moon become morning sky and sun
  box(1.5, 1.3, 0.08, C.cream, -1.9, 2.2, -2.38);
  const pane = add(new THREE.BoxGeometry(1.3, 1.1, 0.1), flat(0x0e1a15), -1.9, 2.2, -2.37);
  const orb = add(new THREE.CircleGeometry(0.2, 24), flat(0xdfe3d6), -1.65, 2.4, -2.31);

  // shelves and stock
  for (const y of [0.85, 1.6, 2.35]) box(2.8, 0.08, 0.6, C.wood, 1.6, y, -2.1);
  for (const x of [0.24, 2.96]) box(0.08, 2.5, 0.6, C.wood, x, 1.25, -2.1);
  const stock = [];
  const tags = [];
  [0.85, 1.6, 2.35].forEach((y, row) => {
    for (let j = 0; j < 4; j++) {
      const mesh = box(0.42, 0.38, 0.42, [C.honey, C.mist, C.rose, C.leaf][(j + row) % 4], 0.7 + j * 0.6, y + 0.23, -2.1);
      stock.push({
        mesh, base: mesh.position.clone(), flagged: (j + row * 2) % 3 === 0,
        off: new THREE.Vector3((rand() - 0.5) * 0.22, 0, rand() * 0.3), turn: (rand() - 0.5) * 1.1, tilt: (rand() - 0.5) * 0.3,
      });
    }
    tags.push(add(new THREE.BoxGeometry(0.5, 0.06, 0.02), flat(C.lime), 1.6, y, -1.79));
  });

  // counter, with the tablet and phone on it
  box(2.8, 0.85, 1.0, C.wood, -1.2, 0.425, 0.3);
  box(3.0, 0.08, 1.15, C.cream, -1.2, 0.89, 0.3);
  const tablet = new THREE.Group();
  tablet.position.set(-1.1, 0.93, 0.25);
  tablet.rotation.x = -0.35;
  room.add(tablet);
  box(0.84, 0.58, 0.05, C.ink, 0, 0.3, 0, tablet);
  const screen = add(new THREE.BoxGeometry(0.74, 0.48, 0.052), flat(C.wall), 0, 0.3, 0.003, tablet);
  const phone = new THREE.Group();
  phone.position.set(-0.15, 0.93, 0.5);
  room.add(phone);
  box(0.24, 0.46, 0.04, C.ink, 0, 0.24, 0, phone).rotation.x = -0.25;
  const bubbles = ['payment pending', 'resend the invoice', 'call me back'].map((text, i) => tile(text, '#e0604e', '#fffef9', phone, 0.55, 0.8 + i * 0.3, 0));

  // bills: a neat stack that scatters into the air, then turns into ledgers
  const billSpot = new THREE.Vector3(-2.1, 0.94, 0.3);
  const sheets = [];
  for (let i = 0; i < 18; i++) {
    const mesh = box(0.42, 0.012, 0.56, C.cream, 0, 0, 0);
    sheets.push({
      mesh, neat: new THREE.Vector3(billSpot.x, billSpot.y + i * 0.013, billSpot.z),
      messy: new THREE.Vector3(-2.6 + rand() * 2.2, 1.0 + rand() * 1.5, -0.2 + rand() * 1.3),
      spin: new THREE.Vector3((rand() - 0.5) * 2.4, (rand() - 0.5) * 3, (rand() - 0.5) * 2.4),
    });
  }
  const books = new THREE.Group();
  books.position.copy(billSpot);
  room.add(books);
  [C.leaf, C.terracotta, C.mist].forEach((color, i) => { box(0.5, 0.09, 0.36, color, 0, 0.05 + i * 0.09, 0, books).rotation.y = (i - 1) * 0.18; });

  // lamp, stool, parcels, plant
  add(new THREE.ConeGeometry(0.36, 0.3, 20, 1, true), toon(C.terracotta), -1.2, 2.78, 0.3).material.side = THREE.DoubleSide;
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.6), flat(C.ink), -1.2, 3.2, 0.3);
  add(new THREE.SphereGeometry(0.1, 16, 12), flat(0xffe2b0), -1.2, 2.66, 0.3);
  add(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 20), toon(C.terracotta), -1.2, 0.52, 1.45);
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.5), toon(C.ink), -1.2, 0.25, 1.45);
  box(0.6, 0.5, 0.6, 0xc9a06b, 1.1, 0.25, 0.9).rotation.y = 0.4;
  box(0.45, 0.35, 0.45, 0xd8b987, 1.8, 0.175, 1.35).rotation.y = -0.3;
  add(new THREE.CylinderGeometry(0.24, 0.18, 0.32, 16), toon(C.terracotta), 2.7, 0.16, 1.6);
  [[0, 0.62, 0, 0.3], [-0.16, 0.5, 0.1, 0.22], [0.17, 0.48, -0.08, 0.2]].forEach(([x, y, z, r]) => {
    add(new THREE.IcosahedronGeometry(r, 0), toon(C.leaf), 2.7 + x, y, 1.6 + z).material.flatShading = true;
  });

  // morning: one line joins stock, order, invoice and books
  const stops = [['STOCK', 1.6, 2.95, -1.9], ['ORDER', -0.15, 1.75, 0.5], ['INVOICE', -1.1, 2.3, 0.25], ['BOOKS', -2.1, 1.75, 0.3]];
  const curve = new THREE.CatmullRomCurve3(stops.map(([, x, y, z]) => new THREE.Vector3(x, y - 0.28, z)), false, 'catmullrom', 0.6);
  const SEGMENTS = 140;
  const line = add(new THREE.TubeGeometry(curve, SEGMENTS, 0.03, 8), flat(C.lime), 0, 0, 0);
  const labels = stops.map(([text, x, y, z]) => tile(text, '#d9ed9d', '#16281f', room, x, y, z));
  const dust = new THREE.BufferGeometry();
  dust.setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 180 }, (_, i) => (i % 3 === 1 ? 0.3 + rand() * 3 : (rand() - 0.5) * 6)), 3));
  const sparkles = new THREE.Points(dust, new THREE.PointsMaterial({ color: C.lime, size: 0.05, transparent: true, depthWrite: false }));
  room.add(sparkles);

  // light: cool and dim at night, warm and bright in the morning
  const sky = new THREE.HemisphereLight(0x5b7a9a, 0x1a2e25, 0.6);
  const sun = new THREE.DirectionalLight(0x9fb7cf, 0.5);
  sun.position.set(5, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 24 });
  sun.shadow.bias = -0.0015;
  const lamp = new THREE.PointLight(0xffc98a, 10, 9, 2);
  lamp.position.set(-1.2, 2.55, 0.3);
  const alarm = new THREE.PointLight(C.alarm, 0, 7, 2);
  scene.add(sky, sun, lamp, alarm);
  const NIGHT = { sky: new THREE.Color(0x5b7a9a), sun: new THREE.Color(0x9fb7cf), pane: new THREE.Color(0x0e1a15), orb: new THREE.Color(0xdfe3d6), screen: new THREE.Color(C.wall) };
  const DAY = { sky: new THREE.Color(0xfff1d6), sun: new THREE.Color(0xffe2b0), pane: new THREE.Color(C.mist), orb: new THREE.Color(0xf2c14e), screen: new THREE.Color(C.lime) };

  // one camera stop per chapter (hero, evening, morning); it backs off further on narrow screens
  const KEYS = [
    { pos: [7.5, 5.2, 9], at: [0, 1.2, -0.3], far: 1.45 },
    { pos: [1.4, 3, 8.4], at: [-0.1, 1.5, -0.5], far: 0.82 },
    { pos: [7, 6, 9], at: [-0.2, 1.3, -0.3], far: 1 },
  ].map((key) => ({ ...key, pos: new THREE.Vector3(...key.pos), at: new THREE.Vector3(...key.at) }));
  const eye = (key, aspect) => {
    const back = Math.max(1, Math.min(2.7, 1.35 / aspect));
    return key.pos.clone().sub(key.at).multiplyScalar(back * key.far).add(key.at);
  };

  let p = 0;
  let last = 0;
  let pointer = 0;
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const look = new THREE.Vector3();

  function draw(time) {
    const t = still ? 0 : time / 1000;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio, 2);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
    }
    const aspect = width / height;

    const rect = story.getBoundingClientRect();
    const goal = clamp01(-rect.top / (rect.height - window.innerHeight)) * (KEYS.length - 1);
    const dt = Math.min(0.5, (time - last) / 1000);
    last = time;
    p = still ? goal : p + (goal - p) * (1 - Math.exp(-dt * 5)); // same glide at any frame rate

    // camera: ease between this chapter's stop and the next
    const i = Math.min(KEYS.length - 2, Math.floor(p));
    const f = ss(0, 1, p - i);
    from.copy(eye(KEYS[i], aspect)).lerp(to.copy(eye(KEYS[i + 1], aspect)), f);
    look.copy(KEYS[i].at).lerp(KEYS[i + 1].at, f);
    camera.position.copy(from);
    camera.lookAt(look);
    camera.aspect = aspect;
    // slide the picture clear of the text: down under the hero, then up (phones) or right (wide screens)
    const hero = 1 - ss(0, 0.8, p);
    const shiftX = aspect > 1 ? (1 - hero) * 0.2 : 0;
    const shiftY = hero * (aspect > 1 ? 0.4 : 0.34) - (aspect > 1 ? 0 : (1 - hero) * 0.17);
    camera.setViewOffset(width, height, -shiftX * width, -shiftY * height, width, height);

    const solved = ss(1.3, 1.8, p);
    const day = ss(1.2, 1.8, p);
    const chaos = ss(0.2, 0.9, p) * (1 - solved);
    const mismatch = chaos;
    const buzz = ss(0.4, 1, p) * (1 - solved);
    const joined = ss(1.6, 2, p);

    room.rotation.y = Math.sin(t * 0.3) * 0.035 + pointer * 0.05;

    sheets.forEach(({ mesh, neat, messy, spin }, n) => {
      mesh.position.lerpVectors(neat, messy, chaos);
      mesh.position.y += chaos * Math.sin(t * 1.4 + n) * 0.06;
      mesh.position.lerp(billSpot, solved);
      mesh.rotation.set(spin.x * chaos, spin.y * chaos + n * 0.05, spin.z * chaos);
      mesh.scale.setScalar(Math.max(0.001, 1 - solved));
    });
    books.scale.setScalar(Math.max(0.001, outBack(solved)));

    stock.forEach(({ mesh, base, off, turn, tilt, flagged }, n) => {
      mesh.position.copy(base).addScaledVector(off, mismatch);
      mesh.rotation.set(0, turn * mismatch, tilt * mismatch);
      if (flagged) mesh.material.emissive.setRGB(mismatch * (still ? 0.5 : 0.35 + 0.35 * Math.sin(t * 5 + n)), 0, 0);
    });
    tags.forEach((tag) => tag.scale.setX(Math.max(0.001, solved)));

    phone.rotation.z = buzz * Math.sin(t * 45) * 0.05;
    const grow = (sprite, amount, size = 1) => sprite.scale.set(0.9 * amount * size + 0.001, 0.28 * amount * size + 0.001, 1);
    bubbles.forEach((bubble, n) => grow(bubble, outBack(buzz * 3 - n)));

    screen.material.color.lerpColors(NIGHT.screen, DAY.screen, solved);
    pane.material.color.lerpColors(NIGHT.pane, DAY.pane, day);
    orb.material.color.lerpColors(NIGHT.orb, DAY.orb, day);
    orb.position.y = lerp(2.4, 2.05, day);
    sky.color.lerpColors(NIGHT.sky, DAY.sky, day);
    sky.intensity = lerp(0.6, 1.35, day);
    sun.color.lerpColors(NIGHT.sun, DAY.sun, day);
    sun.intensity = lerp(0.5, 2, day);
    lamp.intensity = lerp(10, 1.5, day);
    alarm.intensity = Math.max(chaos, buzz) * 5;
    alarm.position.copy(look).add(to.set(0, 1.4, 1.6));

    line.geometry.setDrawRange(0, Math.floor(joined * SEGMENTS) * 48);
    labels.forEach((label, n) => {
      const shown = clamp01(joined * 4 - n * 0.9);
      label.material.opacity = shown;
      grow(label, shown, aspect < 1 ? 1.35 : 1); // the last shot sits further back on phones
    });
    sparkles.material.opacity = solved * 0.7;
    sparkles.rotation.y = t * 0.05;

    renderer.render(scene, camera);
    return Math.abs(goal - p) > 0.001;
  }

  // draw only while the story is on screen; with reduced motion, only when the page scrolls
  let visible = false;
  let queued = false;
  const tick = (time) => {
    queued = false;
    const moving = draw(time);
    if (visible && (!still || moving)) request();
  };
  const request = () => { if (!queued) { queued = true; window.requestAnimationFrame(tick); } };
  new window.IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); }).observe(story);
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse') pointer = (event.clientX / window.innerWidth - 0.5) * 2; });
}

try {
  build();
} catch {
  // no WebGL: the CSS backdrop takes over and the chapters still read as a normal page
  story.classList.add('no-webgl');
}
