import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/UI/Card';
import Button from '../components/UI/Button';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Search,
  Edit,
  Trash2,
  Dumbbell,
  Save,
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_groups: string[];
  equipment: string[];
  require_weight: boolean;
}

interface ProgramExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  exercise: Exercise;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  program_exercises: ProgramExercise[];
}

interface ProgramAssignment {
  id: string;
  program: WorkoutProgram;
  team: {
    id: string;
    name: string;
  };
  start_date: string;
  end_date: string;
}

interface WorkoutLog {
  id: string;
  date: string;
  exercises: {
    exerciseId: string;
    sets: {
      weight?: number;
      reps: number;
      failed: boolean;
    }[];
  }[];
  notes: string;
  borg_rating: number;
}

export default function WorkoutLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLogging, setIsLogging] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(
    null
  );
  const [borgRating, setBorgRating] = useState(10);
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [availablePrograms, setAvailablePrograms] = useState<
    ProgramAssignment[]
  >([]);
  const [exerciseSets, setExerciseSets] = useState<
    Record<string, { weight?: number; failed: boolean }[]>
  >({});

  useEffect(() => {
    if (user?.role === 'player') {
      fetchWorkoutLogs();
      fetchAvailablePrograms();
    }
  }, [user]);

  const fetchWorkoutLogs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching workout logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePrograms = async () => {
    if (!user) return;
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('workout_program_assignments')
        .select(
          `
          *,
          program:workout_programs(
            *,
            program_exercises(
              *,
              exercise:exercises(*)
            )
          ),
          team:teams(*)
        `
        )
        .eq('team_id', user.teamId)
        .gte('end_date', new Date().toISOString())
        .lte('start_date', new Date().toISOString());
      if (assignmentsError) throw assignmentsError;
      setAvailablePrograms(assignments || []);
    } catch (err: any) {
      console.error('Error fetching available programs:', err);
      setError(err.message);
    }
  };

  const initializeExerciseSets = (exercise: ProgramExercise) => {
    if (!exerciseSets[exercise.exercise_id]) {
      setExerciseSets((prev) => ({
        ...prev,
        [exercise.exercise_id]: Array(exercise.sets)
          .fill(null)
          .map(() => ({ failed: false })),
      }));
    }
  };

  const updateSet = (
    exerciseId: string,
    setIndex: number,
    updates: Partial<{ weight?: number; failed: boolean }>
  ) => {
    setExerciseSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, i) =>
        i === setIndex ? { ...set, ...updates } : set
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProgram) return;
    try {
      const exercises = selectedProgram.program_exercises.map((exercise) => ({
        exerciseId: exercise.exercise_id,
        sets: (exerciseSets[exercise.exercise_id] || []).map((set) => ({
          weight: set.weight,
          reps: parseInt(exercise.reps) || 0,
          failed: set.failed,
        })),
      }));
      const { error: submitError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          date: new Date().toISOString(),
          exercises,
          borg_rating: borgRating,
          notes: notes.trim() || null,
        });
      if (submitError) throw submitError;
      setSelectedProgram(null);
      setBorgRating(10);
      setNotes('');
      setExerciseSets({});
      setIsLogging(false);
      fetchWorkoutLogs();
    } catch (err: any) {
      console.error('Error logging workout:', err);
      setError(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workout Logs</h1>
        <Button onClick={() => setIsLogging((prev) => !prev)}>
          {isLogging ? (
            'Cancel'
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Log Workout
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 rounded p-4 mb-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLogging && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Log New Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2">Select Workout Program</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedProgram?.id || ''}
                  onChange={(e) => {
                    const program =
                      availablePrograms.find(
                        (a) => a.program.id === e.target.value
                      )?.program || null;
                    setSelectedProgram(program);
                    if (program)
                      program.program_exercises.forEach(initializeExerciseSets);
                  }}
                  required
                >
                  <option value="">Select a program...</option>
                  {availablePrograms.map((a) => (
                    <option key={a.program.id} value={a.program.id}>
                      {a.program.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProgram && (
                <>
                  <div className="space-y-4">
                    {selectedProgram.program_exercises.map((exercise) => {
                      initializeExerciseSets(exercise);
                      const requiresWeight = exercise.exercise.require_weight;
                      return (
                        <Card key={exercise.exercise_id} className="p-4">
                          <CardContent>
                            <h3 className="font-semibold text-lg">
                              {exercise.exercise.name}
                            </h3>
                            <div className="mt-2 space-y-2">
                              {Array.from({ length: exercise.sets }).map(
                                (_, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-4"
                                  >
                                    <span className="w-16">Set {idx + 1}</span>
                                    {requiresWeight ? (
                                      <input
                                        type="number"
                                        placeholder="Weight (kg)"
                                        className="w-32 p-2 border rounded"
                                        value={
                                          exerciseSets[exercise.exercise_id]?.[
                                            idx
                                          ]?.weight || ''
                                        }
                                        onChange={(e) =>
                                          updateSet(exercise.exercise_id, idx, {
                                            weight: e.target.value
                                              ? parseFloat(e.target.value)
                                              : undefined,
                                          })
                                        }
                                        step="0.5"
                                        min="0"
                                      />
                                    ) : (
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={
                                            !exerciseSets[
                                              exercise.exercise_id
                                            ]?.[idx]?.failed
                                          }
                                          onChange={(e) =>
                                            updateSet(
                                              exercise.exercise_id,
                                              idx,
                                              { failed: !e.target.checked }
                                            )
                                          }
                                          className="h-4 w-4"
                                        />
                                        <span>Completed</span>
                                      </label>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block mb-2">Borg Rating (1-20)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={borgRating}
                        onChange={(e) =>
                          setBorgRating(parseInt(e.target.value))
                        }
                        className="flex-1"
                        required
                      />
                      <span className="w-8 text-center">{borgRating}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2 border rounded"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsLogging(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Save Workout
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and sort logs */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 p-2 border rounded"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={() =>
              setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
            }
          >
            <Calendar className="mr-1 h-4 w-4" />
            Date {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Render existing logs */}
      {loading ? (
        <Card>
          <CardContent className="py-6 text-center text-gray-500">
            <Dumbbell className="animate-pulse h-8 w-8 mx-auto mb-4" />
            Loading workout logs...
          </CardContent>
        </Card>
      ) : !logs.length ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Dumbbell className="h-12 w-12 mx-auto mb-4" />
            No Workouts Logged
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent>
                {/* simplified log display */}
                <h3 className="font-medium">
                  Workout on {new Date(log.date).toLocaleDateString()}
                </h3>
                <p>Borg: {log.borg_rating}/20</p>
                {/* ...render sets similarly to above... */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
