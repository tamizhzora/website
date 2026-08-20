# KV → D1 Migration Engine (STEP 5)

Status: **migration tooling only**. Running this — in either mode — does
**not** change what the live application reads or writes. The app still
reads/writes exclusively through `env.VIDEOS` (KV); that will only change
in STEP 16/17. `migration/kv-migrate.js` only ever *copies* data from KV
into D1, and only when you explicitly call it.

This complements `migration/kv-audit.js` (STEP 3, read-only inventory) and
`migrations/0001_initial_schema.sql` (STEP 4, D1 table structure). Read
`migration/KV_AUDIT.md` first if you haven't — every field mapping below
comes from it.

---

## Hard guarantees

- Never calls `env.VIDEOS.put(...)` or `env.VIDEOS.delete(...)`. Every KV
  call is `get`/`list`.
- Dry run never writes to D1 (or KV) — it reads KV, validates, and reports
  what *would* happen.
- Real mode writes to D1 almost entirely via `INSERT OR IGNORE`, so
  re-running never creates duplicate rows. Two narrow, documented
  exceptions use an `UPDATE`/`UPSERT` because the schema needs it — see
  **Known limitations** below. Nothing in this file ever issues a
  `DELETE`, against D1 or KV.
- Every route requires `env.MIGRATION_SECRET` (the same secret
  `kv-audit.js` uses).
- Errors on individual keys/rows are recorded in a D1 table and the
  migration keeps going — one bad record never aborts a batch.

---

## Before you run anything

1. Apply the D1 schema if you haven't already:
   ```bash
   npx wrangler d1 execute my-video-site-db --file=migrations/0001_initial_schema.sql --remote
   # or --local to test first, without touching anything live
   ```
2. Set the secret (skip if already set for the audit tool — same secret):
   ```bash
   npx wrangler secret put MIGRATION_SECRET
   ```
3. **Wire the route into `index.js`.** This file intentionally does not
   modify `index.js` for you — add this block yourself, right next to the
   existing STEP 3 audit block, so you can review the diff:

   ```js
   import { handleMigration } from "./migration/kv-migrate.js";
   // ...
   // ── STEP 5: KV → D1 migration engine (temporary) ─────────────────────
   // Only ever reads env.VIDEOS and writes env.DB; never touches
   // env.VIDEOS.put/delete. Gated on its own secret (env.MIGRATION_SECRET),
   // independent of the admin-session gate below. Remove this block (and
   // the import above, and migration/kv-migrate.js) once the migration is
   // complete and verified.
   if (path.startsWith("/migration/kv-migrate")) {
     return handleMigration(request, env, url);
   }
   ```
   Put it before the admin route gate, same as the audit block. This adds
   a new, isolated route — it does not change any existing route.

---

## Commands

All requests need `X-Migration-Secret: <secret>` (or `?secret=<secret>`).

### Dry run a phase

```bash
curl -X POST -H "X-Migration-Secret: <secret>" \
  "https://<your-worker>.workers.dev/migration/kv-migrate/run?phase=1&mode=dry&batchSize=200"
```

Reads KV, validates every record, tells you what would be inserted,
skipped, or errored — writes nothing anywhere. Safe to run against
production KV as many times as you like.

### Real migration of a phase

```bash
curl -X POST -H "X-Migration-Secret: <secret>" \
  "https://<your-worker>.workers.dev/migration/kv-migrate/run?phase=1&mode=real&batchSize=200"
```

Writes to D1. Still never writes to KV.

### Resume behavior

Each call processes **one batch** and returns `done: true/false` per unit
in the response. If any unit shows `done: false`, call the *exact same
URL again* — it picks up from its saved checkpoint automatically. Repeat
until every unit in the phase reports `done: true`. This is normal, not
an error: a Cloudflare Worker request has a limited execution budget, so
large phases (e.g. `users`, `video_list`) are expected to take several
calls. A simple loop:

```bash
until curl -s -X POST -H "X-Migration-Secret: <secret>" \
  "https://<your-worker>.workers.dev/migration/kv-migrate/run?phase=1&mode=real&batchSize=200" \
  | grep -q '"done": true.*"done": true'; do sleep 1; done
```
(or just re-run the `status` route below until every unit shows a
`completed_at`.)

Re-running a phase that's already fully complete is a fast no-op — each
unit checks its checkpoint's `completed_at` first and returns immediately.

### Check progress

```bash
curl -H "X-Migration-Secret: <secret>" \
  "https://<your-worker>.workers.dev/migration/kv-migrate/status?phase=1"
```

Shows `processed`/`inserted`/`skipped`/`errors` and `completed_at` per
unit, plus a count of recorded errors per unit.

### Inspect errors

```bash
curl -H "X-Migration-Secret: <secret>" \
  "https://<your-worker>.workers.dev/migration/kv-migrate/errors?phase=1&limit=50"
```

### Restrict to one unit within a phase

Add `&unit=<name>` (e.g. `&unit=comments`) to `run` to work on a single
unit instead of the whole phase — useful for retrying just the piece that
had errors.

### `observedFields`

Every `run` response includes an `observedFields` list: every top-level
JSON key actually seen in the KV records processed in that batch. Compare
this against the field names this script expects (see **Field-name
assumptions** below) before trusting a real run on `series` or `videos`
in particular, where the KV shape wasn't fully pinned down in
`KV_AUDIT.md`.

---

## Phases

Run in this order — each depends on rows inserted by earlier phases
existing for its foreign keys (`users.email`, `videos.id`, etc.) to
resolve cleanly, though a missing reference is logged as an error rather
than aborting the batch:

| Phase | Units | KV → D1 |
|---|---|---|
| 1 | `users` | `user:<email>` → `users` |
| 2 | `ip_accounts`, `device_accounts` | `ip_accounts:<ip>`, `device_accounts:<id>` → one row per array element |
| 3 | `categories` | `categories_v2` → `categories` + `subcategories` |
| 4 | `series` | `series_list` → `series` |
| 5 | `videos` | `video_list` → `videos` |
| 6 | `comments`, `ratings`, `likes`, `views`, `watch_history` | `comments:`, `ratings:`, `likedata:`, `views:`, `history:` |
| 7 | `purchase_counts`, `purchases`, `downloads` | `purchasecount:`, `purchases:`, `downloads:` |
| 8 | `coin_history`, `transaction_log`, `gifts`, `coin_requests_in`, `coin_requests_out` | `coinhistory:`, `transaction_log`, `gift:`, `coinreq_in:`/`coinreq_out:` |
| 9 | `friends`, `friend_requests_in`, `friend_requests_out` | `friends:`, `friendreq_in:`/`friendreq_out:` |
| 10 | `notifications` | `notifications:` |
| 11 | `ads`, `settings` | `ads_list`, `settings` |
| 12 | `anon_presence`, `daily_visit_totals`, `daily_visit_dedup`, `checkin_state`, `active_time_state` | analytics/check-in prefixes |
| 13 | `admin_audit_log` | `admin_audit_log` |

Deliberately **not migrated** (per `KV_AUDIT.md` — derived or superseded,
see the summary table there for why): `user_username:`, `user_referral:`,
`all_users`, legacy `categories`, `giftsent:`, `gift_reversing:`,
legacy `ad_code`.

---

## Data-shape handling worth knowing about

- **De-duplication is automatic, not a separate step.** `friends:`,
  `coinreq_in:`/`coinreq_out:`, and `friendreq_in:`/`friendreq_out:` each
  store the same logical record twice (once per party). The script
  processes every prefix but writes with `INSERT OR IGNORE` on the row's
  natural key (`(email_a, email_b)` for friends, `id` for requests), so
  the second copy is always a no-op — you don't need to run these units
  in a particular order relative to each other.
- **IDs that don't exist in KV are synthesized deterministically.**
  `comments`, `ratings`, `notifications`, `coin_requests`,
  `friend_requests` all have an `id` field in KV already and it's used
  directly. `coin_history` does not — its D1 `id` is a content hash of
  `(email, time, type, amount, reason)`, so re-running produces the same
  id and stays idempotent even though KV's array is a capped ring buffer
  that reorders on new entries.

---

## Field-name assumptions

`KV_AUDIT.md` documents `series_list` and `video_list` at the level of
"array of series/video objects" without pinning down every field's exact
casing. This script's field mapping is written defensively — it checks a
few likely spellings per field (e.g. `coinCost`, `coin_cost`, `price` for
a video's cost) and falls back to `null`/`0` if none match, rather than
crashing. It never guesses a value; it only guesses *which key holds a
value that's already there*.

**Before a real run of phase 4 or 5**, dry-run it first and check the
`observedFields` list in the response against what this script expects:

- `videos` requires: `id`, `driveId`/`drive_id`, `thumbnail` (rows without
  these are skipped and logged as errors — see `/errors`).
- `series` requires: `id`.

If `observedFields` shows a field name this script doesn't check for
(e.g. your `coinCost` is actually called `price`), tell me and I'll add
it to the candidate list — don't run `mode=real` on a phase until the
dry-run's error count for it is zero or explained.

---

## Known limitations

These are honest gaps between what KV stores and what the D1 schema
needs — not bugs, but things to be aware of before/after a real run:

1. **`views` and `purchases`/`downloads` have no per-event timestamp in
   KV.** KV only stores an aggregate `count`/`viewedBy` list (views) or a
   bare array of ids (purchases, downloads) — never a timestamp per
   event. Per the migration brief, this script does **not** invent a fake
   historical timestamp. Instead every row from a given run is stamped
   with that run's start time (`views.time`, `purchases.purchased_at`,
   `downloads.downloaded_at`), and the `run` response's `runAt` field
   records exactly what that stamp was. These timestamps mean "known to
   exist as of this migration run," not "occurred at this moment."
2. **`friends.created_at` has no KV source either** — KV stores only the
   list of friend emails, not when the friendship formed. Same handling:
   stamped with the migration run's time.
3. **`users.referred_by` is a self-referencing foreign key**, and KV's
   flat `user:` prefix gives no ordering guarantee that a referrer is
   migrated before the user they referred. The script inserts each user
   row with `referred_by` left `NULL`, then immediately tries to backfill
   it with `UPDATE ... WHERE referred_by IS NULL AND EXISTS (SELECT 1
   FROM users WHERE email = <referrer>)` — this only fills a currently-
   empty field once and never overwrites an existing value, so it's safe
   to run repeatedly. If the referrer hasn't been migrated yet at the
   time a given batch runs, the link stays `NULL` until you re-run the
   `users` unit (e.g. call `/run?phase=1&unit=users&mode=real` a second
   time after phase 1 as a whole reaches `done: true` for every batch —
   this is a fast, idempotent no-op for already-inserted rows and will
   pick up any remaining backfills).
4. **`daily_visit_totals` uses a merge, not a plain insert-once.** KV
   stores this as a running total per day; the script writes it as
   `ON CONFLICT(date, kind) DO UPDATE SET count = MAX(count, excluded.count)`
   so re-running with a since-incremented KV counter can only raise the
   D1 value, never lower it with stale data — this is the one place
   besides the `referred_by` backfill where this script issues an
   `UPDATE`.
5. **`admin_audit_log` has no natural unique key**, in KV or in the D1
   schema (`id` is autoincrement-only, no unique constraint). Idempotency
   here relies entirely on the array-index checkpoint never being
   reprocessed from an earlier point once a real run has committed rows
   from it. **Do not manually reset this unit's checkpoint after a real
   run** (`DELETE FROM migration_checkpoint WHERE unit = 'admin_audit_log'`)
   without first truncating `admin_audit_log` in D1, or you will get
   duplicate rows. The same caution applies to `views` rows within a
   given `views:<videoId>` key, for the same reason (no unique constraint
   on `(video_id, user_id)` in the `views` table, since it's modeled as
   an event log).
6. **Foreign keys aren't necessarily enforced by D1 at insert time**
   depending on your Wrangler/D1 version's default `PRAGMA foreign_keys`
   setting. This script doesn't depend on that either way — every insert
   is wrapped so a constraint failure (enforced or not) is caught,
   recorded in `migration_errors`, and the batch continues.
7. **`transaction_log`'s 1000-entry cap and `coinhistory`/`notifications`'
   200/100-entry caps are KV-side size guards, not migrated as caps.**
   Every entry present in the KV array at the time you run that unit is
   migrated; D1 has no size limit forcing a cap.

---

## Verification SQL

Run these against D1 after a phase completes to spot-check counts. Compare
against the corresponding numbers from `migration/kv-audit.js`'s
`/report` endpoint (its `keyCount` per prefix, or `1` for a `present`
singleton) — they won't always match exactly (see limitations above,
e.g. `views` rows vs. KV's `viewedBy` array length should match 1:1, but
`ip_accounts`/`device_accounts` rows should match the sum of every KV
array's length, not the key count):

```sql
-- Row counts per table
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM ip_accounts;
SELECT COUNT(*) FROM device_accounts;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM subcategories;
SELECT COUNT(*) FROM series;
SELECT COUNT(*) FROM videos;
SELECT COUNT(*) FROM comments;
SELECT COUNT(*) FROM ratings;
SELECT COUNT(*) FROM likes;
SELECT COUNT(*) FROM views;
SELECT COUNT(*) FROM watch_history;
SELECT COUNT(*) FROM purchase_counts;
SELECT COUNT(*) FROM purchases;
SELECT COUNT(*) FROM downloads;
SELECT COUNT(*) FROM coin_history;
SELECT COUNT(*) FROM transaction_log;
SELECT COUNT(*) FROM gifts;
SELECT COUNT(*) FROM coin_requests;
SELECT COUNT(*) FROM friends;
SELECT COUNT(*) FROM friend_requests;
SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM ads;
SELECT COUNT(*) FROM settings;
SELECT COUNT(*) FROM anon_presence;
SELECT COUNT(*) FROM daily_visit_totals;
SELECT COUNT(*) FROM daily_visit_dedup;
SELECT COUNT(*) FROM checkin_state;
SELECT COUNT(*) FROM active_time_state;
SELECT COUNT(*) FROM admin_audit_log;

-- Spot-check: any user with an unresolved referral link?
SELECT email, referred_by FROM users
WHERE email IN (SELECT DISTINCT referred_by FROM users WHERE referred_by IS NOT NULL)
  AND referred_by IS NULL; -- should be empty after phase 1 fully settles

-- Spot-check: every video's series_id (if set) resolves
SELECT v.id, v.series_id FROM videos v
LEFT JOIN series s ON s.id = v.series_id
WHERE v.series_id IS NOT NULL AND s.id IS NULL;

-- Migration engine's own view of progress
SELECT * FROM migration_checkpoint ORDER BY phase, unit;
SELECT phase, unit, COUNT(*) FROM migration_errors GROUP BY phase, unit;
```

Cross-check row counts against `migration/kv-audit.js`:
```bash
curl -H "X-Migration-Secret: <secret>" \
  https://<your-worker>.workers.dev/migration/kv-audit/report
```

---

## Failure recovery

- **A batch call times out or errors mid-way**: just call the same `run`
  URL again. The checkpoint only advances after a batch's D1 writes
  succeed, so at worst you re-process a partial batch — safe, because
  every write is `INSERT OR IGNORE` (or an idempotent upsert; see
  **Known limitations** items 3–4).
- **A specific key/row keeps failing validation**: check `/errors`,
  fix the underlying KV data or extend this script's field mapping, then
  re-run — already-migrated keys in the same batch are skipped via the
  per-key processed ledger, so you won't reprocess everything.
- **You want a completely fresh migration** (e.g. after fixing a mapping
  bug): bump `MIGRATION_VERSION` at the top of `migration/kv-migrate.js`.
  Every checkpoint/error/processed-key record is scoped to that version
  string, so a new version starts from zero without needing to touch old
  records — but you're then responsible for clearing the D1 *data* tables
  yourself first if you don't want duplicate rows from two versions'
  worth of `INSERT OR IGNORE` calls colliding oddly (they won't
  duplicate, since `INSERT OR IGNORE` still respects each table's real
  primary key regardless of migration version — a version bump only
  resets *this script's own* bookkeeping, not D1's constraints).
- **KV itself**: nothing in this script can corrupt or lose KV data —
  there is no code path that calls `env.VIDEOS.put` or
  `env.VIDEOS.delete` anywhere in `migration/kv-migrate.js` (grep it
  yourself to confirm, same as the STEP 3 audit tool's guarantee).

---

## Before deploying / running for real

Per the review checklist this file was written against:

1. ✅ JavaScript syntax checked (`node --check migration/kv-migrate.js`).
2. ✅ Imports: only the one `export { handleMigration }`, wired in by you
   per the snippet above — no other file imports anything new.
3. ✅ Wrangler compatibility: uses only `env.VIDEOS.get/list` and
   `env.DB.prepare/batch`, both already declared in `wrangler.toml`.
4. ✅ `env.VIDEOS` and `env.DB` bindings verified against `wrangler.toml`.
5. ✅ No existing application route touched — this adds one new,
   independent path prefix, exactly like the STEP 3 audit tool.
6. ✅ No `env.VIDEOS.delete`/`env.VIDEOS.put` call exists anywhere in
   `migration/kv-migrate.js`.

**The real migration has not been run.** Review this file and
`migration/MIGRATION.md` (this document), wire the route into `index.js`
yourself, then dry-run every phase before running any of them for real.
