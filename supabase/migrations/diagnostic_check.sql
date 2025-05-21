/*
  # Diagnostic check for database tables

  1. Purpose
    - Check which tables exist in the database
    - Identify any issues with dependencies
*/

-- Check which tables exist
DO $$
BEGIN
  RAISE NOTICE 'Checking database tables...';
  
  -- Check if users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE NOTICE 'users table exists';
  ELSE
    RAISE NOTICE 'users table does NOT exist';
  END IF;
  
  -- Check if teams table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
    RAISE NOTICE 'teams table exists';
  ELSE
    RAISE NOTICE 'teams table does NOT exist';
  END IF;
  
  -- Check if players table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'players') THEN
    RAISE NOTICE 'players table exists';
  ELSE
    RAISE NOTICE 'players table does NOT exist';
  END IF;
END $$;