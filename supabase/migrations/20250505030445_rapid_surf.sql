/*
  # Fix RLS policies for physical tests table

  1. Changes
    - Drop existing RLS policies for physical_tests table
    - Create new policies that properly handle test creation for coaches and admins
    - Maintain existing security requirements where only admins can create club tests

  2. Security
    - Enable RLS on physical_tests table
    - Add policies for:
      - Coaches and admins to manage tests (with club test restrictions)
      - Everyone to view tests
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;

-- Recreate policies with correct permissions
CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = ANY (ARRAY['admin', 'coach'])
  AND (
    NOT is_club_test 
    OR (
      is_club_test AND (auth.jwt() ->> 'role')::text = 'admin'
    )
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = ANY (ARRAY['admin', 'coach'])
  AND (
    NOT is_club_test 
    OR (
      is_club_test AND (auth.jwt() ->> 'role')::text = 'admin'
    )
  )
);

CREATE POLICY "Everyone can view tests"
ON physical_tests
FOR SELECT
TO authenticated
USING (true);
