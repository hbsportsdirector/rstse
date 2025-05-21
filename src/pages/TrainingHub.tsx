import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Layout,
  Grid,
  List,
  Dumbbell,
  Info,
  Upload,
  Image as ImageIcon,
  Edit,
  AlertCircle,
  PlayCircle,
  Youtube,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/UI/Card';
import Button from '../components/UI/Button';
import { ExerciseImport } from '../components/UI/ExerciseImport';
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
}

export default function TrainingHub() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type'>('recent');

  // Store unique values for filters
  const [uniqueMuscleGroups, setUniqueMuscleGroups] = useState<string[]>([]);
  const [uniqueEquipment, setUniqueEquipment] = useState<string[]>([]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from('exercises').select('*');

        // Apply search filter
        if (searchQuery) {
          query = query.or(
            `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
          );
        }

        // Apply muscle group filter
        if (muscleGroupFilter) {
          query = query.contains('muscle_groups', [muscleGroupFilter]);
        }

        // Apply equipment filter
        if (equipmentFilter) {
          if (equipmentFilter === 'none') {
            query = query.eq('equipment', '{}');
          } else {
            query = query.contains('equipment', [equipmentFilter]);
          }
        }

        // Apply sorting
        switch (sortBy) {
          case 'recent':
            query = query.order('created_at', { ascending: false });
            break;
          case 'name':
            query = query.order('name');
            break;
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setExercises(data || []);

        // Extract unique muscle groups and equipment
        if (data) {
          const muscleGroups = new Set<string>();
          const equipment = new Set<string>();

          data.forEach((exercise) => {
            exercise.muscle_groups.forEach((group) => muscleGroups.add(group));
            exercise.equipment.forEach((item) => equipment.add(item));
          });

          setUniqueMuscleGroups(Array.from(muscleGroups).sort());
          setUniqueEquipment(Array.from(equipment).sort());
        }
      } catch (err: any) {
        console.error('Error fetching exercises:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [searchQuery, muscleGroupFilter, equipmentFilter, sortBy]);

  const handleUpdateImage = async () => {
    if (!editingExercise || !imageUrl) return;

    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('exercises')
        .update({ image_url: imageUrl })
        .eq('id', editingExercise.id)
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      setExercises(
        exercises.map((ex) =>
          ex.id === editingExercise.id ? { ...ex, image_url: imageUrl } : ex
        )
      );

      setEditingExercise(null);
      setImageUrl('');
    } catch (err: any) {
      console.error('Error updating exercise image:', err);
      setError(err.message);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setMuscleGroupFilter('');
    setEquipmentFilter('');
    setSortBy('recent');
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map((exercise) => (
        <Card
          key={exercise.id}
          className="h-full flex flex-col animate-scale-in hover:shadow-lg transition-shadow"
        >
          <div className="relative group">
            <div
              className="h-48 bg-cover bg-center rounded-t-lg"
              style={{ backgroundImage: `url(${exercise.thumbnail_url})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
              {exercise.youtube_short && (
                <Button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    setSelectedVideo({
                      url: exercise.youtube_short!,
                      title: `${exercise.name} (Short)`,
                    })
                  }
                >
                  <PlayCircle className="h-8 w-8" />
                </Button>
              )}
            </div>
            <Button
              size="sm"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              onClick={() => {
                setEditingExercise(exercise);
                setImageUrl(exercise.image_url || '');
              }}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Edit Image
            </Button>
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{exercise.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
            <div className="flex flex-wrap gap-1">
              {exercise.muscle_groups.map((group) => (
                <span
                  key={group}
                  className="text-xs px-2 py-1 bg-muted rounded-full"
                >
                  {group}
                </span>
              ))}
            </div>
            {exercise.equipment && exercise.equipment.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.equipment.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
            {exercise.youtube_long && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() =>
                  setSelectedVideo({
                    url: exercise.youtube_long!,
                    title: `${exercise.name} (Full Tutorial)`,
                  })
                }
              >
                <Youtube className="h-4 w-4 mr-2" />
                Watch Full Tutorial
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button size="sm" variant="outline">
              Details
            </Button>
            <Button size="sm">Add to Workout</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {exercises.map((exercise) => (
        <Card
          key={exercise.id}
          className="animate-fade-in hover:shadow-md transition-shadow"
        >
          <div className="flex">
            <div className="relative group w-24">
              <div
                className="w-24 h-24 bg-cover bg-center rounded-l-lg"
                style={{ backgroundImage: `url(${exercise.thumbnail_url})` }}
              />
              {exercise.youtube_short && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center rounded-l-lg">
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      setSelectedVideo({
                        url: exercise.youtube_short!,
                        title: `${exercise.name} (Short)`,
                      })
                    }
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                className="absolute -top-2 -right-2 bg-white shadow-md hover:bg-white"
                onClick={() => {
                  setEditingExercise(exercise);
                  setImageUrl(exercise.image_url || '');
                }}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{exercise.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {exercise.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.muscle_groups.map((group) => (
                  <span
                    key={group}
                    className="text-xs px-2 py-1 bg-muted rounded-full"
                  >
                    {group}
                  </span>
                ))}
                {exercise.equipment &&
                  exercise.equipment.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                    >
                      {item}
                    </span>
                  ))}
              </div>
              {exercise.youtube_long && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setSelectedVideo({
                      url: exercise.youtube_long!,
                      title: `${exercise.name} (Full Tutorial)`,
                    })
                  }
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Watch Tutorial
                </Button>
              )}
            </div>
            <div className="flex items-center pr-4">
              <Button size="sm">Add</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Training Hub</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setShowImport(true)}
          >
            Import Exercises
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            Filter
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showImport && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <ExerciseImport
              onComplete={() => {
                setShowImport(false);
                window.location.reload();
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search exercises by name, muscle group, or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filterOpen && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 animate-slide-down">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Filter Exercises</h3>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Muscle Group</label>
              <select
                className="select-field"
                value={muscleGroupFilter}
                onChange={(e) => setMuscleGroupFilter(e.target.value)}
              >
                <option value="">All Muscle Groups</option>
                {uniqueMuscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Equipment</label>
              <select
                className="select-field"
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
              >
                <option value="">All Equipment</option>
                <option value="none">No Equipment</option>
                {uniqueEquipment.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <select
              className="select-field w-48"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'recent' | 'name' | 'type')
              }
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-primary mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Training Hub Tips</h3>
            <p className="text-sm text-gray-600 mt-1">
              Browse exercises to build your own workouts or select a
              pre-designed program. Your coach can assign specific programs
              based on your needs and performance tests.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Dumbbell className="h-8 w-8 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      ) : error ? (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      ) : exercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Exercises Found</h3>
            <p className="text-muted-foreground">
              Start by importing exercises or creating new ones.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Exercise Library</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/create-exercise')}
              >
                Create Exercise
              </Button>
            </div>

            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>

          <div>
            <div className="sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Workout Programs</h2>
              <Card>
                <CardContent className="py-6 text-center">
                  <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Create a Program</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Design custom workout programs for yourself or your team
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/workout-program-creator')}
                  >
                    Create Program
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {editingExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              Update Image for {editingExercise.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="form-label" htmlFor="imageUrl">
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input-field"
                  placeholder="Enter image URL"
                />
              </div>

              {imageUrl && (
                <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = editingExercise.thumbnail_url;
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingExercise(null);
                    setImageUrl('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateImage} disabled={!imageUrl}>
                  Update Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
