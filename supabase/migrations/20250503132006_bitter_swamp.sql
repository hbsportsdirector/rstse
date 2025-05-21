/*
  # Fix RLS policies for test creation

  1. Changes
    - Add policy for test creation if it doesn't exist
    - Add policy for reading own user data if it doesn't exist
    - Add policy for coaches and admins to read all users if it doesn't exist

  2. Security
    - Checks for existing policies before creating new ones
    - Maintains existing RLS settings
*/

DO $$ 
BEGIN
  -- Check and create policy for test creation
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_tests' 
    AND policyname = 'Coaches and admins can create tests'
  ) THEN
    CREATE POLICY "Coaches and admins can create tests"
    ON learning_tests
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = users.id
        AND users.raw_user_meta_data->>'role' IN ('coach', 'admin')
      )
    );
  END IF;

  -- Check and create policy for reading own user data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id
    );
  END IF;

  -- Check and create policy for coaches and admins to read all users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Coaches and admins can read all users'
  ) THEN
    CREATE POLICY "Coaches and admins can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = users.id
        AND users.raw_user_meta_data->>'role' IN ('coach', 'admin')
      )
    );
  END IF;
END $$;
