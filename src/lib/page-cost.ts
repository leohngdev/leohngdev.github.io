/**
 * One measurement of what this page cost, shared by everything that reports it.
 *
 * The footer readout and the hero cost explorer used to sample Resource Timing
 * independently, a hundred milliseconds apart. Anything that arrived in that gap
 * made them disagree — and two numbers on one page contradicting each other
 * destroys the credibility of both, which on this site is the entire point.
 *
 * So: one settle point, one snapshot, one set of numbers.
 */

export interface ResourceSnapshot {
  /** Every byte over the wire, document included. */
  total: number;
  /** The HTML document itself. */
  document: number;
  entries: PerformanceResourceTiming[];
}

/**
 * Weight of a single resource.
 *
 * encodedBodySize first, transferSize only as a fallback. transferSize reports what
 * crossed the wire *this* time, which is close to zero on a cached repeat visit —
 * on the second load the explorer read a total of 3 KB, which is technically true
 * and a completely false picture of what the page weighs. encodedBodySize is the
 * compressed payload the browser actually parsed, so the number is stable whether
 * the visitor arrived cold or is coming back, and it is still genuinely measured
 * rather than hardcoded. Same-origin only here, so it is always populated.
 */
export function weightOf(entry: { encodedBodySize?: number; transferSize?: number }): number {
  return entry.encodedBodySize || entry.transferSize || 0;
}

/** Bytes for resources whose URL satisfies the predicate. */
export function sumWhere(
  snapshot: ResourceSnapshot,
  predicate: (name: string, entry: PerformanceResourceTiming) => boolean,
): number {
  let bytes = 0;
  for (const entry of snapshot.entries) {
    if (predicate(entry.name.toLowerCase(), entry)) bytes += weightOf(entry);
  }
  return bytes;
}

export const isFont = (name: string) => /\.woff2?(\?|$)/.test(name);
export const isScript = (name: string) => /\.m?js(\?|$)/.test(name);
export const isStyle = (name: string) => /\.css(\?|$)/.test(name);

export function snapshot(): ResourceSnapshot {
  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const documentBytes = nav ? weightOf(nav) : 0;
  const total = documentBytes + entries.reduce((sum, entry) => sum + weightOf(entry), 0);

  return { total, document: documentBytes, entries };
}

/**
 * Runs the callback once the page has genuinely stopped fetching things.
 *
 * 600ms after load rather than immediately: LCP is not final until the page
 * settles, and late arrivals (prefetches, lazily-triggered requests) would
 * otherwise be missed by whichever reader sampled first.
 */
export function whenSettled(callback: () => void): void {
  const run = () => requestAnimationFrame(() => setTimeout(callback, 600));
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

/** Largest Contentful Paint, observed from as early as possible. */
export function observeLcp(): () => number {
  let value = 0;
  if ('PerformanceObserver' in window) {
    try {
      // buffered:true picks up the entry that fired before this ran.
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) value = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      /* Firefox lacked LCP for a long time. A missing metric is not an error. */
    }
  }
  return () => Math.round(value);
}
