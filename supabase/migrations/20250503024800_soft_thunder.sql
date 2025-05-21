/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text, unique)
      - `firstName` (text)
      - `lastName` (text)
      - `role` (text) - 'player', 'coach', or 'admin'
      - `teamId` (uuid, nullable) - references teams table
      - `profileImageUrl` (text, nullable)
      - `createdAt` (timestamp)

  2. Security
    - Enable RLS
    - Users can read their own data
    - Admins can read all user data
    - Users can update their own data
    - Admins can update any user's data
*/

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  firstName text NOT NULL,
  lastName text NOT NULL,
  role text NOT NULL CHECK (role IN ('player', 'coach', 'admin')),
  teamId uuid REFERENCES teams(id),
  profileImageUrl text,
  createdAt timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any user's data
CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Allow insert during registration
CREATE POLICY "Allow insert during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
