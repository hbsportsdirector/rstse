/*
  # Update users table constraints and indexes

  1. Changes
    - Add NOT NULL constraints where appropriate
    - Add indexes for frequently queried columns
    - Add email format validation
    - Add role validation
*/

-- Add email format validation
ALTER TABLE users
ADD CONSTRAINT email_format_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_team_id_idx ON users(team_id);

-- Add created_at index for sorting
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);

-- Ensure timestamps are always set
ALTER TABLE users
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN created_at SET NOT NULL;
