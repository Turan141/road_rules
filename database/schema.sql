CREATE TABLE IF NOT EXISTS road_changes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    road_name TEXT,
    type TEXT NOT NULL DEFAULT 'other',
    severity TEXT NOT NULL DEFAULT 'yellow',
    status TEXT NOT NULL DEFAULT 'pending',
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    upvotes INTEGER NOT NULL DEFAULT 0,
    image TEXT
);

ALTER TABLE road_changes
    ADD COLUMN IF NOT EXISTS road_name TEXT;

CREATE INDEX IF NOT EXISTS road_changes_timestamp_idx
    ON road_changes (timestamp DESC);

CREATE INDEX IF NOT EXISTS road_changes_status_idx
    ON road_changes (status);

CREATE TABLE IF NOT EXISTS request_rate_limits (
    scope TEXT NOT NULL,
    identifier_hash TEXT NOT NULL,
    bucket_start TIMESTAMPTZ NOT NULL,
    hits INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (scope, identifier_hash, bucket_start)
);

CREATE INDEX IF NOT EXISTS request_rate_limits_expires_at_idx
    ON request_rate_limits (expires_at);

CREATE TABLE IF NOT EXISTS admin_login_cooldowns (
    account_key TEXT PRIMARY KEY,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lock_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_login_cooldowns_lock_until_idx
    ON admin_login_cooldowns (lock_until);

CREATE TABLE IF NOT EXISTS site_visit_sessions (
    session_hash TEXT PRIMARY KEY,
    visitor_hash TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    entry_path TEXT NOT NULL DEFAULT '/',
    user_agent TEXT NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hits INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS site_visit_sessions_first_seen_idx
    ON site_visit_sessions (first_seen_at DESC);

CREATE INDEX IF NOT EXISTS site_visit_sessions_last_seen_idx
    ON site_visit_sessions (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS site_visit_sessions_visitor_hash_idx
    ON site_visit_sessions (visitor_hash);