// ============================================================================
// D1 DATABASE HELPERS (STEP 4)
// ----------------------------------------------------------------------------
// One function per existing KV helper in index.js, same name/signature/return
// shape wherever practical, so that swapping a call site from the old KV
// helper to this D1 helper in STEP 16/17 is a mechanical, low-risk change.
//
// NOT YET WIRED IN: nothing in index.js imports or calls these functions.
// The live application still reads/writes exclusively through env.VIDEOS
// (KV) until STEP 16/17. This file only exists so the D1 read/write layer
// can be built and tested in isolation first.
//
// Requires the "DB" binding added to wrangler.toml in this step (env.DB).
// ============================================================================

// Booleans are stored as 0/1 in SQLite; these two helpers keep call sites
// readable and consistent everywhere a bool crosses the D1 boundary.
function toBool(v) { return v ? 1 : 0; }
function fromBool(v) { return !!v; }

// ─── Users / Accounts ───────────────────────────────────────────────────────

async function getUserD1(env, emailOrUsername) {
  const needle = emailOrUsername.toLowerCase();
  let row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(needle).first();
  if (!row) return null;
  return rowToUser(row);
}

async function saveUserD1(env, user) {
  const u = user;
  await env.DB.prepare(`
    UPDATE users SET
      username=?, name=?, password_hash=?, coins=?, is_banned=?, ban_reason=?,
      is_active=?, provider=?, verified=?, google_sub=?, avatar=?, referred_by=?,
      signup_ip=?, device_id=?, last_login_ip=?, last_login_at=?, local_reset_token=?,
      is_private=?, show_coins_public=?, show_friends=?, last_seen=?,
      total_stay_minutes=?, total_earned=?, referral_count=?, checkin_streak=?,
      last_checkin_date=?, username_set=?, earned_achievements=?
    WHERE email=?
  `).bind(
    u.username, u.name || null, u.passwordHash || null, u.coins || 0, toBool(u.isBanned), u.banReason || null,
    toBool(u.isActive), u.provider || "password", toBool(u.verified), u.googleSub || null, u.avatar || null, u.referredBy || null,
    u.signupIp || null, u.deviceId || null, u.lastLoginIp || null, u.lastLoginAt || null, u.localResetToken || 0,
    toBool(u.isPrivate), u.showCoinsPublic == null ? null : toBool(u.showCoinsPublic), u.showFriends == null ? null : toBool(u.showFriends), u.lastSeen || null,
    u.totalStayMinutes || 0, u.totalEarned || 0, u.referralCount || 0, u.checkinStreak || 0,
    u.lastCheckinDate || null, toBool(u.usernameSet), u.earnedAchievements ? JSON.stringify(u.earnedAchievements) : null,
    u.email.toLowerCase()
  ).run();
}

function rowToUser(row) {
  return {
    email: row.email,
    username: row.username,
    name: row.name,
    passwordHash: row.password_hash,
    coins: row.coins,
    isBanned: fromBool(row.is_banned),
    banReason: row.ban_reason,
    isActive: fromBool(row.is_active),
    provider: row.provider,
    verified: fromBool(row.verified),
    googleSub: row.google_sub,
    avatar: row.avatar,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    signupIp: row.signup_ip,
    deviceId: row.device_id,
    lastLoginIp: row.last_login_ip,
    lastLoginAt: row.last_login_at,
    localResetToken: row.local_reset_token,
    createdAt: row.created_at,
    isPrivate: fromBool(row.is_private),
    showCoinsPublic: row.show_coins_public == null ? null : fromBool(row.show_coins_public),
    showFriends: row.show_friends == null ? null : fromBool(row.show_friends),
    lastSeen: row.last_seen,
    totalStayMinutes: row.total_stay_minutes,
    totalEarned: row.total_earned,
    referralCount: row.referral_count,
    checkinStreak: row.checkin_streak,
    lastCheckinDate: row.last_checkin_date,
    usernameSet: fromBool(row.username_set),
    earnedAchievements: row.earned_achievements ? JSON.parse(row.earned_achievements) : []
  };
}

async function createUserD1(env, user) {
  const u = user;
  await env.DB.prepare(`
    INSERT INTO users (
      email, username, name, password_hash, coins, is_banned, ban_reason, is_active,
      provider, verified, google_sub, avatar, referral_code, referred_by, signup_ip,
      device_id, last_login_ip, last_login_at, local_reset_token, created_at, is_private,
      show_coins_public, show_friends, last_seen, total_stay_minutes, total_earned,
      referral_count, checkin_streak, last_checkin_date, username_set, earned_achievements
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    u.email.toLowerCase(), u.username.toLowerCase(), u.name || null, u.passwordHash || null,
    u.coins || 0, toBool(u.isBanned), u.banReason || null, toBool(u.isActive),
    u.provider || "password", toBool(u.verified), u.googleSub || null, u.avatar || null,
    u.referralCode, u.referredBy || null, u.signupIp || null,
    u.deviceId || null, u.lastLoginIp || null, u.lastLoginAt || null, u.localResetToken || 0,
    u.createdAt || Date.now(), toBool(u.isPrivate),
    u.showCoinsPublic == null ? null : toBool(u.showCoinsPublic), u.showFriends == null ? null : toBool(u.showFriends),
    u.lastSeen || null, u.totalStayMinutes || 0, u.totalEarned || 0,
    u.referralCount || 0, u.checkinStreak || 0, u.lastCheckinDate || null,
    toBool(u.usernameSet), u.earnedAchievements ? JSON.stringify(u.earnedAchievements) : null
  ).run();
}

async function deleteUserFullyD1(env, email) {
  const lc = email.toLowerCase();
  await env.DB.prepare("DELETE FROM users WHERE email = ?").bind(lc).run();
}

// Replaces getAllUsers()+enrichUsers() — with D1 the "all_users" mirror no
// longer exists; this queries the single source of truth directly.
async function getAllUsersD1(env) {
  const { results } = await env.DB.prepare("SELECT * FROM users").all();
  return results.map(rowToUser);
}

async function getIpAccountsD1(env, ip) {
  if (!ip || ip === "unknown") return [];
  const { results } = await env.DB.prepare("SELECT email FROM ip_accounts WHERE ip = ?").bind(ip).all();
  return results.map(r => r.email);
}
async function addIpAccountD1(env, ip, email) {
  if (!ip || ip === "unknown") return;
  await env.DB.prepare("INSERT OR IGNORE INTO ip_accounts (ip, email) VALUES (?, ?)").bind(ip, email).run();
}
async function getDeviceAccountsD1(env, deviceId) {
  if (!deviceId) return [];
  const { results } = await env.DB.prepare("SELECT email FROM device_accounts WHERE device_id = ?").bind(deviceId).all();
  return results.map(r => r.email);
}
async function addDeviceAccountD1(env, deviceId, email) {
  if (!deviceId) return;
  await env.DB.prepare("INSERT OR IGNORE INTO device_accounts (device_id, email) VALUES (?, ?)").bind(deviceId, email).run();
}

// ─── Videos ─────────────────────────────────────────────────────────────────

function rowToVideo(row) {
  return {
    id: row.id, title: row.title, driveId: row.drive_id, thumbnail: row.thumbnail,
    duration: row.duration, category: row.category, subCategory: row.sub_category,
    description: row.description, coinCost: row.coin_cost, seriesId: row.series_id,
    part: row.part, partOrder: row.part_order, publishAt: row.publish_at,
    releaseDate: row.release_date, hidden: fromBool(row.hidden), draft: fromBool(row.draft),
    deleted: fromBool(row.deleted), deletedAt: row.deleted_at, createdAt: row.created_at
  };
}

async function getVideosD1(env) {
  const { results } = await env.DB.prepare("SELECT * FROM videos ORDER BY created_at DESC").all();
  return results.map(rowToVideo);
}

async function getVideoByIdD1(env, id) {
  const row = await env.DB.prepare("SELECT * FROM videos WHERE id = ?").bind(id).first();
  return row ? rowToVideo(row) : null;
}

async function saveVideoD1(env, v) {
  await env.DB.prepare(`
    INSERT INTO videos (id, title, drive_id, thumbnail, duration, category, sub_category,
      description, coin_cost, series_id, part, part_order, publish_at, release_date,
      hidden, draft, deleted, deleted_at, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, drive_id=excluded.drive_id, thumbnail=excluded.thumbnail,
      duration=excluded.duration, category=excluded.category, sub_category=excluded.sub_category,
      description=excluded.description, coin_cost=excluded.coin_cost, series_id=excluded.series_id,
      part=excluded.part, part_order=excluded.part_order, publish_at=excluded.publish_at,
      release_date=excluded.release_date, hidden=excluded.hidden, draft=excluded.draft,
      deleted=excluded.deleted, deleted_at=excluded.deleted_at
  `).bind(
    v.id, v.title, v.driveId, v.thumbnail, v.duration || null, v.category || null, v.subCategory || null,
    v.description || null, v.coinCost || 0, v.seriesId || null, v.part || null, v.partOrder || null,
    v.publishAt || null, v.releaseDate || null, toBool(v.hidden), toBool(v.draft), toBool(v.deleted),
    v.deletedAt || null, v.createdAt || Date.now()
  ).run();
}

// ─── Categories ─────────────────────────────────────────────────────────────

async function getCategoriesD1(env) {
  const { results: cats } = await env.DB.prepare("SELECT * FROM categories ORDER BY sort_order, name").all();
  const { results: subs } = await env.DB.prepare("SELECT * FROM subcategories ORDER BY id").all();
  return cats.map(c => ({
    name: c.name,
    hidden: fromBool(c.hidden),
    subs: subs.filter(s => s.category_name === c.name).map(s => s.name)
  }));
}

async function saveCategoryD1(env, name, hidden, sortOrder) {
  await env.DB.prepare(`
    INSERT INTO categories (name, hidden, sort_order) VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET hidden=excluded.hidden, sort_order=excluded.sort_order
  `).bind(name, toBool(hidden), sortOrder ?? null).run();
}

async function addSubcategoryD1(env, categoryName, subName) {
  await env.DB.prepare("INSERT OR IGNORE INTO subcategories (category_name, name) VALUES (?, ?)")
    .bind(categoryName, subName).run();
}

// ─── Series ─────────────────────────────────────────────────────────────────

function rowToSeries(row) {
  return {
    id: row.id, title: row.title, coinCost: row.coin_cost, deleted: fromBool(row.deleted),
    deletedAt: row.deleted_at, hidden: fromBool(row.hidden), createdAt: row.created_at
  };
}

async function getSeriesListD1(env) {
  const { results } = await env.DB.prepare("SELECT * FROM series ORDER BY created_at").all();
  return results.map(rowToSeries);
}

async function getSeriesByIdD1(env, id) {
  const row = await env.DB.prepare("SELECT * FROM series WHERE id = ?").bind(id).first();
  return row ? rowToSeries(row) : null;
}

async function saveSeriesD1(env, s) {
  await env.DB.prepare(`
    INSERT INTO series (id, title, coin_cost, deleted, deleted_at, hidden, created_at)
    VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, coin_cost=excluded.coin_cost, deleted=excluded.deleted,
      deleted_at=excluded.deleted_at, hidden=excluded.hidden
  `).bind(s.id, s.title, s.coinCost || 0, toBool(s.deleted), s.deletedAt || null, toBool(s.hidden), s.createdAt || Date.now()).run();
}

// ─── Comments ───────────────────────────────────────────────────────────────

async function getCommentsD1(env, videoId) {
  const { results } = await env.DB.prepare("SELECT * FROM comments WHERE video_id = ? ORDER BY time DESC").bind(videoId).all();
  return results.map(r => ({ id: r.id, name: r.name, text: r.text, userId: r.user_id, time: r.time }));
}
async function addCommentD1(env, videoId, id, name, text, userId, time) {
  await env.DB.prepare("INSERT INTO comments (id, video_id, name, text, user_id, time) VALUES (?,?,?,?,?,?)")
    .bind(id, videoId, name, text, userId, time).run();
}
async function deleteCommentD1(env, commentId) {
  await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
}
async function editCommentD1(env, commentId, newText) {
  await env.DB.prepare("UPDATE comments SET text = ? WHERE id = ?").bind(newText, commentId).run();
}

// ─── Ratings ────────────────────────────────────────────────────────────────

async function getRatingsD1(env, videoId) {
  const { results } = await env.DB.prepare("SELECT * FROM ratings WHERE video_id = ? ORDER BY time DESC").bind(videoId).all();
  return results.map(r => ({ id: r.id, userId: r.user_id, name: r.name, stars: r.stars, text: r.text, time: r.time, isAdmin: fromBool(r.is_admin) }));
}
async function addOrUpdateRatingD1(env, videoId, id, userId, name, stars, text, time, isAdmin) {
  await env.DB.prepare(`
    INSERT INTO ratings (id, video_id, user_id, name, stars, text, time, is_admin)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(video_id, user_id) DO UPDATE SET
      name=excluded.name, stars=excluded.stars, text=excluded.text, time=excluded.time
  `).bind(id, videoId, userId, name, stars, text, time, toBool(isAdmin)).run();
}
async function deleteRatingByIdD1(env, ratingId) {
  await env.DB.prepare("DELETE FROM ratings WHERE id = ?").bind(ratingId).run();
}

// ─── Likes / Dislikes ───────────────────────────────────────────────────────

async function getLikeDataD1(env, videoId) {
  const { results } = await env.DB.prepare("SELECT user_id, action FROM likes WHERE video_id = ?").bind(videoId).all();
  const likedBy = results.filter(r => r.action === "liked").map(r => r.user_id);
  const dislikedBy = results.filter(r => r.action === "disliked").map(r => r.user_id);
  return { likes: likedBy.length, dislikes: dislikedBy.length, likedBy, dislikedBy };
}
async function setLikeActionD1(env, videoId, userId, action /* "liked"|"disliked"|null */) {
  if (action === null) {
    await env.DB.prepare("DELETE FROM likes WHERE video_id = ? AND user_id = ?").bind(videoId, userId).run();
    return;
  }
  await env.DB.prepare(`
    INSERT INTO likes (video_id, user_id, action) VALUES (?, ?, ?)
    ON CONFLICT(video_id, user_id) DO UPDATE SET action = excluded.action
  `).bind(videoId, userId, action).run();
}
async function resetLikesD1(env, videoId) {
  await env.DB.prepare("DELETE FROM likes WHERE video_id = ?").bind(videoId).run();
}

// ─── Views ──────────────────────────────────────────────────────────────────

async function getViewsD1(env, videoId) {
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM views WHERE video_id = ?").bind(videoId).first();
  return { count: countRow ? countRow.c : 0 };
}
async function hasRecentViewD1(env, videoId, userId, sinceMs) {
  const row = await env.DB.prepare("SELECT 1 FROM views WHERE video_id = ? AND user_id = ? AND time > ? LIMIT 1")
    .bind(videoId, userId, sinceMs).first();
  return !!row;
}
async function addViewD1(env, videoId, userId, ip, time) {
  await env.DB.prepare("INSERT INTO views (video_id, user_id, ip, time) VALUES (?,?,?,?)").bind(videoId, userId, ip || "unknown", time).run();
}
async function resetViewsD1(env, videoId) {
  await env.DB.prepare("DELETE FROM views WHERE video_id = ?").bind(videoId).run();
}

// ─── Watch history ──────────────────────────────────────────────────────────

async function getWatchHistoryD1(env, email, limit = 300) {
  const { results } = await env.DB.prepare(
    "SELECT video_id, category, watched_at FROM watch_history WHERE email = ? ORDER BY watched_at DESC LIMIT ?"
  ).bind(email.toLowerCase(), limit).all();
  return results.map(r => ({ id: r.video_id, category: r.category, watchedAt: r.watched_at }));
}
async function recordWatchHistoryD1(env, email, video) {
  const lc = email.toLowerCase();
  // Mirrors current de-dupe-by-video behavior: drop any older row for this
  // video before inserting the new one, so it moves back to "most recent".
  await env.DB.prepare("DELETE FROM watch_history WHERE email = ? AND video_id = ?").bind(lc, video.id).run();
  await env.DB.prepare("INSERT INTO watch_history (email, video_id, category, watched_at) VALUES (?,?,?,?)")
    .bind(lc, video.id, video.category || null, Date.now()).run();
}

// ─── Purchases / Downloads / Purchase counts ───────────────────────────────

async function getPurchasesD1(env, email) {
  const { results } = await env.DB.prepare("SELECT item_id FROM purchases WHERE email = ? ORDER BY purchased_at DESC").bind(email.toLowerCase()).all();
  return results.map(r => r.item_id);
}
async function addPurchaseD1(env, email, itemId) {
  await env.DB.prepare("INSERT OR IGNORE INTO purchases (email, item_id, purchased_at) VALUES (?,?,?)")
    .bind(email.toLowerCase(), itemId, Date.now()).run();
}

async function getDownloadsD1(env, email) {
  const { results } = await env.DB.prepare("SELECT video_id FROM downloads WHERE email = ? ORDER BY downloaded_at DESC").bind(email.toLowerCase()).all();
  return results.map(r => r.video_id);
}
async function addDownloadD1(env, email, videoId) {
  await env.DB.prepare("INSERT OR IGNORE INTO downloads (email, video_id, downloaded_at) VALUES (?,?,?)")
    .bind(email.toLowerCase(), videoId, Date.now()).run();
}

async function getPurchaseCountD1(env, videoId) {
  const row = await env.DB.prepare("SELECT count FROM purchase_counts WHERE video_id = ?").bind(videoId).first();
  return row ? row.count : 0;
}
async function incPurchaseCountD1(env, videoId) {
  await env.DB.prepare(`
    INSERT INTO purchase_counts (video_id, count) VALUES (?, 1)
    ON CONFLICT(video_id) DO UPDATE SET count = count + 1
  `).bind(videoId).run();
  return getPurchaseCountD1(env, videoId);
}

// ─── Coin history / transaction log ────────────────────────────────────────

async function getCoinHistoryD1(env, email, limit = 200) {
  const { results } = await env.DB.prepare("SELECT * FROM coin_history WHERE email = ? ORDER BY time DESC LIMIT ?")
    .bind(email.toLowerCase(), limit).all();
  return results.map(r => ({ id: r.id, time: r.time, type: r.type, amount: r.amount, reason: r.reason, balanceAfter: r.balance_after }));
}
async function addCoinHistoryEntryD1(env, email, id, entry) {
  await env.DB.prepare("INSERT INTO coin_history (id, email, time, type, amount, reason, balance_after) VALUES (?,?,?,?,?,?,?)")
    .bind(id, email.toLowerCase(), Date.now(), entry.type, entry.amount, entry.reason || null, entry.balanceAfter).run();
}

async function addTransactionLogD1(env, id, entry) {
  await env.DB.prepare(`
    INSERT INTO transaction_log (id, time, type, from_username, to_username, amount, status, note, request_id, gift_id, balance_before, balance_after)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, Date.now(), entry.type, entry.from || null, entry.to || null, entry.amount,
    entry.status, entry.note || null, entry.requestId || null, entry.giftId || null,
    entry.balanceBefore == null ? null : entry.balanceBefore, entry.balanceAfter == null ? null : entry.balanceAfter
  ).run();
}
async function getTransactionLogD1(env, limit = 1000) {
  const { results } = await env.DB.prepare("SELECT * FROM transaction_log ORDER BY time DESC LIMIT ?").bind(limit).all();
  return results;
}

// ─── Gifts ──────────────────────────────────────────────────────────────────

async function saveGiftD1(env, gift) {
  await env.DB.prepare(`
    INSERT INTO gifts (id, sender_email, sender_username, recipient_email, recipient_username, amount, created_at, reverse_window_minutes, status, reversed_at, reverse_reason)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET status=excluded.status, reversed_at=excluded.reversed_at, reverse_reason=excluded.reverse_reason
  `).bind(
    gift.id, gift.senderEmail, gift.senderUsername, gift.recipientEmail, gift.recipientUsername,
    gift.amount, gift.createdAt, gift.reverseWindowMinutes ?? null, gift.status, gift.reversedAt || null, gift.reverseReason || null
  ).run();
}
async function getGiftD1(env, id) {
  const row = await env.DB.prepare("SELECT * FROM gifts WHERE id = ?").bind(id).first();
  if (!row) return null;
  return {
    id: row.id, senderEmail: row.sender_email, senderUsername: row.sender_username,
    recipientEmail: row.recipient_email, recipientUsername: row.recipient_username,
    amount: row.amount, createdAt: row.created_at, reverseWindowMinutes: row.reverse_window_minutes,
    status: row.status, reversedAt: row.reversed_at, reverseReason: row.reverse_reason
  };
}
async function getSentGiftsD1(env, email) {
  const { results } = await env.DB.prepare("SELECT id FROM gifts WHERE sender_email = ? ORDER BY created_at DESC LIMIT 50").bind(email.toLowerCase()).all();
  return results.map(r => r.id);
}
// Replaces the KV TTL-30s claim key — D1 has no TTL, so the row's own
// expires_at is checked explicitly; INSERT OR IGNORE gives the same
// "first writer wins" atomicity as KV put-if-absent.
async function claimGiftReversalD1(env, giftId, ttlSeconds = 30) {
  const now = Date.now();
  await env.DB.prepare("DELETE FROM gift_reversal_claims WHERE gift_id = ? AND expires_at < ?").bind(giftId, now).run();
  const result = await env.DB.prepare("INSERT OR IGNORE INTO gift_reversal_claims (gift_id, claimed_at, expires_at) VALUES (?,?,?)")
    .bind(giftId, now, now + ttlSeconds * 1000).run();
  return result.meta.changes === 1; // true = we won the claim, false = already claimed
}

// ─── Coin requests ──────────────────────────────────────────────────────────

async function getCoinRequestsInD1(env, email) {
  const { results } = await env.DB.prepare("SELECT * FROM coin_requests WHERE target_email = ? ORDER BY created_at DESC LIMIT 50").bind(email.toLowerCase()).all();
  return results.map(rowToCoinRequest);
}
async function getCoinRequestsOutD1(env, email) {
  const { results } = await env.DB.prepare("SELECT * FROM coin_requests WHERE requester_email = ? ORDER BY created_at DESC LIMIT 50").bind(email.toLowerCase()).all();
  return results.map(rowToCoinRequest);
}
function rowToCoinRequest(r) {
  return {
    id: r.id, requesterEmail: r.requester_email, requesterUsername: r.requester_username,
    targetEmail: r.target_email, targetUsername: r.target_username, amount: r.amount,
    note: r.note, status: r.status, createdAt: r.created_at, resolvedAt: r.resolved_at
  };
}
async function createCoinRequestD1(env, id, requester, target, amount, note) {
  await env.DB.prepare(`
    INSERT INTO coin_requests (id, requester_email, requester_username, target_email, target_username, amount, note, status, created_at)
    VALUES (?,?,?,?,?,?,?,'pending',?)
  `).bind(id, requester.email, requester.username, target.email, target.username, amount, (note || "").slice(0, 140), Date.now()).run();
}
async function setCoinRequestStatusD1(env, id, status) {
  await env.DB.prepare("UPDATE coin_requests SET status = ?, resolved_at = ? WHERE id = ?").bind(status, Date.now(), id).run();
}
async function findCoinRequestD1(env, id) {
  const row = await env.DB.prepare("SELECT * FROM coin_requests WHERE id = ?").bind(id).first();
  return row ? rowToCoinRequest(row) : null;
}

// ─── Friends ────────────────────────────────────────────────────────────────

// Pair is stored with the alphabetically-lesser email first so each
// friendship is exactly one row regardless of lookup direction.
function friendPair(a, b) {
  const x = a.toLowerCase(), y = b.toLowerCase();
  return x < y ? [x, y] : [y, x];
}
async function getFriendsD1(env, email) {
  const lc = email.toLowerCase();
  const { results } = await env.DB.prepare("SELECT * FROM friends WHERE email_a = ? OR email_b = ?").bind(lc, lc).all();
  // Resolve the "other side" email/username for each row via a users join,
  // matching the denormalized {email, username} shape the KV list stored.
  const others = results.map(r => r.email_a === lc ? r.email_b : r.email_a);
  if (!others.length) return [];
  const placeholders = others.map(() => "?").join(",");
  const { results: userRows } = await env.DB.prepare(`SELECT email, username FROM users WHERE email IN (${placeholders})`).bind(...others).all();
  return userRows;
}
async function areFriendsD1(env, emailA, emailB) {
  const [a, b] = friendPair(emailA, emailB);
  const row = await env.DB.prepare("SELECT 1 FROM friends WHERE email_a = ? AND email_b = ?").bind(a, b).first();
  return !!row;
}
async function addFriendPairD1(env, emailA, emailB) {
  const [a, b] = friendPair(emailA, emailB);
  await env.DB.prepare("INSERT OR IGNORE INTO friends (email_a, email_b, created_at) VALUES (?,?,?)").bind(a, b, Date.now()).run();
}
async function removeFriendPairD1(env, emailA, emailB) {
  const [a, b] = friendPair(emailA, emailB);
  await env.DB.prepare("DELETE FROM friends WHERE email_a = ? AND email_b = ?").bind(a, b).run();
}

async function getFriendRequestsInD1(env, email) {
  const { results } = await env.DB.prepare("SELECT * FROM friend_requests WHERE to_email = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 200").bind(email.toLowerCase()).all();
  return results.map(rowToFriendRequest);
}
async function getFriendRequestsOutD1(env, email) {
  const { results } = await env.DB.prepare("SELECT * FROM friend_requests WHERE from_email = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 200").bind(email.toLowerCase()).all();
  return results.map(rowToFriendRequest);
}
function rowToFriendRequest(r) {
  return { id: r.id, fromEmail: r.from_email, fromUsername: r.from_username, toEmail: r.to_email, toUsername: r.to_username, createdAt: r.created_at };
}
async function createFriendRequestD1(env, id, fromUser, toUser) {
  await env.DB.prepare("INSERT INTO friend_requests (id, from_email, from_username, to_email, to_username, created_at, status) VALUES (?,?,?,?,?,?,'pending')")
    .bind(id, fromUser.email, fromUser.username, toUser.email, toUser.username, Date.now()).run();
}
async function resolveFriendRequestD1(env, fromEmail, toEmail, status) {
  await env.DB.prepare("UPDATE friend_requests SET status = ? WHERE from_email = ? AND to_email = ? AND status = 'pending'")
    .bind(status, fromEmail.toLowerCase(), toEmail.toLowerCase()).run();
}

// ─── Notifications ──────────────────────────────────────────────────────────

async function getNotificationsD1(env, email, limit = 100) {
  const { results } = await env.DB.prepare("SELECT * FROM notifications WHERE email = ? ORDER BY time DESC LIMIT ?").bind(email.toLowerCase(), limit).all();
  return results.map(r => ({ id: r.id, text: r.text, time: r.time, read: fromBool(r.read), type: r.type, actionUrl: r.action_url, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
}
async function addNotificationD1(env, id, email, text, meta) {
  await env.DB.prepare("INSERT INTO notifications (id, email, text, time, read, type, action_url, metadata) VALUES (?,?,?,?,0,?,?,?)")
    .bind(id, email.toLowerCase(), text, Date.now(), (meta && meta.type) || "system", (meta && meta.actionUrl) || null, meta && meta.metadata ? JSON.stringify(meta.metadata) : null).run();
}
async function markNotificationsReadD1(env, email) {
  await env.DB.prepare("UPDATE notifications SET read = 1 WHERE email = ?").bind(email.toLowerCase()).run();
}

// ─── Ads ────────────────────────────────────────────────────────────────────

async function getAdsD1(env) {
  const { results } = await env.DB.prepare("SELECT * FROM ads ORDER BY priority DESC").all();
  return results.map(r => ({
    id: r.id, name: r.name, type: r.type, code: r.code, placement: r.placement, status: r.status,
    priority: r.priority, startDate: r.start_date, endDate: r.end_date, createdAt: r.created_at, updatedAt: r.updated_at
  }));
}
async function saveAdD1(env, ad) {
  await env.DB.prepare(`
    INSERT INTO ads (id, name, type, code, placement, status, priority, start_date, end_date, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, type=excluded.type, code=excluded.code, placement=excluded.placement,
      status=excluded.status, priority=excluded.priority, start_date=excluded.start_date,
      end_date=excluded.end_date, updated_at=excluded.updated_at
  `).bind(
    ad.id, ad.name || null, ad.type || "html", ad.code || null, ad.placement, ad.status || "active",
    ad.priority || 0, ad.startDate || null, ad.endDate || null, ad.createdAt || Date.now(), Date.now()
  ).run();
}
async function deleteAdD1(env, id) {
  await env.DB.prepare("DELETE FROM ads WHERE id = ?").bind(id).run();
}

// ─── Settings (singleton) ───────────────────────────────────────────────────

async function getSettingsRawD1(env) {
  const row = await env.DB.prepare("SELECT data FROM settings WHERE id = 1").first();
  return row ? JSON.parse(row.data) : {};
}
async function saveSettingsD1(env, settingsObj) {
  await env.DB.prepare(`
    INSERT INTO settings (id, data, updated_at) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).bind(JSON.stringify(settingsObj), Date.now()).run();
}

// ─── Admin audit log ────────────────────────────────────────────────────────

async function addAdminAuditLogD1(env, admin, action, target, details) {
  await env.DB.prepare("INSERT INTO admin_audit_log (admin, action, target, details, timestamp) VALUES (?,?,?,?,?)")
    .bind(admin, action, target || null, details || "", Date.now()).run();
}
async function getAdminAuditLogD1(env, limit = 1000) {
  const { results } = await env.DB.prepare("SELECT * FROM admin_audit_log ORDER BY timestamp DESC LIMIT ?").bind(limit).all();
  return results;
}

// ─── Analytics: presence / daily visits ─────────────────────────────────────

async function recordAnonymousPresenceD1(env, visitorId, ttlSeconds = 60) {
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO anon_presence (visitor_id, last_seen, expires_at) VALUES (?,?,?)
    ON CONFLICT(visitor_id) DO UPDATE SET last_seen=excluded.last_seen, expires_at=excluded.expires_at
  `).bind(visitorId, now, now + ttlSeconds * 1000).run();
}
async function getAnonymousOnlineCountD1(env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM anon_presence WHERE expires_at > ?").bind(Date.now()).first();
  return row ? row.c : 0;
}
// Prunes rows past expiry — call opportunistically (e.g. from the same
// request that records a heartbeat) since D1 has no automatic TTL sweep.
async function pruneExpiredPresenceD1(env) {
  await env.DB.prepare("DELETE FROM anon_presence WHERE expires_at < ?").bind(Date.now()).run();
}

async function recordDailyVisitD1(env, date, subject, kind, dedupTtlSeconds) {
  const now = Date.now();
  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO daily_visit_dedup (date, subject, kind, expires_at) VALUES (?,?,?,?)
  `).bind(date, subject, kind, now + dedupTtlSeconds * 1000).run();
  if (result.meta.changes === 1) {
    await env.DB.prepare(`
      INSERT INTO daily_visit_totals (date, kind, count) VALUES (?, ?, 1)
      ON CONFLICT(date, kind) DO UPDATE SET count = count + 1
    `).bind(date, kind).run();
  }
}
async function getDailyVisitTotalD1(env, date, kind) {
  const row = await env.DB.prepare("SELECT count FROM daily_visit_totals WHERE date = ? AND kind = ?").bind(date, kind).first();
  return row ? row.count : 0;
}

// ─── Check-in / active-time state ──────────────────────────────────────────

async function hasCheckedInTodayD1(env, email, date) {
  const row = await env.DB.prepare("SELECT 1 FROM checkin_state WHERE email = ? AND date = ?").bind(email.toLowerCase(), date).first();
  return !!row;
}
async function recordCheckinD1(env, email, date) {
  await env.DB.prepare("INSERT OR IGNORE INTO checkin_state (email, date, checked_in_at) VALUES (?,?,?)")
    .bind(email.toLowerCase(), date, Date.now()).run();
}

async function getActiveTimeStateD1(env, email, date) {
  const row = await env.DB.prepare("SELECT * FROM active_time_state WHERE email = ? AND date = ?").bind(email.toLowerCase(), date).first();
  return row
    ? { minutes: row.minutes, baseAwarded: fromBool(row.base_awarded), chunksAwarded: row.chunks_awarded, lastBeat: row.last_beat }
    : { minutes: 0, baseAwarded: false, chunksAwarded: 0, lastBeat: 0 };
}
async function saveActiveTimeStateD1(env, email, date, state) {
  await env.DB.prepare(`
    INSERT INTO active_time_state (email, date, minutes, base_awarded, chunks_awarded, last_beat)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(email, date) DO UPDATE SET
      minutes=excluded.minutes, base_awarded=excluded.base_awarded,
      chunks_awarded=excluded.chunks_awarded, last_beat=excluded.last_beat
  `).bind(email.toLowerCase(), date, state.minutes, toBool(state.baseAwarded), state.chunksAwarded, state.lastBeat).run();
}

module.exports = {
  toBool, fromBool,
  getUserD1, saveUserD1, createUserD1, deleteUserFullyD1, getAllUsersD1,
  getIpAccountsD1, addIpAccountD1, getDeviceAccountsD1, addDeviceAccountD1,
  getVideosD1, getVideoByIdD1, saveVideoD1,
  getCategoriesD1, saveCategoryD1, addSubcategoryD1,
  getSeriesListD1, getSeriesByIdD1, saveSeriesD1,
  getCommentsD1, addCommentD1, deleteCommentD1, editCommentD1,
  getRatingsD1, addOrUpdateRatingD1, deleteRatingByIdD1,
  getLikeDataD1, setLikeActionD1, resetLikesD1,
  getViewsD1, hasRecentViewD1, addViewD1, resetViewsD1,
  getWatchHistoryD1, recordWatchHistoryD1,
  getPurchasesD1, addPurchaseD1, getDownloadsD1, addDownloadD1,
  getPurchaseCountD1, incPurchaseCountD1,
  getCoinHistoryD1, addCoinHistoryEntryD1, addTransactionLogD1, getTransactionLogD1,
  saveGiftD1, getGiftD1, getSentGiftsD1, claimGiftReversalD1,
  getCoinRequestsInD1, getCoinRequestsOutD1, createCoinRequestD1, setCoinRequestStatusD1, findCoinRequestD1,
  getFriendsD1, areFriendsD1, addFriendPairD1, removeFriendPairD1,
  getFriendRequestsInD1, getFriendRequestsOutD1, createFriendRequestD1, resolveFriendRequestD1,
  getNotificationsD1, addNotificationD1, markNotificationsReadD1,
  getAdsD1, saveAdD1, deleteAdD1,
  getSettingsRawD1, saveSettingsD1,
  addAdminAuditLogD1, getAdminAuditLogD1,
  recordAnonymousPresenceD1, getAnonymousOnlineCountD1, pruneExpiredPresenceD1,
  recordDailyVisitD1, getDailyVisitTotalD1,
  hasCheckedInTodayD1, recordCheckinD1, getActiveTimeStateD1, saveActiveTimeStateD1
};
