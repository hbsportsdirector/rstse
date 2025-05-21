/*
  # Add thumbnail column to exercises table

  1. Changes
    - Add thumbnail_url column to exercises table
    - Update RLS policies to include the new column
    - Keep existing policies and constraints
*/

-- Add thumbnail_url column
ALTER TABLE exercises
ADD COLUMN thumbnail_url text;

-- No need to modify RLS policies as they cover all columns
