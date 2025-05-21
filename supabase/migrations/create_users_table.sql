/*
  # Create users table if it doesn't exist

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `role` (text)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `users` table
    - Add basic policies
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'player',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY IF NOT EXISTS "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());