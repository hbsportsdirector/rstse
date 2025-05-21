import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { ArrowLeft, Calendar, Clock, BarChart2, Users, Edit, Trash2, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Define types
interface Program {
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

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  image_url?: string;
}

interface ProgramExercise {
  id: string;
  program_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  day_number: number;
  order_in_day: number;
  exercise: Exercise;
}

interface UserProgress {
  id: string;
  user_id: string;
  program_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  current_day: number;
  start_date: string | null;
  completion_date: string | null;
  log_count: number;
}

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchProgramDetails();
      if (user) {
        fetchUserProgress();
      }
    }
  }, [id, user]);

  const fetchProgramDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch program details
      const { data: programData, error: programError } = await supabase
        .from('workout_programs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (programError) throw programError;
      
      // Fetch program exercises with exercise details
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('program_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('program_id', id)
        .order('day_number')
        .order('order_in_day');
      
      if (exercisesError) throw exercisesError;
      
      setProgram(programData);
      setExercises(exercisesData);
    } catch (err: any) {
      console.error('Error fetching program details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('program_user_progress')
        .select('*')
        .eq('program_id', id)
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      setUserProgress(data || null);
    } catch (err: any) {
      console.error('Error fetching user progress:', err);
      // Don't set error state here as it's not critical
    }
  };

  const assignProgram = async () => {
    if (!user || !program) return;
    
    try {
      setIsAssigning(true);
      
      const { data, error } = await supabase
        .from('program_user_progress')
        .insert({
          user_id: user.id,
          program_id: program.id,
          status: 'not_started',
          current_day: 1,
          start_date: null,
          completion_date: null,
          log_count: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setUserProgress(data);
      toast.success('Program assigned successfully!');
    } catch (err: any) {
      console.error('Error assigning program:', err);
      toast.error('Failed to assign program: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const startProgram = async () => {
    if (!userProgress) return;
    
    try {
      const { data, error } = await supabase
        .from('program_user_progress')
        .update({
          status: 'in_progress',
          start_date: new Date().toISOString(),
        })
        .eq('id', userProgress.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setUserProgress(data);
      toast.success('Program started!');
    } catch (err: any) {
      console.error('Error starting program:', err);
      toast.error('Failed to start program: ' + err.message);
    }
  };

  const deleteProgram = async () => {
    if (!program || !user) return;
    
    // Check if user is admin or the creator of the program
    if (user.role !== 'admin' && user.id !== program.created_by) {
      toast.error('You do not have permission to delete this program');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Delete program exercises first (due to foreign key constraints)
      const { error: exercisesError } = await supabase
        .from('program_exercises')
        .delete()
        .eq('program_id', program.id);
      
      if (exercisesError) throw exercisesError;
      
      // Delete user progress records
      const { error: progressError } = await supabase
        .from('program_user_progress')
        .delete()
        .eq('program_id', program.id);
      
      if (progressError) throw progressError;
      
      // Finally delete the program
      const { error: programError } = await supabase
        .from('workout_programs')
        .delete()
        .eq('id', program.id);
      
      if (programError) throw programError;
      
      toast.success('Program deleted successfully');
      navigate('/programs');
    } catch (err: any) {
      console.error('Error deleting program:', err);
      toast.error('Failed to delete program: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      deleteProgram();
    }
  };

  // Group exercises by day
  const exercisesByDay = exercises.reduce((acc, exercise) => {
    const day = exercise.day_number;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(exercise);
    return acc;
  }, {} as Record<number, ProgramExercise[]>);

  // Check if user can edit the program
  const canEdit = user && (user.role === 'admin' || (program && user.id === program.created_by));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'Program not found'}
        </div>
        <Link to="/programs">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Programs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/programs">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Programs
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{program.name}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {program.difficulty}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {program.category}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            {canEdit && (
              <>
                <Button 
                  variant="outline" 
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={() => navigate(`/workout-program-creator/${program.id}`)}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                  onClick={confirmDelete}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </>
            )}
            
            {!userProgress && (
              <Button 
                leftIcon={<Play className="h-4 w-4" />}
                onClick={assignProgram}
                isLoading={isAssigning}
              >
                Assign to Me
              </Button>
            )}
            
            {userProgress && userProgress.status === 'not_started' && (
              <Button 
                leftIcon={<Play className="h-4 w-4" />}
                onClick={startProgram}
              >
                Start Program
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">{program.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-primary mr-2" />
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{program.duration_weeks} weeks</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-primary mr-2" />
            <div>
              <p className="text-sm text-gray-500">Workouts</p>
              <p className="font-medium">{Object.keys(exercisesByDay).length} days</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <BarChart2 className="h-5 w-5 text-primary mr-2" />
            <div>
              <p className="text-sm text-gray-500">Difficulty</p>
              <p className="font-medium">{program.difficulty}</p>
            </div>
          </div>
        </div>
        
        {userProgress && (
          <div className={`mb-6 p-4 rounded-lg ${
            userProgress.status === 'completed' ? 'bg-green-50 border border-green-200' :
            userProgress.status === 'in_progress' ? 'bg-blue-50 border border-blue-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <h3 className="font-medium mb-2 flex items-center">
              {userProgress.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : userProgress.status === 'in_progress' ? (
                <Play className="h-5 w-5 text-blue-500 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-gray-500 mr-2" />
              )}
              Your Progress
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{userProgress.status.replace('_', ' ')}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Current Day</p>
                <p className="font-medium">{userProgress.current_day} of {Object.keys(exercisesByDay).length}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">
                  {userProgress.start_date 
                    ? new Date(userProgress.start_date).toLocaleDateString() 
                    : 'Not started yet'}
                </p>
              </div>
            </div>
            
            {program.max_log_count && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Logs</p>
                <p className="font-medium">{userProgress.log_count} of {program.max_log_count} completed</p>
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">Workout Schedule</h2>
      
      {Object.keys(exercisesByDay).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exercises Found</h3>
          <p className="text-gray-500 mb-6">This program doesn't have any exercises yet.</p>
          {canEdit && (
            <Button 
              onClick={() => navigate(`/workout-program-creator/${program.id}`)}
            >
              Add Exercises
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(exercisesByDay).map(([day, dayExercises]) => (
            <Card key={day} className="overflow-visible">
              <CardHeader className="bg-gray-50">
                <CardTitle>Day {day}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {dayExercises.map((exercise, index) => (
                    <div key={exercise.id} className="p-4 hover:bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-2 md:mb-0">
                          <div className="bg-primary/10 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <Link 
                              to={`/exercises/${exercise.exercise_id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {exercise.exercise.name}
                            </Link>
                            <p className="text-sm text-gray-500">{exercise.exercise.muscle_group}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4 text-sm">
                          <div>
                            <span className="text-gray-500">Sets:</span> {exercise.sets}
                          </div>
                          <div>
                            <span className="text-gray-500">Reps:</span> {exercise.reps}
                          </div>
                          <div>
                            <span className="text-gray-500">Rest:</span> {exercise.rest_seconds}s
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramDetail;
