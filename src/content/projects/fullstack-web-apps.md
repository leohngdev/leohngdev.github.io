---
title: Full Stack Web Applications
tagline: Database-backed web apps built front to back, from schema design through to deployed UI.
role: Developer
org: Monash University — Web Development & Database Systems
period: Feb 2023 – Nov 2025
order: 4
featured: true
category: web
summary: >-
  A series of full stack applications built across the whole path: relational schema design and
  query tuning in PostgreSQL and MySQL, server side application code in Node.js and CakePHP, and
  hand-written HTML, CSS and JavaScript on the front end before reaching for a framework.
stack:
  - Node.js
  - CakePHP
  - PHP
  - PostgreSQL
  - MySQL
  - JavaScript
  - HTML
  - CSS
highlights:
  - Normalised relational schemas designed from requirements rather than retrofitted
  - Query and index tuning against realistic data volumes
  - Front ends built without a framework, so the platform is understood directly
links: []
---

## Front to back, deliberately

These projects were where I built every layer myself rather than inheriting one. That matters more
than it sounds, because it is the difference between using a database and understanding one.

**The data layer first.** Designing schemas from requirements — working out entities, relationships
and where normalisation genuinely helps versus where it just adds joins — then tuning the queries
and indexes that sit on top. Getting this wrong early is the kind of mistake that is expensive to
undo later, which is a good lesson to learn while the stakes are still coursework.

**Server side in more than one ecosystem.** Node.js and CakePHP are not similar, and working in both
was useful precisely because it separates the ideas that are transferable — routing, middleware,
ORM patterns, request lifecycle — from the framework-specific syntax around them. When I later
picked up Nest.js on a live production codebase, it was recognisable rather than new.

**Plain front end.** HTML, CSS and JavaScript directly, without a framework in between. Semantic
markup, layout and the actual DOM API. This site is built on that foundation, which is why it ships
almost no JavaScript.

<!--
TODO (Leo): pick the single best of these and split it into its own entry with a real name, a repo
link and a screenshot. One named, linkable project with a live demo outperforms a category summary.
-->
