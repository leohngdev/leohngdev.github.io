/**
 * Where the site lives. This is the ONLY place the GitHub username appears.
 *
 * astro.config.mjs, the robots.txt endpoint, the OG card generator, the CV
 * generator and the footer all import from here, so moving to a different
 * username or a custom domain is a one-line change rather than a hunt through
 * the repo. Anything that needs the deployed URL must import it from this file.
 */

export const GITHUB_HANDLE = 'leohngdev';

/** Hostname only, for places that print the URL without a scheme. */
export const SITE_DOMAIN = `${GITHUB_HANDLE}.github.io`;

/** Canonical origin. No trailing slash: callers build paths off it with `new URL()`. */
export const SITE_URL = `https://${SITE_DOMAIN}`;

export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_HANDLE}`;

/** The Pages repository that builds this site, linked from the footer. */
export const REPO_URL = `${GITHUB_PROFILE_URL}/${SITE_DOMAIN}`;
