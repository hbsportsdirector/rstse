/*
  # Update test schema for image options

  1. Changes
    - Add media_type and media_url to question_options table
    - Move correctness_percentage from test_questions to question_options
    - Add constraint for media_type values

  2. Security
    - Maintain existing RLS policies
*/

-- Add media columns to question_options
ALTER TABLE question_options
ADD COLUMN media_type text NOT NULL DEFAULT 'none'
CHECK (media_type IN ('none', 'image')),
ADD COLUMN media_url text;

-- Move correctness percentage to options
ALTER TABLE question_options
ADD COLUMN correctness_percentage integer NOT NULL DEFAULT 0
CHECK (correctness_percentage >= 0 AND correctness_percentage <= 100);

-- Drop correctness_score as it's replaced by correctness_percentage
ALTER TABLE question_options
DROP COLUMN correctness_score;

-- Remove correctness_percentage from questions as it's now per option
ALTER TABLE test_questions
DROP COLUMN correctness_percentage;
