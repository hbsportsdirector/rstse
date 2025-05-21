import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Loader2, ArrowLeft, UserMinus, Edit } from 'lucide-react';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
  profile_image_url?: string;
  team_id: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
}

const TeamPlayers = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      fetchTeamAndPlayers(teamId);
    }
  }, [teamId]);

  const fetchTeamAndPlayers = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();
      
      if (teamError) throw teamError;
      setTeam(teamData);
      
      // Fetch players in this team
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', id)
        .order('first_name');
      
      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (err: any) {
      console.error('Error fetching team and players:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromTeam = async (playerId: string) => {
    if (!confirm('Are you sure you want to remove this player from the team?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('players')
        .update({ team_id: null })
        .eq('id', playerId);
      
      if (error) throw error;
      
      // Update local state
      setPlayers(players.filter(player => player.id !== playerId));
    } catch (err: any) {
      console.error('Error removing player from team:', err);
      alert(`Error removing player: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>Team not found</p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/teams')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/teams')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{team.name} - Players</h1>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          {team.logo_url ? (
            <img 
              src={team.logo_url} 
              alt={team.name} 
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{team.name[0]}</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{team.name}</h2>
            {team.description && <p className="text-muted-foreground">{team.description}</p>}
            <p className="text-sm mt-1">{players.length} {players.length === 1 ? 'player' : 'players'}</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => (
          <Card key={player.id}>
            <CardContent className="p-4">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden mr-3">
                  {player.profile_image_url ? (
                    <img 
                      src={player.profile_image_url} 
                      alt={`${player.first_name} ${player.last_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-muted-foreground">
                      {player.first_name[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{player.first_name} {player.last_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {player.position || 'No position'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/players/${player.id}`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveFromTeam(player.id)}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {players.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No players in this team</p>
                <Button onClick={() => navigate('/players')}>
                  View All Players
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPlayers;
