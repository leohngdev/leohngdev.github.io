---
title: Yard
tagline: A privacy-first social app built around a bounded world you tend rather than a feed you scroll.
role: Solo Developer
period: May 2026 – present
order: 1
featured: true
category: web
summary: >-
  Yard is a social app built on a deliberate constraint: instead of an infinite feed, every person
  keeps a bounded 16×12 plot they tend over time. On top of that sit low-friction photo updates,
  optional 24-hour stories, a map where the location of each post is opt-in individually, and a soft
  matching system derived from what people actually do in the app rather than a questionnaire. Next.js
  and Supabase on the web, an Expo React Native app for mobile, and eleven hand-written Postgres
  migrations underneath.
stack:
  - Next.js
  - React
  - TypeScript
  - Supabase
  - PostgreSQL
  - pgvector
  - Expo
  - React Native
  - Tailwind CSS
  - MapLibre
highlights:
  - Eleven hand-written Postgres migrations with row level security, moderation and a social graph
  - Embedding-based match signals with a deterministic fallback so the feature works offline
  - Privacy policy, account deletion and report/block shipped for App Store review
links: []
---

## The idea

Most social products are unbounded by design. The feed has no end, the incentive is to post as much
as possible, and the cost of that is well documented by now.

Yard starts from the opposite constraint. Each person tends a bounded 16×12 plot of curated
placeable tiles — a small world rather than a timeline. It fills up. You have to decide what earns a
space and what gets replaced, and that scarcity is the entire point: it makes a profile something you
cultivate rather than something you accumulate.

Everything else is built to stay consistent with that. Photo and caption updates are deliberately
low-friction. Stories are optional and expire after 24 hours. The map shows where posts came from,
but location is opt-in *per post* rather than a single account-wide switch, because "share my
location" is not one decision — it is a different decision every time you post.

## Privacy as a schema problem

The privacy-first claim is only worth anything if it is enforced somewhere the client cannot
override, so it lives in the database. Eleven hand-written SQL migrations define row level security
policies, storage bucket rules, the social graph, and a moderation layer with reports and blocks.
Access rules are Postgres policies rather than checks in application code, which means a bug in a
React component cannot leak another person's data — the query simply returns nothing.

That is a slower way to build, and I would make the same choice again. Getting authorisation wrong
in application code is the kind of mistake you discover from the outside.

## The matching system

Yard suggests people through what it calls match signals, derived from in-app activity rather than
an onboarding questionnaire. Nobody answers honestly about what they like; what they engage with is
better evidence.

Activity is embedded using OpenAI's `text-embedding-3-small` at 384 dimensions and stored in
Postgres via pgvector, with affinity scores recomputed on a daily Vercel cron job. The part I am
most pleased with is the fallback: if no embedding provider is reachable, the system drops to a
deterministic hash-based signal instead of failing. The feature degrades rather than breaking, and
the whole app still runs offline in development without an API key.

A second hourly cron expires stories. Both endpoints are protected with a bearer secret, because a
public URL that mutates data is a public URL that will eventually be found.

## Web and mobile

The web app is Next.js 16 on the App Router with React 19 — around sixty components, including an
interactive map built on MapLibre with supercluster for clustering, a reels-style feed, a story
viewer, and a comment sheet. The UI primitives are hand-rolled rather than pulled from a component
library, which was a deliberate exercise in understanding the accessibility and focus-management
problems that libraries usually hide.

The mobile app is Expo and React Native with expo-router tab navigation, covering the map, reels,
direct messages, stories, push notifications and settings. Both are currently being consolidated
into a shared monorepo so the types and business logic have one home.

## Shipping discipline

The part that taught me the most was everything after the code worked. Yard has an operations
runbook covering environment variables, transactional email configuration, and how the cron jobs
behave on Vercel's Hobby tier. It has an in-app privacy policy, working account deletion, and
report/block flows — not because they were interesting to build, but because App Store review
requires them for any app with user-generated content, and discovering that at submission time is
how projects die.
