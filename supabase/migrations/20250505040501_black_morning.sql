/*
  # Fix test results RLS policies

  1. Changes
    - Drop existing policies that might conflict
    - Create new simplified policies for test results management
    - Allow coaches and admins to manage results
    - Allow users to view their own results
    
  2. Security
    - Maintain RLS enabled
    - Ensure proper access control
    - Fix result submission issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own results" ON test_results;
DROP POLICY IF EXISTS "Coaches can manage results for their team" ON test_results;
DROP POLICY IF EXISTS "Admins can manage all results" ON test_results;
DROP POLICY IF EXISTS "Coaches and admins can insert results" ON test_results;

-- Create new policies
CREATE POLICY "Coaches and admins can manage all results"
ON test_results
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text IN ('coach', 'admin')
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text IN ('coach', 'admin')
);

CREATE POLICY "Users can view own results"
ON test_results
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
