export const VIDEOS_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS videos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    description     TEXT,
    thumbnail_url   TEXT,
    file_name       TEXT,
    file_path       TEXT,
    mime_type       TEXT,
    file_size_bytes INTEGER NOT NULL DEFAULT 0
                    CHECK (file_size_bytes >= 0),
    views           INTEGER NOT NULL DEFAULT 0
                    CHECK (views >= 0),
    category_id     INTEGER,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'draft', 'archived')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

CREATE TABLE IF NOT EXISTS video_view_stats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id    INTEGER NOT NULL,
    view_date   TEXT NOT NULL,
    views       INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (video_id) REFERENCES videos(id)
        ON DELETE CASCADE,
    UNIQUE (video_id, view_date)
);

CREATE INDEX IF NOT EXISTS idx_view_stats_date
    ON video_view_stats(view_date);
CREATE INDEX IF NOT EXISTS idx_view_stats_video
    ON video_view_stats(video_id);
`;
