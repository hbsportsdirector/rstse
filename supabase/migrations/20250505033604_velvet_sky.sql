-- Drop existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;

-- Create new policies with simplified checks
CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = ANY (ARRAY['admin'::text, 'coach'::text])
  AND (
    NOT is_club_test 
    OR (
      is_club_test AND (auth.jwt() ->> 'role')::text = 'admin'::text
    )
  )
);

CREATE POLICY "Everyone can view tests"
ON physical_tests
FOR SELECT
TO authenticated
USING (true);
