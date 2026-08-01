import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWheelGesture } from './input.ts';

/**
 * createWheelGesture is the pure debounce pulled out of input.ts's onWheel so
 * it can be driven with hand-picked timestamps instead of real setTimeout
 * delays and a real browser. It takes no DOM or THREE import, so it runs
 * under plain Node like the rest of this directory's tests.
 *
 * The gesture-shaped tests below exist because a flat cooldown timed from the
 * first qualifying wheel event (this file's first attempt) expires mid-burst:
 * trackpad momentum keeps emitting deltaY events above the threshold for well
 * over a second, so a later event in the same physical flick read as a second
 * gesture and skipped an extra room. createWheelGesture tracks silence
 * between events instead of elapsed time since the first one, so a gesture
 * stays "in progress" for as long as the browser keeps delivering events for
 * it, however long that runs.
 */

const THRESHOLD = 32;
const QUIET_MS = 300;

test('a single qualifying wheel event steps forward on positive deltaY', () => {
  const gesture = createWheelGesture(THRESHOLD, QUIET_MS);
  assert.equal(gesture.onEvent(100, 0), 1, 'positive deltaY (scrolling down) steps to the next room');
});

test('a single qualifying wheel event steps back on negative deltaY', () => {
  const gesture = createWheelGesture(THRESHOLD, QUIET_MS);
  assert.equal(gesture.onEvent(-100, 0), -1, 'negative deltaY (scrolling up) steps back toward room 01');
});

test('a wheel event below the threshold never steps', () => {
  const gesture = createWheelGesture(THRESHOLD, QUIET_MS);
  assert.equal(gesture.onEvent(10, 0), null);
  assert.equal(gesture.onEvent(-10, 100), null);
});

test('a burst of qualifying events close together steps only once', () => {
  const gesture = createWheelGesture(THRESHOLD, QUIET_MS);
  // Five events 50ms apart, well inside QUIET_MS: one continuous gesture.
  const steps = [0, 50, 100, 150, 200].map((t) => gesture.onEvent(80, t));
  assert.deepEqual(steps, [1, null, null, null, null], 'only the first event in the burst steps');
});

test('a decaying trackpad tail spanning well over a second still steps only once', () => {
  // Reproduces the shape the bug report described: real trackpad momentum
  // keeps emitting deltaY above the threshold for well over a second after
  // the initial flick, decaying in magnitude but not dropping below the
  // threshold until near the very end. Events fire every 80ms (comfortably
  // inside QUIET_MS) across roughly 1.4 seconds total, far past the old flat
  // 700ms cooldown this replaced.
  const gesture = createWheelGesture(THRESHOLD, QUIET_MS);
  const deltas = [200, 180, 160, 140, 120, 100, 90, 80, 70, 60, 50, 40, 35, 33];
  const steps = deltas.map((delta, i) => gesture.onEvent(delta, i * 80));
  const stepCount = steps.filter((step) => step !== null).length;
  assert.equal(
    stepCount,
    1,
    'one physical gesture must produce exactly one room step, no matter how long its decaying tail runs',
  );
  assert.equal(steps[0], 1, 'the single step must fire on the first qualifying event, not a later one');
});

test('a real pause longer than the quiet window starts a genuinely new gesture', () => {
  const gesture = createWheelGesture(THRESHOLD, QUIET_MS);
  assert.equal(gesture.onEvent(100, 0), 1, 'the first gesture steps');
  assert.equal(gesture.onEvent(100, 100), null, 'still the same gesture, inside the quiet window');
  // Silence longer than QUIET_MS separates two real, separate flicks.
  const secondGestureStart = 100 + QUIET_MS + 1;
  assert.equal(
    gesture.onEvent(100, secondGestureStart),
    1,
    'a new gesture arriving after real silence must be free to step again',
  );
});
