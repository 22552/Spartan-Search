import { createClient } from "@libsql/client/web";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};
const SEARCH_CACHE_CONTROL = "public, max-age=60, s-maxage=900, stale-while-revalidate=86400";
const STATS_CACHE_CONTROL = "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    if (request.method !== "GET") {
      return json({ error: "method not allowed" }, 405);
    }

    try {
      if (url.pathname === "/api/search") return await search(request, url, env, ctx);
      if (url.pathname === "/api/stats") return await stats(request, env, ctx);
      return json({ error: "not found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: "search backend unavailable" }, 502);
    }
  },
};

function client(env) {
  if (!env.TURSO_AUTH_TOKEN) throw new Error("TURSO_AUTH_TOKEN is not configured");

  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

async function search(request, url, env, ctx) {
  const query = (url.searchParams.get("q") || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  if (!query) return json({ query: "", mode: null, results: [] });
  if ([...query].length < 3) return json({ error: "3文字未満は短すぎます！" }, 400);
  if (query.length > 160) return json({ error: "query too long" }, 400);

  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const requestedLimit = Number(url.searchParams.get("limit") || 20);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : 20;

  const terms = query.split(" ").filter(Boolean);
  const db = client(env);
  let payload;

  if (terms.every((term) => [...term].length >= 3)) {
    try {
      const ftsQuery = terms
        .map((term) => `"${term.replaceAll('"', '""')}"`)
        .join(" AND ");

      const result = await db.execute({
        sql: `SELECT
                p.url,
                COALESCE(NULLIF(p.title, ''), p.url) AS title,
                snippet(pages_fts, 2, '', '', ' … ', 24) AS snippet,
                bm25(pages_fts, 0.0, 8.0, 1.0) AS score
              FROM pages_fts
              JOIN pages AS p ON p.url = pages_fts.url
              WHERE pages_fts MATCH ? AND p.status = 2
              ORDER BY score, p.url
              LIMIT ?`,
        args: [ftsQuery, limit],
      });

      payload = { query, mode: "fts5", results: normalizeRows(result.rows) };
    } catch (error) {
      console.warn("FTS5 failed, falling back to LIKE", error);
    }
  }

  if (!payload) {
    const conditions = terms.map(() => "(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')");
    const args = [];

    for (const term of terms) {
      const pattern = `%${escapeLike(term)}%`;
      args.push(pattern, pattern);
    }

    const result = await db.execute({
      sql: `SELECT
              url,
              COALESCE(NULLIF(title, ''), url) AS title,
              CASE
                WHEN length(body) > 240 THEN substr(body, 1, 240) || ' …'
                ELSE body
              END AS snippet
            FROM pages
            WHERE status = 2 AND ${conditions.join(" AND ")}
            ORDER BY CASE WHEN title LIKE ? THEN 0 ELSE 1 END, url
            LIMIT ?`,
      args: [...args, `%${escapeLike(query)}%`, limit],
    });

    payload = { query, mode: "like", results: normalizeRows(result.rows) };
  }

  const response = json(payload, 200, SEARCH_CACHE_CONTROL);
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

async function stats(request, env, ctx) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const db = client(env);
  const result = await db.execute(`
    SELECT
      COUNT(*) AS pages,
      COUNT(DISTINCT substr(url, 11, instr(substr(url, 11), '/') - 1)) AS hosts,
      MAX(fetched_at) AS last_fetched_at
    FROM pages
    WHERE status = 2
  `);

  const payload = normalizeRows(result.rows)[0] || { pages: 0, hosts: 0, last_fetched_at: null };
  const response = json(payload, 200, STATS_CACHE_CONTROL);
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function normalizeRows(rows) {
  return rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === "bigint" ? Number(value) : value,
    ]),
  ));
}

function json(body, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, "cache-control": cacheControl },
  });
}
