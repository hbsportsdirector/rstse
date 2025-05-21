/*
  # Fix Physical Tests RLS Policies

  1. Changes
    - Update the RLS policy for managing physical tests to properly check user roles
    - Ensure proper access for coaches and admins
    - Maintain existing policy for viewing tests

  2. Security
    - Fix role check to use proper JWT token access
    - Maintain existing RLS enabled status
    - Keep existing view permissions intact
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;

-- Create updated policy with correct role check
CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role' IN ('admin', 'coach'))
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt()->>'role' = 'admin'))
  )
)
WITH CHECK (
  (auth.jwt()->>'role' IN ('admin', 'coach'))
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt()->>'role' = 'admin'))
  )
);
