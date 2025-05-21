-- Drop existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;

-- Create function to set created_by
CREATE OR REPLACE FUNCTION set_physical_test_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS set_physical_test_created_by_trigger ON physical_tests;
CREATE TRIGGER set_physical_test_created_by_trigger
  BEFORE INSERT ON physical_tests
  FOR EACH ROW
  EXECUTE FUNCTION set_physical_test_created_by();

-- Create new policies
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
)
WITH CHECK (
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
