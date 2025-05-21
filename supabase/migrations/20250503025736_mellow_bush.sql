/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies
    - Create new simplified policies for:
      - Reading user data
      - Updating user data
      - Inserting new users
    - Fix recursive policy issues
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data and admins can read all" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Allow insert during registration" ON users;

-- Create simplified read policy
CREATE POLICY "Allow users to read own data"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Create admin read policy
CREATE POLICY "Allow admins to read all users"
ON users
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Create update policy
CREATE POLICY "Allow users to update own data"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create insert policy
CREATE POLICY "Allow user registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
