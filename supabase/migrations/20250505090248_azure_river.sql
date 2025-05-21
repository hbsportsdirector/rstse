/*
  # Add constraints to program_exercises table

  1. Changes
    - Add check constraints for week_number and day_number
    - Only add constraints if they don't exist
    - Ensure valid values for week and day numbers
    
  2. Security
    - No changes to existing policies
    - Maintain data integrity with constraints
*/

DO $$ 
BEGIN
  -- Add check constraint for week_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'program_exercises' 
    AND constraint_name = 'valid_week_number'
  ) THEN
    ALTER TABLE program_exercises
    ADD CONSTRAINT valid_week_number CHECK (week_number > 0);
  END IF;

  -- Add check constraint for day_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'program_exercises' 
    AND constraint_name = 'valid_day_number'
  ) THEN
    ALTER TABLE program_exercises
    ADD CONSTRAINT valid_day_number CHECK (day_number BETWEEN 1 AND 7);
  END IF;
END $$;
