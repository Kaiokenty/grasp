CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_text        TEXT        NOT NULL,
  category        TEXT        CHECK (category IN ('Work', 'Personal', 'Shopping', 'Health', 'Ideas', 'Other')),
  urgency         TEXT        CHECK (urgency IN ('High', 'Medium', 'Low')),
  extracted_tasks JSONB       NOT NULL DEFAULT '[]',
  is_complete     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     UUID        NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  deadline    TIMESTAMPTZ,
  is_complete BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rollback: DROP TABLE tasks; DROP TABLE notes; DROP TABLE users;
