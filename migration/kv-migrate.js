// ============================================================================
// MIGRATION ENGINE (STEP 5) — KV → D1
// ----------------------------------------------------------------------------
// Purpose: copy data from the existing KV namespace (env.VIDEOS) into the
// new D1 database (env.DB), so D1 can eventually replace KV as the
// application's data source (a later step — this file does not do that).
//
// HARD GUARANTEES (do not weaken these without a deliberate, reviewed change):
//   • This file NEVER calls env.VIDEOS.put(...) or env.VIDEOS.delete(...).
//     Every KV call here is env.VIDEOS.get(...) or env.VIDEOS.list(...).
//   • This file NEVER changes the application's data source. env.VIDEOS
//     remains authoritative; nothing outside this file reads env.DB as of
//     this step.
//   • Every route requires env.MIGRATION_SECRET and is rejected otherwise
//     (same auth pattern as migration/kv-audit.js, independent copy so this
//     file stays self-contained).
//   • The secret itself is never included in any response, log line, or
//     error message.
//   • DRY RUN mode never writes to D1 (or KV). Only "real" mode writes to
//     D1 — almost entirely via INSERT OR IGNORE (idempotent, never
//     overwrites an existing row), plus two narrow, documented exceptions
//     that use an UPDATE/UPSERT because the schema requires it (the
//     users.referred_by backfill and the daily_visit_totals counter merge
//     — see migration/MIGRATION.md "Known limitations"). This file never
//     issues a DELETE anywhere, against D1 or KV.
//   • This module is self-contained. It is wired into index.js via a single
//     early-return path-prefix check, mirroring how migration/kv-audit.js is
//     wired in — see migration/MIGRATION.md for the exact snippet. It does
//     not interfere with, shadow, or change any existing route.
//
// Set the secret with (same secret migration/kv-audit.js already uses):
//   npx wrangler secret put MIGRATION_SECRET
// Call routes with header:  X-Migration-Secret: <the secret>
//
// See migration/MIGRATION.md for full usage, phase list, verification SQL,
// and known limitations.
// ============================================================================

const ROUTE_PREFIX = "/migration/kv-migrate";
const MIGRATION_VERSION = "v1"; // bump this to force a from-scratch re-run of every unit

// ─── Auth (independent copy — see header) ─────────────────────────────────

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a || "");
  const bBytes = enc.encode(b || "");
  if (aBytes.length !== bBytes.length) {
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

// ─── Small helpers ──────────────────────────────────────────────────────

function safeParse(raw) {
  if (raw === null || raw === undefined) return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, value: raw };
  }
}

// Reads the first present field out of several candidate KV field-name
// spellings. Used only where migration/KV_AUDIT.md documents the shape at
// the object level but not every field's exact casing — this degrades
// gracefully (missing optional fields become the fallback) instead of
// crashing or silently guessing wrong with confidence. See MIGRATION.md
// "Field-name assumptions" for the full list of fields this applies to.
function pick(obj, candidates, fallback = null) {
  for (const c of candidates) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, c) && obj[c] !== undefined) {
      return obj[c];
    }
  }
  return fallback;
}

function boolToInt(v) {
  if (v === true) return 1;
  if (v === false) return 0;
  if (v === 1 || v === 0) return v;
  return v ? 1 : 0;
}

function jsonOrNull(v) {
  if (v === undefined || v === null) return null;
  try { return JSON.stringify(v); } catch { return null; }
}

// Small dependency-free stable string hash (FNV-1a) for building
// deterministic synthetic ids when a KV record has no natural id of its
// own. Same input always produces the same id, so INSERT OR IGNORE stays
// idempotent across repeated runs.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function syntheticId(...parts) {
  return fnv1a(parts.map(p => String(p)).join("|"));
}

// ─── Checkpoint / error / processed-key bookkeeping (D1 side) ─────────────
// Created lazily on first use so this file needs no separate schema
// migration of its own. Never touches any application table.

async function ensureMigrationTables(env) {
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS migration_checkpoint (
        migration_version TEXT NOT NULL,
        phase              INTEGER NOT NULL,
        unit               TEXT NOT NULL,
        cursor             TEXT,
        processed          INTEGER NOT NULL DEFAULT 0,
        inserted           INTEGER NOT NULL DEFAULT 0,
        skipped            INTEGER NOT NULL DEFAULT 0,
        errors             INTEGER NOT NULL DEFAULT 0,
        started_at         INTEGER,
        updated_at         INTEGER,
        completed_at       INTEGER,
        PRIMARY KEY (migration_version, phase, unit)
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS migration_errors (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_version  TEXT NOT NULL,
        phase              INTEGER NOT NULL,
        unit               TEXT NOT NULL,
        kv_key             TEXT,
        message            TEXT,
        time               INTEGER NOT NULL
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS migration_processed_keys (
        migration_version TEXT NOT NULL,
        unit               TEXT NOT NULL,
        kv_key             TEXT NOT NULL,
        processed_at        INTEGER NOT NULL,
        PRIMARY KEY (migration_version, unit, kv_key)
      )
    `)
  ]);
}

async function getCheckpoint(env, phase, unit) {
  const row = await env.DB.prepare(
    `SELECT * FROM migration_checkpoint WHERE migration_version = ? AND phase = ? AND unit = ?`
  ).bind(MIGRATION_VERSION, phase, unit).first();
  return row || null;
}

async function upsertCheckpoint(env, phase, unit, patch) {
  const now = Date.now();
  const existing = await getCheckpoint(env, phase, unit);
  if (!existing) {
    await env.DB.prepare(`
      INSERT INTO migration_checkpoint
        (migration_version, phase, unit, cursor, processed, inserted, skipped, errors, started_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      MIGRATION_VERSION, phase, unit,
      patch.cursor ?? null,
      patch.processed ?? 0,
      patch.inserted ?? 0,
      patch.skipped ?? 0,
      patch.errors ?? 0,
      now, now,
      patch.completed_at ?? null
    ).run();
    return;
  }
  await env.DB.prepare(`
    UPDATE migration_checkpoint SET
      cursor = ?,
      processed = processed + ?,
      inserted = inserted + ?,
      skipped = skipped + ?,
      errors = errors + ?,
      updated_at = ?,
      completed_at = ?
    WHERE migration_version = ? AND phase = ? AND unit = ?
  `).bind(
    patch.cursor ?? existing.cursor,
    patch.processed ?? 0,
    patch.inserted ?? 0,
    patch.skipped ?? 0,
    patch.errors ?? 0,
    now,
    patch.completed_at !== undefined ? patch.completed_at : existing.completed_at,
    MIGRATION_VERSION, phase, unit
  ).run();
}

async function recordError(env, phase, unit, kvKey, message) {
  try {
    await env.DB.prepare(`
      INSERT INTO migration_errors (migration_version, phase, unit, kv_key, message, time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(MIGRATION_VERSION, phase, unit, kvKey || null, String(message).slice(0, 2000), Date.now()).run();
  } catch {
    // Recording the error must never itself crash the migration.
  }
}

async function isKeyProcessed(env, unit, kvKey) {
  const row = await env.DB.prepare(
    `SELECT 1 FROM migration_processed_keys WHERE migration_version = ? AND unit = ? AND kv_key = ?`
  ).bind(MIGRATION_VERSION, unit, kvKey).first();
  return !!row;
}

async function markKeyProcessed(env, unit, kvKey) {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO migration_processed_keys (migration_version, unit, kv_key, processed_at)
    VALUES (?, ?, ?, ?)
  `).bind(MIGRATION_VERSION, unit, kvKey, Date.now()).run();
}

// ─── Row builders (one per D1 table) ───────────────────────────────────────
// Each returns { stmt, ok, reason } where stmt is a ready-to-run prepared
// D1 statement (real mode) or null (dry run — validation only), and ok
// indicates whether the row passed validation. Field names/candidates
// follow migration/KV_AUDIT.md §1–§26.

function buildUserRow(env, email, u) {
  const username = pick(u, ["username"]);
  const referralCode = pick(u, ["referralCode", "referral_code"]);
  const createdAt = pick(u, ["createdAt", "created_at"]);
  if (!username || !referralCode || createdAt === null) {
    return { ok: false, reason: "missing required field (username/referralCode/createdAt)" };
  }
  const stmt = env.DB.prepare(`
    INSERT OR IGNORE INTO users (
      email, username, name, password_hash, coins, is_banned, ban_reason, is_active,
      provider, verified, google_sub, avatar, referral_code, referred_by, signup_ip,
      device_id, last_login_ip, last_login_at, local_reset_token, created_at, is_private,
      show_coins_public, show_friends, last_seen, total_stay_minutes, total_earned,
      referral_count, checkin_streak, last_checkin_date, username_set, earned_achievements
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    email,
    username,
    pick(u, ["name"], null),
    pick(u, ["passwordHash", "password_hash"], null),
    pick(u, ["coins"], 0),
    boolToInt(pick(u, ["isBanned"], false)),
    pick(u, ["banReason"], null),
    boolToInt(pick(u, ["isActive"], true)),
    pick(u, ["provider"], "password"),
    boolToInt(pick(u, ["verified"], false)),
    pick(u, ["googleSub"], null),
    pick(u, ["avatar"], null),
    referralCode,
    null, // referred_by resolved separately below (self-referencing FK — see note)
    pick(u, ["signupIp"], null),
    pick(u, ["deviceId"], null),
    pick(u, ["lastLoginIp"], null),
    pick(u, ["lastLoginAt"], null),
    pick(u, ["localResetToken"], 0),
    createdAt,
    boolToInt(pick(u, ["isPrivate"], false)),
    pick(u, ["showCoinsPublic"], null),
    pick(u, ["showFriends"], null),
    pick(u, ["lastSeen"], null),
    pick(u, ["totalStayMinutes"], 0),
    pick(u, ["totalEarned"], 0),
    pick(u, ["referralCount"], 0),
    pick(u, ["checkinStreak"], 0),
    pick(u, ["lastCheckinDate"], null),
    boolToInt(pick(u, ["usernameSet"], true)),
    jsonOrNull(pick(u, ["earnedAchievements"], null))
  );
  return { ok: true, stmt, referredBy: pick(u, ["referredBy", "referred_by"], null) };
}

// ─── Unit definitions ───────────────────────────────────────────────────
// type:
//   "keyed"          one KV key (matching `prefix`) => at most one D1 row
//   "keyed-expand"   one KV key => zero or more D1 rows (array/object expand)
//   "singleton-array" one KV key holding a whole array => many D1 rows,
//                     paginated by array index instead of a KV cursor
//   "singleton-object" one KV key => a single D1 row
//   "special"        bespoke handler (categories_v2 nested shape)

const UNITS = {
  // PHASE 1
  users: { phase: 1, type: "keyed", prefix: "user:" },

  // PHASE 2
  ip_accounts: { phase: 2, type: "keyed-expand", prefix: "ip_accounts:" },
  device_accounts: { phase: 2, type: "keyed-expand", prefix: "device_accounts:" },

  // PHASE 3
  categories: { phase: 3, type: "special-categories", key: "categories_v2" },

  // PHASE 4
  series: { phase: 4, type: "singleton-array", key: "series_list" },

  // PHASE 5
  videos: { phase: 5, type: "singleton-array", key: "video_list" },

  // PHASE 6
  comments: { phase: 6, type: "keyed-expand", prefix: "comments:" },
  ratings: { phase: 6, type: "keyed-expand", prefix: "ratings:" },
  likes: { phase: 6, type: "keyed-expand", prefix: "likedata:" },
  views: { phase: 6, type: "keyed-expand", prefix: "views:" },
  watch_history: { phase: 6, type: "keyed-expand", prefix: "history:" },

  // PHASE 7
  purchase_counts: { phase: 7, type: "keyed", prefix: "purchasecount:" },
  purchases: { phase: 7, type: "keyed-expand", prefix: "purchases:" },
  downloads: { phase: 7, type: "keyed-expand", prefix: "downloads:" },

  // PHASE 8
  coin_history: { phase: 8, type: "keyed-expand", prefix: "coinhistory:" },
  transaction_log: { phase: 8, type: "singleton-array", key: "transaction_log" },
  gifts: { phase: 8, type: "keyed", prefix: "gift:" },
  coin_requests_in: { phase: 8, type: "keyed-expand", prefix: "coinreq_in:" },
  coin_requests_out: { phase: 8, type: "keyed-expand", prefix: "coinreq_out:" },

  // PHASE 9
  friends: { phase: 9, type: "keyed-expand", prefix: "friends:" },
  friend_requests_in: { phase: 9, type: "keyed-expand", prefix: "friendreq_in:" },
  friend_requests_out: { phase: 9, type: "keyed-expand", prefix: "friendreq_out:" },

  // PHASE 10
  notifications: { phase: 10, type: "keyed-expand", prefix: "notifications:" },

  // PHASE 11
  ads: { phase: 11, type: "singleton-array", key: "ads_list" },
  settings: { phase: 11, type: "singleton-object", key: "settings" },

  // PHASE 12
  anon_presence: { phase: 12, type: "keyed", prefix: "anon_presence:" },
  daily_visit_totals: { phase: 12, type: "keyed", prefix: "anon_visits_total:", secondaryPrefix: "reg_visits_total:" },
  daily_visit_dedup: { phase: 12, type: "keyed", prefix: "anon_seen:", secondaryPrefix: "reg_seen:" },
  checkin_state: { phase: 12, type: "keyed", prefix: "checkin:" },
  active_time_state: { phase: 12, type: "keyed", prefix: "activetime:" },

  // PHASE 13
  admin_audit_log: { phase: 13, type: "singleton-array", key: "admin_audit_log" }
};

const PHASES = {
  1: ["users"],
  2: ["ip_accounts", "device_accounts"],
  3: ["categories"],
  4: ["series"],
  5: ["videos"],
  6: ["comments", "ratings", "likes", "views", "watch_history"],
  7: ["purchase_counts", "purchases", "downloads"],
  8: ["coin_history", "transaction_log", "gifts", "coin_requests_in", "coin_requests_out"],
  9: ["friends", "friend_requests_in", "friend_requests_out"],
  10: ["notifications"],
  11: ["ads", "settings"],
  12: ["anon_presence", "daily_visit_totals", "daily_visit_dedup", "checkin_state", "active_time_state"],
  13: ["admin_audit_log"]
};

// ─── Per-unit row expansion ────────────────────────────────────────────
// Returns an array of { table, ok, stmt (real mode only), reason,
// naturalId } describing every D1 row a single KV key should produce.
// Never writes anything itself.

function expandRows(env, unit, kvKey, value, mode, observed) {
  const rows = [];
  const track = (obj) => { if (observed && obj && typeof obj === "object") for (const k of Object.keys(obj)) observed.add(k); };

  const mk = (table, columns, params, ok = true, reason = null) => {
    const stmt = (mode === "real" && ok)
      ? env.DB.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).bind(...params)
      : null;
    rows.push({ table, ok, stmt, reason });
  };

  switch (unit) {
    case "ip_accounts": {
      const ip = kvKey.slice("ip_accounts:".length);
      const emails = Array.isArray(value) ? value : [];
      for (const email of emails) {
        if (!email) continue;
        mk("ip_accounts", ["ip", "email"], [ip, email]);
      }
      break;
    }
    case "device_accounts": {
      const deviceId = kvKey.slice("device_accounts:".length);
      const emails = Array.isArray(value) ? value : [];
      for (const email of emails) {
        if (!email) continue;
        mk("device_accounts", ["device_id", "email"], [deviceId, email]);
      }
      break;
    }
    case "comments": {
      const videoId = kvKey.slice("comments:".length);
      const arr = Array.isArray(value) ? value : [];
      for (const c of arr) {
        track(c);
        const id = pick(c, ["id"]) || syntheticId("comment", videoId, pick(c, ["userId"]), pick(c, ["time"]), pick(c, ["text"]));
        mk("comments", ["id", "video_id", "name", "text", "user_id", "time"],
          [id, videoId, pick(c, ["name"], null), pick(c, ["text"], ""), pick(c, ["userId"], null), pick(c, ["time"], null)]);
      }
      break;
    }
    case "ratings": {
      const videoId = kvKey.slice("ratings:".length);
      const arr = Array.isArray(value) ? value : [];
      for (const r of arr) {
        track(r);
        const id = pick(r, ["id"]) || syntheticId("rating", videoId, pick(r, ["userId"]));
        mk("ratings", ["id", "video_id", "user_id", "name", "stars", "text", "time", "is_admin"],
          [id, videoId, pick(r, ["userId"], null), pick(r, ["name"], null), pick(r, ["stars"], 0),
            pick(r, ["text"], null), pick(r, ["time"], null), boolToInt(pick(r, ["isAdmin"], false))]);
      }
      break;
    }
    case "likes": {
      const videoId = kvKey.slice("likedata:".length);
      const likedBy = Array.isArray(value?.likedBy) ? value.likedBy : [];
      const dislikedBy = Array.isArray(value?.dislikedBy) ? value.dislikedBy : [];
      for (const userId of likedBy) {
        if (!userId) continue;
        mk("likes", ["video_id", "user_id", "action"], [videoId, userId, "liked"]);
      }
      for (const userId of dislikedBy) {
        if (!userId) continue;
        mk("likes", ["video_id", "user_id", "action"], [videoId, userId, "disliked"]);
      }
      break;
    }
    case "views": {
      // KV only has an aggregate count + viewedBy list, not per-view
      // timestamps. We do NOT invent historical times: every row produced
      // here is stamped with this migration run's start time, which is
      // recorded as `migratedAt` in the run summary. See MIGRATION.md
      // "Known limitations".
      const videoId = kvKey.slice("views:".length);
      const viewedBy = Array.isArray(value?.viewedBy) ? value.viewedBy : [];
      const runTime = observed?.runTimestamp || Date.now();
      for (const userId of viewedBy) {
        if (!userId) continue;
        const id = syntheticId("view", videoId, userId);
        mk("views", ["video_id", "user_id", "ip", "time"], [videoId, userId, null, runTime], true, null);
        rows[rows.length - 1].naturalId = id; // informational only; table has no unique constraint on this
      }
      break;
    }
    case "watch_history": {
      const email = kvKey.slice("history:".length);
      const arr = Array.isArray(value) ? value : [];
      for (const h of arr) {
        track(h);
        mk("watch_history", ["email", "video_id", "category", "watched_at"],
          [email, pick(h, ["videoId"]), pick(h, ["category"], null), pick(h, ["watchedAt"])]);
      }
      break;
    }
    case "purchases": {
      // KV stores only item ids, no per-purchase timestamp. Stamped with
      // this migration run's time — see MIGRATION.md "Known limitations".
      const email = kvKey.slice("purchases:".length);
      const arr = Array.isArray(value) ? value : [];
      const runTime = observed?.runTimestamp || Date.now();
      for (const itemId of arr) {
        if (!itemId) continue;
        mk("purchases", ["email", "item_id", "purchased_at"], [email, itemId, runTime]);
      }
      break;
    }
    case "downloads": {
      // Same limitation as purchases — KV stores only video ids.
      const email = kvKey.slice("downloads:".length);
      const arr = Array.isArray(value) ? value : [];
      const runTime = observed?.runTimestamp || Date.now();
      for (const videoId of arr) {
        if (!videoId) continue;
        mk("downloads", ["email", "video_id", "downloaded_at"], [email, videoId, runTime]);
      }
      break;
    }
    case "coin_history": {
      const email = kvKey.slice("coinhistory:".length);
      const arr = Array.isArray(value) ? value : [];
      for (const h of arr) {
        track(h);
        const time = pick(h, ["time"]);
        const type = pick(h, ["type"], "unknown");
        const amount = pick(h, ["amount"], 0);
        // No id field in the KV shape — build a deterministic content id so
        // repeated runs stay idempotent even if array order shifts.
        const id = syntheticId("coinhist", email, time, type, amount, pick(h, ["reason"]));
        mk("coin_history", ["id", "email", "time", "type", "amount", "reason", "balance_after"],
          [id, email, time, type, amount, pick(h, ["reason"], null), pick(h, ["balanceAfter"], null)]);
      }
      break;
    }
    case "gifts": {
      const id = kvKey.slice("gift:".length);
      const g = value || {};
      track(g);
      mk("gifts", [
        "id", "sender_email", "sender_username", "recipient_email", "recipient_username",
        "amount", "created_at", "reverse_window_minutes", "status", "reversed_at", "reverse_reason"
      ], [
        pick(g, ["id"], id), pick(g, ["senderEmail"]), pick(g, ["senderUsername"]),
        pick(g, ["recipientEmail"]), pick(g, ["recipientUsername"]), pick(g, ["amount"], 0),
        pick(g, ["createdAt"]), pick(g, ["reverseWindowMinutes"], null),
        pick(g, ["status"], "completed"), pick(g, ["reversedAt"], null), pick(g, ["reverseReason"], null)
      ], !!(pick(g, ["senderEmail"]) && pick(g, ["recipientEmail"]) && pick(g, ["createdAt"])),
        "missing required field (senderEmail/recipientEmail/createdAt)");
      break;
    }
    case "coin_requests_in":
    case "coin_requests_out": {
      // Same logical record is duplicated on both the requester's "out"
      // list and the target's "in" list. We migrate both prefixes, but
      // INSERT OR IGNORE on the PK (id) means the second copy encountered
      // is always a no-op — no separate dedup logic needed.
      const arr = Array.isArray(value) ? value : [];
      for (const r of arr) {
        track(r);
        const id = pick(r, ["id"]) || syntheticId("coinreq", pick(r, ["requesterEmail"]), pick(r, ["targetEmail"]), pick(r, ["createdAt"]), pick(r, ["amount"]));
        mk("coin_requests", [
          "id", "requester_email", "requester_username", "target_email", "target_username",
          "amount", "note", "status", "created_at", "resolved_at"
        ], [
          id, pick(r, ["requesterEmail"]), pick(r, ["requesterUsername"]),
          pick(r, ["targetEmail"]), pick(r, ["targetUsername"]), pick(r, ["amount"], 0),
          pick(r, ["note"], null), pick(r, ["status"], "pending"),
          pick(r, ["createdAt"]), pick(r, ["resolvedAt"], null)
        ], !!(pick(r, ["requesterEmail"]) && pick(r, ["targetEmail"]) && pick(r, ["createdAt"])),
          "missing required field");
      }
      break;
    }
    case "friends": {
      // KV lists the friendship on both users' friends: lists. We
      // canonicalize to one row per pair with email_a < email_b; the
      // second copy encountered (from the other side) hits the same PK
      // and is ignored by INSERT OR IGNORE. KV does not store a
      // per-friendship created_at, so this run's timestamp is used — see
      // MIGRATION.md "Known limitations".
      const email = kvKey.slice("friends:".length);
      const arr = Array.isArray(value) ? value : [];
      const runTime = observed?.runTimestamp || Date.now();
      for (const other of arr) {
        if (!other || other === email) continue;
        const [a, b] = email < other ? [email, other] : [other, email];
        mk("friends", ["email_a", "email_b", "created_at"], [a, b, runTime]);
      }
      break;
    }
    case "friend_requests_in":
    case "friend_requests_out": {
      const arr = Array.isArray(value) ? value : [];
      for (const r of arr) {
        track(r);
        const id = pick(r, ["id"]) || syntheticId("freq", pick(r, ["fromEmail"]), pick(r, ["toEmail"]), pick(r, ["createdAt"]));
        mk("friend_requests", ["id", "from_email", "from_username", "to_email", "to_username", "created_at", "status"],
          [id, pick(r, ["fromEmail"]), pick(r, ["fromUsername"]), pick(r, ["toEmail"]), pick(r, ["toUsername"]),
            pick(r, ["createdAt"]), pick(r, ["status"], "pending")],
          !!(pick(r, ["fromEmail"]) && pick(r, ["toEmail"]) && pick(r, ["createdAt"])), "missing required field");
      }
      break;
    }
    case "notifications": {
      const email = kvKey.slice("notifications:".length);
      const arr = Array.isArray(value) ? value : [];
      for (const n of arr) {
        track(n);
        const id = pick(n, ["id"]) || syntheticId("notif", email, pick(n, ["time"]), pick(n, ["text"]));
        mk("notifications", ["id", "email", "text", "time", "read", "type", "action_url", "metadata"],
          [id, email, pick(n, ["text"], ""), pick(n, ["time"]), boolToInt(pick(n, ["read"], false)),
            pick(n, ["type"], "system"), pick(n, ["actionUrl"], null), jsonOrNull(pick(n, ["metadata"], null))]);
      }
      break;
    }
    default:
      throw new Error(`expandRows: no handler for unit "${unit}"`);
  }
  return rows;
}

// "keyed" units: one KV key => at most one D1 row.
function buildKeyedRow(env, unit, kvKey, value, mode, observed) {
  switch (unit) {
    case "users": {
      const email = kvKey.slice("user:".length);
      const u = value || {};
      if (observed) for (const k of Object.keys(u)) observed.add(k);
      const r = buildUserRow(env, email, u);
      return r.ok
        ? { table: "users", ok: true, stmt: mode === "real" ? r.stmt : null, extra: { referredBy: r.referredBy, email } }
        : { table: "users", ok: false, reason: r.reason };
    }
    case "purchase_counts": {
      const videoId = kvKey.slice("purchasecount:".length);
      const count = typeof value === "number" ? value : Number(value) || 0;
      const stmt = mode === "real"
        ? env.DB.prepare(`INSERT OR IGNORE INTO purchase_counts (video_id, count) VALUES (?, ?)`).bind(videoId, count)
        : null;
      return { table: "purchase_counts", ok: true, stmt };
    }
    case "gifts": {
      // handled by expandRows for consistency with other array-shaped units,
      // but gift: is single-object-per-key — route it through expandRows too.
      const rows = expandRows(env, "gifts", kvKey, value, mode, observed);
      return rows[0] || { ok: false, reason: "empty" };
    }
    case "anon_presence": {
      const visitorId = kvKey.slice("anon_presence:".length);
      const p = value || {};
      if (observed) for (const k of Object.keys(p)) observed.add(k);
      const lastSeen = pick(p, ["lastSeen", "last_seen"]);
      const expiresAt = pick(p, ["expiresAt", "expires_at"], (lastSeen || Date.now()) + 5 * 60 * 1000);
      if (lastSeen === null) return { ok: false, reason: "missing lastSeen" };
      const stmt = mode === "real"
        ? env.DB.prepare(`INSERT OR IGNORE INTO anon_presence (visitor_id, last_seen, expires_at) VALUES (?, ?, ?)`)
          .bind(visitorId, lastSeen, expiresAt)
        : null;
      return { table: "anon_presence", ok: true, stmt };
    }
    case "daily_visit_totals": {
      // kvKey looks like anon_visits_total:<date> or reg_visits_total:<date>
      const isAnon = kvKey.startsWith("anon_visits_total:");
      const date = kvKey.slice(kvKey.indexOf(":") + 1);
      const kind = isAnon ? "anon" : "reg";
      const count = typeof value === "number" ? value : Number(value) || 0;
      const stmt = mode === "real"
        ? env.DB.prepare(`INSERT INTO daily_visit_totals (date, kind, count) VALUES (?, ?, ?)
             ON CONFLICT(date, kind) DO UPDATE SET count = MAX(count, excluded.count)`)
          .bind(date, kind, count)
        : null;
      return { table: "daily_visit_totals", ok: true, stmt };
    }
    case "daily_visit_dedup": {
      // kvKey looks like anon_seen:<date>:<visitorId> or reg_seen:<date>:<subject>
      const isAnon = kvKey.startsWith("anon_seen:");
      const rest = kvKey.slice(kvKey.indexOf(":") + 1); // "<date>:<subject>"
      const sepIdx = rest.indexOf(":");
      const date = rest.slice(0, sepIdx);
      const subject = rest.slice(sepIdx + 1);
      const kind = isAnon ? "anon" : "reg";
      const stmt = mode === "real"
        ? env.DB.prepare(`INSERT OR IGNORE INTO daily_visit_dedup (date, subject, kind, expires_at) VALUES (?, ?, ?, ?)`)
          .bind(date, subject, kind, Date.now() + 3 * 24 * 60 * 60 * 1000)
        : null;
      return { table: "daily_visit_dedup", ok: true, stmt };
    }
    case "checkin_state": {
      // kvKey looks like checkin:<email>:<date>
      const rest = kvKey.slice("checkin:".length);
      const sepIdx = rest.indexOf(":");
      const email = rest.slice(0, sepIdx);
      const date = rest.slice(sepIdx + 1);
      const stmt = mode === "real"
        ? env.DB.prepare(`INSERT OR IGNORE INTO checkin_state (email, date, checked_in_at) VALUES (?, ?, ?)`)
          .bind(email, date, Date.now())
        : null;
      return { table: "checkin_state", ok: true, stmt };
    }
    case "active_time_state": {
      // kvKey looks like activetime:<email>:<date>
      const rest = kvKey.slice("activetime:".length);
      const sepIdx = rest.indexOf(":");
      const email = rest.slice(0, sepIdx);
      const date = rest.slice(sepIdx + 1);
      const s = value || {};
      if (observed) for (const k of Object.keys(s)) observed.add(k);
      const stmt = mode === "real"
        ? env.DB.prepare(`
            INSERT OR IGNORE INTO active_time_state (email, date, minutes, base_awarded, chunks_awarded, last_beat)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(email, date, pick(s, ["minutes"], 0), pick(s, ["baseAwarded"], 0), pick(s, ["chunksAwarded"], 0), pick(s, ["lastBeat"], 0))
        : null;
      return { table: "active_time_state", ok: true, stmt };
    }
    default:
      throw new Error(`buildKeyedRow: no handler for unit "${unit}"`);
  }
}

// ─── Singleton-array units (videos, series, ads, transaction_log, admin_audit_log) ─

function buildSingletonArrayRow(env, unit, item, mode, observed) {
  if (observed) for (const k of Object.keys(item || {})) observed.add(k);
  switch (unit) {
    case "series": {
      const id = pick(item, ["id"]);
      if (!id) return { ok: false, reason: "missing id" };
      const stmt = mode === "real"
        ? env.DB.prepare(`
            INSERT OR IGNORE INTO series (id, title, coin_cost, deleted, deleted_at, hidden, created_at)
            VALUES (?,?,?,?,?,?,?)
          `).bind(
            id,
            pick(item, ["title"], ""),
            pick(item, ["coinCost", "coin_cost", "price"], 0),
            boolToInt(pick(item, ["deleted"], false)),
            pick(item, ["deletedAt", "deleted_at"], null),
            boolToInt(pick(item, ["hidden"], false)),
            pick(item, ["createdAt", "created_at"], Date.now())
          )
        : null;
      return { ok: true, table: "series", stmt };
    }
    case "videos": {
      const id = pick(item, ["id"]);
      const driveId = pick(item, ["driveId", "drive_id"]);
      const thumbnail = pick(item, ["thumbnail"]);
      if (!id || !driveId || !thumbnail) return { ok: false, reason: "missing required field (id/driveId/thumbnail)" };
      const stmt = mode === "real"
        ? env.DB.prepare(`
            INSERT OR IGNORE INTO videos (
              id, title, drive_id, thumbnail, duration, category, sub_category, description,
              coin_cost, series_id, part, part_order, publish_at, release_date, hidden, draft,
              deleted, deleted_at, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `).bind(
            id, pick(item, ["title"], ""), driveId, thumbnail,
            pick(item, ["duration"], null), pick(item, ["category"], null), pick(item, ["subCategory", "sub_category"], null),
            pick(item, ["description"], null), pick(item, ["coinCost", "coin_cost"], 0),
            pick(item, ["seriesId", "series_id"], null), pick(item, ["part"], null), pick(item, ["partOrder", "part_order"], null),
            pick(item, ["publishAt", "publish_at"], null), pick(item, ["releaseDate", "release_date"], null),
            boolToInt(pick(item, ["hidden"], false)), boolToInt(pick(item, ["draft"], false)),
            boolToInt(pick(item, ["deleted"], false)), pick(item, ["deletedAt", "deleted_at"], null),
            pick(item, ["createdAt", "created_at"], Date.now())
          )
        : null;
      return { ok: true, table: "videos", stmt };
    }
    case "ads": {
      const id = pick(item, ["id"]);
      if (!id) return { ok: false, reason: "missing id" };
      const stmt = mode === "real"
        ? env.DB.prepare(`
            INSERT OR IGNORE INTO ads (id, name, type, code, placement, status, priority, start_date, end_date, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
          `).bind(
            id, pick(item, ["name"], null), pick(item, ["type"], "html"), pick(item, ["code"], null),
            pick(item, ["placement"], ""), pick(item, ["status"], "active"), pick(item, ["priority"], 0),
            pick(item, ["startDate", "start_date"], null), pick(item, ["endDate", "end_date"], null),
            pick(item, ["createdAt", "created_at"], Date.now()), pick(item, ["updatedAt", "updated_at"], Date.now())
          )
        : null;
      return { ok: true, table: "ads", stmt };
    }
    case "transaction_log": {
      const id = pick(item, ["id"]);
      if (!id) return { ok: false, reason: "missing id" };
      const stmt = mode === "real"
        ? env.DB.prepare(`
            INSERT OR IGNORE INTO transaction_log (
              id, time, type, from_username, to_username, amount, status, note, request_id,
              gift_id, balance_before, balance_after
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
          `).bind(
            id, pick(item, ["time"], Date.now()), pick(item, ["type"], "unknown"),
            pick(item, ["from"], null), pick(item, ["to"], null), pick(item, ["amount"], 0),
            pick(item, ["status"], "unknown"), pick(item, ["note"], null),
            pick(item, ["requestId", "request_id"], null), pick(item, ["giftId", "gift_id"], null),
            pick(item, ["balanceBefore", "balance_before"], null), pick(item, ["balanceAfter", "balance_after"], null)
          )
        : null;
      return { ok: true, table: "transaction_log", stmt };
    }
    case "admin_audit_log": {
      // No natural id in the KV shape and the D1 table is autoincrement
      // only (no unique constraint) — see MIGRATION.md "Known limitations"
      // for why this unit must not have its checkpoint reset after a real
      // run without first truncating admin_audit_log in D1.
      const timestamp = pick(item, ["timestamp"]);
      if (timestamp === null) return { ok: false, reason: "missing timestamp" };
      const stmt = mode === "real"
        ? env.DB.prepare(`INSERT INTO admin_audit_log (admin, action, target, details, timestamp) VALUES (?,?,?,?,?)`)
          .bind(pick(item, ["admin"], null), pick(item, ["action"], null), pick(item, ["target"], null),
            pick(item, ["details"], null), timestamp)
        : null;
      return { ok: true, table: "admin_audit_log", stmt };
    }
    default:
      throw new Error(`buildSingletonArrayRow: no handler for unit "${unit}"`);
  }
}

// ─── Processing loops ───────────────────────────────────────────────────

const DEFAULT_BATCH_SIZE = 200;
const MAX_BATCH_SIZE = 1000;

function clampBatch(n) {
  const v = Number(n) || DEFAULT_BATCH_SIZE;
  return Math.max(1, Math.min(MAX_BATCH_SIZE, v));
}

async function runKeyed(env, unit, def, mode, batchSize, observed) {
  const cp = await getCheckpoint(env, def.phase, unit);
  if (cp && cp.completed_at) return { done: true, ...summarize(cp) };

  const prefixes = def.secondaryPrefix ? [def.prefix, def.secondaryPrefix] : [def.prefix];
  // cursor encodes which prefix we're on plus that prefix's KV list cursor:
  // "<prefixIndex>:<kvCursor-or-empty>"
  let [prefixIndexStr, kvCursor] = (cp?.cursor || "0:").split(/:(.*)/s);
  let prefixIndex = Number(prefixIndexStr) || 0;
  if (kvCursor === "") kvCursor = undefined;

  let processed = 0, inserted = 0, skipped = 0, errors = 0;
  const stmts = [];
  const insertMarkers = []; // parallel array: true if the stmt at same index should count as "inserted" on success

  while (prefixIndex < prefixes.length && processed < batchSize) {
    const remaining = batchSize - processed;
    const page = await env.VIDEOS.list({ prefix: prefixes[prefixIndex], cursor: kvCursor, limit: Math.min(remaining, 1000) });
    for (const k of page.keys) {
      processed++;
      const kvKey = k.name;
      try {
        if (await isKeyProcessed(env, unit, kvKey)) { skipped++; continue; }
        const raw = await env.VIDEOS.get(kvKey);
        const { ok: parsedOk, value } = safeParse(raw);
        const usableValue = parsedOk ? value : raw; // some units (counters) are plain strings, not JSON
        const built = buildKeyedRow(env, unit, kvKey, usableValue, mode, observed);
        if (!built.ok) {
          errors++;
          await recordError(env, def.phase, unit, kvKey, built.reason || "validation failed");
          continue;
        }
        if (mode === "real") {
          stmts.push(built.stmt);
          insertMarkers.push({ kvKey, extra: built.extra });
        } else {
          inserted++; // dry run: would-insert
        }
      } catch (e) {
        errors++;
        await recordError(env, def.phase, unit, kvKey, e && e.message ? e.message : String(e));
      }
    }
    if (page.list_complete) {
      prefixIndex++;
      kvCursor = undefined;
    } else {
      kvCursor = page.cursor;
      break; // batch budget likely spent; stop even if more prefixes remain
    }
    if (processed >= batchSize) break;
  }

  if (mode === "real" && stmts.length) {
    const results = await env.DB.batch(stmts);
    for (let i = 0; i < results.length; i++) {
      const changed = results[i]?.meta?.changes ?? 0;
      if (changed > 0) inserted++; else skipped++;
      await markKeyProcessed(env, unit, insertMarkers[i].kvKey);
      // Resolve users.referred_by now that the row exists, if the referrer
      // already exists in D1. See "Known limitations" in MIGRATION.md.
      if (unit === "users" && insertMarkers[i].extra?.referredBy) {
        try {
          await env.DB.prepare(`
            UPDATE users SET referred_by = ?
            WHERE email = ? AND referred_by IS NULL
              AND EXISTS (SELECT 1 FROM users WHERE email = ?)
          `).bind(insertMarkers[i].extra.referredBy, insertMarkers[i].extra.email, insertMarkers[i].extra.referredBy).run();
        } catch (e) {
          await recordError(env, def.phase, unit, insertMarkers[i].kvKey, "referred_by backfill failed: " + (e.message || e));
        }
      }
    }
  } else if (mode === "real") {
    // still mark dry-validated-but-skipped keys (e.g. already processed) — no-op, handled above
  }

  const done = prefixIndex >= prefixes.length && kvCursor === undefined;
  const cursor = `${prefixIndex}:${kvCursor || ""}`;
  await upsertCheckpoint(env, def.phase, unit, {
    cursor, processed, inserted, skipped, errors,
    completed_at: done ? Date.now() : null
  });
  return { done, processed, inserted, skipped, errors };
}

async function runKeyedExpand(env, unit, def, mode, batchSize, observed) {
  const cp = await getCheckpoint(env, def.phase, unit);
  if (cp && cp.completed_at) return { done: true, ...summarize(cp) };

  let kvCursor = cp?.cursor || undefined;
  if (kvCursor === "") kvCursor = undefined;

  let keysProcessed = 0, inserted = 0, skipped = 0, errors = 0;
  const stmts = [];
  const keysToMark = [];

  const page = await env.VIDEOS.list({ prefix: def.prefix, cursor: kvCursor, limit: batchSize });
  for (const k of page.keys) {
    keysProcessed++;
    const kvKey = k.name;
    try {
      if (await isKeyProcessed(env, unit, kvKey)) { skipped++; continue; }
      const raw = await env.VIDEOS.get(kvKey);
      const { value } = safeParse(raw);
      const rows = expandRows(env, unit, kvKey, value, mode, observed);
      for (const row of rows) {
        if (!row.ok) {
          errors++;
          await recordError(env, def.phase, unit, kvKey, row.reason || "validation failed");
          continue;
        }
        if (mode === "real") {
          stmts.push(row.stmt);
        } else {
          inserted++;
        }
      }
      // Mark the source key processed even if some of its rows failed
      // validation — those failures are durably recorded in
      // migration_errors instead, so this key is never retried forever.
      keysToMark.push(kvKey);
    } catch (e) {
      errors++;
      await recordError(env, def.phase, unit, kvKey, e && e.message ? e.message : String(e));
    }
  }

  if (mode === "real" && stmts.length) {
    const results = await env.DB.batch(stmts);
    for (const r of results) {
      const changed = r?.meta?.changes ?? 0;
      if (changed > 0) inserted++; else skipped++;
    }
  }
  if (mode === "real") {
    for (const kvKey of keysToMark) await markKeyProcessed(env, unit, kvKey);
  }

  const done = page.list_complete;
  const cursor = done ? "" : page.cursor;
  await upsertCheckpoint(env, def.phase, unit, {
    cursor, processed: keysProcessed, inserted, skipped, errors,
    completed_at: done ? Date.now() : null
  });
  return { done, processed: keysProcessed, inserted, skipped, errors };
}

async function runSingletonArray(env, unit, def, mode, batchSize, observed) {
  const cp = await getCheckpoint(env, def.phase, unit);
  if (cp && cp.completed_at) return { done: true, ...summarize(cp) };

  const raw = await env.VIDEOS.get(def.key);
  const { value } = safeParse(raw);
  const arr = Array.isArray(value) ? value : [];

  const startIdx = Number(cp?.cursor) || 0;
  const endIdx = Math.min(arr.length, startIdx + batchSize);

  let inserted = 0, skipped = 0, errors = 0;
  const stmts = [];

  for (let i = startIdx; i < endIdx; i++) {
    try {
      const built = buildSingletonArrayRow(env, unit, arr[i], mode, observed);
      if (!built.ok) {
        errors++;
        await recordError(env, def.phase, unit, `${def.key}[${i}]`, built.reason || "validation failed");
        continue;
      }
      if (mode === "real") stmts.push(built.stmt);
      else inserted++;
    } catch (e) {
      errors++;
      await recordError(env, def.phase, unit, `${def.key}[${i}]`, e && e.message ? e.message : String(e));
    }
  }

  if (mode === "real" && stmts.length) {
    const results = await env.DB.batch(stmts);
    for (const r of results) {
      const changed = r?.meta?.changes ?? 0;
      if (changed > 0) inserted++; else skipped++;
    }
  }

  const processed = endIdx - startIdx;
  const done = endIdx >= arr.length;
  await upsertCheckpoint(env, def.phase, unit, {
    cursor: String(endIdx), processed, inserted, skipped, errors,
    completed_at: done ? Date.now() : null
  });
  return { done, processed, inserted, skipped, errors, totalInArray: arr.length };
}

async function runSingletonObject(env, unit, def, mode, observed) {
  const cp = await getCheckpoint(env, def.phase, unit);
  if (cp && cp.completed_at) return { done: true, ...summarize(cp) };

  const raw = await env.VIDEOS.get(def.key);
  const { ok: parsedOk, value } = safeParse(raw);
  let inserted = 0, skipped = 0, errors = 0;

  if (raw === null) {
    // Nothing to migrate — mark done so re-runs don't loop forever.
    await upsertCheckpoint(env, def.phase, unit, { cursor: "", processed: 0, inserted: 0, skipped: 1, errors: 0, completed_at: Date.now() });
    return { done: true, processed: 0, inserted: 0, skipped: 1, errors: 0, note: "key not present in KV" };
  }
  if (!parsedOk) {
    errors++;
    await recordError(env, def.phase, unit, def.key, "value is not valid JSON");
    await upsertCheckpoint(env, def.phase, unit, { cursor: "", processed: 1, inserted: 0, skipped: 0, errors: 1, completed_at: Date.now() });
    return { done: true, processed: 1, inserted: 0, skipped: 0, errors: 1 };
  }
  if (observed) for (const k of Object.keys(value)) observed.add(k);

  if (unit === "settings") {
    if (mode === "real") {
      const res = await env.DB.prepare(`
        INSERT OR IGNORE INTO settings (id, data, updated_at) VALUES (1, ?, ?)
      `).bind(JSON.stringify(value), Date.now()).run();
      if ((res?.meta?.changes ?? 0) > 0) inserted++; else skipped++;
    } else {
      inserted++;
    }
  }

  await upsertCheckpoint(env, def.phase, unit, {
    cursor: "", processed: 1, inserted, skipped, errors, completed_at: Date.now()
  });
  return { done: true, processed: 1, inserted, skipped, errors };
}

async function runCategoriesSpecial(env, def, mode, batchSize, observed) {
  const cp = await getCheckpoint(env, def.phase, "categories");
  if (cp && cp.completed_at) return { done: true, ...summarize(cp) };

  const raw = await env.VIDEOS.get(def.key); // "categories_v2"
  const { ok: parsedOk, value } = safeParse(raw);
  const cats = parsedOk && Array.isArray(value) ? value : [];

  let inserted = 0, skipped = 0, errors = 0;
  const stmts = [];

  cats.forEach((cat, idx) => {
    if (observed) for (const k of Object.keys(cat || {})) observed.add(k);
    const name = pick(cat, ["name"]);
    if (!name) { errors++; return; }
    if (mode === "real") {
      stmts.push(env.DB.prepare(`INSERT OR IGNORE INTO categories (name, hidden, sort_order) VALUES (?,?,?)`)
        .bind(name, boolToInt(pick(cat, ["hidden"], false)), idx));
    } else {
      inserted++;
    }
    const subs = Array.isArray(cat.subs) ? cat.subs : [];
    for (const sub of subs) {
      const subName = typeof sub === "string" ? sub : pick(sub, ["name"]);
      if (!subName) { errors++; continue; }
      if (mode === "real") {
        stmts.push(env.DB.prepare(`INSERT OR IGNORE INTO subcategories (category_name, name) VALUES (?, ?)`)
          .bind(name, subName));
      } else {
        inserted++;
      }
    }
  });

  if (mode === "real" && stmts.length) {
    const results = await env.DB.batch(stmts);
    for (const r of results) {
      const changed = r?.meta?.changes ?? 0;
      if (changed > 0) inserted++; else skipped++;
    }
  }

  await upsertCheckpoint(env, def.phase, "categories", {
    cursor: "", processed: cats.length, inserted, skipped, errors, completed_at: Date.now()
  });
  return { done: true, processed: cats.length, inserted, skipped, errors };
}

function summarize(cp) {
  return { processed: cp.processed, inserted: cp.inserted, skipped: cp.skipped, errors: cp.errors };
}

// ─── Route handlers ─────────────────────────────────────────────────────

async function runUnit(env, unitName, mode, batchSize, observed) {
  const def = UNITS[unitName];
  if (!def) throw new Error(`unknown unit "${unitName}"`);
  switch (def.type) {
    case "keyed": return runKeyed(env, unitName, def, mode, batchSize, observed);
    case "keyed-expand": return runKeyedExpand(env, unitName, def, mode, batchSize, observed);
    case "singleton-array": return runSingletonArray(env, unitName, def, mode, batchSize, observed);
    case "singleton-object": return runSingletonObject(env, unitName, def, observed);
    case "special-categories": return runCategoriesSpecial(env, def, mode, batchSize, observed);
    default: throw new Error(`no runner for type "${def.type}"`);
  }
}

async function handleRun(request, env, url) {
  const phase = Number(url.searchParams.get("phase"));
  if (!phase || !PHASES[phase]) {
    return json({ error: "provide a valid ?phase= (1-13)", validPhases: Object.keys(PHASES) }, 400);
  }
  const mode = url.searchParams.get("mode") === "real" ? "real" : "dry";
  const batchSize = clampBatch(url.searchParams.get("batchSize"));
  const onlyUnit = url.searchParams.get("unit");

  await ensureMigrationTables(env);

  const runTimestamp = Date.now();
  const observed = new Set();
  observed.runTimestamp = runTimestamp; // piggy-backed onto the Set instance for the row builders above

  const units = onlyUnit ? [onlyUnit] : PHASES[phase];
  const results = {};
  for (const unitName of units) {
    if (!PHASES[phase].includes(unitName)) {
      results[unitName] = { error: `unit "${unitName}" is not part of phase ${phase}` };
      continue;
    }
    try {
      results[unitName] = await runUnit(env, unitName, mode, batchSize, observed);
    } catch (e) {
      results[unitName] = { error: e && e.message ? e.message : String(e) };
    }
  }

  return json({
    migrationVersion: MIGRATION_VERSION,
    phase,
    mode,
    batchSize,
    runAt: new Date(runTimestamp).toISOString(),
    results,
    observedFields: [...observed].filter(v => typeof v === "string"),
    note: mode === "dry"
      ? "Dry run: KV was read only; nothing was written to D1 or KV. Re-call with the same params to continue past this batch, or mode=real to actually write."
      : "Real run: matching rows were written to D1 via INSERT OR IGNORE (or INSERT for admin_audit_log/views, which have no natural unique key). KV was never written to. Re-call with the same params to continue past this batch."
  });
}

async function handleStatus(env, url) {
  await ensureMigrationTables(env);
  const phase = url.searchParams.get("phase");
  const rows = phase
    ? await env.DB.prepare(`SELECT * FROM migration_checkpoint WHERE migration_version = ? AND phase = ? ORDER BY unit`).bind(MIGRATION_VERSION, Number(phase)).all()
    : await env.DB.prepare(`SELECT * FROM migration_checkpoint WHERE migration_version = ? ORDER BY phase, unit`).bind(MIGRATION_VERSION).all();
  const errorCounts = await env.DB.prepare(`
    SELECT phase, unit, COUNT(*) as count FROM migration_errors WHERE migration_version = ? GROUP BY phase, unit
  `).bind(MIGRATION_VERSION).all();
  return json({
    migrationVersion: MIGRATION_VERSION,
    checkpoints: rows.results || [],
    errorCounts: errorCounts.results || []
  });
}

async function handleErrors(env, url) {
  await ensureMigrationTables(env);
  const phase = url.searchParams.get("phase");
  const unit = url.searchParams.get("unit");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  let query = `SELECT * FROM migration_errors WHERE migration_version = ?`;
  const params = [MIGRATION_VERSION];
  if (phase) { query += ` AND phase = ?`; params.push(Number(phase)); }
  if (unit) { query += ` AND unit = ?`; params.push(unit); }
  query += ` ORDER BY time DESC LIMIT ?`;
  params.push(limit);
  const rows = await env.DB.prepare(query).bind(...params).all();
  return json({ errors: rows.results || [] });
}

function handleHelp() {
  return json({
    tool: "KV → D1 migration engine (STEP 5)",
    auth: "Header 'X-Migration-Secret: <MIGRATION_SECRET>' or ?secret=<...> query param",
    routes: {
      [`${ROUTE_PREFIX}/run?phase=<1-13>&mode=dry|real&batchSize=<n>&unit=<optional single unit>`]:
        "Processes one batch of one phase (or one unit within it). Call repeatedly with the same params until every unit in the response shows done:true. mode defaults to dry.",
      [`${ROUTE_PREFIX}/status?phase=<optional>`]: "Checkpoint + error-count summary for this migration version.",
      [`${ROUTE_PREFIX}/errors?phase=<optional>&unit=<optional>&limit=<n>`]: "Recent per-key migration errors."
    },
    phases: PHASES,
    migrationVersion: MIGRATION_VERSION
  });
}

// Entry point called from index.js. Handles every path under
// /migration/kv-migrate and returns a Response; index.js should return
// whatever this returns without any further processing.
export async function handleMigration(request, env, url) {
  if (!isAuthorized(request, env)) return unauthorized();

  const path = url.pathname;
  try {
    if (path === `${ROUTE_PREFIX}/run` && request.method === "POST") return await handleRun(request, env, url);
    if (path === `${ROUTE_PREFIX}/status`) return await handleStatus(env, url);
    if (path === `${ROUTE_PREFIX}/errors`) return await handleErrors(env, url);
    return handleHelp();
  } catch (e) {
    return json({ error: "migration run failed", message: e && e.message ? e.message : String(e) }, 500);
  }
}
