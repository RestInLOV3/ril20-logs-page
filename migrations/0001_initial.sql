-- Migration: 0001_initial
-- TRPG 로그 아카이브 초기 스키마

CREATE TABLE scenarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#808080',
  cover_r2    TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE characters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  pl_name     TEXT NOT NULL,
  image_r2    TEXT,
  bio         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE character_quotes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  quote        TEXT NOT NULL
);

CREATE TABLE logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  order_num   INTEGER NOT NULL DEFAULT 0,
  html_r2     TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  pl_name     TEXT,
  content     TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_characters_scenario ON characters(scenario_id);
CREATE INDEX idx_logs_scenario_order ON logs(scenario_id, order_num);
CREATE INDEX idx_reviews_scenario ON reviews(scenario_id, created_at);
