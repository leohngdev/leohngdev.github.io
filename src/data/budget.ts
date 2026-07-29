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
  javascript: 10 * KB,
  css: 16 * KB,
  html: 16 * KB,
};

export const runtimeBudget: RuntimeBudget = {
  // Fonts are now the overwhelming majority of this: three variable faces at roughly
  // 66, 47 and 40 KB. That is a deliberate trade the cost explorer lets a visitor
  // interrogate for themselves rather than something to hide.
  transferred: 240 * KB,
  javascript: 12 * KB,
  lcp: 1500,
};
