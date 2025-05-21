/*
  # Update program exercises schema

  1. Changes
    - Remove week_number and day_number columns from program_exercises
    - These columns are no longer needed since programs are now assigned with date ranges
    
  2. Security
    - Maintain existing RLS policies
    - Keep foreign key relationships intact
*/

-- Remove week and day columns from program_exercises
ALTER TABLE program_exercises
DROP COLUMN week_number,
DROP COLUMN day_number;
