# Spartan Atlas

Cloudflare Workers + Turso frontend for the Spartan Search index.

## Setup

```bash
cd atlas
npm install
npx wrangler secret put TURSO_AUTH_TOKEN
npm run deploy
```

`TURSO_DATABASE_URL` is already configured in `wrangler.jsonc` as:

```text
libsql://spartanatlas-8noh.aws-ap-northeast-1.turso.io
```

Use a **read-only** Turso database token for the Worker.

For local development, create `atlas/.dev.vars` (ignored by Git):

```text
TURSO_AUTH_TOKEN=your-token-here
```

Then run:

```bash
npm run dev
```

## Routes

- `/` — search UI
- `/api/search?q=...` — JSON search API
- `/api/stats` — indexed page/host counts

The API uses the existing `pages_fts` FTS5 index and falls back to `LIKE` for short queries or when FTS is unavailable.
