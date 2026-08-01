/**
 * The only module src/pages/house.astro imports. Everything three.js hangs off here
 * so the dynamic import boundary stays in one obvious place.
 */
import { cellFor, columnsFor } from './grid.ts';
import { createScene, type HouseScene } from './scene.ts';
import { createCameraRig, type CameraRig } from './camera.ts';
import { createCharacter, type Character } from './character.ts';
import { createInput } from './input.ts';
import { ladderColumnFor, pathBetween } from './path.ts';
import { rooms } from '~/data/house';

let active: HouseScene | null = null;
let rig: CameraRig | null = null;
let kid: Character | null = null;

/**
 * stage.dataset.houseRoom is written as a plain string and only this module
 * writes it, but a parse feeding camera and character placement should still
 * guard its input. Anything missing, non-numeric or out of the room range
 * clamps to room 0 and keeps the character on the grid.
 */
function parseRoomIndex(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value < rooms.length ? value : 0;
}

export function mountHouseScene(stage: HTMLElement): void {
  if (active) return;

  let columns = columnsFor(window.innerWidth);
  active = createScene(stage, columns);
  rig = createCameraRig(active.camera, stage);
  stage.dataset.houseState = 'scene';

  kid = createCharacter(active.scene);
  kid.placeAt({ col: 0, row: 0 }, columns);

  // The one control a phone visitor has for leaving a room. Cover-fit fills the
  // canvas edge to edge once the camera is pushed in, so there is no empty canvas
  // area left to tap and no Escape key to press. house.astro renders this button
  // as static markup, so it lives in the accessibility tree and the tab order
  // from the very first paint. Visibility follows the camera state below.
  const backButton = stage.querySelector<HTMLButtonElement>('[data-house-back]');

  function syncBackButton() {
    if (backButton) backButton.hidden = rig?.state !== 'room';
  }

  // Escape and the back button both end at this one function. One place decides
  // what "leave the room" means, so the two triggers cannot drift apart.
  function goToOverview() {
    rig?.pullOut();
    syncBackButton();
  }

  // The phone shaft opens pushed into room 01. A contain fit on a 1x6 tower would
  // shrink every room to a thin band, which the phone spec rejects outright, so the
  // landing view has to already be inside a room. Desktop keeps opening framed on
  // the whole house. Overview stays reachable from the phone through the back
  // button or Escape.
  if (columns === 1) {
    stage.dataset.houseRoom = '0';
    rig.pushInto({ col: 0, row: 0 }, columns);
  } else {
    rig.frameHouse(columns);
  }
  syncBackButton();
  backButton?.addEventListener('click', goToOverview);

  // A click during a walk redirects rather than being ignored: follow() cancels
  // whatever arrival callback was pending and registers this one, so the capsule
  // turns toward the new room and the camera pushes into wherever it actually
  // lands.
  const input = createInput({
    renderer: active.renderer,
    camera: active.camera,
    roomMeshes: active.roomMeshes,
    onSelect(index) {
      if (!kid || !rig) return;
      const destination = cellFor(index, columns);
      const moves = pathBetween(kid.cell, destination, ladderColumnFor(columns));
      kid.follow(moves, columns, () => {
        rig?.pushInto(destination, columns);
        syncBackButton();
      });
      stage.dataset.houseRoom = String(index);
    },
    onBack: goToOverview,
  });

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
      // The room index is layout-independent; only the cell it maps to changes
      // when the house re-flows. Reading it back from the stage keeps the visitor
      // in the room they were in and restores whichever camera state they had,
      // across the breakpoint. A visitor who pulled out to overview keeps their
      // last room recorded here too, so a resize during overview places the
      // character correctly even though the camera stays framed on the house.
      const currentRoom = parseRoomIndex(stage.dataset.houseRoom);
      columns = next;
      active?.rebuild(columns);
      const cell = cellFor(currentRoom, columns);
      kid?.placeAt(cell, columns);
      if (rig?.state === 'room') rig.pushInto(cell, columns);
      else rig?.frameHouse(columns);
      syncBackButton();
    }
    active?.resize();
  };
  window.addEventListener('resize', onResize);

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
    backButton?.removeEventListener('click', goToOverview);
    input.dispose();
    active?.dispose();
    active = null;
    rig = null;
    kid = null;
  }, { once: true });
}
