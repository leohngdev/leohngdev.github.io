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
  Australia. Over a five month industry placement I worked in a team of five on its questionnaire
  scoring engine, making categories, thresholds and weighting configurable at runtime, carried the
  new scoring into the clinician dashboard and PDF reporting, and passed UAT at 100% across two
  client signed iterations.
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
  - Built runtime-configurable categories, severity thresholds and question weighting
  - Traced and fixed a data mismatch that produced no error and no log entry
links: []
confidential: true
---

## The brief

ANTSA is a live digital mental health platform used by clinicians and their clients across
Australia. I joined a team of five on a five month industry placement, and my brief was the scoring
engine behind its questionnaires.

Clinicians shape assessments around their own practice, so the goal was to put scoring rules in
data where a clinician can reach them, instead of somewhere only a developer can.

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

The first was getting the whole stack running on my own machine. API, database and mobile client, and
I wanted all three up before I wrote a line. Standing that up meant reading the system and working
out how the services were meant to fit together before I had anything running to learn from. Nobody
reads that work in a changelog, and everything I did afterwards depended on it.

The second was diagnostic. I chased a data mismatch that produced no error and no log entry, where
every layer I checked looked correct on its own. I found it by distrusting the layer that looked
fine and following the values instead of the code meant to produce them. Working on clinical software
is a good argument for never taking plausible-looking data at face value.

## Outcome

Two iterations, both signed off by the client, both at 100% UAT pass. Clinicians who understand the
instruments can now configure the scoring themselves.
