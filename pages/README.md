# Spartan Atlas Pages UI

Static frontend for Cloudflare Pages.

## Cloudflare Pages

Use `pages` as the project root/output directory. No build command is required.

By default the frontend calls `/api` on the same origin. If the API Worker is on a separate `workers.dev` or custom domain, edit `config.js`:

```js
globalThis.SPARTAN_ATLAS_API_BASE = "https://your-api.example.com";
```

The API Worker lives in [`/atlas`](../atlas) and allows cross-origin GET requests.
