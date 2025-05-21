import React, { useState, useEffect } from 'react';
import { Label } from './UI/Label';
import { supabase } from '../lib/supabaseClient';

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  selectedTeamId: string | null;
  onTeamSelect: (teamId: string | null) => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  selectedTeamId, 
  onTeamSelect 
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('teams')
          .select('id, name')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setTeams(data || []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value || null;
    onTeamSelect(teamId);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="team">Team</Label>
      <select
        id="team"
        value={selectedTeamId || ''}
        onChange={handleTeamChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        disabled={loading}
      >
        <option value="">Select a team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      
      {loading && <p className="text-sm text-gray-500">Loading teams...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
