---
title: PostMint
tagline: An AI pipeline that turns market data into short-form finance videos, queue and renderer included.
role: Solo Developer
period: Apr – May 2026
order: 3
featured: true
category: web
summary: >-
  PostMint takes financial market data and produces short-form social content from it — first as
  written posts, then, after a mid-project pivot, as fully rendered videos with generated scripts and
  voiceover. An Express API queues the work, a background worker runs the pipeline, and Remotion
  renders the result programmatically. It is a working skeleton rather than a finished product, and
  the interesting part is the pipeline architecture.
stack:
  - Node.js
  - Express
  - TypeScript
  - BullMQ
  - Redis
  - Groq
  - Remotion
  - Supabase
  - PostgreSQL
  - Next.js
highlights:
  - Redis-backed job queue running an async script, voiceover and render pipeline
  - Video composed programmatically in React via Remotion rather than an editor
  - Monorepo split across API, renderer and dashboard with a typed client between them
links: []
---

## What it does

PostMint started as a content engine: pull market data, generate a short social post about it, format
it for the platform it is going to. That part worked, and it was not very interesting — an LLM call
with a well-built prompt is a solved problem.

The pivot in early May is what made it worth building. Instead of stopping at text, the pipeline now
generates a script, produces voiceover for it, and renders an actual video. That turns a request into
something that cannot be answered synchronously, and the architecture had to change to match.

## The pipeline is the project

A video render takes far too long to hold an HTTP connection open for, so a generation request does
not produce a video — it produces a job.

The Express API validates the request, enqueues it on a Redis-backed BullMQ queue and returns
immediately. A separate worker picks the job up and runs the stages: fetch market data, build the
prompt, generate the script through Groq, produce the voiceover, then hand the finished script to the
renderer. The dashboard polls for status. The stages are separate services rather than one long
function, which is what makes an individual stage retryable when it fails — and with three external
providers in the chain, stages fail.

The renderer is the part I would show first. Remotion composes video in React, so the finance video
is a component tree with animation driven by frame number rather than a timeline in an editor. Charts
and figures are real DOM rendered per frame. That means video output is code — diffable, reviewable,
and produced identically every run.

Around that sits the ordinary but necessary work: authentication middleware, a rate limiter, a
centralised error handler, and three Postgres migrations covering the schema and the video job table.
The web dashboard is Next.js with a typed API client and a Zustand store, so the front end talks to
the API through one checked surface rather than scattered fetch calls.

## Where it actually stands

Honestly: this is a working skeleton, not a product. Every layer of the pipeline exists and connects
end to end, but there is no test suite, billing is a stub route, and my own commit message describes
the video output as "still basic result so far." The README describes more than is built.

I would rather say that than overstate it. What PostMint demonstrates is that I can design an
asynchronous multi-stage pipeline across several external services and make it hold together — not
that I shipped a finished SaaS.
