---
title: Barn — Environment & Audio
tagline: A Unity farm environment with cinematic sequencing and a soundscape built in FMOD.
role: Environment & Audio Designer
org: Monash University — Games Development minor
period: '2025'
order: 4
featured: true
category: game
summary: >-
  A realtime farm environment built in Unity, with opening and closing cinematic sequences authored
  in Timeline, interaction logic assembled as PlayMaker state machines, and a full ambient soundscape
  designed separately in FMOD Studio from around thirty sourced samples. This is level design,
  sequencing and game audio work rather than engine programming.
stack:
  - Unity
  - PlayMaker
  - FMOD Studio
  - Level Design
  - Cinematic Timeline
  - Spatial Audio
highlights:
  - Terrain and modular set dressing composed into a single continuous playable space
  - Opening and closing cinematics sequenced with Unity Timeline
  - Ambient soundscape built as randomised FMOD events rather than looping tracks
links: []
---

## What this is

A farm environment you can walk around, with a cinematic on the way in and another on the way out,
and a soundscape that holds up while you stand still in it. Built in Unity with a modular nature
asset library, terrain sculpting, and PlayMaker for the interaction logic.

I want to be precise about which craft this demonstrates, because it is not the same one as the rest
of this site. This is spatial and audio design work — deciding where things go, how a space reads
when you move through it, and what it sounds like — rather than systems programming.

## Composing a space

Set dressing with a purchased asset library sounds like the easy version of environment art, and in
one sense it is: you are not modelling the fence posts. What it does not remove is the actual
problem, which is composition. A modular library gives you a few dozen pieces and the job is making
them read as one coherent place rather than a field with objects scattered on it.

That is mostly about sightlines and density. Where does the eye go when the player rounds the barn.
What is visible from the spawn point, and does it suggest where to walk without a marker telling you
to. Which areas earn detail because people will stand in them, and which are background that only
needs to hold up at distance. Terrain sculpting does a lot of this quietly — a rise in the ground
hides a boundary far more naturally than a fence does.

The cinematics were the other half. An opening and closing sequence authored in Unity's Timeline,
which is camera work and pacing more than anything technical: how long to hold a shot before it
becomes dead air, and when a cut does more than a move.

## The soundscape

The audio was built as its own FMOD Studio project rather than dropped in as clips, and it is the
part I would point at first.

A farm ambience made of looping tracks falls apart in about forty seconds — the ear finds the loop
point and then cannot stop hearing it. So the environment is built from around thirty sourced
samples organised into randomised events instead: birds, wind, sheep, pigs, creaking timber, and
footstep variations that change with the surface underfoot, grass against wood. Randomised
selection, timing and pitch mean the space never repeats itself exactly.

Footsteps in particular are worth the effort out of all proportion to how much anyone notices them.
Nobody praises good footstep audio. Everybody feels wrong-footed by bad footstep audio, usually
without being able to say why.
