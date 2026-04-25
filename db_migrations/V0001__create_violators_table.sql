CREATE TABLE IF NOT EXISTS t_p30280406_good_words_search_ru.violators (
  id SERIAL PRIMARY KEY,
  bad_word TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);