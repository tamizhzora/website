// ============================================================================
// MIGRATION AUDIT TOOL (STEP 3) — READ-ONLY
// ----------------------------------------------------------------------------
// Purpose: inspect the existing KV namespace (env.VIDEOS) so the KV → D1
// migration can be planned from real data, without touching anything.
//
// HARD GUARANTEES (do not weaken these without a deliberate, reviewed change):
//   • Every KV call in this file is env.VIDEOS.get(...) or env.VIDEOS.list(...).
//     There is no env.VIDEOS.put(...) or env.VIDEOS.delete(...) anywhere below.
//   • env.DB is never touched here. This step does not read or write D1.
//   • Every route requires env.MIGRATION_SECRET and is rejected otherwise.
//   • The secret itself is never included in any response, log line, or error
//     message — only a boolean "authorized" outcome ever leaves this file.
//   • This module is self-contained. It is wired into index.js via a single
//     early-return path-prefix check (see the "STEP 3" comment in index.js),
//     so it cannot interfere with, shadow, or change any existing route.
//
// Set the secret with:
//   npx wrangler secret put MIGRATION_SECRET
// Call routes with header:  X-Migration-Secret: <the secret>
// ============================================================================

const ROUTE_PREFIX = "/migration/kv-audit";

// ─── Auth ────────────────────────────────────────────────────────────────

// Constant-time string compare so response timing can't be used to guess
// the secret one byte at a time.
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a || "");
  const bBytes = enc.encode(b || "");
  if (aBytes.length !== bBytes.length) {
    // Still do a comparison of equal-ish length to avoid an early-exit
    // timing signal on length itself.
    let dummy = 0;
    for (let i = 0; i < Math.max(aBytes.length, bBytes.length); i++) {
      dummy |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

function isAuthorized(request, env) {
  if (!env.MIGRATION_SECRET) return false; // fail closed if secret isn't set
  const supplied = request.headers.get("X-Migration-Secret")
    || new URL(request.url).searchParams.get("secret");
  return timingSafeEqual(supplied, env.MIGRATION_SECRET);
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ─── KV key-pattern inventory ───────────────────────────────────────────
// Derived directly from grep of every env.VIDEOS.get/put/delete/list call
// in index.js (STEP 3 audit). See migration/KV_AUDIT.md for full detail
// (data shape, creator/reader/updater/deleter functions, D1 target table).
//
// `kind: "prefixed"` → many keys share this prefix, one per id/email/date;
//   counted via env.VIDEOS.list({ prefix }).
// `kind: "singleton"` → exactly one key with this exact name (or absent);
//   counted via env.VIDEOS.get(key) !== null.

const KV_GROUPS = {
  users: [
    { key: "user:", kind: "prefixed", note: "one JSON user object per email" },
    { key: "user_username:", kind: "prefixed", note: "username → email index" },
    { key: "user_referral:", kind: "prefixed", note: "referral code → email index" },
    { key: "all_users", kind: "singleton", note: "lightweight index array, merged with user: via enrichUsers()" }
  ],
  accounts: [
    { key: "ip_accounts:", kind: "prefixed", note: "IP → list of emails signed up from it" },
    { key: "device_accounts:", kind: "prefixed", note: "device id → list of emails" }
  ],
  videos: [
    { key: "video_list", kind: "singleton", note: "single JSON array of all video objects" },
    { key: "purchasecount:", kind: "prefixed", note: "per-video purchase counter" }
  ],
  categories: [
    { key: "categories_v2", kind: "singleton", note: "current category+subcategory tree" },
    { key: "categories", kind: "singleton", note: "legacy flat name list, read as fallback only" }
  ],
  subcategories: [
    // subcategories are nested inside the categories_v2 JSON blob, not a
    // separate key — see KV_AUDIT.md
  ],
  series: [
    { key: "series_list", kind: "singleton", note: "single JSON array of all series objects" }
  ],
  comments: [
    { key: "comments:", kind: "prefixed", note: "per-video JSON array of comments" }
  ],
  ratings: [
    { key: "ratings:", kind: "prefixed", note: "per-video JSON array of ratings" }
  ],
  likes: [
    { key: "likedata:", kind: "prefixed", note: "per-video {likedBy:[], dislikedBy:[]} — likes and dislikes share one key" }
  ],
  dislikes: [
    // same key as likes (likedata:) — see KV_AUDIT.md
  ],
  views: [
    { key: "views:", kind: "prefixed", note: "per-video {count, viewedBy:[]}" }
  ],
  watch_history: [
    { key: "history:", kind: "prefixed", note: "per-user JSON array, capped at 300 entries" }
  ],
  coins_balances: [
    // balance lives on the user object (user:<email>.coins) — no separate key
  ],
  coin_history: [
    { key: "coinhistory:", kind: "prefixed", note: "per-user JSON array, capped at 200 entries" }
  ],
  transactions: [
    { key: "transaction_log", kind: "singleton", note: "single global JSON array, capped at 1000 entries" }
  ],
  purchases: [
    { key: "purchases:", kind: "prefixed", note: "per-user JSON array of purchased item ids" }
  ],
  downloads: [
    { key: "downloads:", kind: "prefixed", note: "per-user JSON array of downloaded video ids" }
  ],
  gifts: [
    { key: "gift:", kind: "prefixed", note: "one JSON object per gift id" },
    { key: "giftsent:", kind: "prefixed", note: "per-sender JSON array, capped at 50 entries" },
    { key: "gift_reversing:", kind: "prefixed", note: "short-lived (30s TTL) race-guard marker, not durable data" }
  ],
  friends: [
    { key: "friends:", kind: "prefixed", note: "per-user JSON array of friend emails" }
  ],
  friend_requests: [
    { key: "friendreq_in:", kind: "prefixed", note: "per-user JSON array, capped at 200 entries" },
    { key: "friendreq_out:", kind: "prefixed", note: "per-user JSON array, capped at 200 entries" }
  ],
  referrals: [
    // referral edges live on user_referral: (code→email index) plus
    // referredBy/referralCount fields on the user object — no separate key
  ],
  notifications: [
    { key: "notifications:", kind: "prefixed", note: "per-user JSON array, capped at 100 entries" }
  ],
  ads: [
    { key: "ads_list", kind: "singleton", note: "current JSON array of ad objects" },
    { key: "ad_code", kind: "singleton", note: "legacy single ad string, migrated into ads_list on first read" }
  ],
  settings: [
    { key: "settings", kind: "singleton", note: "single JSON object, site-wide settings" }
  ],
  analytics: [
    { key: "anon_presence:", kind: "prefixed", note: "per-visitor heartbeat, short TTL" },
    { key: "anon_visits_total:", kind: "prefixed", note: "anon_visits_total:<YYYY-MM-DD>, counter string" },
    { key: "reg_visits_total:", kind: "prefixed", note: "reg_visits_total:<YYYY-MM-DD>, counter string" },
    { key: "anon_seen:", kind: "prefixed", note: "anon_seen:<YYYY-MM-DD>:<visitorId>, TTL dedup marker '1'" },
    { key: "reg_seen:", kind: "prefixed", note: "reg_seen:<YYYY-MM-DD>:<email>, TTL dedup marker '1'" }
  ],
  admin_data: [
    { key: "admin_audit_log", kind: "singleton", note: "single global JSON array, capped at 1000 entries" }
  ],
  coin_requests: [
    { key: "coinreq_in:", kind: "prefixed", note: "per-user JSON array, capped at 50 entries" },
    { key: "coinreq_out:", kind: "prefixed", note: "per-user JSON array, capped at 50 entries" }
  ],
  checkin_activetime: [
    { key: "checkin:", kind: "prefixed", note: "checkin:<email>:<YYYY-MM-DD>, TTL 3 days, marker value '1'" },
    { key: "activetime:", kind: "prefixed", note: "activetime:<email>:<YYYY-MM-DD>, TTL 3 days, JSON state object" }
  ],
  other: []
};

// Prefixes that hold sensitive fields — redact before returning a sample.
const SENSITIVE_KEY_PREFIXES = ["user:"];
const SENSITIVE_FIELDS = ["passwordHash", "googleSub", "signupIp", "deviceId", "lastLoginIp"];

function redact(value) {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const f of SENSITIVE_FIELDS) {
        if (f in parsed) parsed[f] = "[redacted]";
      }
    }
    return parsed;
  } catch {
    return value; // not JSON (e.g. plain counter/marker string) — return as-is
  }
}

// Lists one page of keys under a prefix. Caps at KV's own max (1000).
async function listPage(env, prefix, cursor, limit) {
  const opts = { prefix, limit: Math.min(limit || 1000, 1000) };
  if (cursor) opts.cursor = cursor;
  return env.VIDEOS.list(opts);
}

// Counts keys under a prefix across multiple pages, up to a safety cap, so
// a single /report call can't run away on a huge namespace. Callers that
// need the exact full count for a big prefix should page through
// /counts themselves.
const REPORT_PAGE_CAP = 10; // 10 * 1000 = up to 10,000 keys per prefix in the summary

async function countPrefix(env, prefix) {
  let cursor;
  let total = 0;
  let pages = 0;
  let truncated = false;
  do {
    const page = await listPage(env, prefix, cursor, 1000);
    total += page.keys.length;
    cursor = page.list_complete ? null : page.cursor;
    pages++;
    if (!page.list_complete && pages >= REPORT_PAGE_CAP) { truncated = true; break; }
  } while (cursor);
  return { count: total, truncated };
}

// ─── Route handlers ─────────────────────────────────────────────────────

async function handleReport(env) {
  const groups = {};
  for (const [groupName, entries] of Object.entries(KV_GROUPS)) {
    groups[groupName] = [];
    for (const entry of entries) {
      if (entry.kind === "singleton") {
        const raw = await env.VIDEOS.get(entry.key);
        groups[groupName].push({
          keyPattern: entry.key,
          kind: "singleton",
          present: raw !== null,
          note: entry.note
        });
      } else {
        const { count, truncated } = await countPrefix(env, entry.key);
        groups[groupName].push({
          keyPattern: entry.key + "*",
          kind: "prefixed",
          keyCount: count,
          truncated, // true = there are more than shown; page via /counts
          note: entry.note
        });
      }
    }
  }
  return json({
    generatedAt: new Date().toISOString(),
    readOnly: true,
    kvNamespace: "VIDEOS",
    groups
  });
}

async function handleCounts(env, url) {
  const prefix = url.searchParams.get("prefix");
  if (!prefix) return json({ error: "missing required query param: prefix" }, 400);
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = Number(url.searchParams.get("limit")) || 1000;
  const includeKeys = url.searchParams.get("includeKeys") === "1";

  const page = await listPage(env, prefix, cursor, limit);
  return json({
    prefix,
    pageKeyCount: page.keys.length,
    listComplete: page.list_complete,
    nextCursor: page.list_complete ? null : page.cursor,
    keys: includeKeys ? page.keys.map(k => ({ name: k.name, expiration: k.expiration || null })) : undefined
  });
}

async function handleSample(env, url) {
  const prefix = url.searchParams.get("prefix");
  const key = url.searchParams.get("key");
  if (!prefix && !key) return json({ error: "provide prefix or key" }, 400);

  let targetKey = key;
  if (!targetKey) {
    const page = await listPage(env, prefix, undefined, 1);
    if (!page.keys.length) return json({ error: "no keys found under that prefix" }, 404);
    targetKey = page.keys[0].name;
  }

  const raw = await env.VIDEOS.get(targetKey);
  if (raw === null) return json({ error: "key not found", key: targetKey }, 404);

  const sensitive = SENSITIVE_KEY_PREFIXES.some(p => targetKey.startsWith(p));
  return json({
    key: targetKey,
    redacted: sensitive,
    value: sensitive ? redact(raw) : (() => { try { return JSON.parse(raw); } catch { return raw; } })()
  });
}

function handleHelp() {
  return json({
    tool: "KV migration audit (STEP 3, read-only)",
    auth: "Header 'X-Migration-Secret: <MIGRATION_SECRET>' or ?secret=<...> query param",
    routes: {
      [`${ROUTE_PREFIX}/report`]: "Full grouped inventory with key counts per known prefix (capped per prefix, see 'truncated' flag).",
      [`${ROUTE_PREFIX}/counts?prefix=<p>&cursor=<c>&limit=<n>&includeKeys=1`]: "One paginated page of keys under a single prefix.",
      [`${ROUTE_PREFIX}/sample?prefix=<p>`]: "Fetch one example key's value under a prefix (sensitive fields redacted). Or pass ?key=<exact key> instead of prefix."
    }
  });
}

// Entry point called from index.js. Handles every path under
// /migration/kv-audit and returns a Response; index.js should return
// whatever this returns without any further processing.
export async function handleMigrationAudit(request, env, url) {
  if (!isAuthorized(request, env)) return unauthorized();

  const path = url.pathname;
  if (path === `${ROUTE_PREFIX}/report`) return handleReport(env);
  if (path === `${ROUTE_PREFIX}/counts`) return handleCounts(env, url);
  if (path === `${ROUTE_PREFIX}/sample`) return handleSample(env, url);
  return handleHelp();
}
