/*
  # Physical Tests Enhancement

  1. New Tables
    - physical_test_categories: Organizes tests into hierarchical categories
    - physical_test_templates: Pre-configured test definitions
    - physical_test_benchmarks: Age and position-specific benchmarks
    
  2. Changes
    - Add category, setup instructions, and safety notes to physical_tests
    - Add default categories and templates
    - Enable RLS with appropriate policies
*/

-- Create test categories
CREATE TABLE physical_test_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES physical_test_categories(id),
  created_at timestamptz DEFAULT now()
);

-- Create test templates
CREATE TABLE physical_test_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES physical_test_categories(id),
  type text NOT NULL CHECK (type IN ('strength', 'speed', 'endurance', 'agility', 'power')),
  metrics jsonb NOT NULL,
  equipment text[] DEFAULT '{}',
  instructions text[] NOT NULL,
  setup_instructions text[] DEFAULT '{}',
  safety_notes text[] DEFAULT '{}',
  video_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_template_metrics CHECK (
    jsonb_typeof(metrics) = 'array' AND
    jsonb_array_length(metrics) > 0
  )
);

-- Add new columns to physical_tests
ALTER TABLE physical_tests
ADD COLUMN category_id uuid REFERENCES physical_test_categories(id),
ADD COLUMN setup_instructions text[] DEFAULT '{}',
ADD COLUMN safety_notes text[] DEFAULT '{}',
ADD COLUMN video_url text;

-- Create benchmarks table
CREATE TABLE physical_test_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES physical_test_templates(id) ON DELETE CASCADE,
  age_group text NOT NULL,
  position text,
  gender text,
  level text CHECK (level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  metrics jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_benchmark_metrics CHECK (jsonb_typeof(metrics) = 'object')
);

-- Enable RLS
ALTER TABLE physical_test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_test_benchmarks ENABLE ROW LEVEL SECURITY;

-- Add policies for categories
CREATE POLICY "Everyone can view categories"
  ON physical_test_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON physical_test_categories
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Add policies for templates
CREATE POLICY "Everyone can view templates"
  ON physical_test_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON physical_test_templates
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Add policies for benchmarks
CREATE POLICY "Everyone can view benchmarks"
  ON physical_test_benchmarks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage benchmarks"
  ON physical_test_benchmarks
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Insert default categories
INSERT INTO physical_test_categories (name, description) VALUES
('Strength Tests', 'Tests measuring maximum force production'),
('Speed Tests', 'Tests measuring acceleration and maximum velocity'),
('Endurance Tests', 'Tests measuring cardiovascular and muscular endurance'),
('Agility Tests', 'Tests measuring change of direction and body control'),
('Power Tests', 'Tests measuring force production over time');

-- Insert common test templates
INSERT INTO physical_test_templates (
  name, description, type, metrics, instructions, setup_instructions, safety_notes
) VALUES
(
  '1RM Bench Press',
  'Maximum weight for one repetition bench press',
  'strength',
  '[{"name": "Weight", "unit": "kg"}]',
  ARRAY['Perform warm-up sets', 'Gradually increase weight', 'Attempt 1RM with proper form'],
  ARRAY['Set up bench with safety bars', 'Prepare weight plates and clips'],
  ARRAY['Ensure proper spotter position', 'Maintain proper form throughout']
),
(
  '40m Sprint',
  'Maximum speed over 40 meters',
  'speed',
  '[{"name": "Time", "unit": "seconds"}]',
  ARRAY['Start in athletic stance', 'Sprint through finish line', 'Record time'],
  ARRAY['Mark start and finish lines', 'Prepare timing system'],
  ARRAY['Proper warm-up required', 'Ensure running surface is suitable']
),
(
  'Beep Test',
  'Multi-stage fitness test',
  'endurance',
  '[{"name": "Level", "unit": "level"}, {"name": "Shuttle", "unit": "count"}]',
  ARRAY['Run between markers', 'Keep pace with beeps', 'Continue until exhaustion'],
  ARRAY['Mark 20m distance', 'Test audio system'],
  ARRAY['Proper footwear required', 'Stop if feeling unwell']
);

-- Insert sample benchmarks
INSERT INTO physical_test_benchmarks (
  template_id,
  age_group,
  position,
  gender,
  level,
  metrics
) 
SELECT 
  id,
  'U18',
  'Forward',
  'Male',
  'advanced',
  '{"Weight": 80}'
FROM physical_test_templates 
WHERE name = '1RM Bench Press'
LIMIT 1;
