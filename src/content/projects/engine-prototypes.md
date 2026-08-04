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
  mechanics, AI behaviour systems and AR/VR interaction. These taught me to think in frame budgets,
  memory and update loops, and that habit follows me into everything else I build.
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

Engine work is the least forgiving programming I have done. A web request that takes 200ms is fine. A
frame that takes 200ms is a broken game. A 16 millisecond budget teaches you to watch allocation,
cache behaviour and how often your code runs, and I keep watching those things when I go back to a
backend.

The design loop differs too. No spec can tell you whether a mechanic feels good, so you build the
smallest playable version, put it in front of people, watch what they do rather than what they say,
and change it. User acceptance testing runs the same loop, slower.

## What these prototypes cover

- **Gameplay mechanics.** Movement, interaction and state systems written against engine primitives
  in C++ for Unreal and C# for Unity.
- **AI behaviour.** Decision making for non-player agents: perception, state transitions and
  navigation, built to stay readable as the behaviour grew.
- **AR/VR interaction.** Spatial interaction prototypes, where the performance budget tightens again
  and comfort is a hard requirement.
