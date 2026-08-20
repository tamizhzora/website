# KV Migration Audit — STEP 3 (Read-Only)

Status: **audit only**. Nothing in this document or the accompanying
`migration/kv-audit.js` tool writes to KV, writes to D1, or changes any
existing application route or behavior. The app still reads/writes
exclusively through `env.VIDEOS` (KV). D1 (`env.DB`) is not touched by this
step at all.

Every key pattern below was found by grepping `index.js` for
`env.VIDEOS.get(`, `env.VIDEOS.put(`, `env.VIDEOS.delete(`, and
`env.VIDEOS.list(` and reading the surrounding function — nothing here is
guessed. Line numbers refer to the `index.js` you provided.

---

## 1. Users

### `user:<email>` (prefixed, one key per user)
- **Shape**: JSON object — email, username, name, password_hash-equivalent
  (`passwordHash`), coins, isBanned, banReason, isActive, provider, verified,
  googleSub, avatar, referralCode, referredBy, signupIp, deviceId,
  lastLoginIp, lastLoginAt, localResetToken, createdAt, isPrivate,
  showCoinsPublic, showFriends, lastSeen, totalStayMinutes, totalEarned,
  referralCount, checkinStreak, lastCheckinDate, usernameSet,
  earnedAchievements[].
- **Create**: `createUser` (695), `createGoogleUser` (735)
- **Read**: `getUser` (685)
- **Update**: `saveUser` (691) — called from many places (coin adjustments,
  profile edits, ban/unban, streak updates, etc.)
- **Delete**: `deleteUserFully` (1716, via `env.VIDEOS.delete("user:"+lc)` at 1720)
- **D1 table**: `users`. **PK**: `email`. Migrate: **yes**.

### `user_username:<username>` (prefixed — username → email index)
- **Create**: `createUser` (727), `createGoogleUser` (768)
- **Read**: `uniqueUsernameFromEmail` (780), username lookups throughout
  auth/gift/friend/coin-request routes (e.g. 5747, 5770, 5861, 5974...)
- **Update**: username-change flow (5640–5641: delete old, put new)
- **Delete**: `deleteUserFully` (1721)
- **D1 table**: none — becomes `SELECT email FROM users WHERE username = ?`
  (unique index already on `users.username`). Migrate: **no (derived)**.

### `user_referral:<code>` (prefixed — referral code → email index)
- **Create**: `createUser` (728), `createGoogleUser` (769)
- **Read**: `applyReferralSignup` callers (5586, 5693)
- **Delete**: none found (no cleanup path)
- **D1 table**: none — becomes `SELECT email FROM users WHERE referral_code = ?`.
  Migrate: **no (derived)**.

### `all_users` (singleton — lightweight index array)
- **Read**: `getAllUsers` (1566), consumed by `enrichUsers` (1574),
  `getTopEarners` (4793)
- **Update**: `updateUsersList` (1712)
- **D1 table**: none — `getAllUsersD1` in `db.js` already replaces this
  pattern with a direct `SELECT * FROM users` (no separate index needed once
  users live in one relational table). Migrate: **no (superseded)**.

---

## 2. Accounts (multi-account detection)

### `ip_accounts:<ip>` / `device_accounts:<deviceId>` (prefixed)
- **Shape**: JSON array of emails.
- **Create/Update**: `addIpAccount` (813), `addDeviceAccount` (826)
- **Read**: `getIpAccounts` (808), `getDeviceAccounts` (821), via
  `firstLiveAccount` (835)
- **Delete**: none found
- **D1 tables**: `ip_accounts` (PK: `ip, email`), `device_accounts`
  (PK: `device_id, email`). FK: `email → users.email`. Migrate: **yes**
  (one row per array element).

---

## 3. Videos

### `video_list` (singleton — single JSON array of every video)
- **Read**: `getVideos` (663)
- **Update**: `saveVideos` (667) — used for every create/edit/hide/delete/
  restore/publish action (video is found by id in the array, mutated, whole
  array re-saved)
- **D1 table**: `videos`. **PK**: `id`. **FK**: `series_id → series.id`.
  Migrate: **yes** (one row per array element).

### `purchasecount:<videoId>` (prefixed — counter)
- **Read**: `getPurchaseCount` (1475)
- **Update**: `incPurchaseCount` (1479) — get-then-put increment, no atomicity
- **D1 table**: `purchase_counts`. **PK**: `video_id`. **FK**: `video_id →
  videos.id`. Migrate: **yes** — this is a plain counter; in D1 it should
  become `UPDATE purchase_counts SET count = count + 1 WHERE video_id = ?`
  (or `INSERT ... ON CONFLICT DO UPDATE`), which also fixes the
  read-then-write race the KV version has.

---

## 4. Categories / Subcategories

### `categories_v2` (singleton — current)
- **Shape**: JSON array of `{ name, subs: [] }`.
- **Read**: `getCategories` (1515)
- **Update**: `saveCategories` (1524)
- **D1 tables**: `categories` (PK `name`) + `subcategories` (PK `id`,
  unique `(category_name, name)`, FK `category_name → categories.name`).
  Migrate: **yes** — one `categories` row per array element, one
  `subcategories` row per entry in each `.subs[]`.

### `categories` (singleton — legacy, read-only fallback)
- **Read**: `getCategories` (1518), only consulted if `categories_v2` is
  absent, then reshaped in memory.
- **Delete/write**: none — this key is never written by the current code,
  only ever read as a fallback.
- Migrate: **no** — superseded by `categories_v2`; include in the audit
  only to confirm whether any environment is still relying on the fallback
  (see "Testing" section).

---

## 5. Series

### `series_list` (singleton — single JSON array)
- **Read**: `getSeriesList` (1530), `getSeriesById` (1537)
- **Update**: `saveSeriesList` (1534) — used for create/rename/hide/
  soft-delete/restore/permanent-delete (e.g. 7171–7231)
- **D1 table**: `series`. **PK**: `id`. Migrate: **yes**.

---

## 6. Comments

### `comments:<videoId>` (prefixed)
- **Shape**: JSON array of `{ id, name, text, userId, time }`.
- **Create**: `addComment` (1492)
- **Read**: `getComments` (1487)
- **Update**: `editComment` (1506)
- **Delete**: `deleteComment` (1500) — removes one entry and re-saves the array
- **D1 table**: `comments`. **PK**: `id`. **FK**: `video_id → videos.id`.
  Migrate: **yes** (one row per array element).

---

## 7. Ratings

### `ratings:<videoId>` (prefixed)
- **Shape**: JSON array of `{ id, userId, name, stars, text, time, isAdmin }`.
- **Create**: `addOrUpdateRating` (1344), `addAdminRating` (1379)
- **Read**: `getRatings` (1331), summarized by `ratingsSummary` (1338)
- **Update**: `addOrUpdateRating` (upsert by userId), `editRatingById` (1367)
- **Delete**: `deleteOwnRating` (1353), `deleteRatingById` (1360)
- **D1 table**: `ratings`. **PK**: `id`. **Unique**: `(video_id, user_id)`.
  **FK**: `video_id → videos.id`. Migrate: **yes**.

---

## 8. Likes / Dislikes

### `likedata:<videoId>` (prefixed — **one key holds both likes and dislikes**)
- **Shape**: `{ likedBy: string[], dislikedBy: string[] }` (user ids).
- **Read**: `getLikeData` (1257), `getLikes` (1265), `getDislikes` (1269),
  `getUserLikeAction` (1317)
- **Update**: `saveLikeData` (1261), via `toggleLike` (1275) /
  `toggleDislike` (1296) — mutually exclusive: adding to one list removes
  from the other
- **Reset**: `resetLikes` (1325) — admin action, empties both arrays
- **D1 table**: `likes`. **PK**: `(video_id, user_id)`. `action` column
  (`'liked'`/`'disliked'`) replaces the two separate arrays. **FK**:
  `video_id → videos.id`. Migrate: **yes** — each array entry becomes one
  row with `action` set accordingly; the counter shown in the UI becomes
  `COUNT(*) WHERE action = 'liked'` / `'disliked'`.

---

## 9. Views

### `views:<videoId>` (prefixed)
- **Shape**: `{ count: number, viewedBy: string[] }`.
- **Read**: `getViews` (1389)
- **Update**: `incViews` (1395) — appends to `viewedBy` and bumps `count`
- **Reset**: `resetViews` (1409) — also directly `env.VIDEOS.put` at 6885
  (admin "reset views to N" — sets `count` to an admin-chosen number and
  clears `viewedBy`)
- **D1 tables**: `views` (one row per (video_id, user_id, time) — an actual
  event log, PK `id` autoincrement) *and* a derived count. Migrate:
  **yes, but reshape**: the KV `count` field is a running counter that
  in D1 should become `SELECT COUNT(*) FROM views WHERE video_id = ?`
  rather than a stored counter column, since `views` already models each
  view as its own row (matches `0001_initial_schema.sql`). The admin
  "reset views" action becomes `DELETE FROM views WHERE video_id = ?`
  instead of overwriting a counter.

---

## 10. Watch history

### `history:<email>` (prefixed)
- **Shape**: JSON array of `{ videoId, category, watchedAt }`, capped at 300.
- **Read**: `getWatchHistory` (1419), feeds `buildTasteProfile` (1433) /
  recommendation ranking (1453)
- **Update**: `recordWatchHistory` (1423) — unshift + slice(0,300)
- **Delete**: `deleteUserFully` (1880)
- **D1 table**: `watch_history`. **PK**: `id` autoincrement. **FK**:
  `email → users.email`. Migrate: **yes** (one row per array element). The
  300-entry cap was a KV-size guard; in D1 this can either be dropped or
  kept as a periodic prune — a judgment call for STEP 5, not this step.

---

## 11. Coins / balances

Coin balance is **not** a separate KV key — it's the `coins` field inside
each `user:<email>` object, adjusted in place and re-saved via `saveUser`.
No separate migration entry needed; it's part of the `users` table
migration (§1).

## 12. Coin history

### `coinhistory:<email>` (prefixed)
- **Shape**: JSON array of `{ time, type, amount, reason, balanceAfter }`,
  capped at 200.
- **Read**: `getCoinHistory` (4657)
- **Update**: `addCoinHistoryEntry` (4661)
- **Delete**: `deleteUserFully` (1878)
- **D1 table**: `coin_history`. **PK**: `id`. **FK**: `email → users.email`.
  Migrate: **yes**.

## 13. Transactions (global admin log)

### `transaction_log` (singleton — single capped array, all users)
- **Shape**: JSON array of `{ id, time, type, from, to, amount, status,
  note, requestId, giftId, balanceBefore, balanceAfter }`, capped at 1000.
- **Read**: `getTransactionLog` (4701)
- **Update**: `addTransactionLog` (4695) — unshift + slice(0,1000)
- **D1 table**: `transaction_log`. **PK**: `id`. Migrate: **yes** — but note
  this KV structure is a **capped ring buffer for the whole site**, not
  per-user. Once in D1 there is no size reason to keep capping at 1000; STEP
  5 should decide whether to preserve the cap (matching current admin UI
  expectations) or keep the full history now that D1 isn't size-limited the
  same way.

---

## 14. Purchases

### `purchases:<email>` (prefixed)
- **Shape**: JSON array of purchased item ids.
- **Read**: `getPurchases` (4632)
- **Update**: `savePurchases` (4636), `addPurchase` (4639)
- **Delete**: `deleteUserFully` (1876)
- **D1 table**: `purchases`. **PK**: `(email, item_id)`. **FK**: `email →
  users.email`. Migrate: **yes**.

## 15. Downloads

### `downloads:<email>` (prefixed)
- **Shape**: JSON array of downloaded video ids.
- **Read**: `getDownloads` (4646)
- **Update**: `addDownload` (4650)
- **Delete**: `deleteUserFully` (1877)
- **D1 table**: `downloads`. **PK**: `(email, video_id)`. **FK**: `email →
  users.email`. Migrate: **yes**.

---

## 16. Gifts

### `gift:<giftId>` (prefixed — one key per gift)
- **Shape**: `{ id, senderEmail, senderUsername, recipientEmail,
  recipientUsername, amount, createdAt, reverseWindowMinutes, status,
  reversedAt, reverseReason }`.
- **Create**: `saveGift` (4725)
- **Read**: `getGift` (4728)
- **Update**: `saveGift` again on reversal (status → `'reversed'`)
- **D1 table**: `gifts`. **PK**: `id`. **FK**: `sender_email`,
  `recipient_email → users.email`. Migrate: **yes**.

### `giftsent:<email>` (prefixed — per-sender index of gift ids)
- **Read**: `getSentGifts` (4732)
- **Update**: `addSentGiftRef` (4736), capped at 50
- **Delete**: `deleteUserFully` (1881)
- **D1 table**: none needed — becomes `SELECT * FROM gifts WHERE
  sender_email = ? ORDER BY created_at DESC LIMIT 50`. Migrate: **no
  (derived)**.

### `gift_reversing:<giftId>` (prefixed — 30s TTL race-guard, not durable data)
- **Read/Write**: `/api/gift/reverse` handler (5921, 5923)
- Migrate: **no** — this is a transient concurrency lock, not durable
  business data. If gift reversal needs a race guard against D1, that's a
  STEP 16/17 concurrency-design question (e.g. a conditional `UPDATE ...
  WHERE status = 'completed'` is likely sufficient and simpler), not
  something to carry over from KV.

### `gift_reversal_claims` table already in `0001_initial_schema.sql`
Present in the schema but **no KV equivalent was found** for it — the
current KV code uses the ad-hoc `gift_reversing:` TTL key instead (see
above). Flagging this mismatch for STEP 5/16 rather than guessing intent.

---

## 17. Coin requests

### `coinreq_in:<email>` / `coinreq_out:<email>` (prefixed)
- **Shape**: JSON array of `{ id, requesterEmail, requesterUsername,
  targetEmail, targetUsername, amount, note, status, createdAt,
  resolvedAt }` — the **same record duplicated** into both the requester's
  "out" list and the target's "in" list.
- **Create**: `createCoinRequest` (4756) — writes both keys (4766, 4769)
- **Read**: `getCoinRequestsIn` (4748), `getCoinRequestsOut` (4752),
  `findCoinRequest` (4783)
- **Update**: `setCoinRequestStatus` (4775) — updates status in **both**
  copies
- **Delete**: `deleteUserFully` (1882–1883)
- **D1 table**: `coin_requests`. **PK**: `id`. **FK**:
  `requester_email`, `target_email → users.email`. Migrate: **yes**, but
  **de-duplicate**: KV stores this record twice (once per side); D1 has a
  single `coin_requests` row and both "incoming" and "outgoing" views
  become `WHERE target_email = ?` / `WHERE requester_email = ?` queries
  against the one row.

---

## 18. Friends

### `friends:<email>` (prefixed)
- **Shape**: JSON array of friend emails.
- **Read**: `getFriends` (1735), `areFriends` (1750)
- **Update**: `saveFriends` (1739), `removeFriendOneSide` (1757)
- **Delete**: `deleteUserFully` (1884)
- **D1 table**: `friends`. **PK**: `(email_a, email_b)`. Migrate: **yes**,
  but **de-duplicate the direction**: KV stores the friendship on *both*
  users' `friends:` lists (each side lists the other). The `friends` table
  should store one canonical row per pair (e.g. always `email_a < email_b`)
  and membership checks/listings become `WHERE email_a = ? OR email_b = ?`.

## 19. Friend requests

### `friendreq_in:<email>` / `friendreq_out:<email>` (prefixed)
- **Shape**: JSON array of `{ id, fromEmail, fromUsername, toEmail,
  toUsername, createdAt, status }`, capped at 200.
- **Create**: `sendFriendRequest` (1782) — writes both keys (1792, 1795)
- **Read**: `getFriendRequestsIn` (1742), `getFriendRequestsOut` (1746)
- **Update**: `acceptFriendRequest` (1803), `declineFriendRequest` (1822)
- **Delete**: `cancelFriendRequest` (1799), `removeFriendRequestOneSide`
  (1764), bulk via `deleteUserFully` (1885–1886)
- **D1 table**: `friend_requests`. **PK**: `id`. **FK**: `from_email`,
  `to_email → users.email`. Migrate: **yes**, same duplicate-record
  de-dup note as coin requests (§17) — one row, two query directions.

---

## 20. Referrals

No dedicated KV key group — referral data is spread across fields already
covered elsewhere:
- `user_referral:<code>` → email index (§1) — becomes
  `users.referral_code` lookup.
- `referredBy` field on `user:<email>` → becomes `users.referred_by`.
- `referralCount` field on `user:<email>` → becomes `users.referral_count`.

`applyReferralSignup` (791) is the function that ties these together at
signup time. Migrate: **yes**, but only as part of the `users` table (§1) —
no separate D1 table needed beyond what `0001_initial_schema.sql` already
has (`users.referred_by`, self-referencing FK to `users.email`).

---

## 21. Notifications

### `notifications:<email>` (prefixed)
- **Shape**: JSON array of `{ id, text, time, read, type, actionUrl,
  metadata }`, capped at 100.
- **Create**: `addNotification` (4671)
- **Read**: `getNotifications` (4667)
- **Update**: `markNotificationsRead` (4684)
- **Delete**: `deleteUserFully` (1879)
- **D1 table**: `notifications`. **PK**: `id`. **FK**: `email →
  users.email`. Migrate: **yes**.

---

## 22. Ads

### `ads_list` (singleton — current)
- **Shape**: JSON array of ad objects (`id, name, type, code, placement,
  status, priority, startDate, endDate, createdAt, updatedAt`).
- **Read**: `getAds` (1976), `getAdForPlacement` (2008)
- **Update**: `saveAds` (2002)
- **D1 table**: `ads`. **PK**: `id`. Migrate: **yes**.

### `ad_code` (singleton — legacy single ad)
- **Read**: `getAds` (1982) — only consulted once, then migrated in-memory
  into the `ads_list` shape and **written back to `ads_list`** (1997) the
  first time `getAds` runs after the legacy key is found.
- Migrate: **no** — by the time this audit runs, if `ads_list` already
  exists, `ad_code` is dead weight kept only for that one-time upgrade
  path. Worth checking via the audit tool whether `ad_code` is still
  present (see "Testing" below) before assuming it's safe to ignore.

---

## 23. Settings

### `settings` (singleton)
- **Shape**: single JSON object — site-wide config (coin reward amounts,
  thresholds, branding, free-mode flags, etc.)
- **Read**: `getSettings` (1033)
- **Update**: `saveSettings` (1047)
- **D1 table**: `settings` (singleton row, `id=1`, `data` TEXT column
  already matches this "just store the JSON blob" shape in
  `0001_initial_schema.sql`). Migrate: **yes**, as-is — no reshaping
  needed since the D1 schema was designed to mirror this key directly.

---

## 24. Analytics

### `anon_presence:<visitorId>` (prefixed, short TTL)
- **Create/Update**: `recordAnonymousPresence` (1623)
- **Read**: `getAnonymousOnlineCount` (1651), via `env.VIDEOS.list({prefix:
  "anon_presence:"})` (1655)
- **D1 table**: `anon_presence`. **PK**: `visitor_id`. Migrate: **yes** —
  D1 has no TTL, so `pruneExpiredPresenceD1` (already written in `db.js`)
  will need to be called opportunistically, as its comment says.

### `anon_visits_total:<date>` / `reg_visits_total:<date>` (prefixed — counters)
- **Update**: `recordAnonymousPresence` (1631–1632), `recordRegisteredVisit`
  (1641–1643)
- **Read**: `getAnalyticsSnapshot` (1662, reads both via 1666–1667)
- **D1 table**: `daily_visit_totals`. **PK**: `(date, kind)`. Migrate:
  **yes**, reshape as a real counter column (`count`) incremented with
  `ON CONFLICT DO UPDATE SET count = count + 1`, exactly as
  `recordDailyVisitD1` in `db.js` already does — this fixes the same
  get-then-put race the KV version has.

### `anon_seen:<date>:<visitorId>` / `reg_seen:<date>:<subject>` (prefixed — TTL dedup markers)
- Same functions as above; these exist purely so a visitor/user is only
  counted once per day.
- **D1 table**: `daily_visit_dedup`. **PK**: `(date, subject, kind)`.
  Migrate: **yes** — `INSERT OR IGNORE` on this table (as
  `recordDailyVisitD1` does) replaces the KV get-then-put-if-absent pattern
  with a single atomic statement.

---

## 25. Admin data

### `admin_audit_log` (singleton — capped array)
- **Shape**: JSON array of `{ admin, action, target, details, timestamp }`,
  capped at 1000.
- **Read**: `getAdminAuditLog` (4715)
- **Update**: `addAdminAuditLog` (4709)
- **D1 table**: `admin_audit_log`. **PK**: `id` autoincrement. Migrate:
  **yes**.

---

## 26. Check-in / active-time state

### `checkin:<email>:<YYYY-MM-DD>` (prefixed, TTL 3 days, marker value `"1"`)
- **Read**: `hasCheckedInToday` (4895)
- **Write**: `doDailyCheckin` (4904)
- **D1 table**: `checkin_state`. **PK**: `(email, date)`. Migrate: **yes**
  — `hasCheckedInTodayD1`/`recordCheckinD1` in `db.js` already implement
  this as `INSERT OR IGNORE`, no TTL needed since old rows are just
  historical record, not live state.

### `activetime:<email>:<YYYY-MM-DD>` (prefixed, TTL 3 days, JSON state)
- **Shape**: `{ minutes, baseAwarded, chunksAwarded, lastBeat }`.
- **Read/Write**: `recordActiveMinute` (4933–4965)
- **D1 table**: `active_time_state`. **PK**: `(email, date)`. Migrate:
  **yes**, matches `getActiveTimeStateD1`/`saveActiveTimeStateD1` in
  `db.js` already.

---

## 27. Other KV data

None found beyond the groups above — every `env.VIDEOS.get/put/delete/list`
call site in `index.js` is accounted for in §1–26. (The audit tool's
`/report` endpoint queries every prefix listed here directly against the
live namespace, so it will also surface anything present in KV that isn't
reachable from current code — e.g. orphaned keys from a removed feature.)

---

## Summary: KV → D1 mapping table

| KV pattern | Kind | D1 target | Notes |
|---|---|---|---|
| `user:<email>` | 1/user | `users` | direct |
| `user_username:<u>` | index | — | derived (`users.username`) |
| `user_referral:<code>` | index | — | derived (`users.referral_code`) |
| `all_users` | singleton | — | superseded by `SELECT * FROM users` |
| `ip_accounts:<ip>` | 1/ip | `ip_accounts` | array → rows |
| `device_accounts:<id>` | 1/device | `device_accounts` | array → rows |
| `video_list` | singleton | `videos` | array → rows |
| `purchasecount:<id>` | 1/video | `purchase_counts` | counter → column, atomic incr |
| `categories_v2` | singleton | `categories`+`subcategories` | array(+nested) → rows |
| `categories` (legacy) | singleton | — | dead once `categories_v2` exists |
| `series_list` | singleton | `series` | array → rows |
| `comments:<id>` | 1/video | `comments` | array → rows |
| `ratings:<id>` | 1/video | `ratings` | array → rows |
| `likedata:<id>` | 1/video | `likes` | two arrays → one table + `action` col |
| `views:<id>` | 1/video | `views` | counter+array → event rows, count = `COUNT(*)` |
| `history:<email>` | 1/user | `watch_history` | array → rows |
| `coinhistory:<email>` | 1/user | `coin_history` | array → rows |
| `transaction_log` | singleton | `transaction_log` | global capped array → rows |
| `purchases:<email>` | 1/user | `purchases` | array → rows |
| `downloads:<email>` | 1/user | `downloads` | array → rows |
| `gift:<id>` | 1/gift | `gifts` | direct |
| `giftsent:<email>` | 1/user | — | derived (`gifts WHERE sender_email`) |
| `gift_reversing:<id>` | TTL lock | — | not durable data, ignore |
| `coinreq_in:`/`coinreq_out:` | 1/user (x2) | `coin_requests` | duplicated record → single row, two-way query |
| `friends:<email>` | 1/user | `friends` | duplicated pair → single canonical row |
| `friendreq_in:`/`friendreq_out:` | 1/user (x2) | `friend_requests` | duplicated record → single row, two-way query |
| `notifications:<email>` | 1/user | `notifications` | array → rows |
| `ads_list` | singleton | `ads` | array → rows |
| `ad_code` (legacy) | singleton | — | one-time-upgrade artifact, check if still present |
| `settings` | singleton | `settings` | direct, same shape |
| `anon_presence:<id>` | 1/visitor | `anon_presence` | direct, needs manual pruning (no TTL in D1) |
| `anon_visits_total:`/`reg_visits_total:` | 1/day | `daily_visit_totals` | counter → atomic column |
| `anon_seen:`/`reg_seen:` | 1/day/subject | `daily_visit_dedup` | TTL marker → `INSERT OR IGNORE` row |
| `admin_audit_log` | singleton | `admin_audit_log` | array → rows |
| `checkin:<email>:<date>` | 1/day/user | `checkin_state` | TTL marker → durable row |
| `activetime:<email>:<date>` | 1/day/user | `active_time_state` | TTL JSON → durable row |

Every D1 target above already has a matching helper function in `db.js`
(built in STEP 4, not yet wired in) — so this audit's mapping and that
file's design independently agree, which is a good cross-check.

---

## Known open questions for later steps (not resolved here)

1. `gift_reversal_claims` exists in the D1 schema but has no KV
   counterpart — the live reversal-race-guard uses a `gift_reversing:` TTL
   key instead. STEP 5/16 needs to decide whether to keep using a
   short-TTL approach (would need a D1-native equivalent, e.g. a row with
   an `expires_at` and opportunistic pruning) or switch to a conditional
   `UPDATE ... WHERE status = 'completed'` and drop the claims table.
2. `friends:` and `coinreq_in:`/`coinreq_out:` and `friendreq_in:`/`_out:`
   all store the same logical record twice (once per party). The migration
   script (STEP 5) needs de-duplication logic so D1 doesn't end up with
   two rows per friendship/request — flagging now so it isn't missed.
3. Whether `categories` (legacy) or `ad_code` (legacy) are still present in
   the live namespace is unknown until the audit tool is actually run
   against production KV (see "Testing," below) — if absent, they can be
   dropped from the migration plan entirely.

---

## Testing the audit tool

All routes require the `MIGRATION_SECRET` secret, sent as either the
`X-Migration-Secret` header or a `?secret=` query param.

```bash
# 1. Set the secret (one-time)
npx wrangler secret put MIGRATION_SECRET

# 2. Full grouped report (counts per known prefix, capped per prefix at 10,000
#    keys per group so one call can't run away on a huge namespace — the
#    "truncated" flag tells you if a group hit that cap)
curl -H "X-Migration-Secret: <secret>" \
  https://<your-worker>.workers.dev/migration/kv-audit/report

# 3. Paginate a single prefix precisely (KV list() cursor pattern)
curl -H "X-Migration-Secret: <secret>" \
  "https://<your-worker>.workers.dev/migration/kv-audit/counts?prefix=user:&limit=1000"
# → { "nextCursor": "...", "listComplete": false, ... }
# repeat with &cursor=<nextCursor> until listComplete is true

# 4. Inspect one example value under a prefix (sensitive fields redacted
#    automatically for user: keys)
curl -H "X-Migration-Secret: <secret>" \
  "https://<your-worker>.workers.dev/migration/kv-audit/sample?prefix=video_list"

# Missing/incorrect secret:
curl https://<your-worker>.workers.dev/migration/kv-audit/report
# → 401 {"error":"Unauthorized"}
```

Local testing against a simulated namespace (no live data touched):

```bash
npx wrangler dev --local
```

Confirm no writes occurred: KV's dashboard "last modified" timestamps for
existing keys should be unchanged after running the audit, since every
call the tool makes is `get`/`list` only (see `migration/kv-audit.js`
header comment for the hard guarantee this is enforced by code review, not
just intent).
