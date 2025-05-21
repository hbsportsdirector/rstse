// src/pages/CreateExercise.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import { AlertCircle } from 'lucide-react';

export default function CreateExercise() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [newMuscle, setNewMuscle] = useState('');
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [equipmentText, setEquipmentText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [instructionsUrl, setInstructionsUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  // load existing muscle_groups for the select
  useEffect(() => {
    async function loadMuscles() {
      const { data, error } = await supabase
        .from('exercises')
        .select('muscle_groups');
      if (error) {
        console.error(error);
        return;
      }
      const all = (data || [])
        .flatMap((r) => r.muscle_groups || [])
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();
      setMuscleOptions(all);
    }
    loadMuscles();
  }, []);

  // Extract YouTube video ID from URL
  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    
    // Match patterns like:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://youtube.com/shorts/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([^&\?\/]+)/,
      /youtube\.com\/v\/([^&\?\/]+)/,
      /youtube\.com\/embed\/([^&\?\/]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Generate thumbnail URL from YouTube video ID
  const generateThumbnailUrl = (videoId: string | null): string => {
    if (!videoId) return '';
    // YouTube provides several thumbnail options:
    // - maxresdefault.jpg (HD)
    // - hqdefault.jpg (HQ)
    // - mqdefault.jpg (MQ)
    // - default.jpg (SD)
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  // Update thumbnail preview when video URL changes
  useEffect(() => {
    if (videoUrl) {
      const videoId = extractYoutubeId(videoUrl);
      const thumbnail = generateThumbnailUrl(videoId);
      setPreviewThumbnail(thumbnail);
      setThumbnailUrl(thumbnail); // Auto-set the thumbnail URL
    } else {
      setPreviewThumbnail(null);
      setThumbnailUrl('');
    }
  }, [videoUrl]);

  // add a new muscle group on the fly
  const handleAddMuscle = () => {
    const m = newMuscle.trim();
    if (!m) return;
    if (!muscleOptions.includes(m)) {
      setMuscleOptions((prev) => [...prev, m]);
    }
    setSelectedMuscle(m);
    setNewMuscle('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to create an exercise.');
      return;
    }

    setLoading(true);
    setError(null);

    // Ensure we have a thumbnail URL if a video URL is provided
    let finalThumbnailUrl = thumbnailUrl;
    if (videoUrl && !thumbnailUrl) {
      const videoId = extractYoutubeId(videoUrl);
      finalThumbnailUrl = generateThumbnailUrl(videoId);
    }

    const payload = {
      name,
      description,
      muscle_groups: selectedMuscle ? [selectedMuscle] : [],
      equipment: equipmentText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      video_url: videoUrl || null,
      instructions: instructionsUrl ? [instructionsUrl] : [],
      created_by: user.id,
      thumbnail_url: finalThumbnailUrl || null,
    };

    const { error: insertError } = await supabase
      .from('exercises')
      .insert(payload)
      .single();

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError(insertError.message);
    } else {
      navigate('/training');
    }
  };

  // Handle custom thumbnail URL input
  const handleThumbnailUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThumbnailUrl(e.target.value);
    // If user enters a custom URL, update the preview
    if (e.target.value) {
      setPreviewThumbnail(e.target.value);
    } else if (videoUrl) {
      // If they clear the custom URL, revert to the YouTube thumbnail
      const videoId = extractYoutubeId(videoUrl);
      setPreviewThumbnail(generateThumbnailUrl(videoId));
    } else {
      setPreviewThumbnail(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create New Exercise</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full input-field"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full textarea-field"
          />
        </div>

        {/* Target Main Muscle Group */}
        <div>
          <label htmlFor="muscles" className="block font-medium mb-1">
            Target Main Muscle Group
          </label>
          <select
            id="muscles"
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full select-field"
          >
            <option value="" disabled>
              Select muscle group
            </option>
            {muscleOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Add new muscle group */}
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              placeholder="Add new muscle group"
              value={newMuscle}
              onChange={(e) => setNewMuscle(e.target.value)}
              className="flex-1 input-field"
            />
            <Button
              type="button"
              onClick={handleAddMuscle}
              disabled={!newMuscle.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label htmlFor="equipment" className="block font-medium mb-1">
            Equipment
          </label>
          <input
            id="equipment"
            type="text"
            placeholder="e.g. kettlebell, resistance band, none"
            value={equipmentText}
            onChange={(e) => setEquipmentText(e.target.value)}
            className="w-full input-field"
          />
          <p className="text-sm text-gray-500 mt-1">
            Comma-separate multiple items.
          </p>
        </div>

        {/* Instruction Video (Short) */}
        <div>
          <label htmlFor="videoUrl" className="block font-medium mb-1">
            Instruction Video (Short)
          </label>
          <input
            id="videoUrl"
            type="url"
            placeholder="https://youtube.com/..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full input-field"
          />
          <p className="text-sm text-gray-500 mt-1">
            YouTube URL (will automatically generate a thumbnail)
          </p>
        </div>

        {/* Thumbnail Preview */}
        {previewThumbnail && (
          <div>
            <label className="block font-medium mb-1">Thumbnail Preview</label>
            <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={previewThumbnail}
                alt="Video thumbnail preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/600x400?text=Thumbnail+Error';
                  setError('Could not load thumbnail preview. Please check the video URL.');
                }}
              />
            </div>
          </div>
        )}

        {/* Custom Thumbnail URL (optional) */}
        <div>
          <label htmlFor="thumbnailUrl" className="block font-medium mb-1">
            Custom Thumbnail URL (optional)
          </label>
          <input
            id="thumbnailUrl"
            type="url"
            placeholder="https://..."
            value={thumbnailUrl}
            onChange={handleThumbnailUrlChange}
            className="w-full input-field"
          />
          <p className="text-sm text-gray-500 mt-1">
            Override the auto-generated thumbnail with a custom image URL
          </p>
        </div>

        {/* Detailed Instructions (Video) */}
        <div>
          <label htmlFor="instructionsUrl" className="block font-medium mb-1">
            Detailed Instructions (Video)
          </label>
          <input
            id="instructionsUrl"
            type="url"
            placeholder="https://..."
            value={instructionsUrl}
            onChange={(e) => setInstructionsUrl(e.target.value)}
            className="w-full input-field"
          />
          <p className="text-sm text-gray-500 mt-1">(optional)</p>
        </div>

        {/* YouTube URL Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-700">YouTube Video Tips</h3>
              <p className="text-sm text-blue-600 mt-1">
                Supported YouTube URL formats:
              </p>
              <ul className="text-sm text-blue-600 list-disc list-inside mt-1">
                <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
                <li>https://youtu.be/VIDEO_ID</li>
                <li>https://youtube.com/shorts/VIDEO_ID</li>
                <li>https://www.youtube.com/embed/VIDEO_ID</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Exercise'}
          </Button>
        </div>
      </form>
    </div>
  );
}
