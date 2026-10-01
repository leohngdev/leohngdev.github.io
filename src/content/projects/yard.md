---
title: Yard
tagline: A privacy-focused neighbourhood social app, built as a solo product.
role: Solo Developer
period: '2026'
order: 0
featured: true
category: web
summary: >-
  Yard is a neighbourhood social app where posts grow on a map and repeated crossings
  can create a private bloom. I built its mobile and web clients, shared domain package,
  and Postgres backend, with privacy rules enforced in the data layer.
stack:
  - Expo
  - React Native
  - Next.js
  - TypeScript
  - Supabase
  - PostgreSQL
highlights:
  - Mobile and web clients with a shared domain package
  - Privacy rules enforced in the database
  - Mutual opt-in before identities are revealed
links:
  - label: Public product and engineering showcase
    href: https://github.com/leohngdev/yard-social
---

## Neighbourhood connections, on your terms

Yard puts posts on a neighbourhood map. Repeated crossings can create a private bloom,
but a connection waits for both people to choose it. I built Yard as a solo product.

<figure>
  <img src="/media/loose-parts/yard-map.webp" alt="Yard's neighbourhood map, showing posts in the public project showcase." width="1080" height="2400" loading="lazy" decoding="async" style="width: min(100%, 320px); height: auto; margin-inline: auto;" />
  <figcaption>The map screen from the Yard showcase.</figcaption>
</figure>

## One set of product rules

The mobile app uses Expo and React Native. The web client uses Next.js. Both share a
domain package, with Supabase and PostgreSQL underneath.

The privacy decisions are part of the product:

- Private posts do not create crossings.
- Matching does not read live location.
- Neither identity is revealed until both people opt in.

The database enforces these boundaries, so they do not depend only on what a client
chooses to display.

## Where it stands

As documented on **30 September 2026**, Yard was in TestFlight beta and had been submitted
for App Store review. This is a dated status, not a claim of a public App Store release.

The [public showcase](https://github.com/leohngdev/yard-social) documents product screens
and engineering decisions. The application source is private.
