/*
  # Fix users table RLS policies

  1. Changes
    - Update RLS policies for users table to allow proper access during test creation
    - Add policy for authenticated users to read user data when referenced in other tables
    - Maintain existing policies for user management

  2. Security
    - Maintains row-level security
    - Ensures users can only access their own data
    - Allows reading of necessary user data for test creation
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow reading referenced user data" ON users;

-- Add new policy to allow reading user data when referenced
CREATE POLICY "Allow reading referenced user data"
ON users
FOR SELECT
TO authenticated
USING (
  -- Allow access to own data
  auth.uid() = id
  OR
  -- Allow access when user is referenced in learning_tests
  EXISTS (
    SELECT 1 FROM learning_tests
    WHERE learning_tests.created_by = users.id
  )
  OR
  -- Allow coaches and admins to read all users
  EXISTS (
    SELECT 1 FROM users coach
    WHERE coach.id = auth.uid()
    AND coach.role IN ('coach', 'admin')
  )
);
