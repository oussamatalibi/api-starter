-- School library (biblio) table for the CRUD lab
-- Run this in the Neon SQL Editor, then set DATABASE_URL on Vercel.

-- Remove the old simple notes table if it exists
DROP TABLE IF EXISTS notes;

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  author VARCHAR(100) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  pages INTEGER,
  language VARCHAR(30) NOT NULL DEFAULT 'English',
  available BOOLEAN NOT NULL DEFAULT TRUE,
  summary VARCHAR(300) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demo library books (only if the table is empty)
INSERT INTO books (title, author, genre, year, pages, language, available, summary)
SELECT * FROM (
  VALUES
    (
      'The Little Prince',
      'Antoine de Saint-Exupéry',
      'fiction',
      1943,
      96,
      'French',
      TRUE,
      'A pilot meets a little prince from another planet.'
    ),
    (
      'Harry Potter and the Philosopher''s Stone',
      'J. K. Rowling',
      'fiction',
      1997,
      223,
      'English',
      TRUE,
      'A young wizard discovers Hogwarts.'
    ),
    (
      'A Brief History of Time',
      'Stephen Hawking',
      'science',
      1988,
      256,
      'English',
      FALSE,
      'An introduction to space, time, and black holes.'
    ),
    (
      'The Story of Morocco',
      'Classroom Author',
      'history',
      2015,
      180,
      'English',
      TRUE,
      'A simple history book for young readers.'
    ),
    (
      'JavaScript for Beginners',
      'Code Academy',
      'technology',
      2022,
      210,
      'English',
      TRUE,
      'Learn variables, functions, and fetch() step by step.'
    ),
    (
      'Asterix the Gaul',
      'René Goscinny',
      'comics',
      1961,
      48,
      'French',
      TRUE,
      'Asterix and Obelix protect their village.'
    )
) AS demo(title, author, genre, year, pages, language, available, summary)
WHERE NOT EXISTS (SELECT 1 FROM books LIMIT 1);
