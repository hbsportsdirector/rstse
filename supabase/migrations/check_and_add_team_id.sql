/*
  # Check and add team_id column to players table

  1. Purpose
    - Diagnose the current structure of the players table
    - Add team_id column if it doesn't exist
  2. Changes
    - Add team_id column to players table if missing
*/

-- First, check the current columns in the players table
DO $$
DECLARE
  column_exists boolean;
  column_info record;
BEGIN
  -- Check if team_id exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'team_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE 'team_id column already exists in players table';
  ELSE
    RAISE NOTICE 'team_id column does NOT exist in players table';
    
    -- Check if teams table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
      -- Add team_id column with foreign key reference
      ALTER TABLE players ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added team_id column with foreign key reference to teams table';
    ELSE
      -- Add team_id column without foreign key if teams table doesn't exist
      ALTER TABLE players ADD COLUMN team_id uuid;
      RAISE NOTICE 'Added team_id column without foreign key (teams table not found)';
    END IF;
  END IF;
  
  -- List all columns in players table for diagnosis
  RAISE NOTICE 'Current columns in players table:';
  FOR column_info IN 
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'players'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '%: %', column_info.column_name, column_info.data_type;
  END LOOP;
END $$;