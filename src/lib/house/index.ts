/**
 * The only module src/pages/house.astro imports. Everything three.js hangs off here
 * so the dynamic import boundary stays in one obvious place.
 */
import { columnsFor } from './grid.ts';
import { createScene, type HouseScene } from './scene.ts';
import { createCameraRig, type CameraRig } from './camera.ts';
import { createCharacter, type Character } from './character.ts';

let active: HouseScene | null = null;
let rig: CameraRig | null = null;
let kid: Character | null = null;

export function mountHouseScene(stage: HTMLElement): void {
  if (active) return;

  let columns = columnsFor(window.innerWidth);
  active = createScene(stage, columns);
  rig = createCameraRig(active.camera, stage);
  rig.frameHouse(columns);
  stage.dataset.houseState = 'scene';

  kid = createCharacter(active.scene);
  kid.placeAt({ col: 0, row: 0 }, columns);

  let frame = 0;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    rig?.update(dt);
    kid?.update(dt);
    if (active) active.renderer.render(active.scene, active.camera);
  };
  frame = requestAnimationFrame(tick);

  // Named so the same reference can be removed in teardown. An anonymous listener
  // here would outlive every scene it was built for, and the camera-rig task is
  // what will actually exercise a second mount and surface the leak.
  const onResize = () => {
    const next = columnsFor(window.innerWidth);
    if (next !== columns) {
      columns = next;
      active?.rebuild(columns);
      rig?.frameHouse(columns);
      kid?.placeAt({ col: 0, row: 0 }, columns);
    }
    active?.resize();
  };
  window.addEventListener('resize', onResize);

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
    active?.dispose();
    active = null;
    rig = null;
    kid = null;
  }, { once: true });
}
