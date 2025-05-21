// User roles
export type UserRole = 'player' | 'coach' | 'admin';

// Profile type
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  email?: string;
  profile_image_url?: string;
  team_id?: string;
  position?: string;
  created_at?: string;
  updated_at?: string;
}

// Team type
export interface Team {
  id: string;
  name: string;
  description?: string;
  coach_id: string;
  created_at?: string;
  updated_at?: string;
}

// Exercise type
export interface Exercise {
  id: string;
  name: string;
  description: string;
  video_url?: string;
  image_url?: string;
  category: string;
  difficulty: string;
  equipment_needed: string[];
  muscles_targeted: string[];
  created_by: string;
  is_approved: boolean;
  created_at?: string;
  updated_at?: string;
}

// Program type
export interface Program {
  id: string;
  name: string;
  description: string;
  duration_weeks: number;
  difficulty: string;
  category: string;
  created_by: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  exercises?: ProgramExercise[];
}

// Program Exercise type
export interface ProgramExercise {
  id: string;
  program_id: string;
  exercise_id: string;
  day_of_week: number;
  week_number: number;
  sets: number;
  reps: number;
  duration_seconds?: number;
  rest_seconds?: number;
  notes?: string;
  exercise?: Exercise;
}

// Physical Test type
export interface PhysicalTest {
  id: string;
  name: string;
  description: string;
  category: string;
  measurement_unit: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

// Physical Test Result type
export interface PhysicalTestResult {
  id: string;
  test_id: string;
  player_id: string;
  value: number;
  date: string;
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  test?: PhysicalTest;
  player?: Profile;
}

// Program User Progress type
export interface ProgramUserProgress {
  id: string;
  program_id: string;
  user_id: string;
  current_week: number;
  current_day: number;
  is_completed: boolean;
  completion_date?: string;
  assigned_by?: string;
  assigned_date?: string;
  log_count: number;
  max_log_count: number;
  created_at?: string;
  updated_at?: string;
  program?: Program;
  user?: Profile;
}

// Workout Log type
export interface WorkoutLog {
  id: string;
  program_id: string;
  user_id: string;
  exercise_id: string;
  date: string;
  sets_completed: number;
  reps_completed: number;
  weight_used?: number;
  duration_seconds?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  exercise?: Exercise;
}

// Knowledge Test type
export interface KnowledgeTest {
  id: string;
  title: string;
  description: string;
  category: string;
  passing_score: number;
  created_by: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  questions?: TestQuestion[];
}

// Test Question type
export interface TestQuestion {
  id: string;
  test_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  points: number;
  order_number: number;
  created_at?: string;
  updated_at?: string;
  options?: TestQuestionOption[];
}

// Test Question Option type
export interface TestQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_number: number;
  created_at?: string;
  updated_at?: string;
}

// Test Attempt type
export interface TestAttempt {
  id: string;
  test_id: string;
  user_id: string;
  score: number;
  is_passed: boolean;
  start_time: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
  test?: KnowledgeTest;
  user?: Profile;
  answers?: TestAnswer[];
}

// Test Answer type
export interface TestAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  text_answer?: string;
  is_correct: boolean;
  points_earned: number;
  created_at?: string;
  updated_at?: string;
  question?: TestQuestion;
  selected_option?: TestQuestionOption;
}
