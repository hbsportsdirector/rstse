// User types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'coach' | 'athlete';
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

// Program types
export interface Program {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  category: string;
  duration_weeks: number;
  created_by: string;
  is_public: boolean;
  created_at: string;
  max_log_count?: number;
}

// Exercise types
export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  image_url?: string;
  video_url?: string;
  instructions?: string;
}

// Program Exercise types
export interface ProgramExercise {
  id: string;
  program_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  day_number: number;
  order_in_day: number;
  exercise?: Exercise;
}

// Player types
export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string;
  height_cm?: number;
  weight_kg?: number;
  position?: string;
  team_id?: string;
  profile_image_url?: string;
  created_at: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  coach_id: string;
  created_at: string;
}

// Physical Test types
export interface PhysicalTest {
  id: string;
  name: string;
  description: string;
  unit: string;
  created_by: string;
  created_at: string;
}

export interface PhysicalTestResult {
  id: string;
  test_id: string;
  player_id: string;
  value: number;
  date: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

// Progress types
export interface UserProgress {
  id: string;
  user_id: string;
  program_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  current_day: number;
  start_date: string | null;
  completion_date: string | null;
  log_count: number;
}
