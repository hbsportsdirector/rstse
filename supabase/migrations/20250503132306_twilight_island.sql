/*
  # Fix users table RLS policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify policy conditions to avoid self-referential queries
    - Maintain security while preventing recursion
  
  2. Security
    - Maintain RLS enabled on users table
    - Ensure users can still only access appropriate data
    - Prevent unauthorized access while avoiding recursion
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow public read access to basic user info" ON users;
DROP POLICY IF EXISTS "Allow reading referenced user data" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Coaches and admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create simplified policies that avoid recursion
CREATE POLICY "Public can read basic user info"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Coaches and admins can read all users"
ON users FOR SELECT 
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = ANY (ARRAY['coach', 'admin'])
);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow user registration"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
