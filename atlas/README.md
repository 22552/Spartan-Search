# Spartan Atlas API

Cloudflare Worker + Turso API for the Spartan Search index.

The static UI lives in [`/pages`](../pages) and is intended for Cloudflare Pages.

Production API: `https://atlas.h6e.workers.dev`

Deployment trigger refreshed on 2026-08-31.

## Worker setup

```bash
cd atlas
npm install
npx wrangler secret put TURSO_AUTH_TOKEN
npm run deploy
```

`TURSO_DATABASE_URL` is configured in `wrangler.jsonc` as:

```text
libsql://spartanatlas-8noh.aws-ap-northeast-1.turso.io
```

Use a **read-only** Turso database token.

For local development, create `atlas/.dev.vars` (ignored by Git):

```text
TURSO_AUTH_TOKEN=your-token-here
```

Then run:

```bash
npm run dev
```

## API

- `GET /api/search?q=...` — search the existing `pages_fts` FTS5 index
- `GET /api/stats` — indexed page/host counts

The search endpoint falls back to `LIKE` for short queries or when FTS is unavailable. CORS is enabled because the UI may be hosted separately on Cloudflare Pages.
