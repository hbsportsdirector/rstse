/*
  # Fix Physical Tests Creation

  1. Changes
    - Update RLS policy to properly handle test creation
    - Fix role check in policy
    - Ensure proper access control
    
  2. Security
    - Maintain RLS enabled
    - Allow coaches and admins to create tests
    - Keep existing view permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;

-- Create new policies with proper role checks
CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  auth.role() IN ('admin', 'coach')
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND auth.role() = 'admin')
  )
)
WITH CHECK (
  auth.role() IN ('admin', 'coach')
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND auth.role() = 'admin')
  )
);

CREATE POLICY "Everyone can view tests"
ON physical_tests
FOR SELECT
TO authenticated
USING (true);
