---
title: Game Engine Prototypes
tagline: Gameplay systems, AI and AR/VR built in Unreal and Unity across three years of the games minor.
role: Developer
org: Monash University — Games Development minor
period: Feb 2023 – Nov 2025
order: 2
featured: true
category: game
summary: >-
  A body of prototypes built in Unreal Engine and Unity in C++ and C#, covering core gameplay
  mechanics, AI behaviour systems and AR/VR interaction. These are where I learned to think about
  frame budgets, memory and update loops, which is an instinct that transfers directly to
  everything else I build.
stack:
  - Unreal Engine
  - Unity
  - C++
  - C#
  - AR/VR
  - Game Design
highlights:
  - Gameplay mechanics and AI behaviour systems built from engine primitives
  - AR/VR interaction prototypes targeting headset performance budgets
  - Iterated designs against playtest feedback rather than spec documents
links: []
---

## Why this sits on a software portfolio

Engine work is the most unforgiving programming I have done. A web request that takes 200ms is
fine. A frame that takes 200ms is a broken game. Working inside a 16 millisecond budget teaches you
to care about allocation, cache behaviour and how often your code actually runs, and that habit does
not switch off when I go back to a backend.

It is also a different design loop. There is no correct answer to whether a mechanic feels good, so
you build the smallest playable version, put it in front of people, watch what they do rather than
what they say, and change it. That is the same loop as user acceptance testing, just faster.

## What these prototypes cover

- **Gameplay mechanics** — movement, interaction and state systems written against engine
  primitives in C++ for Unreal and C# for Unity.
- **AI behaviour** — decision making for non-player agents: perception, state transitions and
  navigation, built to stay readable as behaviour grew more complex.
- **AR/VR interaction** — spatial interaction prototypes, where the performance budget is tighter
  again and comfort constraints are a hard requirement rather than a nicety.

<!--
TODO (Leo): this entry is intentionally written as a body of work because the individual
prototypes are not yet public. It gets substantially stronger if you:
  1. Split the best one or two out into their own named entries with a `links:` entry to the repo.
  2. Drop screenshots or a short clip into src/assets/ and set `cover:` in the frontmatter.
  3. Export a Unity prototype to WebGL — a playable build is the single most convincing artifact
     a games portfolio can have.
-->
