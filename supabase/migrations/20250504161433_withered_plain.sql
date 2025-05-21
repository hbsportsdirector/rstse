/*
  # Fix RLS policies for physical tests

  1. Changes
    - Drop and recreate policies for physical_tests table
    - Add proper role-based access control
    - Fix policy conflicts
    
  2. Security
    - Maintain RLS enabled
    - Allow coaches and admins to manage tests
    - Allow everyone to view tests
    - Restrict club test creation to admins
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Coaches and admins can manage all learning_tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;
DROP POLICY IF EXISTS "Only admins can create club tests" ON physical_tests;
DROP POLICY IF EXISTS "Coaches and admins can insert tests" ON physical_tests;
DROP POLICY IF EXISTS "Coaches and admins can update tests" ON physical_tests;
DROP POLICY IF EXISTS "Coaches and admins can delete tests" ON physical_tests;

-- Create new policies
CREATE POLICY "Coaches and admins can manage tests"
  ON physical_tests
  FOR ALL
  TO authenticated
  USING (
    ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'coach'::text])) AND
    ((NOT is_club_test) OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text))
  )
  WITH CHECK (
    ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'coach'::text])) AND
    ((NOT is_club_test) OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text))
  );

CREATE POLICY "Everyone can view tests"
  ON physical_tests
  FOR SELECT
  TO authenticated
  USING (true);
