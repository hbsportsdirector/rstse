import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { 
  User, 
  Dumbbell, 
  Brain, 
  Activity, 
  Calendar,
  BarChart,
  Trash2,
  AlertCircle,
  Clock,
  Heart
} from 'lucide-react';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  team_id: string | null;
  profile_image_url: string | null;
  created_at: string;
  team?: {
    name: string;
  };
}

interface TestResult {
  id: string;
  test_id: string;
  date: string;
  metrics: Record<string, number>;
  notes?: string;
  test: {
    name: string;
    type: string;
  };
}

interface LearningTest {
  id: string;
  title: string;
  date: string;
  score: number;
  max_score: number;
}

interface WorkoutLog {
  id: string;
  date: string;
  duration: number;
  intensity: number;
  physical_state_rating: number;
  exercises: any[];
  notes?: string;
}

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [physicalTests, setPhysicalTests] = useState<TestResult[]>([]);
  const [learningTests, setLearningTests] = useState<LearningTest[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch player details with explicit foreign key relationship
        const { data: playerData, error: playerError } = await supabase
          .from('users')
          .select(`
            *,
            team:teams!users_teamid_fkey(name)
          `)
          .eq('id', id)
          .single();

        if (playerError) throw playerError;
        setPlayer(playerData);

        // Fetch physical test results
        const { data: physicalData, error: physicalError } = await supabase
          .from('test_results')
          .select(`
            *,
            test:physical_tests(name, type)
          `)
          .eq('user_id', id)
          .order('date', { ascending: false });

        if (physicalError) throw physicalError;
        setPhysicalTests(physicalData || []);

        // Fetch learning test results
        const { data: learningData, error: learningError } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', id)
          .order('date', { ascending: false });

        if (learningError) throw learningError;
        setLearningTests(learningData || []);

        // Fetch workout logs
        const { data: workoutData, error: workoutError } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', id)
          .order('date', { ascending: false });

        if (workoutError) throw workoutError;
        setWorkoutLogs(workoutData || []);

      } catch (err: any) {
        console.error('Error fetching player data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  const handleDeleteResult = async (resultId: string) => {
    if (!user || user.role !== 'admin') return;
    
    if (!confirm('Are you sure you want to delete this test result?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('test_results')
        .delete()
        .eq('id', resultId);

      if (deleteError) throw deleteError;

      // Update the UI by removing the deleted result
      setPhysicalTests(physicalTests.filter(test => test.id !== resultId));
    } catch (err: any) {
      console.error('Error deleting test result:', err);
      setError(err.message);
    }
  };

  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only coaches and administrators can view player profiles.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Loading player data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Player Not Found</h2>
              <p className="text-muted-foreground">
                The player you're looking for doesn't exist or has been removed.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Player Profile</h1>
          <p className="text-muted-foreground">
            Manage player information and view progress
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                {player.profile_image_url ? (
                  <img
                    src={player.profile_image_url}
                    alt={`${player.first_name} ${player.last_name}`}
                    className="w-32 h-32 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-medium mx-auto mb-4">
                    {player.first_name[0]}{player.last_name[0]}
                  </div>
                )}
                <h2 className="text-xl font-semibold">
                  {player.first_name} {player.last_name}
                </h2>
                <p className="text-muted-foreground">{player.email}</p>
                {player.team && (
                  <div className="mt-2">
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {player.team.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-t">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>{new Date(player.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t">
                  <span className="text-muted-foreground">Role</span>
                  <span className="capitalize">{player.role}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-success">Active</span>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Physical Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {physicalTests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No physical test results yet
                </p>
              ) : (
                <div className="space-y-4">
                  {physicalTests.map((result) => (
                    <div key={result.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{result.test.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.date).toLocaleDateString()}
                        </p>
                        <div className="mt-2 space-y-1">
                          {Object.entries(result.metrics).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                        {result.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {result.notes}
                          </p>
                        )}
                      </div>
                      {user.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResult(result.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {learningTests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No learning test results yet
                </p>
              ) : (
                <div className="space-y-4">
                  {learningTests.map((test) => (
                    <div key={test.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{test.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.date).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-primary rounded-full"
                                style={{ width: `${(test.score / test.max_score) * 100}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              {Math.round((test.score / test.max_score) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResult(test.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="h-5 w-5 mr-2" />
                Recent Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workoutLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No workout logs yet
                </p>
              ) : (
                <div className="space-y-4">
                  {workoutLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">
                            Workout on {new Date(log.date).toLocaleDateString()}
                          </h3>
                          <div className="flex gap-3 mt-1">
                            <span className="text-sm flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {log.duration} min
                            </span>
                            <span className="text-sm flex items-center text-muted-foreground">
                              <Activity className="h-4 w-4 mr-1" />
                              Intensity: {log.intensity}/10
                            </span>
                            <span className="text-sm flex items-center text-muted-foreground">
                              <Heart className="h-4 w-4 mr-1" />
                              Physical State: {log.physical_state_rating}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {log.exercises.map((exercise: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{exercise.name}</span>
                            <div className="ml-4">
                              {exercise.sets.map((set: any, setIndex: number) => (
                                <div key={setIndex} className="text-muted-foreground">
                                  Set {setIndex + 1}: {set.weight}kg × {set.reps} reps
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {log.notes && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
