import * as THREE from 'three';

export function createCharacter(): THREE.Group {
  const character = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf1d936, roughness: 0.27, metalness: 0.12 });
  const black = new THREE.MeshStandardMaterial({ color: 0x101217, roughness: 0.24 });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blush = new THREE.MeshStandardMaterial({ color: 0xf2a461, roughness: 0.7 });
  const sphere = new THREE.SphereGeometry(1, 20, 12);
  const part = (material: THREE.Material, position: [number, number, number], scale: [number, number, number]) => {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    character.add(mesh);
    return mesh;
  };

  const silhouette = Array.from({ length: 49 }, (_, index) => {
    const t = index / 48;
    return new THREE.Vector2(Math.pow(Math.sin(t * Math.PI), 0.55) * (0.99 - t * 0.34), 0.14 + t * 2.25);
  });
  const body = new THREE.Mesh(new THREE.LatheGeometry(silhouette, 36), yellow);
  character.add(body);

  for (const side of [-1, 1]) {
    part(black, [side * 0.27, 1.65, 0.66], [0.091, 0.108, 0.065]);
    part(white, [side * 0.27 - 0.021, 1.686, 0.716], [0.025, 0.028, 0.013]);
    part(blush, [side * 0.46, 1.39, 0.65], [0.085, 0.085, 0.025]);
    const arm = part(yellow, [side * 0.78, 0.91, 0.05], [0.12, 0.36, 0.14]);
    arm.rotation.z = side * 0.24;
    part(black, [side * 0.32, 0.12, 0.12], [0.24, 0.12, 0.33]);
  }
  const smile = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.18, 1.33, 0.88),
    new THREE.Vector3(0, 1.1, 0.93),
    new THREE.Vector3(0.18, 1.33, 0.88),
  );
  character.add(new THREE.Mesh(new THREE.TubeGeometry(smile, 16, 0.025, 7, false), black));
  return character;
}
