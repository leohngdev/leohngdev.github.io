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
  hardcoded questionnaire scoring system with a fully configurable engine, extended the new
  scoring into the clinician dashboard and PDF reporting, and delivered 100% UAT pass across
  two client signed iterations.
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

ANTSA's questionnaire scoring was hardcoded. Every scoring rule — which questions belonged to
which category, what score counted as mild versus severe, how much each question contributed to
a total — lived in code. Adding a questionnaire, or changing a threshold on an existing one,
meant a developer writing and deploying a code change.

For a platform where clinicians need to configure assessments around their own practice, that is
the wrong place for the logic to live. The brief was to move all of it into data.

## What I built

I rebuilt the engine so that every part of scoring is configurable at runtime:

- **Custom categories.** Questions are grouped into named categories defined per questionnaire
  rather than fixed in code, so a new assessment is a configuration exercise rather than a release.
- **Severity thresholds.** Score bands are defined per category, which is what lets one
  questionnaire report "mild / moderate / severe" and another report a different scale entirely.
- **Configurable weighting with auto-redistribution.** Questions carry weights that must sum to a
  whole. This was the most interesting constraint: when someone changes one weight, the others have
  to move to keep the total valid, without silently destroying values the user set deliberately.
- **Reverse scoring.** Some instruments deliberately invert questions to detect inattentive
  responses. That inversion is now a per-question flag rather than a special case in the scoring path.

Once the engine was in place I extended it outward into the surfaces clinicians actually use — the
dashboard views that display scored results, and the PDF export that they hand to clients.

## The part I'm most proud of

Two things, and neither was a feature.

The dev environment was broken when I arrived. This is a multiservice system — API, database, mobile
client — and it did not start. I rebuilt the local environment from scratch, which meant reading
enough of the system to understand how the services were meant to fit together before I had any
running code to learn from. That work is invisible in a changelog and it was the thing that made
everything afterwards possible.

The second was a silent bug. The mobile app was serving incorrect answer options for certain
questions. Nothing errored, nothing logged, and the data looked plausible enough to pass a casual
glance — which is exactly what makes this class of bug dangerous in a clinical setting. Tracking it
down meant not trusting the layer that looked correct, and following the actual values rather than
the code that was supposed to produce them.

## Outcome

Two iterations, both signed off by the client, both at 100% UAT pass. Scoring configuration moved
out of the codebase and into the hands of the people who understand the instruments.

<!--
The specific implementation details above are deliberately kept at a design level: this is
client work on a live health platform. If ANTSA is happy for more to be shared, screenshots of
the configuration UI would strengthen this page considerably.
-->
