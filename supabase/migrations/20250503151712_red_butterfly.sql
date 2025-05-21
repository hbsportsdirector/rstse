/*
  # Fix RLS policies for learning tests

  1. Changes
    - Drop existing policies
    - Create new simplified policies for:
      - Coaches and admins to manage all tests
      - All authenticated users to view tests
      - Users to manage their own tests
    
  2. Security
    - Maintains RLS enabled
    - Uses auth.jwt() for role checks
    - Ensures proper access control
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage all learning_tests" ON learning_tests;
DROP POLICY IF EXISTS "Users can delete own learning_tests" ON learning_tests;
DROP POLICY IF EXISTS "Users can insert learning_tests" ON learning_tests;
DROP POLICY IF EXISTS "Users can select own learning_tests" ON learning_tests;
DROP POLICY IF EXISTS "Users can update own learning_tests" ON learning_tests;

-- Create new simplified policies

-- Allow coaches and admins to manage everything
CREATE POLICY "Coaches and admins can manage all learning_tests"
  ON learning_tests
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'coach'::text]))
  WITH CHECK ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'coach'::text]));

-- Allow all authenticated users to view tests
CREATE POLICY "Everyone can view tests"
  ON learning_tests
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to manage their own tests
CREATE POLICY "Users can manage own learning_tests"
  ON learning_tests
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
