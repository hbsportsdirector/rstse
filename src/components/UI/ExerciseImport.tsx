import React, { useState, useRef } from 'react';
import { AlertCircle, Upload, FileText, Check, X } from 'lucide-react';
import Button from './Button';
import { supabase } from '../../lib/supabase';

interface ExerciseRow {
  exercise: string;
  youtube_short: string;
  youtube_long: string;
  muscle_group: string;
  equipment: string;
  body_region: string;
  thumbnail: string;
}

interface ImportResult {
  success: boolean;
  name: string;
  error?: string;
}

interface ExerciseImportProps {
  onComplete: () => void;
}

export function ExerciseImport({ onComplete }: ExerciseImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeHeader = (header: string): string => {
    return header
      .toLowerCase()
      .replace(/[^a-z_]/g, '')
      .trim();
  };

  const detectDelimiter = (content: string): string => {
    const firstLine = content.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  const parseCSV = (content: string): ExerciseRow[] => {
    const delimiter = detectDelimiter(content);
    const lines = content.split('\n');
    
    // Get raw headers and normalize them
    const rawHeaders = lines[0].split(delimiter).map(h => h.trim());
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    
    // Validate required headers
    const requiredHeaders = [
      'exercise',
      'youtube_short',
      'youtube_long',
      'muscle_group',
      'equipment',
      'body_region',
      'thumbnail'
    ];
    
    const missingHeaders = requiredHeaders.filter(h => !normalizedHeaders.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required headers: ${missingHeaders.join(', ')}.\n` +
        `Found headers: ${rawHeaders.join(delimiter)}\n` +
        `Normalized headers: ${normalizedHeaders.join(', ')}`
      );
    }

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        return {
          exercise: values[normalizedHeaders.indexOf('exercise')],
          youtube_short: values[normalizedHeaders.indexOf('youtube_short')],
          youtube_long: values[normalizedHeaders.indexOf('youtube_long')],
          muscle_group: values[normalizedHeaders.indexOf('muscle_group')],
          equipment: values[normalizedHeaders.indexOf('equipment')],
          body_region: values[normalizedHeaders.indexOf('body_region')],
          thumbnail: values[normalizedHeaders.indexOf('thumbnail')]
        };
      });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResults([]);
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    try {
      setIsProcessing(true);
      const content = await file.text();
      const exercises = parseCSV(content);
      
      const importResults: ImportResult[] = [];

      for (const exercise of exercises) {
        try {
          // Validate data
          if (!exercise.exercise) {
            throw new Error('Exercise name is required');
          }
          if (!exercise.muscle_group) {
            throw new Error('Muscle group is required');
          }
          if (!exercise.thumbnail) {
            throw new Error('Thumbnail URL is required');
          }

          // Check if exercise already exists
          const { data: existingExercise, error: checkError } = await supabase
            .from('exercises')
            .select('id')
            .eq('name', exercise.exercise)
            .single();

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw checkError;
          }

          if (existingExercise) {
            importResults.push({
              success: false,
              name: exercise.exercise,
              error: 'Exercise with this name already exists'
            });
            continue;
          }

          // Insert exercise into database
          const { error: exerciseError } = await supabase
            .from('exercises')
            .insert({
              name: exercise.exercise,
              description: `${exercise.body_region} exercise targeting ${exercise.muscle_group}`,
              muscle_groups: exercise.muscle_group.split(',').map(g => g.trim()),
              equipment: exercise.equipment ? exercise.equipment.split(',').map(e => e.trim()) : [],
              video_url: exercise.youtube_long || exercise.youtube_short || null,
              thumbnail_url: exercise.thumbnail,
              instructions: [`Watch the video guide for detailed instructions`],
              created_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (exerciseError) throw exerciseError;

          importResults.push({
            success: true,
            name: exercise.exercise
          });
        } catch (err: any) {
          importResults.push({
            success: false,
            name: exercise.exercise,
            error: err.message
          });
        }
      }

      setResults(importResults);
      
      // If all imports were successful, call onComplete
      if (importResults.every(r => r.success)) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Import Exercises</h3>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with exercise information
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          leftIcon={<Upload className="h-4 w-4" />}
        >
          Upload CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="border rounded-lg divide-y">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{result.name}</span>
              </div>
              <div className="flex items-center">
                {result.success ? (
                  <span className="text-success flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Success
                  </span>
                ) : (
                  <span className="text-error flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {result.error}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p className="font-medium">CSV Format:</p>
        <ul className="list-disc list-inside">
          <li>Required columns: exercise, youtube_short, youtube_long, muscle_group, equipment, body_region, thumbnail</li>
          <li>Use commas to separate multiple values in muscle_group and equipment</li>
          <li>First row must contain column headers</li>
          <li>Values can be separated by commas or semicolons</li>
        </ul>
        <p className="mt-2">Example row:</p>
        <pre className="bg-muted p-2 rounded-md text-xs mt-1 overflow-x-auto">
          Bench Press,https://youtu.be/short,https://youtu.be/long,Chest,Barbell,Upper Body,https://example.com/thumbnail.jpg
        
        </pre>
      </div>
    </div>
  );
}
