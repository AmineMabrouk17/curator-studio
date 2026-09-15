CREATE TABLE IF NOT EXISTS studies (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'x', 'other')),
  video_id TEXT,
  thumbnail_url TEXT,
  content TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  is_public INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_studies_slug ON studies(slug);
CREATE INDEX IF NOT EXISTS idx_studies_public ON studies(is_public);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  failed INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER
);