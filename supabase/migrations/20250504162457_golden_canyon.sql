/*
  # Fix RLS policies for physical tests

  1. Changes
    - Drop existing policy that was causing issues
    - Create new policy that properly handles test creation
    - Ensure created_by is set to the authenticated user's ID
    
  2. Security
    - Only coaches and admins can create tests
    - Club tests can only be created by admins
    - All authenticated users can view tests
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;

-- Create new policy that properly handles test creation
CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role') IN ('admin', 'coach')
  AND (
    (NOT is_club_test) 
    OR 
    (is_club_test AND (auth.jwt() ->> 'role') = 'admin')
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role') IN ('admin', 'coach')
  AND (
    (NOT is_club_test) 
    OR 
    (is_club_test AND (auth.jwt() ->> 'role') = 'admin')
  )
  AND (created_by = auth.uid())
);
