/**
 * Performance budgets, in one place, read by two consumers:
 *
 *   - src/components/Instrument.astro renders the runtime budgets as meters next to
 *     numbers measured live in the visitor's browser.
 *   - scripts/check-budget.mjs enforces the build budgets and fails `npm run build`
 *     when an asset crosses one.
 *
 * The two sets measure different things on purpose:
 *
 *   Build budgets are gzipped sizes of the files Astro emits. That is a static,
 *   reproducible proxy for transfer weight that CI can check without a browser.
 *
 *   Runtime budgets are what actually crossed the wire, read from the Resource
 *   Timing API. GitHub Pages negotiates brotli, so these run a little under the
 *   gzip figures. They will never match exactly, and they are not supposed to.
 *
 * A budget nothing can fail is decoration. These are set with modest headroom over
 * the real numbers at the time of writing, so a genuine regression trips them rather
 * than ordinary noise. Tighten them when the numbers improve — see the note on
 * javascript below.
 */

export interface BuildBudget {
  /** Combined gzipped size of every .js file Astro emits. */
  javascript: number;
  /** Combined gzipped size of every .css file Astro emits. */
  css: number;
  /** Gzipped size of the single largest HTML page. */
  html: number;
  /**
   * Combined gzipped size of every .js chunk belonging to the house route.
   *
   * Budgeted separately from `javascript` on purpose. The site retired its
   * page-weight thesis, but the argument that the rest of the site should stay
   * near zero still holds: only the route that needs a 3D scene should pay for
   * one. A single global figure would have let three.js hide the cost of
   * everything else.
   */
  houseJavascript: number;
}

export interface RuntimeBudget {
  /** Every byte this page pulled over the wire, fonts included. */
  transferred: number;
  /**
   * JavaScript bytes over the wire.
   *
   * Was ~65 KB when a React island rendered the terminal, roughly 57 KB of which was
   * react-dom. Rewriting that as a vanilla command palette took it to ~5 KB. The
   * budget was cut to match: leaving the old ceiling in place would have meant a
   * gate that could never fail, which is the same as no gate.
   */
  javascript: number;
  /** Largest Contentful Paint, milliseconds. */
  lcp: number;
}

const KB = 1024;

export const buildBudget: BuildBudget = {
  /**
   * Raised from 10 KB to 15 KB when Astro's ClientRouter was added for cross-page
   * view transitions, which cost about 4.7 KB and pushed the build to 12.6 KB.
   *
   * Recording why, because this is the case the gate exists for. It failed, the
   * spend was looked at, and it was judged worth it: removing the white flash
   * between the work index and a case study is a real improvement to how the site
   * feels, and 15 KB is still a quarter of what a single React island cost. The
   * wrong move would have been raising this without noticing.
   */
  javascript: 15 * KB,
  css: 16 * KB,
  html: 16 * KB,
  // three.js core plus the house modules. Set with headroom over the greybox
  // build so Phase 1 art loading does not trip it, and low enough that pulling in
  // a second large dependency does.
  houseJavascript: 220 * KB,
};

export const runtimeBudget: RuntimeBudget = {
  // Fonts are now the overwhelming majority of this: three variable faces at roughly
  // 66, 47 and 40 KB. That is a deliberate trade the cost explorer lets a visitor
  // interrogate for themselves rather than something to hide.
  transferred: 240 * KB,
  javascript: 20 * KB,
  lcp: 1500,
};
