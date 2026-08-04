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

## Every layer by hand

I built each layer of these myself instead of inheriting one, which is the difference between using a
database and understanding one.

**The data layer first.** Designing schemas from requirements: working out entities, relationships,
and where normalisation earns its keep versus where it only adds joins, then tuning the queries and
indexes on top. Getting this wrong early costs a fortune to undo, and coursework is a cheap place to
learn that.

**Server side in two ecosystems.** Node.js and CakePHP are not alike, and working in both separated
the transferable ideas (routing, middleware, ORM patterns, request lifecycle) from the syntax around
them. When I picked up Nest.js on a live production codebase later, I recognised the shape of it.

**Plain front end.** HTML, CSS and JavaScript directly, no framework in between. Semantic markup,
layout, and the DOM API. This site runs on that foundation, which is why it ships almost no
JavaScript.
