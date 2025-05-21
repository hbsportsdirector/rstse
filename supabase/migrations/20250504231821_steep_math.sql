/*
  # Fix Physical Tests RLS Policies

  1. Changes
    - Update RLS policies to use auth.jwt() instead of role() function
    - Fix policy for managing physical tests
    - Maintain existing policy for viewing tests

  2. Security
    - Ensure proper role-based access control
    - Handle club test restrictions
    - Keep existing view permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;

-- Create new policies with correct role checks
CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role'::text) IN ('admin', 'coach')
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin')
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role'::text) IN ('admin', 'coach')
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin')
  )
);

CREATE POLICY "Everyone can view tests"
ON physical_tests
FOR SELECT
TO authenticated
USING (true);
