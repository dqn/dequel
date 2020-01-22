DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

DROP TABLE IF EXISTS tests CASCADE;

CREATE TABLE tests (
  id BIGSERIAL NOT NULL,
  test_text TEXT NOT NULL DEFAULT '',
  test_bigint BIGINT NOT NULL DEFAULT 0,
  test_boolean BOOLEAN NOT NULL DEFAULT FALSE,
  test_jsonb JSONB NOT NULL DEFAULT '{}',
  test_text_array TEXT[] NOT NULL DEFAULT '{}',
  test_timestamptz TIMESTAMPTZ NOT NULL DEFAULT '-infinity',
  PRIMARY KEY(id)
);

INSERT INTO tests (
  test_text,
  test_bigint,
  test_boolean,
  test_jsonb,
  test_text_array,
  test_timestamptz
) VALUES (
  'hello',
  42,
  TRUE,
  '{"foo":"bar"}',
  '{"Node.js","PostgreSQL","dequel"}',
  NOW()
);
