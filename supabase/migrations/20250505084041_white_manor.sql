/*
  # Update workout logs schema for weight tracking

  1. Changes
    - Update exercises JSONB structure to include weight and failed status
    - Add check constraint to ensure proper exercise data structure
    
  2. Security
    - Maintain existing RLS policies
    - No changes to access control needed
*/

-- Create a function to validate the exercises JSON structure
CREATE OR REPLACE FUNCTION check_exercise_sets_structure(exercises jsonb)
RETURNS boolean AS $$
DECLARE
  exercise jsonb;
  set_data jsonb;
  exercise_cursor CURSOR FOR SELECT * FROM jsonb_array_elements(exercises);
  set_cursor CURSOR(ex jsonb) FOR SELECT * FROM jsonb_array_elements(ex->'sets');
BEGIN
  -- Check that exercises is an array
  IF NOT jsonb_typeof(exercises) = 'array' THEN
    RETURN false;
  END IF;

  -- Check each exercise
  OPEN exercise_cursor;
  LOOP
    FETCH exercise_cursor INTO exercise;
    EXIT WHEN NOT FOUND;

    -- Check exercise structure
    IF NOT (
      exercise ? 'exerciseId' AND
      exercise ? 'sets' AND
      jsonb_typeof(exercise->'sets') = 'array'
    ) THEN
      CLOSE exercise_cursor;
      RETURN false;
    END IF;

    -- Check each set
    OPEN set_cursor(exercise);
    LOOP
      FETCH set_cursor INTO set_data;
      EXIT WHEN NOT FOUND;

      -- Check set structure
      IF NOT (
        set_data ? 'reps' AND
        set_data ? 'failed' AND
        (NOT (set_data ? 'weight') OR jsonb_typeof(set_data->'weight') = 'number')
      ) THEN
        CLOSE set_cursor;
        CLOSE exercise_cursor;
        RETURN false;
      END IF;
    END LOOP;
    CLOSE set_cursor;
  END LOOP;
  CLOSE exercise_cursor;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Update the check constraint for exercises
ALTER TABLE workout_logs
DROP CONSTRAINT IF EXISTS valid_exercises;

ALTER TABLE workout_logs
ADD CONSTRAINT valid_exercises 
CHECK (check_exercise_sets_structure(exercises));
