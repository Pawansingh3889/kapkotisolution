import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';

async function sceneModule(path) {
  const result = await build({ entryPoints: [path], bundle: true, format: 'cjs', platform: 'node', write: false });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports });
  return module.exports;
}

test('all six workflow states have finite geometry and reject invalid selections', async () => {
  const { createWorkflow, MODULE_COUNT } = await sceneModule('scene/workflow.ts');
  const workflow = createWorkflow();
  assert.equal(MODULE_COUNT, 6);
  for (let index = 0; index < MODULE_COUNT; index++) workflow.select(index, 1);
  assert.throws(() => workflow.select(-1, 1), /Unknown service module/);
  assert.throws(() => workflow.select(6, 1), /Unknown service module/);
  assert.throws(() => workflow.select(0.5, 1), /Unknown service module/);
  let meshes = 0;
  workflow.group.traverse((object) => {
    if (!object.isMesh) return;
    meshes++;
    assert.ok(Array.from(object.geometry.attributes.position.array).every(Number.isFinite));
    assert.ok(object.scale.x > 0);
  });
  assert.ok(meshes > 6);
});

test('character geometry has a finite visible silhouette', async () => {
  const { createCharacter } = await sceneModule('scene/character.ts');
  const character = createCharacter();
  character.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry.computeBoundingSphere();
    assert.ok(Number.isFinite(object.geometry.boundingSphere.radius));
    assert.ok(object.geometry.boundingSphere.radius > 0);
  });
  assert.ok(character.children.length > 1);
});
