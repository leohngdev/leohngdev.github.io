---
title: ANTSA Questionnaire Scoring Engine
tagline: Rebuilt the scoring engine behind a live Australian digital mental health platform.
role: Software Developer
org: ANTSA — Monash Industry Experience Project
period: Jul – Nov 2025
order: 1
featured: true
category: web
summary: >-
  ANTSA is a live digital mental health platform used by clinicians and their clients across
  Australia. Over a five month industry placement I worked in a team of five to replace its
  hardcoded questionnaire scoring with a configurable engine, carried the new scoring into the
  clinician dashboard and PDF reporting, and passed UAT at 100% across two client signed
  iterations.
stack:
  - Nest.js
  - Node.js
  - PostgreSQL
  - React Native
  - TypeScript
  - Docker
  - Agile / Scrum
highlights:
  - 100% UAT pass rate across two client signed iterations
  - Replaced hardcoded scoring with configurable categories, thresholds and weighting
  - Found and fixed a silent bug serving wrong answer options to clinicians
links: []
confidential: true
---

## The problem

ANTSA's questionnaire scoring was hardcoded. Which questions belonged to which category, what score
counted as mild versus severe, how much each question contributed to a total: all of it lived in
code. Adding a questionnaire, or changing one threshold on an existing one, meant a developer
writing and deploying a code change.

Clinicians configure assessments around their own practice, so that logic belongs in data. Moving
it there was the brief.

## What I built

Every part of scoring is now configurable at runtime.

- **Custom categories.** Questions group into named categories defined per questionnaire instead of
  fixed in code, so adding an assessment is configuration rather than a release.
- **Severity thresholds.** Score bands are set per category, which lets one questionnaire report
  mild, moderate and severe while another uses a different scale.
- **Configurable weighting with auto-redistribution.** Weights have to sum to a whole, so changing
  one forces the others to move. The hard part was keeping the total valid without wiping values
  someone had set on purpose.
- **Reverse scoring.** Some instruments invert questions to catch inattentive responses. That
  inversion is a per-question flag now, rather than a branch inside the scoring path.

With the engine in place I extended it into the surfaces clinicians use: the dashboard views that
display scored results, and the PDF export they hand to clients.

## The two things I am proudest of

Neither shipped as a feature.

The dev environment did not start when I arrived. API, database, mobile client, and nothing came up.
I rebuilt it from scratch, which meant reading enough of the system to work out how the services
were meant to fit together before I had anything running to learn from. Nobody reads that work in a
changelog. Everything after it depended on it.

Then the silent bug. The mobile app served incorrect answer options for some questions. Nothing
errored, nothing logged, and the data looked plausible enough to survive a glance, which is what
makes this class of bug dangerous in a clinical setting. I found it by distrusting the layer that
looked correct and following the values instead of the code meant to produce them.

## Outcome

Two iterations, both signed off by the client, both at 100% UAT pass. Clinicians who understand the
instruments now configure the scoring themselves.
