import type { APIRoute } from 'astro';

import { SITE_URL } from '../data/site';

/**
 * Emitted as dist/robots.txt at build time rather than kept in public/, so the
 * sitemap URL is derived from the one canonical site URL instead of being a
 * second copy that silently rots when the domain changes.
 */
const body = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap-index.xml
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
