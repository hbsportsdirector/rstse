import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Loader2, Plus, Edit, Trash2, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  player_count?: number;
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
  profile_image_url?: string;
  team_id?: string;
}

const TeamManagement = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedPlayers, setUnassignedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: ''
  });
  const [showUnassignedPlayers, setShowUnassignedPlayers] = useState(false);
  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
    fetchUnassignedPlayers();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (teamsError) throw teamsError;
      
      // Get player counts for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count, error: countError } = await supabase
            .from('players')
            .select('id', { count: 'exact', head: true })
            .eq('team_id', team.id);
          
          if (countError) throw countError;
          
          return {
            ...team,
            player_count: count || 0
          };
        })
      );
      
      setTeams(teamsWithCounts);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .is('team_id', null)
        .order('first_name');
      
      if (error) throw error;
      
      setUnassignedPlayers(data || []);
    } catch (err: any) {
      console.error('Error fetching unassigned players:', err);
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTeam = () => {
    setIsAddingTeam(true);
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      logo_url: ''
    });
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsAddingTeam(false);
    setFormData({
      name: team.name,
      description: team.description || '',
      logo_url: team.logo_url || ''
    });
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? This will remove all players from the team.')) {
      return;
    }
    
    try {
      // First, unassign all players from this team
      const { error: updateError } = await supabase
        .from('players')
        .update({ team_id: null })
        .eq('team_id', id);
      
      if (updateError) throw updateError;
      
      // Then delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setTeams(teams.filter(team => team.id !== id));
      // Refresh unassigned players
      fetchUnassignedPlayers();
    } catch (err: any) {
      console.error('Error deleting team:', err);
      alert(`Error deleting team: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTeam) {
        // Update existing team
        const { error } = await supabase
          .from('teams')
          .update({
            name: formData.name,
            description: formData.description,
            logo_url: formData.logo_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTeam.id);
        
        if (error) throw error;
      } else {
        // Create new team
        const { error } = await supabase
          .from('teams')
          .insert({
            name: formData.name,
            description: formData.description,
            logo_url: formData.logo_url || null
          });
        
        if (error) throw error;
      }
      
      // Reset form and fetch updated teams
      setFormData({
        name: '',
        description: '',
        logo_url: ''
      });
      setIsAddingTeam(false);
      setEditingTeam(null);
      fetchTeams();
    } catch (err: any) {
      console.error('Error saving team:', err);
      alert(`Error saving team: ${err.message}`);
    }
  };

  const cancelForm = () => {
    setIsAddingTeam(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      logo_url: ''
    });
  };

  const handleAssignPlayer = async (playerId: string, teamId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ team_id: teamId })
        .eq('id', playerId);
      
      if (error) throw error;
      
      // Update local state
      setUnassignedPlayers(unassignedPlayers.filter(player => player.id !== playerId));
      // Refresh teams to update player counts
      fetchTeams();
      // Reset assignment UI
      setAssigningPlayerId(null);
      setSelectedTeamId(null);
    } catch (err: any) {
      console.error('Error assigning player:', err);
      alert(`Error assigning player: ${err.message}`);
    }
  };

  const toggleUnassignedPlayers = () => {
    setShowUnassignedPlayers(!showUnassignedPlayers);
    if (!showUnassignedPlayers) {
      fetchUnassignedPlayers();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={toggleUnassignedPlayers}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {showUnassignedPlayers ? 'Hide Unassigned' : 'Show Unassigned'}
          </Button>
          {!isAddingTeam && !editingTeam && (
            <Button onClick={handleAddTeam}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      {/* Unassigned Players Section */}
      {showUnassignedPlayers && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Players</CardTitle>
          </CardHeader>
          <CardContent>
            {unassignedPlayers.length === 0 ? (
              <p className="text-muted-foreground">No unassigned players found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unassignedPlayers.map(player => (
                  <Card key={player.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden mr-3">
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
                      
                      {assigningPlayerId === player.id ? (
                        <div className="space-y-2">
                          <select
                            className="select-field w-full"
                            value={selectedTeamId || ''}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                          >
                            <option value="">Select a team</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setAssigningPlayerId(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              disabled={!selectedTeamId}
                              onClick={() => selectedTeamId && handleAssignPlayer(player.id, selectedTeamId)}
                            >
                              Assign
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setAssigningPlayerId(player.id);
                              setSelectedTeamId(null);
                            }}
                          >
                            Assign to Team
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Team Form */}
      {(isAddingTeam || editingTeam) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="name">
                  Team Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="input-field"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="form-label" htmlFor="logo_url">
                  Logo URL (optional)
                </label>
                <input
                  id="logo_url"
                  name="logo_url"
                  type="text"
                  className="input-field"
                  value={formData.logo_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={cancelForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <Card key={team.id}>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {team.logo_url ? (
                  <img 
                    src={team.logo_url} 
                    alt={team.name} 
                    className="h-12 w-12 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {team.player_count} {team.player_count === 1 ? 'player' : 'players'}
                  </p>
                </div>
              </div>
              
              {team.description && (
                <p className="text-sm text-gray-600 mb-4">{team.description}</p>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/team/${team.id}/players`)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  View Players
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditTeam(team)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteTeam(team.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {teams.length === 0 && !isAddingTeam && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No teams found</p>
                <Button onClick={handleAddTeam}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
