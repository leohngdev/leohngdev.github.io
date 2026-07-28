---
title: 3D Character Pipeline
tagline: Modelled, textured and rigged characters in Maya and Substance Painter for realtime use.
role: 3D Artist / Technical Artist
org: Monash University — 3D Animation
period: Feb 2023 – Nov 2025
order: 3
featured: true
category: threed
summary: >-
  End to end character work: modelling and topology in Maya, texturing in Substance Painter, then
  rigging and animation. The constraint throughout was realtime rendering, which makes topology and
  texture budget engineering problems rather than aesthetic ones.
stack:
  - Maya
  - Substance Painter
  - Character Rigging
  - Animation
  - Realtime Optimisation
highlights:
  - Optimised topology to hold deformation cleanly at realtime polygon budgets
  - PBR texturing in Substance Painter
  - Rigs built for animators other than me to use
links: []
---

## The engineering in art

Making a character look good in a render is one problem. Making it look good while deforming
correctly at 60 frames per second on a polygon budget is a different one, and it is much closer to
software work than people expect.

Topology is the clearest example. Where you place edges determines whether an elbow creases
correctly or collapses when it bends. You are effectively designing for a use case you cannot fully
see at build time, deciding where to spend a limited resource, and living with those decisions later.
That is a familiar shape of problem.

Rigging is interface design. A rig is a tool another person uses, and a rig that is technically
correct but awkward to pose is a bad rig. Naming, control placement and sensible limits matter for
the same reason a clean API surface matters.

## Where it connects

This is the reason I am comfortable talking to designers and artists rather than treating them as a
source of tickets. Having been on the other side of the handoff, I know what makes an asset pipeline
painful, and I know what a "small change" actually costs.

<!--
TODO (Leo): this is the section that most needs visuals. Even two or three renders would transform
it. Suggested, in order of impact:
  1. A clean turntable render or two of your best character (add to src/assets/, set `cover:`).
  2. A wireframe next to the shaded model — it shows the topology decisions this page describes.
  3. A short clip of the rig being posed.
-->
