/*
  # Update physical tests schema

  1. Changes
    - Add categories, templates, and benchmarks if they don't exist
    - Add new columns to physical_tests table
    - Set up proper relationships between tables
    - Add sample data for common tests
    
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Only create tables if they don't exist
DO $$ 
BEGIN
  -- Create test categories if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physical_test_categories') THEN
    CREATE TABLE physical_test_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      parent_id uuid REFERENCES physical_test_categories(id),
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Create test templates if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physical_test_templates') THEN
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
  END IF;

  -- Create benchmarks table if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physical_test_benchmarks') THEN
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
  END IF;
END $$;

-- Add new columns to physical_tests if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_tests' AND column_name = 'category_id') THEN
    ALTER TABLE physical_tests ADD COLUMN category_id uuid REFERENCES physical_test_categories(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_tests' AND column_name = 'setup_instructions') THEN
    ALTER TABLE physical_tests ADD COLUMN setup_instructions text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_tests' AND column_name = 'safety_notes') THEN
    ALTER TABLE physical_tests ADD COLUMN safety_notes text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_tests' AND column_name = 'video_url') THEN
    ALTER TABLE physical_tests ADD COLUMN video_url text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE physical_test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_test_benchmarks ENABLE ROW LEVEL SECURITY;

-- Add policies for categories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_test_categories' AND policyname = 'Everyone can view categories') THEN
    CREATE POLICY "Everyone can view categories"
      ON physical_test_categories
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_test_categories' AND policyname = 'Admins can manage categories') THEN
    CREATE POLICY "Admins can manage categories"
      ON physical_test_categories
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
      WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Add policies for templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_test_templates' AND policyname = 'Everyone can view templates') THEN
    CREATE POLICY "Everyone can view templates"
      ON physical_test_templates
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_test_templates' AND policyname = 'Admins can manage templates') THEN
    CREATE POLICY "Admins can manage templates"
      ON physical_test_templates
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
      WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Add policies for benchmarks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_test_benchmarks' AND policyname = 'Everyone can view benchmarks') THEN
    CREATE POLICY "Everyone can view benchmarks"
      ON physical_test_benchmarks
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_test_benchmarks' AND policyname = 'Admins can manage benchmarks') THEN
    CREATE POLICY "Admins can manage benchmarks"
      ON physical_test_benchmarks
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
      WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Insert default categories and templates
DO $$ 
DECLARE
  strength_id uuid;
  speed_id uuid;
  endurance_id uuid;
  agility_id uuid;
  power_id uuid;
  bench_template_id uuid;
  sprint_template_id uuid;
  beep_template_id uuid;
BEGIN
  -- Only insert categories if they don't exist
  IF NOT EXISTS (SELECT 1 FROM physical_test_categories WHERE name = 'Strength Tests') THEN
    INSERT INTO physical_test_categories (name, description)
    VALUES ('Strength Tests', 'Tests measuring maximum force production')
    RETURNING id INTO strength_id;

    INSERT INTO physical_test_categories (name, description)
    VALUES ('Speed Tests', 'Tests measuring acceleration and maximum velocity')
    RETURNING id INTO speed_id;

    INSERT INTO physical_test_categories (name, description)
    VALUES ('Endurance Tests', 'Tests measuring cardiovascular and muscular endurance')
    RETURNING id INTO endurance_id;

    INSERT INTO physical_test_categories (name, description)
    VALUES ('Agility Tests', 'Tests measuring change of direction and body control')
    RETURNING id INTO agility_id;

    INSERT INTO physical_test_categories (name, description)
    VALUES ('Power Tests', 'Tests measuring force production over time')
    RETURNING id INTO power_id;

    -- Get the IDs if they weren't just inserted
    IF strength_id IS NULL THEN
      SELECT id INTO strength_id FROM physical_test_categories WHERE name = 'Strength Tests';
    END IF;
    IF speed_id IS NULL THEN
      SELECT id INTO speed_id FROM physical_test_categories WHERE name = 'Speed Tests';
    END IF;
    IF endurance_id IS NULL THEN
      SELECT id INTO endurance_id FROM physical_test_categories WHERE name = 'Endurance Tests';
    END IF;

    -- Insert test templates if they don't exist
    IF NOT EXISTS (SELECT 1 FROM physical_test_templates WHERE name = '1RM Bench Press') THEN
      INSERT INTO physical_test_templates (
        name, description, category_id, type, metrics, instructions, setup_instructions, safety_notes
      ) VALUES (
        '1RM Bench Press',
        'Maximum weight for one repetition bench press',
        strength_id,
        'strength',
        '[{"name": "Weight", "unit": "kg"}]',
        ARRAY['Perform warm-up sets', 'Gradually increase weight', 'Attempt 1RM with proper form'],
        ARRAY['Set up bench with safety bars', 'Prepare weight plates and clips'],
        ARRAY['Ensure proper spotter position', 'Maintain proper form throughout']
      ) RETURNING id INTO bench_template_id;

      INSERT INTO physical_test_templates (
        name, description, category_id, type, metrics, instructions, setup_instructions, safety_notes
      ) VALUES (
        '40m Sprint',
        'Maximum speed over 40 meters',
        speed_id,
        'speed',
        '[{"name": "Time", "unit": "seconds"}]',
        ARRAY['Start in athletic stance', 'Sprint through finish line', 'Record time'],
        ARRAY['Mark start and finish lines', 'Prepare timing system'],
        ARRAY['Proper warm-up required', 'Ensure running surface is suitable']
      ) RETURNING id INTO sprint_template_id;

      INSERT INTO physical_test_templates (
        name, description, category_id, type, metrics, instructions, setup_instructions, safety_notes
      ) VALUES (
        'Beep Test',
        'Multi-stage fitness test',
        endurance_id,
        'endurance',
        '[{"name": "Level", "unit": "level"}, {"name": "Shuttle", "unit": "count"}]',
        ARRAY['Run between markers', 'Keep pace with beeps', 'Continue until exhaustion'],
        ARRAY['Mark 20m distance', 'Test audio system'],
        ARRAY['Proper footwear required', 'Stop if feeling unwell']
      ) RETURNING id INTO beep_template_id;

      -- Get template IDs if they weren't just inserted
      IF bench_template_id IS NULL THEN
        SELECT id INTO bench_template_id FROM physical_test_templates WHERE name = '1RM Bench Press';
      END IF;
      IF sprint_template_id IS NULL THEN
        SELECT id INTO sprint_template_id FROM physical_test_templates WHERE name = '40m Sprint';
      END IF;
      IF beep_template_id IS NULL THEN
        SELECT id INTO beep_template_id FROM physical_test_templates WHERE name = 'Beep Test';
      END IF;

      -- Insert benchmarks if they don't exist
      IF NOT EXISTS (SELECT 1 FROM physical_test_benchmarks WHERE template_id = bench_template_id) THEN
        INSERT INTO physical_test_benchmarks (
          template_id, age_group, position, gender, level, metrics
        ) VALUES
        (bench_template_id, 'U18', 'Forward', 'Male', 'advanced', '{"Weight": 80}'),
        (sprint_template_id, 'U18', 'Forward', 'Male', 'advanced', '{"Time": 5.2}'),
        (beep_template_id, 'U18', 'Forward', 'Male', 'advanced', '{"Level": 12, "Shuttle": 5}');
      END IF;
    END IF;
  END IF;
END $$;
