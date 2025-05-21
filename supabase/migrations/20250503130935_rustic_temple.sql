/*
  # Update test questions to use correctness percentage

  1. Changes
    - Replace points with correctness_percentage in test_questions table
    - Add constraint to ensure percentage is between 0 and 100
    - Update existing records to convert points to percentage

  2. Security
    - Existing policies remain unchanged
*/

-- First create the new column
ALTER TABLE test_questions
ADD COLUMN correctness_percentage integer;

-- Add constraint for percentage range
ALTER TABLE test_questions
ADD CONSTRAINT valid_correctness_percentage 
CHECK (correctness_percentage IS NULL OR (correctness_percentage >= 0 AND correctness_percentage <= 100));

-- Convert existing points to percentage (assuming each point = 100%)
UPDATE test_questions
SET correctness_percentage = 100
WHERE points IS NOT NULL;

-- Make correctness_percentage required
ALTER TABLE test_questions
ALTER COLUMN correctness_percentage SET NOT NULL,
ALTER COLUMN correctness_percentage SET DEFAULT 100;

-- Drop the points column
ALTER TABLE test_questions
DROP COLUMN points;
