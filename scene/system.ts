import * as THREE from 'three';
import { createCharacter } from './character';
import { createWorkflow, MODULE_COUNT } from './workflow';

export interface SystemScene {
  setState(index: number): void;
  pause(paused: boolean): void;
  dispose(): void;
}

export function createScene(canvas: HTMLCanvasElement): SystemScene {
  const signal = (name: 'scene-ready' | 'scene-error') => canvas.dispatchEvent(new CustomEvent(name, { bubbles: true }));
  let renderer: THREE.WebGLRenderer;
  try {
    // Keep the last rendered frame visible while the on-demand scene is idle.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  } catch (error) {
    canvas.hidden = true;
    signal('scene-error');
    throw error;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  const assembly = new THREE.Group();
  scene.add(assembly);
  const character = createCharacter();
  assembly.add(character);
  const workflow = createWorkflow();
  assembly.add(workflow.group);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.65, 0.2, 48),
    new THREE.MeshStandardMaterial({ color: 0x596674, metalness: 0.82, roughness: 0.4 }),
  );
  platform.position.y = -0.12;
  assembly.add(platform);
  const inset = new THREE.Mesh(
    new THREE.CylinderGeometry(1.46, 1.46, 0.025, 48),
    new THREE.MeshStandardMaterial({ color: 0x0d1623, metalness: 0.4, roughness: 0.45 }),
  );
  inset.position.y = -0.007;
  assembly.add(inset);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.51, 0.016, 6, 64),
    new THREE.MeshBasicMaterial({ color: 0x6c99ce }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.02;
  assembly.add(rim);
  scene.add(new THREE.HemisphereLight(0xdce8ff, 0x1e2535, 2.5));
  const key = new THREE.DirectionalLight(0xfff2d0, 4.5);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const edge = new THREE.DirectionalLight(0x7daeff, 3);
  edge.position.set(4, 3, -3);
  scene.add(edge);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const stage = canvas.closest('#system-stage') ?? canvas;
  let disposed = false;
  let paused = false;
  let visible = true;
  let lost = false;
  let frame = 0;
  let selection = 0;
  let progress = 1;
  let lastTime = 0;
  let targetX = 0;
  let targetY = 0;
  let qualityCap = 1.5;
  let slowFrames = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  };
  const canRender = () => !disposed && !lost && visible && !document.hidden;
  const request = () => {
    if (!frame && canRender()) frame = requestAnimationFrame(draw);
  };
  const resize = () => {
    if (disposed || lost) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, qualityCap, window.innerWidth < 900 ? 1 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const distance = Math.max(9, 12 / camera.aspect);
    camera.position.set(0, 3.2, distance);
    camera.lookAt(0, 1, 0);
    camera.updateProjectionMatrix();
    request();
  };

  function draw(time: number) {
    frame = 0;
    if (!canRender()) return;
    const instant = reduced.matches || paused;
    if (!instant && lastTime && time - lastTime > 34) slowFrames++;
    if (slowFrames >= 8 && qualityCap > 1) {
      qualityCap = 1;
      resize();
    }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = time;
    const ease = instant ? 1 : 1 - Math.exp(-dt * 9);
    assembly.rotation.x += (targetX - assembly.rotation.x) * ease;
    assembly.rotation.y += (targetY - assembly.rotation.y) * ease;
    progress = instant ? 1 : Math.min(1, progress + dt * 2.5);
    workflow.select(selection, progress);
    character.rotation.y = (selection < 3 ? -1 : 1) * progress * 0.035;
    renderer.render(scene, camera);
    if (!instant && (progress < 1 || Math.abs(targetX - assembly.rotation.x) > 0.0003 || Math.abs(targetY - assembly.rotation.y) > 0.0003)) {
      request();
    } else {
      lastTime = 0;
    }
  }

  const pointer = (event: Event) => {
    if (!(event instanceof PointerEvent) || event.pointerType !== 'mouse' || !finePointer.matches || reduced.matches || paused) return;
    const rect = canvas.getBoundingClientRect();
    targetY = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 0.16;
    targetX = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5) * 0.06;
    request();
  };
  const resetPointer = () => {
    targetX = targetY = 0;
    request();
  };
  const visibility = () => {
    if (document.hidden) stop();
    else request();
  };
  const motion = () => {
    resetPointer();
    resize();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    stop();
    canvas.hidden = true;
    signal('scene-error');
  };
  const contextRestored = () => {
    if (disposed) return;
    lost = false;
    canvas.hidden = false;
    resize();
    signal('scene-ready');
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) request();
    else if (!visible) stop();
  });
  observer.observe(stage);
  const resizer = new ResizeObserver(resize);
  resizer.observe(stage);
  stage.addEventListener('pointermove', pointer);
  stage.addEventListener('pointerleave', resetPointer);
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', motion);
  finePointer.addEventListener('change', motion);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  canvas.hidden = false;
  resize();
  signal('scene-ready');

  return {
    setState(index) {
      if (!Number.isInteger(index) || index < 0 || index >= MODULE_COUNT) throw new RangeError('Unknown service module.');
      if (disposed) return;
      selection = index;
      progress = 0;
      request();
    },
    pause(value) {
      if (disposed) return;
      paused = value;
      resetPointer();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      observer.disconnect();
      resizer.disconnect();
      stage.removeEventListener('pointermove', pointer);
      stage.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', motion);
      finePointer.removeEventListener('change', motion);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.hidden = true;
    },
  };
}

export default createScene;
