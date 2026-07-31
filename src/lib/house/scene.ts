/**
 * Greybox house. Boxes for rooms, boxes for props, no materials worth the name.
 *
 * The point of Phase 0 is to find out whether moving around this is enjoyable before
 * any art exists. If it is boring in grey, no amount of Blender fixes it.
 */
import * as THREE from 'three';

import { rooms } from '~/data/house';
import { CELL_HEIGHT, CELL_WIDTH, centeredPositionFor, layout } from './grid.ts';

export interface HouseScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly roomMeshes: Map<number, THREE.Mesh>;
  rebuild(columns: number): void;
  resize(): void;
  dispose(): void;
}

const ROOM_DEPTH = 6;
const WALL = 0.3;

export function createScene(container: HTMLElement, columns: number): HouseScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0c10);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Ambient raised from 0.6 to 1.2 so the shell and floor read against the
  // background instead of blending into it. The four hex colours stay as they are;
  // the background is unlit, so brightening the geometry is what raises figure-
  // ground contrast without touching the deliberate palette.
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 8, 10);
  scene.add(key);

  const roomMeshes = new Map<number, THREE.Mesh>();
  const group = new THREE.Group();
  scene.add(group);

  let columnsNow = columns;

  const shellMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2740 });
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x1b1828 });
  const propMaterial = new THREE.MeshLambertMaterial({ color: 0x564a75 });

  // The invisible per-room click-target material and every BoxGeometry are created
  // fresh on each build() call, so clear() must dispose them or they leak GPU memory
  // on every rebuild. The three shell/floor/prop materials are shared across all six
  // rooms and reused on every rebuild, so they are excluded here and disposed once,
  // in dispose(), when the scene is actually going away.
  function disposeMesh(mesh: THREE.Mesh) {
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (material !== shellMaterial && material !== floorMaterial && material !== propMaterial) {
        material.dispose();
      }
    }
  }

  function clear() {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) disposeMesh(child);
    });
    group.clear();
    roomMeshes.clear();
  }

  function build(cols: number) {
    clear();
    columnsNow = cols;

    for (const { room, cell } of layout(rooms, cols)) {
      // Centred here, so nothing downstream re-derives which way is "later".
      const { x, y } = centeredPositionFor(cell, cols, rooms.length);

      // The room volume. Invisible, and used only as the click target and the
      // anchor the camera pushes toward.
      const volume = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_WIDTH - WALL, CELL_HEIGHT - WALL, ROOM_DEPTH),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      volume.position.set(x, y, 0);
      volume.userData.roomIndex = room.index;
      group.add(volume);
      roomMeshes.set(room.index, volume);

      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_WIDTH, WALL, ROOM_DEPTH),
        floorMaterial,
      );
      floor.position.set(x, y - CELL_HEIGHT / 2, 0);
      group.add(floor);

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_WIDTH, CELL_HEIGHT, WALL),
        shellMaterial,
      );
      back.position.set(x, y, -ROOM_DEPTH / 2);
      group.add(back);

      // Three grey props per room, so each cell reads as occupied and the camera
      // has something to frame when it pushes in.
      for (let i = 0; i < 3; i += 1) {
        const w = 1 + ((room.index + i) % 3) * 0.6;
        const h = 0.8 + ((room.index * 2 + i) % 3) * 0.7;
        const prop = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4), propMaterial);
        prop.position.set(
          x - CELL_WIDTH / 2 + 1.8 + i * 2.6,
          y - CELL_HEIGHT / 2 + WALL / 2 + h / 2,
          0,
        );
        group.add(prop);
      }
    }

    // centeredPositionFor already places every cell relative to the origin, so the
    // group itself stays at the origin.
    group.position.set(0, 0, 0);
  }

  function resize() {
    const w = container.clientWidth;
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h, false);

    // Default framing: the whole house, with padding. The camera rig in camera.ts
    // takes ownership of the frustum once it exists, but setting a real one here
    // keeps this module independently viewable rather than rendering an empty
    // canvas until the rig lands.
    const rowCount = Math.ceil(rooms.length / columnsNow);
    const halfHeight = (rowCount * CELL_HEIGHT * 1.15) / 2;
    const halfWidth = halfHeight * (w / h);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }

  build(columns);
  resize();

  return {
    scene,
    camera,
    renderer,
    roomMeshes,
    rebuild: build,
    resize,
    dispose() {
      clear();
      shellMaterial.dispose();
      floorMaterial.dispose();
      propMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
