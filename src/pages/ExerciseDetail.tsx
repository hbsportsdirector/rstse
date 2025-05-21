import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Exercise } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { ArrowLeft, Dumbbell, Clock, BarChart2, Video } from 'lucide-react';

const ExerciseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setExercise(data);
      } catch (err: any) {
        console.error('Error fetching exercise:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExercise();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading exercise details...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'Exercise not found'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{exercise.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {exercise.difficulty}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {exercise.muscle_group}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {exercise.equipment}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">{exercise.description}</p>
              
              {exercise.instructions && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                  <div className="prose max-w-none">
                    {exercise.instructions.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center">
                  <Dumbbell className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Equipment</p>
                    <p className="font-medium">{exercise.equipment}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Difficulty</p>
                    <p className="font-medium">{exercise.difficulty}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Muscle Group</p>
                    <p className="font-medium">{exercise.muscle_group}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              {exercise.image_url ? (
                <div className="mb-6">
                  <img 
                    src={exercise.image_url} 
                    alt={exercise.name} 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center mb-6">
                  <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
              
              {exercise.video_url ? (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Video Demonstration</h3>
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={exercise.video_url}
                      title={`${exercise.name} demonstration`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg"
                    ></iframe>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No video available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetail;
