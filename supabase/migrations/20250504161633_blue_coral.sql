/*
  # Fix RLS policies for physical tests table

  1. Changes
    - Drop existing policies that might conflict
    - Create new simplified policies for:
      - Test management by coaches and admins
      - Public test viewing
      - Club test management by admins
    
  2. Security
    - Maintain RLS enabled
    - Ensure proper role-based access
    - Handle club tests separately
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;
DROP POLICY IF EXISTS "Only admins can create club tests" ON physical_tests;
DROP POLICY IF EXISTS "Coaches and admins can manage all learning_tests" ON physical_tests;

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
