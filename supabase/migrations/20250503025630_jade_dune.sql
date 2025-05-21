/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Remove recursive policy checks for the users table
    - Simplify user data access policies
    - Maintain security while avoiding infinite recursion
  
  2. Security
    - Users can still only read their own data
    - Admins can read all user data
    - Users can only update their own data
    - Admins can update any user data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Allow insert during registration" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can read own data and admins can read all"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any user"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

CREATE POLICY "Allow insert during registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
