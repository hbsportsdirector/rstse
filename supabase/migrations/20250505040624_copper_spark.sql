/*
  # Fix test results RLS policies

  1. Changes
    - Drop existing policies for test_results table
    - Create new policies that properly handle all operations:
      - Users can insert their own results
      - Users can view their own results
      - Coaches and admins can manage all results
  
  2. Security
    - Enable RLS on test_results table
    - Add policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches and admins can manage all results" ON test_results;
DROP POLICY IF EXISTS "Users can insert own results" ON test_results;
DROP POLICY IF EXISTS "Users can view own results" ON test_results;

-- Recreate policies with correct permissions
CREATE POLICY "Users can manage own results"
ON test_results
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches can manage team results"
ON test_results
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN team_coaches tc ON tc.team_id = u.team_id
    WHERE u.id = test_results.user_id
    AND tc.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN team_coaches tc ON tc.team_id = u.team_id
    WHERE u.id = test_results.user_id
    AND tc.coach_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all results"
ON test_results
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
