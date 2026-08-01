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
  /**
   * True while the house is laid out as the phone's 1x6 tower. Scroll and swipe
   * navigation are the phone substitute for the back button (there is no Escape
   * key and no back button on that layout), so they stay off at desktop widths:
   * a wheel or touch gesture over the canvas there is left to do its ordinary
   * job, including scrolling the page down to the Footer. Read live rather than
   * captured once, since a resize can flip this after createInput has already
   * run.
   */
  isPhone(): boolean;
}

/** Vertical travel, in CSS pixels for a touch swipe or deltaY for a wheel tick,
 * below which a gesture reads as incidental rather than a deliberate scroll. */
const SCROLL_THRESHOLD = 32;

/**
 * Milliseconds a scroll or swipe gesture is ignored right after one has just
 * moved a room. TRANSITION in camera.ts eases a push over 0.65s; this sits a
 * little above that so the lockout always outlasts the camera arriving. That is
 * what keeps one flick worth exactly one room: a real touch swipe reports as one
 * pointerup and a real wheel flick reports as a burst of many small deltaY
 * events, and the lockout swallows every event in that burst after the first.
 */
const SCROLL_COOLDOWN_MS = 700;

export function createInput(options: InputOptions): { dispose(): void; setFocused(index: number): void } {
  const { renderer, camera, roomMeshes, onSelect, onBack, isPhone } = options;
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let focused = 0;
  let scrollLocked = false;
  let touchStartY = 0;
  let trackingTouch = false;

  function pick(event: { clientX: number; clientY: number }) {
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

  // Shared by wheel and touch: the one path either gesture drives, so a swipe
  // and a tap can never produce two different ideas of what "select a room"
  // does. Clamped rather than wrapped, matching the arrow keys below: running
  // past room 06 or room 01 does nothing rather than cycling.
  function stepRoom(direction: 1 | -1) {
    const next = focused + direction;
    if (next < 0 || next > rooms.length - 1) return;
    focused = next;
    onSelect(focused);
  }

  function lockScroll() {
    scrollLocked = true;
    window.setTimeout(() => {
      scrollLocked = false;
    }, SCROLL_COOLDOWN_MS);
  }

  function onPointerDown(event: PointerEvent) {
    // A swipe and a tap both begin as a pointerdown; only the travel between
    // down and up tells them apart, so a touch pointer on the phone layout is
    // tracked rather than picked immediately. Every other pointer (mouse, pen,
    // or touch at desktop widths) keeps the original immediate-tap behaviour.
    if (event.pointerType === 'touch' && isPhone()) {
      touchStartY = event.clientY;
      trackingTouch = true;
      return;
    }
    pick(event);
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'touch' || !isPhone() || !trackingTouch) return;
    trackingTouch = false;
    // Upward finger travel (toward the top of the screen) is the touch
    // equivalent of scrolling a page down to reveal what comes next, so it
    // steps to the next, later room, matching the wheel direction below.
    // Downward travel steps back toward room 01.
    const travel = touchStartY - event.clientY;
    if (Math.abs(travel) < SCROLL_THRESHOLD) {
      pick(event);
      return;
    }
    if (scrollLocked) return;
    stepRoom(travel > 0 ? 1 : -1);
    lockScroll();
  }

  function onWheel(event: WheelEvent) {
    if (!isPhone()) return;
    // Prevented unconditionally once on the phone layout: the stage sits
    // position:fixed there with nothing behind it to scroll, so suppressing
    // the browser's own scroll attempt costs nothing and stops it fighting
    // the room-to-room step below.
    event.preventDefault();
    if (scrollLocked || Math.abs(event.deltaY) < SCROLL_THRESHOLD) return;
    stepRoom(event.deltaY > 0 ? 1 : -1);
    lockScroll();
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

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  canvas.style.cursor = 'pointer';
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'Interactive view of the house where arrow keys and Enter each walk the character into a room and push the camera in. On a phone, scrolling the canvas steps to the next or previous room.',
  );

  return {
    dispose() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    },
    // index.ts calls this after a resize carries a visitor across the phone
    // breakpoint while a room is open, so scroll and arrow-key stepping both
    // resume from the room they are actually looking at rather than whatever
    // room a tap or a previous step last set focused to.
    setFocused(index) {
      focused = index;
    },
  };
}
