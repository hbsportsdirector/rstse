import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Dumbbell, 
  AlertCircle, 
  Youtube, 
  PlayCircle,
  Info,
  Users,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabase';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_groups: string[];
  equipment: string[];
  image_url?: string;
  video_url?: string;
  youtube_short?: string;
  youtube_long?: string;
  thumbnail_url: string;
  created_by: string;
  created_at: string;
}

export default function ExerciseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [relatedPrograms, setRelatedPrograms] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    
    const fetchExercise = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) throw new Error(fetchError.message);
        
        setExercise(data);
        
        // Fetch related programs that use this exercise
        const { data: programData, error: programError } = await supabase
          .from('program_exercises')
          .select(`
            program_id,
            workout_programs(
              id,
              name,
              description,
              created_at
            )
          `)
          .eq('exercise_id', id);
        
        if (programError) throw new Error(programError.message);
        
        // Extract unique programs
        const uniquePrograms = programData
          .filter(item => item.workout_programs)
          .map(item => item.workout_programs)
          .filter((program, index, self) => 
            index === self.findIndex(p => p.id === program.id)
          );
        
        setRelatedPrograms(uniquePrograms);
        
      } catch (err: any) {
        console.error('Error fetching exercise:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercise();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="h-8 w-8 text-primary animate-pulse mx-auto mb-4" />
        <p className="text-muted-foreground">Loading exercise details...</p>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-4">
        <div className="flex items-center text-error">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error || "Exercise not found"}</p>
        </div>
        <Button 
          className="mt-4" 
          onClick={() => navigate('/training-hub')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Training Hub
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate('/training-hub')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <div className="relative">
              <div 
                className="h-64 bg-cover bg-center rounded-t-lg"
                style={{ 
                  backgroundImage: `url(${exercise.image_url || exercise.thumbnail_url})` 
                }}
              />
              {exercise.youtube_short && (
                <Button
                  className="absolute bottom-4 right-4"
                  onClick={() =>
                    setSelectedVideo({
                      url: exercise.youtube_short!,
                      title: `${exercise.name} (Short)`,
                    })
                  }
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Quick Demo
                </Button>
              )}
            </div>
            <CardContent className="py-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 mb-6">{exercise.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Muscle Groups</h3>
                  <div className="flex flex-wrap gap-2">
                    {exercise.muscle_groups.map((group) => (
                      <span
                        key={group}
                        className="px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Equipment</h3>
                  {exercise.equipment && exercise.equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {exercise.equipment.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No equipment required</p>
                  )}
                </div>
              </div>
              
              {exercise.youtube_long && (
                <div className="mt-6">
                  <Button
                    className="w-full"
                    onClick={() =>
                      setSelectedVideo({
                        url: exercise.youtube_long!,
                        title: `${exercise.name} (Full Tutorial)`,
                      })
                    }
                  >
                    <Youtube className="h-5 w-5 mr-2" />
                    Watch Full Tutorial
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Exercise Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Added On</h3>
                    <p className="font-medium">{formatDate(exercise.created_at)}</p>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/create-workout-program')}
                    >
                      Add to New Program
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {relatedPrograms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Related Programs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedPrograms.slice(0, 5).map((program) => (
                      <div 
                        key={program.id} 
                        className="p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer"
                        onClick={() => navigate(`/workout-program/${program.id}`)}
                      >
                        <h3 className="font-medium">{program.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {program.description.length > 60 
                            ? program.description.substring(0, 60) + '...' 
                            : program.description}
                        </p>
                      </div>
                    ))}
                    
                    {relatedPrograms.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-primary"
                      >
                        View All ({relatedPrograms.length})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{selectedVideo.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVideo(null)}
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg"
                src={selectedVideo.url}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
