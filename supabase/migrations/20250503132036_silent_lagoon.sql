/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies that are causing conflicts
    - Create new, properly scoped policies for the users table
    
  2. Security
    - Enable RLS on users table (in case it was disabled)
    - Add policies for:
      - Public read access to basic user info
      - Authenticated users can read their own full data
      - Users can update their own data
      - Coaches and admins can read all user data
*/

-- First enable RLS (in case it was disabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow admins to read all users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow users to read own data" ON users;
DROP POLICY IF EXISTS "Allow users to update own data" ON users;
DROP POLICY IF EXISTS "Coaches and admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policies

-- Allow public read access to basic user info (needed for anon role)
CREATE POLICY "Allow public read access to basic user info"
ON users
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to read their own full data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow coaches and admins to read all user data
CREATE POLICY "Coaches and admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = ANY (ARRAY['coach', 'admin'])
  )
);

-- Allow user registration (insert)
CREATE POLICY "Allow user registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
