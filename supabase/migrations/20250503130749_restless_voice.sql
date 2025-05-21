/*
  # Add per-question time limit

  1. Changes
    - Add time_limit column to test_questions table
    - Add constraint to ensure time_limit is positive when set
    - Update existing policies to include the new column

  2. Notes
    - time_limit is nullable (not all questions need a time limit)
    - time_limit is in seconds
*/

ALTER TABLE test_questions
ADD COLUMN time_limit integer,
ADD CONSTRAINT valid_question_time_limit 
  CHECK (time_limit IS NULL OR time_limit > 0);
