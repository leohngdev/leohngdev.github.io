---
title: ANTSA Digital Mental Health Platform
tagline: Five month industry placement building assessment features on a live Australian health platform.
role: Software Developer
org: ANTSA — Monash Industry Experience Project
period: Jul – Nov 2025
order: 2
featured: true
category: web
summary: >-
  ANTSA is a live digital mental health platform used by clinicians and their clients across
  Australia. Over a five month industry placement I worked in a team of five to make the platform's
  questionnaire assessments configurable rather than code-driven, extended that work into the
  clinician-facing dashboard and PDF reporting, and delivered 100% UAT pass across two client
  signed iterations.
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
  - Moved assessment configuration out of code and into data
  - Delivered in an agile team of five against real client sign-off
links: []
confidential: true
---

## The placement

ANTSA is a commercial product with real clinicians and real clients depending on it, which made this
the first time I worked somewhere that a mistake had consequences beyond a grade. Five months, a team
of five, two iterations, each one demoed to and signed off by the client.

The brief in general terms: the platform's questionnaire assessments were configured in code, and the
goal was to move that configuration into data so the people who understand the clinical instruments
could change them without a developer writing a release. Once the underlying work was in place I
extended it outward into the surfaces clinicians actually use — the dashboard views that display
results, and the PDF export they hand to clients.

## What I took from it

Two things, and neither was a feature.

The first was rebuilding the local development environment. This is a multiservice system — API,
database, mobile client — and getting it running end to end on a fresh machine meant reading enough
of the architecture to understand how the services were meant to fit together before I had anything
running to learn from. That work never shows up in a changelog, and it was the thing that made
everything afterwards possible.

The second was a defect that produced no error and no log entry. Nothing crashed, nothing was
flagged, and the data looked plausible enough to survive a casual glance — which is exactly what
makes that class of bug worth taking seriously. Finding it meant not trusting the layer that looked
correct, and following the actual values through the system rather than reading the code that was
supposed to produce them. It is the same habit I picked up years earlier debugging robots, where the
machine does the wrong thing in front of you and no console is available.

## Outcome

Two iterations, both signed off by the client, both at 100% UAT pass. Assessment configuration moved
out of the codebase and into the hands of the people who understand the instruments.
