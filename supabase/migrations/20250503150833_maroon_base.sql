/*
  # Fix learning tests RLS policies

  1. Changes
    - Drop and recreate policies for learning_tests table
    - Add proper role-based access control
    - Fix policy conflicts by checking existence first
    
  2. Security
    - Maintain RLS enabled
    - Allow coaches and admins to manage all tests
    - Allow users to manage their own tests
*/

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_tests' 
    AND policyname = 'Coaches and admins can manage all learning_tests'
  ) THEN
    DROP POLICY "Coaches and admins can manage all learning_tests" ON learning_tests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_tests' 
    AND policyname = 'Users can delete own learning_tests'
  ) THEN
    DROP POLICY "Users can delete own learning_tests" ON learning_tests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_tests' 
    AND policyname = 'Users can insert learning_tests'
  ) THEN
    DROP POLICY "Users can insert learning_tests" ON learning_tests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_tests' 
    AND policyname = 'Users can select own learning_tests'
  ) THEN
    DROP POLICY "Users can select own learning_tests" ON learning_tests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_tests' 
    AND policyname = 'Users can update own learning_tests'
  ) THEN
    DROP POLICY "Users can update own learning_tests" ON learning_tests;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Coaches and admins can manage all learning_tests"
  ON learning_tests
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'coach'::text]));

CREATE POLICY "Users can delete own learning_tests"
  ON learning_tests
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert learning_tests"
  ON learning_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can select own learning_tests"
  ON learning_tests
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can update own learning_tests"
  ON learning_tests
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
