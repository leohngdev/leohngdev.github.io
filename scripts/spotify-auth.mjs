/**
 * One-time helper to get a Spotify refresh token.
 *
 * Spotify's refresh token is the only credential the site needs long-term, but the
 * only way to obtain one is the authorization-code flow, which means a browser
 * redirect and a code exchange. Doing that by hand means copying a code out of a URL
 * bar and building a curl request with a base64 header, which is easy to get wrong.
 * This runs the whole exchange locally and prints the one value you need.
 *
 * Run it on your own machine, never in CI:
 *
 *   npm run spotify:auth
 *
 * It asks for the client id and secret rather than reading them from the command
 * line. That is not only friendlier: a value typed on a command line ends up in shell
 * history, and `VAR=x command` is Bash syntax that fails outright in PowerShell.
 * Reading from a prompt avoids both. Environment variables still win if they are set,
 * which keeps it usable in a scripted setup.
 *
 * It prints a refresh token. Put that in a GitHub repo secret. Do not paste it into
 * a chat, a commit, or anywhere else: it grants read access to your listening history
 * until you revoke it.
 */
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const PORT = 8888;
// Spotify stopped accepting "localhost" for loopback redirects; it wants the literal
// loopback IP. This string has to match the redirect URI in the dashboard exactly.
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

/**
 * Asks for anything not already in the environment. Values are trimmed because
 * copying from the Spotify dashboard tends to pick up a trailing space, and a secret
 * with whitespace fails the token exchange with an unhelpful 400.
 */
async function collectCredentials() {
  let clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  let clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (clientId && clientSecret) return { clientId, clientSecret };

  // Without a terminal, readline's question never resolves and the process hangs on
  // an unsettled await with no explanation. Say what is wrong instead.
  if (!stdin.isTTY) {
    console.error(
      '\n  No interactive terminal, so there is nothing to prompt.\n' +
        '  Run this directly in a terminal, or set SPOTIFY_CLIENT_ID and\n' +
        '  SPOTIFY_CLIENT_SECRET in the environment first.\n',
    );
    process.exit(1);
  }

  console.log('\n  Spotify app credentials');
  console.log('  developer.spotify.com/dashboard -> your app -> Settings\n');

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    if (!clientId) clientId = (await rl.question('  Client ID:     ')).trim();
    if (!clientSecret) clientSecret = (await rl.question('  Client secret: ')).trim();
  } finally {
    rl.close();
  }

  if (!clientId || !clientSecret) {
    console.error('\n  Both values are required. Nothing was saved; run it again.\n');
    process.exit(1);
  }

  return { clientId, clientSecret };
}

const { clientId: SPOTIFY_CLIENT_ID, clientSecret: SPOTIFY_CLIENT_SECRET } =
  await collectCredentials();

/** Only what the site reads. No playback control, no playlist or profile access. */
const SCOPES = ['user-read-currently-playing', 'user-read-recently-played'].join(' ');

// Guards against a stray request to the callback completing the exchange.
const state = randomBytes(16).toString('hex');

const authorizeUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  response_type: 'code',
  client_id: SPOTIFY_CLIENT_ID,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
  state,
})}`;

async function exchange(code) {
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body.refresh_token;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== '/callback') {
    response.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get('error');
  if (error) {
    response.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Spotify said: ${error}`);
    console.error(`\nSpotify returned an error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (url.searchParams.get('state') !== state) {
    response.writeHead(400, { 'Content-Type': 'text/plain' }).end('State mismatch.');
    console.error('\nState mismatch. Run the script again.');
    server.close();
    process.exit(1);
  }

  try {
    const refreshToken = await exchange(url.searchParams.get('code'));
    response
      .writeHead(200, { 'Content-Type': 'text/plain' })
      .end('Done. The refresh token is in your terminal. You can close this tab.');

    console.log('\n  Refresh token:\n');
    console.log(`  ${refreshToken}\n`);
    console.log('  Add it as the repo secret SPOTIFY_REFRESH_TOKEN.');
    console.log('  Keep it private: it reads your listening history until you revoke it.\n');
  } catch (thrown) {
    response.writeHead(500, { 'Content-Type': 'text/plain' }).end('Exchange failed.');
    console.error(`\nToken exchange failed: ${thrown.message}`);
    server.close();
    process.exit(1);
  }

  server.close();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Add this exact redirect URI to your Spotify app first:\n`);
  console.log(`    ${REDIRECT_URI}\n`);
  console.log(`  Then open this and approve:\n`);
  console.log(`    ${authorizeUrl}\n`);
});
