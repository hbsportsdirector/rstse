import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Plus, Trash2, AlertCircle, CheckSquare, Square, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
}

interface ProgramExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  orderIndex: number;
  restSeconds: number;
}

export default function WorkoutProgramCreator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [programExercises, setProgramExercises] = useState<ProgramExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [maxLogCount, setMaxLogCount] = useState<number | null>(null);
  const [enableLogLimit, setEnableLogLimit] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('exercises')
        .select('id, name, muscle_groups, equipment')
        .order('name');

      if (fetchError) throw fetchError;
      setExercises(data || []);
    } catch (err: any) {
      console.error('Error fetching exercises:', err);
      setError(err.message);
    }
  };

  const toggleExercise = (exerciseId: string) => {
    const newSelection = new Set(selectedExercises);
    if (newSelection.has(exerciseId)) {
      newSelection.delete(exerciseId);
    } else {
      newSelection.add(exerciseId);
    }
    setSelectedExercises(newSelection);
  };

  const addSelectedExercises = () => {
    const currentOrderIndex = programExercises.length;
    const newExercises = Array.from(selectedExercises).map((exerciseId, index) => ({
      exerciseId,
      sets: 3,
      reps: '8-12',
      orderIndex: currentOrderIndex + index,
      restSeconds: 60 // Default rest time of 60 seconds
    }));

    setProgramExercises([...programExercises, ...newExercises]);
    setSelectedExercises(new Set()); // Clear selection
  };

  const removeExercise = (orderIndex: number) => {
    setProgramExercises(
      programExercises.filter(e => e.orderIndex !== orderIndex)
    );
  };

  const updateExercise = (
    orderIndex: number,
    updates: Partial<ProgramExercise>
  ) => {
    setProgramExercises(programExercises.map(exercise => {
      if (exercise.orderIndex === orderIndex) {
        return { ...exercise, ...updates };
      }
      return exercise;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Validate inputs
      if (!name.trim()) throw new Error('Program name is required');
      if (!description.trim()) throw new Error('Description is required');
      if (programExercises.length === 0) throw new Error('At least one exercise is required');
      if (enableLogLimit && (maxLogCount === null || maxLogCount <= 0)) {
        throw new Error('Maximum log count must be a positive number');
      }

      // Create program
      const { data: program, error: programError } = await supabase
        .from('workout_programs')
        .insert({
          name,
          description,
          target_groups: [],
          difficulty: 'intermediate',
          created_by: user.id,
          max_log_count: enableLogLimit ? maxLogCount : null
        })
        .select()
        .single();

      if (programError) throw programError;

      // Insert program exercises
      const { error: exercisesError } = await supabase
        .from('program_exercises')
        .insert(
          programExercises.map(exercise => ({
            program_id: program.id,
            exercise_id: exercise.exerciseId,
            week_number: 1,
            day_number: 1,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.restSeconds,
            order_index: exercise.orderIndex
          }))
        );

      if (exercisesError) throw exercisesError;

      navigate('/training');
    } catch (err: any) {
      console.error('Error creating program:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique muscle groups for filtering
  const uniqueMuscleGroups = Array.from(
    new Set(exercises.flatMap(e => e.muscle_groups))
  ).sort();

  // Filter exercises based on search and muscle group
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = searchQuery === '' || 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = muscleGroupFilter === '' || 
      exercise.muscle_groups.includes(muscleGroupFilter);
    return matchesSearch && matchesMuscleGroup;
  });

  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only coaches and administrators can create workout programs.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/training')}
              >
                Return to Training Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Workout Program</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/training')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Create Program
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="form-label" htmlFor="name">
                Program Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Enter program name"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="Enter program description"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="enableLogLimit"
                  checked={enableLogLimit}
                  onChange={(e) => setEnableLogLimit(e.target.checked)}
                  className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="enableLogLimit" className="ml-2 form-label">
                  Limit the number of times athletes can log results
                </label>
              </div>
              
              {enableLogLimit && (
                <div className="mt-2">
                  <label className="form-label" htmlFor="maxLogCount">
                    Maximum Log Count
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="maxLogCount"
                      type="number"
                      value={maxLogCount === null ? '' : maxLogCount}
                      onChange={(e) => setMaxLogCount(e.target.value ? parseInt(e.target.value) : null)}
                      className="input-field w-32"
                      min="1"
                      placeholder="e.g., 5"
                    />
                    <div className="text-sm text-muted-foreground flex items-start">
                      <Info className="h-4 w-4 mr-1 mt-0.5" />
                      <span>Athletes will only be able to log results this many times for this program</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    placeholder="Search exercises..."
                  />
                </div>

                <div>
                  <label className="form-label">Muscle Group</label>
                  <select
                    value={muscleGroupFilter}
                    onChange={(e) => setMuscleGroupFilter(e.target.value)}
                    className="select-field"
                  >
                    <option value="">All Muscle Groups</option>
                    {uniqueMuscleGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {filteredExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExercise(exercise.id)}
                  >
                    <div className="mr-3">
                      {selectedExercises.has(exercise.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.muscle_groups.map(group => (
                          <span key={group} className="text-xs px-2 py-1 bg-muted rounded-full">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedExercises.size > 0 && (
                <Button
                  onClick={addSelectedExercises}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedExercises.size} Exercise{selectedExercises.size > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programExercises
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((exercise) => {
                  const exerciseDetails = exercises.find(e => e.id === exercise.exerciseId);
                  if (!exerciseDetails) return null;

                  return (
                    <Card key={exercise.orderIndex}>
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">{exerciseDetails.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {exerciseDetails.muscle_groups.map(group => (
                                <span key={group} className="text-xs px-2 py-1 bg-muted rounded-full">
                                  {group}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(exercise.orderIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="form-label">Sets</label>
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(
                                exercise.orderIndex,
                                { sets: parseInt(e.target.value) }
                              )}
                              className="input-field"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="form-label">Reps</label>
                            <input
                              type="text"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(
                                exercise.orderIndex,
                                { reps: e.target.value }
                              )}
                              className="input-field"
                              placeholder="e.g., 8-12 or 5"
                            />
                          </div>

                          <div>
                            <label className="form-label">Rest (seconds)</label>
                            <input
                              type="number"
                              value={exercise.restSeconds}
                              onChange={(e) => updateExercise(
                                exercise.orderIndex,
                                { restSeconds: parseInt(e.target.value) }
                              )}
                              className="input-field"
                              min="0"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
