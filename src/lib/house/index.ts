/**
 * The only module src/pages/house.astro imports. Everything three.js hangs off here
 * so the dynamic import boundary stays in one obvious place.
 */
import { columnsFor } from './grid.ts';
import { createScene, type HouseScene } from './scene.ts';

let active: HouseScene | null = null;

export function mountHouseScene(stage: HTMLElement): void {
  if (active) return;

  const columns = columnsFor(window.innerWidth);
  active = createScene(stage, columns);
  stage.dataset.houseState = 'scene';

  let frame = 0;
  const tick = () => {
    frame = requestAnimationFrame(tick);
    active?.renderer.render(active.scene, active.camera);
  };
  tick();

  // Named so the same reference can be removed in teardown. An anonymous listener
  // here would outlive every scene it was built for, and the camera-rig task is
  // what will actually exercise a second mount and surface the leak.
  const onResize = () => active?.resize();
  window.addEventListener('resize', onResize);

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
    active?.dispose();
    active = null;
  }, { once: true });
}
