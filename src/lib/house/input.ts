/**
 * Pointer and keyboard to room selection.
 *
 * Keyboard is not an afterthought here: arrow keys move between rooms, Enter
 * enters, Escape backs out. The same handlers serve mouse, touch and keyboard so
 * every path reaches the house.
 *
 * The canvas sits next to the accessibility spine (house.astro), which stays in
 * the DOM and the tab order as the no-JS and screen-reader fallback and now holds
 * native details/summary elements per room. onKey binds to window because that is
 * the only way to catch Escape and arrows without demanding the canvas already
 * has focus, but it must not act on keys meant for the spine: it only fires when
 * document.activeElement is the canvas itself. The canvas gets tabIndex 0 and an
 * aria-label so it is a real, named stop in the tab order rather than an
 * unreachable, unlabelled surface a screen reader user has no way to find.
 */
import * as THREE from 'three';

import { rooms } from '~/data/house';

export interface InputOptions {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  roomMeshes: Map<number, THREE.Mesh>;
  onSelect(index: number): void;
  onBack(): void;
}

export function createInput(options: InputOptions): { dispose(): void } {
  const { renderer, camera, roomMeshes, onSelect, onBack } = options;
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let focused = 0;

  function pick(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...roomMeshes.values()], false);
    const first = hits[0]?.object;
    if (!first) return;
    const index = first.userData.roomIndex;
    if (typeof index === 'number') {
      focused = index;
      onSelect(index);
    }
  }

  function onKey(event: KeyboardEvent) {
    // Leave the command palette's own shortcut alone.
    if (event.metaKey || event.ctrlKey) return;

    // The hidden spine shares the page and the tab order. Its own summary and
    // link elements need their native Enter and arrow behaviour, so this handler
    // only acts while the canvas itself holds focus.
    if (document.activeElement !== canvas) return;

    switch (event.key) {
      // Room index rises downward (grid.ts: row 0 is the top floor, later rooms
      // sit below it), so a higher index reads lower on screen. Up steps toward
      // room 01 and Down steps toward room 06 to match; Left and Right stay tied
      // to reading order, where right moves forward the same way Down does.
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focused = Math.min(rooms.length - 1, focused + 1);
        onSelect(focused);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focused = Math.max(0, focused - 1);
        onSelect(focused);
        break;
      case 'Enter':
        event.preventDefault();
        onSelect(focused);
        break;
      case 'Escape':
        event.preventDefault();
        onBack();
        break;
      default:
        break;
    }
  }

  canvas.addEventListener('pointerdown', pick);
  window.addEventListener('keydown', onKey);
  canvas.style.cursor = 'pointer';
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'Interactive view of the house where arrow keys and Enter each walk the character into a room and push the camera in.',
  );

  return {
    dispose() {
      canvas.removeEventListener('pointerdown', pick);
      window.removeEventListener('keydown', onKey);
    },
  };
}
