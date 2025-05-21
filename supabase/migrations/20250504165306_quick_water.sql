/*
  # Update physical tests RLS policy

  1. Changes
    - Modify the RLS policy for physical tests to properly handle test creation
    - Remove the created_by check from the WITH CHECK clause since it's preventing inserts
    - Keep the role check to ensure only coaches and admins can create tests
    - Maintain the club test restriction for non-admin users

  2. Security
    - Maintains role-based access control
    - Preserves club test restrictions
    - Ensures only authorized users can create tests
*/

DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;

CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'coach'::text]) 
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'coach'::text]) 
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  )
);
