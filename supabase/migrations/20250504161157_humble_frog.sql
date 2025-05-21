/*
  # Fix RLS policies for physical tests table

  1. Changes
    - Drop existing RLS policy that's causing issues
    - Create new, more specific policies for each operation type (SELECT, INSERT, UPDATE, DELETE)
    
  2. Security
    - Maintain existing security model where coaches and admins can manage tests
    - Everyone can view tests
    - Only admins can create club tests
*/

-- Drop the existing overly broad policy
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;

-- Create separate policies for each operation
CREATE POLICY "Coaches and admins can insert tests"
ON physical_tests
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  )
);

CREATE POLICY "Coaches and admins can update tests"
ON physical_tests
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  )
);

CREATE POLICY "Coaches and admins can delete tests"
ON physical_tests
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
  AND (
    (NOT is_club_test) 
    OR (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  )
);
