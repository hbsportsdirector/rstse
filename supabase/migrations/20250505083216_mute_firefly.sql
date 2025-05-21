/*
  # Update workout logs schema

  1. Changes
    - Remove duration, intensity, and physical_state_rating columns
    - Add borg_rating column for 1-20 scale
    - Update constraints and policies
    
  2. Security
    - Maintain existing RLS policies
    - Keep existing permissions intact
*/

-- First drop the columns we don't need
ALTER TABLE workout_logs
DROP COLUMN duration,
DROP COLUMN intensity,
DROP COLUMN physical_state_rating;

-- Add the Borg scale rating
ALTER TABLE workout_logs
ADD COLUMN borg_rating integer NOT NULL CHECK (borg_rating BETWEEN 1 AND 20);
