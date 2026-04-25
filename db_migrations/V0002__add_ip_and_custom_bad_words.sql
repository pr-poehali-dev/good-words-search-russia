ALTER TABLE t_p30280406_good_words_search_ru.violators
  ADD COLUMN IF NOT EXISTS ip TEXT;

CREATE TABLE IF NOT EXISTS t_p30280406_good_words_search_ru.custom_bad_words (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  added_at TIMESTAMP DEFAULT NOW()
);