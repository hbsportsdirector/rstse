/*
  # Add week and day number columns to program_exercises table

  1. Changes
    - Add `week_number` column (integer, not null)
    - Add `day_number` column (integer, not null)
    - Add check constraints to ensure valid values

  2. Constraints
    - Week number must be positive
    - Day number must be between 1 and 7 (inclusive)
*/

ALTER TABLE program_exercises 
ADD COLUMN week_number integer NOT NULL,
ADD COLUMN day_number integer NOT NULL;

-- Add check constraints to ensure valid values
ALTER TABLE program_exercises
ADD CONSTRAINT valid_week_number CHECK (week_number > 0),
ADD CONSTRAINT valid_day_number CHECK (day_number BETWEEN 1 AND 7);
