CREATE TABLE IF NOT EXISTS road_changes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'other',
    severity TEXT NOT NULL DEFAULT 'yellow',
    status TEXT NOT NULL DEFAULT 'pending',
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    upvotes INTEGER NOT NULL DEFAULT 0,
    image TEXT
);

CREATE INDEX IF NOT EXISTS road_changes_timestamp_idx
    ON road_changes (timestamp DESC);

CREATE INDEX IF NOT EXISTS road_changes_status_idx
    ON road_changes (status);