/*
  # Fix Physical Tests RLS and Trigger

  1. Changes
    - Drop existing policies
    - Create trigger function to set created_by
    - Create trigger to automatically set created_by
    - Create simplified RLS policies
    
  2. Security
    - Maintain RLS enabled
    - Ensure created_by is set automatically
    - Allow coaches and admins to manage tests
    - Restrict club test creation to admins
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION set_physical_test_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS set_physical_test_created_by_trigger ON physical_tests;
CREATE TRIGGER set_physical_test_created_by_trigger
  BEFORE INSERT ON physical_tests
  FOR EACH ROW
  EXECUTE FUNCTION set_physical_test_created_by();

-- Create simplified policies
CREATE POLICY "Coaches and admins can manage tests"
ON physical_tests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'coach')
    AND (
      NOT physical_tests.is_club_test 
      OR (physical_tests.is_club_test AND users.role = 'admin')
    )
  )
);

CREATE POLICY "Everyone can view tests"
ON physical_tests
FOR SELECT
TO authenticated
USING (true);
