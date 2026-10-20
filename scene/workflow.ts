import * as THREE from 'three';

export const MODULE_COUNT = 6;

export function createWorkflow(): { group: THREE.Group; select: (index: number, progress: number) => void } {
  const group = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x546273, metalness: 0.78, roughness: 0.36 });
  const face = new THREE.MeshStandardMaterial({ color: 0x101925, metalness: 0.28, roughness: 0.55 });
  const line = new THREE.MeshBasicMaterial({ color: 0x304760 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const addBox = (parent: THREE.Group, material: THREE.Material, size: [number, number, number], position: [number, number, number]) => {
    const mesh = new THREE.Mesh(box, material);
    mesh.scale.set(...size);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  };
  const cards: { group: THREE.Group; accent: THREE.MeshStandardMaterial; route: THREE.MeshBasicMaterial }[] = [];
  for (let index = 0; index < MODULE_COUNT; index++) {
    const side = index < 3 ? -1 : 1;
    const row = index % 3;
    const card = new THREE.Group();
    card.position.set(side * (row === 1 ? 2.85 : 2.5), 2.05 - row * 1.2, -0.65 + row * 0.38);
    card.rotation.y = side * -0.14;
    const accent = new THREE.MeshStandardMaterial({ color: 0x7ca9e5, emissive: 0x3f8eff, emissiveIntensity: 0.15, roughness: 0.45 });
    addBox(card, shell, [1.35, 0.82, 0.15], [0, 0, 0]);
    addBox(card, face, [1.27, 0.74, 0.025], [0, 0, 0.087]);
    addBox(card, accent, [0.15, 0.15, 0.03], [-0.45, 0.2, 0.115]);
    addBox(card, line, [0.58, 0.035, 0.025], [0.05, 0.2, 0.115]);
    for (let bar = 0; bar < 3; bar++) {
      addBox(card, bar === index % 3 ? accent : line, [0.72 - bar * 0.13, 0.045, 0.025], [-0.08 - bar * 0.065, 0.025 - bar * 0.13, 0.115]);
    }
    group.add(card);

    const points = [
      new THREE.Vector3(side * 0.55, 0.15, -0.9),
      new THREE.Vector3(side * 1.2, 0.15, -0.9),
      new THREE.Vector3(side * 1.6, card.position.y, card.position.z),
      new THREE.Vector3(card.position.x - side * 0.68, card.position.y, card.position.z),
    ];
    const route = new THREE.MeshBasicMaterial({ color: 0x304d70, transparent: true, opacity: 0.5 });
    const path = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.015, 5, false), route));
    cards.push({ group: card, accent, route });
  }

  const select = (index: number, progress: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= MODULE_COUNT) throw new RangeError('Unknown service module.');
    cards.forEach((card, cardIndex) => {
      const active = index === cardIndex;
      const amount = active ? progress : 0;
      card.group.scale.setScalar(1 + amount * 0.055);
      card.accent.emissiveIntensity = 0.15 + amount * 0.9;
      card.route.color.set(active ? 0x80b6ff : 0x304d70);
      card.route.opacity = active ? 0.6 + progress * 0.4 : 0.4;
    });
  };
  select(0, 1);
  return { group, select };
}
