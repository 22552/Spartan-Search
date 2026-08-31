# Spartan Atlas Pages UI

Static frontend for Cloudflare Pages.

> **Note:** Spartan Atlas is not affiliated with, derived from, or otherwise related to [Alumniminium/atlas](https://github.com/Alumniminium/atlas). The similar name is coincidental.

## Cloudflare Pages

Use `pages` as the project root/output directory. No build command is required.

The frontend calls the Atlas API at:

```text
https://atlas.h6e.workers.dev
```

The endpoint is configured in `config.js`:

```js
globalThis.SPARTAN_ATLAS_API_BASE = "https://atlas.h6e.workers.dev";
```

The API Worker lives in [`/atlas`](../atlas) and allows cross-origin GET requests.
