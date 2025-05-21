/*
  # Add club tests support

  1. Changes
    - Add is_club_test column if it doesn't exist
    - Add RLS policy for club test management
    - Only admins can create and manage club tests
    
  2. Security
    - Maintain existing RLS policies
    - Add specific policy for club tests
*/

DO $$ 
BEGIN
  -- Add is_club_test column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'learning_tests' 
    AND column_name = 'is_club_test'
  ) THEN
    ALTER TABLE learning_tests
    ADD COLUMN is_club_test boolean DEFAULT false;
  END IF;
END $$;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Only admins can create club tests" ON learning_tests;

-- Create new policy for club tests
CREATE POLICY "Only admins can create club tests"
ON learning_tests
FOR ALL
TO authenticated
USING (
  (NOT is_club_test) OR
  (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin')
)
WITH CHECK (
  (NOT is_club_test) OR
  (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin')
);
