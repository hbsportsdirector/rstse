/*
  # Add profile_image_url column to players table

  1. Changes
    - Add profile_image_url column to players table
  2. Purpose
    - Support profile images in the PlayerProfile component
    - Fix the "column players.profile_image_url does not exist" error
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE players ADD COLUMN profile_image_url text;
  END IF;
END $$;