/*
  # Add position and profile_image_url columns to players table

  1. Purpose
    - Add position and profile_image_url columns to players table if they don't exist
  2. Changes
    - Add position column to players table if missing
    - Add profile_image_url column to players table if missing
*/

DO $$
BEGIN
  -- Add position column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'position'
  ) THEN
    ALTER TABLE players ADD COLUMN position text;
    RAISE NOTICE 'Added position column to players table';
  END IF;

  -- Add profile_image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE players ADD COLUMN profile_image_url text;
    RAISE NOTICE 'Added profile_image_url column to players table';
  END IF;
END $$;