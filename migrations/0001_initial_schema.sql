-- ============================================================================
-- Migration 0001: Initial D1 schema
-- Mirrors the KV data inventory from STEP 1 / schema design from STEP 2.
-- This migration ONLY creates structure. It does not read or write any
-- existing KV data — that happens in STEP 5 (migration script).
-- Safe to run on a brand-new, empty D1 database.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ─── Users ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
  email               TEXT PRIMARY KEY,
  username            TEXT UNIQUE NOT NULL,
  name                TEXT,
  password_hash       TEXT,
  coins               INTEGER NOT NULL DEFAULT 0,
  is_banned           INTEGER NOT NULL DEFAULT 0,
  ban_reason          TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  provider            TEXT NOT NULL DEFAULT 'password',
  verified            INTEGER NOT NULL DEFAULT 0,
  google_sub          TEXT,
  avatar              TEXT,
  referral_code       TEXT UNIQUE NOT NULL,
  referred_by         TEXT REFERENCES users(email),
  signup_ip           TEXT,
  device_id           TEXT,
  last_login_ip       TEXT,
  last_login_at       INTEGER,
  local_reset_token   INTEGER NOT NULL DEFAULT 0,
  created_at          INTEGER NOT NULL,
  is_private          INTEGER NOT NULL DEFAULT 0,
  show_coins_public   INTEGER,
  show_friends        INTEGER,
  last_seen           INTEGER,
  total_stay_minutes  INTEGER NOT NULL DEFAULT 0,
  total_earned        INTEGER NOT NULL DEFAULT 0,
  referral_count      INTEGER NOT NULL DEFAULT 0,
  checkin_streak      INTEGER NOT NULL DEFAULT 0,
  last_checkin_date   TEXT,
  username_set        INTEGER NOT NULL DEFAULT 1,
  earned_achievements TEXT
);

CREATE INDEX idx_users_last_seen   ON users(last_seen);
CREATE INDEX idx_users_total_earned ON users(total_earned);

CREATE TABLE ip_accounts (
  ip    TEXT NOT NULL,
  email TEXT NOT NULL REFERENCES users(email),
  PRIMARY KEY (ip, email)
);

CREATE TABLE device_accounts (
  device_id TEXT NOT NULL,
  email     TEXT NOT NULL REFERENCES users(email),
  PRIMARY KEY (device_id, email)
);

-- ─── Categories ─────────────────────────────────────────────────────────────

CREATE TABLE categories (
  name       TEXT PRIMARY KEY,
  hidden     INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER
);

CREATE TABLE subcategories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL REFERENCES categories(name),
  name          TEXT NOT NULL,
  UNIQUE (category_name, name)
);

-- ─── Series ─────────────────────────────────────────────────────────────────

CREATE TABLE series (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  coin_cost  INTEGER NOT NULL DEFAULT 0,
  deleted    INTEGER NOT NULL DEFAULT 0,
  deleted_at INTEGER,
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- ─── Videos ─────────────────────────────────────────────────────────────────

CREATE TABLE videos (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  drive_id      TEXT NOT NULL,
  thumbnail     TEXT NOT NULL,
  duration      TEXT,
  category      TEXT,
  sub_category  TEXT,
  description   TEXT,
  coin_cost     INTEGER NOT NULL DEFAULT 0,
  series_id     TEXT REFERENCES series(id),
  part          INTEGER,
  part_order    INTEGER,
  publish_at    INTEGER,
  release_date  TEXT,
  hidden        INTEGER NOT NULL DEFAULT 0,
  draft         INTEGER NOT NULL DEFAULT 0,
  deleted       INTEGER NOT NULL DEFAULT 0,
  deleted_at    INTEGER,
  created_at    INTEGER NOT NULL
);

CREATE INDEX idx_videos_series_id ON videos(series_id);
CREATE INDEX idx_videos_category  ON videos(category);
CREATE INDEX idx_videos_deleted_hidden_draft ON videos(deleted, hidden, draft);
CREATE INDEX idx_videos_created_at ON videos(created_at);

-- ─── Comments / Ratings / Likes / Views ────────────────────────────────────

CREATE TABLE comments (
  id       TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id),
  name     TEXT,
  text     TEXT NOT NULL,
  user_id  TEXT,
  time     TEXT NOT NULL
);

CREATE INDEX idx_comments_video_id ON comments(video_id);

CREATE TABLE ratings (
  id       TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id),
  user_id  TEXT NOT NULL,
  name     TEXT,
  stars    INTEGER NOT NULL,
  text     TEXT,
  time     TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  UNIQUE (video_id, user_id)
);

CREATE INDEX idx_ratings_video_id ON ratings(video_id);

CREATE TABLE likes (
  video_id TEXT NOT NULL REFERENCES videos(id),
  user_id  TEXT NOT NULL,
  action   TEXT NOT NULL CHECK (action IN ('liked', 'disliked')),
  PRIMARY KEY (video_id, user_id)
);

CREATE INDEX idx_likes_video_id ON likes(video_id);

CREATE TABLE views (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL REFERENCES videos(id),
  user_id  TEXT NOT NULL,
  ip       TEXT,
  time     INTEGER NOT NULL
);

CREATE INDEX idx_views_video_user_time ON views(video_id, user_id, time);

-- ─── Watch history ──────────────────────────────────────────────────────────

CREATE TABLE watch_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL REFERENCES users(email),
  video_id   TEXT NOT NULL,
  category   TEXT,
  watched_at INTEGER NOT NULL
);

CREATE INDEX idx_history_email_watched_at ON watch_history(email, watched_at);

-- ─── Purchases / Downloads / Purchase counts ───────────────────────────────

CREATE TABLE purchases (
  email         TEXT NOT NULL REFERENCES users(email),
  item_id       TEXT NOT NULL,
  purchased_at  INTEGER NOT NULL,
  PRIMARY KEY (email, item_id)
);

CREATE TABLE downloads (
  email          TEXT NOT NULL REFERENCES users(email),
  video_id       TEXT NOT NULL,
  downloaded_at  INTEGER NOT NULL,
  PRIMARY KEY (email, video_id)
);

CREATE TABLE purchase_counts (
  video_id TEXT PRIMARY KEY REFERENCES videos(id),
  count    INTEGER NOT NULL DEFAULT 0
);

-- ─── Coins: history / transactions / gifts / requests ──────────────────────

CREATE TABLE coin_history (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL REFERENCES users(email),
  time           INTEGER NOT NULL,
  type           TEXT NOT NULL,
  amount         INTEGER NOT NULL,
  reason         TEXT,
  balance_after  INTEGER NOT NULL
);

CREATE INDEX idx_coin_history_email_time ON coin_history(email, time);

CREATE TABLE transaction_log (
  id              TEXT PRIMARY KEY,
  time            INTEGER NOT NULL,
  type            TEXT NOT NULL,
  from_username   TEXT,
  to_username     TEXT,
  amount          INTEGER NOT NULL,
  status          TEXT NOT NULL,
  note            TEXT,
  request_id      TEXT,
  gift_id         TEXT,
  balance_before  INTEGER,
  balance_after   INTEGER
);

CREATE INDEX idx_transaction_log_time ON transaction_log(time);

CREATE TABLE gifts (
  id                      TEXT PRIMARY KEY,
  sender_email            TEXT NOT NULL REFERENCES users(email),
  sender_username         TEXT NOT NULL,
  recipient_email         TEXT NOT NULL REFERENCES users(email),
  recipient_username      TEXT NOT NULL,
  amount                  INTEGER NOT NULL,
  created_at              INTEGER NOT NULL,
  reverse_window_minutes  INTEGER,
  status                  TEXT NOT NULL CHECK (status IN ('completed', 'reversed')),
  reversed_at             INTEGER,
  reverse_reason          TEXT
);

CREATE INDEX idx_gifts_sender_email    ON gifts(sender_email);
CREATE INDEX idx_gifts_recipient_email ON gifts(recipient_email);

CREATE TABLE gift_reversal_claims (
  gift_id     TEXT PRIMARY KEY REFERENCES gifts(id),
  claimed_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

CREATE TABLE coin_requests (
  id                  TEXT PRIMARY KEY,
  requester_email     TEXT NOT NULL REFERENCES users(email),
  requester_username  TEXT NOT NULL,
  target_email        TEXT NOT NULL REFERENCES users(email),
  target_username     TEXT NOT NULL,
  amount              INTEGER NOT NULL,
  note                TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          INTEGER NOT NULL,
  resolved_at         INTEGER
);

CREATE INDEX idx_coinreq_requester ON coin_requests(requester_email);
CREATE INDEX idx_coinreq_target    ON coin_requests(target_email);

-- ─── Friends ────────────────────────────────────────────────────────────────

CREATE TABLE friends (
  email_a     TEXT NOT NULL REFERENCES users(email),
  email_b     TEXT NOT NULL REFERENCES users(email),
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (email_a, email_b)
);

CREATE TABLE friend_requests (
  id            TEXT PRIMARY KEY,
  from_email    TEXT NOT NULL REFERENCES users(email),
  from_username TEXT NOT NULL,
  to_email      TEXT NOT NULL REFERENCES users(email),
  to_username   TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_friendreq_from ON friend_requests(from_email);
CREATE INDEX idx_friendreq_to   ON friend_requests(to_email);

-- ─── Notifications ──────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL REFERENCES users(email),
  text        TEXT NOT NULL,
  time        INTEGER NOT NULL,
  read        INTEGER NOT NULL DEFAULT 0,
  type        TEXT NOT NULL DEFAULT 'system',
  action_url  TEXT,
  metadata    TEXT
);

CREATE INDEX idx_notifications_email_time ON notifications(email, time);

-- ─── Ads ────────────────────────────────────────────────────────────────────

CREATE TABLE ads (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  type        TEXT NOT NULL DEFAULT 'html',
  code        TEXT,
  placement   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  priority    INTEGER NOT NULL DEFAULT 0,
  start_date  INTEGER,
  end_date    INTEGER,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX idx_ads_placement_status ON ads(placement, status);

-- ─── Settings (singleton) ───────────────────────────────────────────────────

CREATE TABLE settings (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  data        TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- ─── Admin audit log ────────────────────────────────────────────────────────

CREATE TABLE admin_audit_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  admin     TEXT NOT NULL,
  action    TEXT NOT NULL,
  target    TEXT,
  details   TEXT,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_audit_log_timestamp ON admin_audit_log(timestamp);

-- ─── Analytics: presence / daily visits ─────────────────────────────────────

CREATE TABLE anon_presence (
  visitor_id  TEXT PRIMARY KEY,
  last_seen   INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

CREATE INDEX idx_anon_presence_expires_at ON anon_presence(expires_at);

CREATE TABLE daily_visit_dedup (
  date        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('anon', 'reg')),
  expires_at  INTEGER NOT NULL,
  PRIMARY KEY (date, subject, kind)
);

CREATE TABLE daily_visit_totals (
  date   TEXT NOT NULL,
  kind   TEXT NOT NULL CHECK (kind IN ('anon', 'reg')),
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, kind)
);

-- ─── Check-in / active-time state ──────────────────────────────────────────

CREATE TABLE checkin_state (
  email          TEXT NOT NULL REFERENCES users(email),
  date           TEXT NOT NULL,
  checked_in_at  INTEGER NOT NULL,
  PRIMARY KEY (email, date)
);

CREATE TABLE active_time_state (
  email           TEXT NOT NULL REFERENCES users(email),
  date            TEXT NOT NULL,
  minutes         INTEGER NOT NULL DEFAULT 0,
  base_awarded    INTEGER NOT NULL DEFAULT 0,
  chunks_awarded  INTEGER NOT NULL DEFAULT 0,
  last_beat       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, date)
);
