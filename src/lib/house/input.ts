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

// Uses a relative path, not the '~' alias: node --test resolves modules with
// plain Node ESM and has no knowledge of the tsconfig path alias Astro/Vite
// honour, and input.test.ts (a value import away from this file) needs a path
// Node can follow on its own, matching the fix already applied in camera.ts.
import { rooms } from '../../data/house.ts';

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
   * job, including scrolling the page down to the Footer. This is read live on
   * every event, not captured once, since a resize can flip it after
   * createInput has already run.
   */
  isPhone(): boolean;
}

/** Vertical travel, in CSS pixels for a touch swipe or deltaY for a wheel tick,
 * below which a gesture reads as incidental noise, not a deliberate scroll. */
const SCROLL_THRESHOLD = 32;

/**
 * Milliseconds a touch swipe is ignored right after one has just moved a room.
 * TRANSITION in camera.ts eases a push over 0.65s; this sits a little above
 * that so the lockout always outlasts the camera arriving. A touch swipe is a
 * single pointerup, so a flat lockout after it fires is enough; the wheel path
 * below needs a different mechanism, see WHEEL_GESTURE_QUIET_MS.
 */
const SWIPE_COOLDOWN_MS = 700;

/**
 * Milliseconds of silence after the last wheel event before a run of them
 * counts as over. A trackpad flick does not report as one event: it reports as
 * a burst whose deltaY decays for well over a second, arriving faster than
 * this file first assumed. A flat cooldown timed from the first qualifying
 * event expires mid-burst, so a later event in the same physical flick (still
 * above SCROLL_THRESHOLD) reads as a second gesture and skips an extra room.
 * Tracking silence instead of elapsed time closes that gap: createWheelGesture
 * below only allows a new step once the gap between two events exceeds this
 * value, so a gesture stays "in progress", however long its tail runs, for as
 * long as the browser keeps delivering events for it.
 */
const WHEEL_GESTURE_QUIET_MS = 300;

/**
 * Turns a stream of wheel events into at most one room-step per physical
 * gesture. Pulled out as a pure function with no DOM or THREE dependency, so a
 * decaying tail of events can be fed to it with hand-picked timestamps and
 * checked with no real browser and no real setTimeout delay; input.test.ts
 * exercises it directly, including a tail that runs past WHEEL_GESTURE_QUIET_MS.
 */
export function createWheelGesture(thresholdPx: number, quietMs: number) {
  let lastEventAt = -Infinity;
  let stepped = false;
  return {
    /**
     * Feed one wheel event's deltaY and timestamp (`performance.now()` in the
     * browser). Returns the room step to take (1 or -1), or null if this event
     * should not move a room: too small to read as deliberate, or arriving
     * inside a gesture that already stepped.
     */
    onEvent(deltaY: number, now: number): 1 | -1 | null {
      if (now - lastEventAt > quietMs) stepped = false;
      lastEventAt = now;
      if (stepped || Math.abs(deltaY) < thresholdPx) return null;
      stepped = true;
      return deltaY > 0 ? 1 : -1;
    },
  };
}

export function createInput(options: InputOptions): { dispose(): void; setFocused(index: number): void } {
  const { renderer, camera, roomMeshes, onSelect, onBack, isPhone } = options;
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let focused = 0;
  let swipeLocked = false;
  let touchStartY = 0;
  let trackingTouch = false;
  const wheelGesture = createWheelGesture(SCROLL_THRESHOLD, WHEEL_GESTURE_QUIET_MS);

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
  // does. Clamped, matching the arrow keys below: running past room 06 or
  // room 01 does nothing, it does not wrap or cycle back around.
  function stepRoom(direction: 1 | -1) {
    const next = focused + direction;
    if (next < 0 || next > rooms.length - 1) return;
    focused = next;
    onSelect(focused);
  }

  function lockSwipe() {
    swipeLocked = true;
    window.setTimeout(() => {
      swipeLocked = false;
    }, SWIPE_COOLDOWN_MS);
  }

  function onPointerDown(event: PointerEvent) {
    // A swipe and a tap both begin as a pointerdown; only the travel between
    // down and up tells them apart, so a touch pointer on the phone layout is
    // tracked here and only picked on release. Every other pointer (mouse,
    // pen, or touch at desktop widths) keeps the original immediate-tap
    // behaviour below.
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
    if (swipeLocked) return;
    stepRoom(travel > 0 ? 1 : -1);
    lockSwipe();
  }

  function onWheel(event: WheelEvent) {
    if (!isPhone()) return;
    // Prevented unconditionally once on the phone layout: the stage sits
    // position:fixed there with nothing behind it to scroll, so suppressing
    // the browser's own scroll attempt costs nothing and stops it fighting
    // the room-to-room step below.
    event.preventDefault();
    const step = wheelGesture.onEvent(event.deltaY, performance.now());
    if (step !== null) stepRoom(step);
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
    // resume from the room they are actually looking at, not whatever room a
    // tap or a previous step last set focused to.
    setFocused(index) {
      focused = index;
    },
  };
}
