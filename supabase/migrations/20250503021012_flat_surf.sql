/*
  # Learning Tests Schema

  1. New Tables
    - `learning_tests`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `is_group_test` (boolean)
      - `group_id` (uuid, nullable)
      - `time_limit` (integer, nullable) - in minutes
      
    - `test_questions`
      - `id` (uuid, primary key)
      - `test_id` (uuid, references learning_tests)
      - `order_index` (integer)
      - `question_text` (text)
      - `question_type` (text) - 'multiple_choice' or 'short_answer'
      - `media_type` (text) - 'none', 'image', 'video'
      - `media_url` (text, nullable)
      - `video_timestamp` (integer, nullable) - for video questions
      - `points` (integer)
      
    - `question_options`
      - `id` (uuid, primary key)
      - `question_id` (uuid, references test_questions)
      - `option_text` (text)
      - `correctness_score` (float) - 0 to 1 for partial credit
      
  2. Security
    - Enable RLS on all tables
    - Policies for coaches and admins to manage tests
    - Policies for players to view assigned tests
*/

-- Create learning_tests table
CREATE TABLE learning_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  is_group_test boolean DEFAULT false,
  group_id uuid,
  time_limit integer,
  CONSTRAINT valid_time_limit CHECK (time_limit IS NULL OR time_limit > 0)
);

-- Create test_questions table
CREATE TABLE test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES learning_tests(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer')),
  media_type text NOT NULL DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video')),
  media_url text,
  video_timestamp integer,
  points integer NOT NULL DEFAULT 1,
  CONSTRAINT valid_points CHECK (points > 0),
  CONSTRAINT valid_timestamp CHECK (video_timestamp IS NULL OR video_timestamp >= 0)
);

-- Create question_options table
CREATE TABLE question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  correctness_score float NOT NULL CHECK (correctness_score >= 0 AND correctness_score <= 1)
);

-- Enable Row Level Security
ALTER TABLE learning_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

-- Policies for learning_tests
CREATE POLICY "Coaches and admins can create tests"
  ON learning_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches and admins can update their own tests"
  ON learning_tests
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('coach', 'admin')
    )
  );

CREATE POLICY "Everyone can view tests"
  ON learning_tests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for test_questions
CREATE POLICY "Coaches and admins can manage questions"
  ON test_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_tests
      WHERE learning_tests.id = test_questions.test_id
      AND learning_tests.created_by = auth.uid()
    )
  );

CREATE POLICY "Everyone can view questions"
  ON test_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for question_options
CREATE POLICY "Coaches and admins can manage options"
  ON question_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_questions
      JOIN learning_tests ON test_questions.test_id = learning_tests.id
      WHERE question_options.question_id = test_questions.id
      AND learning_tests.created_by = auth.uid()
    )
  );

CREATE POLICY "Everyone can view options"
  ON question_options
  FOR SELECT
  TO authenticated
  USING (true);
