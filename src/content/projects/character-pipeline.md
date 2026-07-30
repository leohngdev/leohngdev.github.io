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
  rigging and animation. Realtime rendering was the constraint throughout, which turns topology and
  texture budget into engineering problems rather than aesthetic ones.
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

Making a character look good in a render is one problem. Making it look good while it deforms at 60
frames per second on a polygon budget is a different one, and it sits closer to software work than
most people expect.

Topology is the clearest example. Where you place edges decides whether an elbow creases or collapses
when it bends. You design for a use case you cannot see at build time, spend a limited resource, and
live with the decision months later. Anyone who has picked a database schema early has done the same
thing.

Rigging is interface design. A rig is a tool someone else uses, and a technically correct rig that is
awkward to pose is a bad rig. Naming, control placement and sensible limits matter for the same
reason a clean API surface matters.

## Where it connects

I can talk to designers and artists instead of treating them as a source of tickets. I have stood on
the other side of that handoff, so I know what makes an asset pipeline painful and what a small
change costs.
