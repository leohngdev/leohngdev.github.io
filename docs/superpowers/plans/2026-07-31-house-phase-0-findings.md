# The House, Phase 0: Go/No-Go Findings

**Status: incomplete.** Two measurements only the project owner can take are recorded below as empty, with the exact procedure to take them. Do not read a recommendation into this document until both are filled in.

## What Phase 0 set out to answer

Phase 0 built the house as grey boxes and a capsule, with no art, to answer one question before any art or rigging work starts: is walking around this house enjoyable. A greybox that is fun to explore justifies months of modelling and rigging. A greybox that is not fun is not fixed by better art, so the question has to be answered now, cheaply, before that spend happens.

## Exit criteria

Both of the following must be true to proceed to Phase 1. Either alone is not enough.

1. The phone holds 30 fps after sixty seconds of continuous use.
2. The outside tester wanted to keep clicking.

## Desktop measurements

Taken by the agent with the gstack `browse` binary against a production build served by `npx astro preview`, at a 1280x800 viewport, with the dev toolbar stripped. `/house/?fps` was loaded, the "This site has a soundtrack" card was dismissed, and a room was selected to trigger the walk-then-push-in sequence.

| Measurement | Value |
|---|---|
| Idle fps (overview, house framed, no interaction) | ~56 fps (readings ranged 54-59 across repeated idle samples) |
| Fps during a room selection (walk + camera push-in) | ~55 fps (readings ranged 54-59 across six samples taken every 250ms through the walk and the 0.65s push-in transition) |
| Gzipped JS (house), from the build output | 130.3 KB |

**Caveat, stated plainly because a misleading number here is worse than an absent one:** this headless Chromium ran on virtualized/software-backed GPU acceleration, not the real discrete or integrated GPU a visitor's desktop browser would use. In the course of taking these measurements, the same headless session produced one reading of 23-26 fps on a fresh navigation immediately following a `WebGL: CONTEXT_LOST_WEBGL` warning from the prior page's teardown, a swing of more than 2x with no change to the scene or the code. That instability is evidence the absolute numbers here should not be read as "this is what a visitor's machine will do." They should be read only as "the scene renders, the counter works, and the frame rate did not visibly collapse during a walk-and-push-in on a real build." A real desktop browser, not headless, would be a better source for a number to act on, but the harness for this task specifies gstack `browse` for the desktop step and that is what produced the figures above.

## Bundle size

`JS (house)`: **130.3 KB gzipped**, against the **220 KB** budget in `src/data/budget.ts` (59% of budget, 2 files). Site-wide `JavaScript` (everything outside the house route): 12.6 KB gzipped, against the 15 KB budget, unchanged by this task. Neither budget was raised.

## Real-phone measurement

**Not taken. This section is intentionally empty.** A headless browser at a phone-sized viewport is not a phone: it has no touch latency, no thermal envelope, and no battery, so it cannot answer whether the house holds 30 fps after sixty seconds of real use. This requires a physical device held by a person for the full sixty seconds.

**Procedure for the project owner:**

1. Run `npm run build && npx astro preview --host` so the preview server binds to the local network, not just localhost.
2. Note the network URL astro preview prints (something like `http://192.168.x.x:4321`).
3. On the worst phone available, open `http://<that address>:4321/house/?fps`.
4. Read the fps counter in the top-left corner as soon as the scene appears. Record it below as "at start."
5. Move continuously between rooms for at least sixty seconds without stopping, so the device has time to heat up and thermally throttle.
6. At the sixty-second mark, read the counter again without pausing interaction. Record it below as "after sixty seconds."
7. Note whether tapping and dragging still felt responsive at that point, or whether input started lagging behind the screen.

**Record here:**

- Device name and model: _______________
- Fps at start: _______________
- Fps after sixty seconds of continuous use: _______________
- Did interaction stay responsive throughout: _______________

## Outside-tester judgment

**Not taken. This section is intentionally empty.** This needs a person who is not Leo, who has not been told what the house is or how to use it, exploring it cold. Paraphrasing the answers or filling this in from memory of a hallway conversation defeats the purpose: write down what the tester actually says, in their own words, even if it is blunt or unflattering.

**Procedure for the project owner:**

1. Find someone who has not seen this project and is not Leo.
2. Open `/house/` on a device of their choosing, hand it to them, and say nothing about what it is or how to use it.
3. Let them explore with no hints, for as long as they want.
4. Ask exactly these two questions, in this order, and write down the answers verbatim, word for word:
   - What did you think this was?
   - Did you want to keep clicking?

**Record here:**

- Tester (relationship to project, e.g. "friend, no software background"): _______________
- Verbatim answer to "What did you think this was?": _______________
- Verbatim answer to "Did you want to keep clicking?": _______________

## Recommendation

Choose one once both sections above are filled in. Do not choose before then.

- [ ] **Proceed to Phase 1.** Reasoning: _______________
- [ ] **Stop and reconsider the form.** Reasoning: _______________

If the phone throttles below 30 fps, or the tester's answer to either question reads as bored, confused in a way that reads as unfun rather than intriguing, or unwilling to keep going, that is a legitimate result. Write it down as plainly as a passing result would be written. The point of building this document with the fps harness and these two questions ahead of time was so that outcome has a normal place to land rather than being awkward to record after the fact.

## What Phase 0 already proved

Independent of the two outstanding measurements, the greybox that exists today demonstrates:

- Six rooms that read as six distinct rooms, laid out on a grid and framed by the camera.
- A character that walks along a floor and descends a ladder path between rooms, driven by tested pathfinding rather than eyeballed movement.
- A camera rig that pushes in to fill the frame with a single room and pulls back out to the whole-house overview, eased in both directions.
- Room selection that works by pointer (click or touch) and by keyboard (arrow keys plus Enter), with Escape and a back button as equivalent exits.
- A phone layout that re-flows the 3x2 house into a single-column shaft below the breakpoint, and preserves which room and camera state the visitor was in across that re-flow.
- A text spine that renders the full content of every room as plain HTML, readable and navigable with JavaScript disabled or WebGL unavailable.
- A build-time budget gate that keeps three.js and the house code in one accounted chunk, so no other route on the site pays for it.
