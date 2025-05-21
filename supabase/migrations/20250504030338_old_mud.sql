/*
  # Update thumbnail requirement for exercises table

  1. Changes
    - Make thumbnail_url column required
    - Add NOT NULL constraint
    - Keep existing policies and other constraints
*/

-- First drop the existing column if it exists
ALTER TABLE exercises 
DROP COLUMN IF EXISTS thumbnail_url;

-- Add thumbnail_url column as required
ALTER TABLE exercises
ADD COLUMN thumbnail_url text NOT NULL;
