/**
 * Pointer and keyboard to room selection.
 *
 * Keyboard is not an afterthought here: arrow keys move between rooms, Enter
 * enters, Escape backs out. The same handlers serve mouse, touch and keyboard so
 * every path reaches the house.
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

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        focused = Math.min(rooms.length - 1, focused + 1);
        onSelect(focused);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
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

  return {
    dispose() {
      canvas.removeEventListener('pointerdown', pick);
      window.removeEventListener('keydown', onKey);
    },
  };
}
