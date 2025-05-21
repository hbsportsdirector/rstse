import React, { useState, useEffect } from 'react';
import { Label } from './UI/Label';
import { supabase } from '../lib/supabaseClient';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
}

interface AthleteSelectorProps {
  teamId: string | null;
  selectedAthleteId: string | null;
  onAthleteSelect: (athleteId: string | null) => void;
}

export const AthleteSelector: React.FC<AthleteSelectorProps> = ({
  teamId,
  selectedAthleteId,
  onAthleteSelect,
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      if (!teamId) {
        setAthletes([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('athletes')
          .select('id, first_name, last_name')
          .eq('team_id', teamId)
          .order('last_name, first_name');
        
        if (error) {
          throw error;
        }
        
        setAthletes(data || []);
        
        // Reset selected athlete if not in the new team
        if (selectedAthleteId) {
          const athleteExists = data?.some(athlete => athlete.id === selectedAthleteId);
          if (!athleteExists) {
            onAthleteSelect(null);
          }
        }
      } catch (err) {
        console.error('Error fetching athletes:', err);
        setError('Failed to load athletes');
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [teamId, selectedAthleteId, onAthleteSelect]);

  const handleAthleteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const athleteId = e.target.value || null;
    onAthleteSelect(athleteId);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="athlete">Athlete</Label>
      <select
        id="athlete"
        value={selectedAthleteId || ''}
        onChange={handleAthleteChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        disabled={loading || !teamId}
      >
        <option value="">Select an athlete</option>
        {athletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>
            {athlete.last_name}, {athlete.first_name}
          </option>
        ))}
      </select>
      
      {loading && <p className="text-sm text-gray-500">Loading athletes...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!teamId && <p className="text-sm text-gray-500">Select a team first</p>}
    </div>
  );
};
