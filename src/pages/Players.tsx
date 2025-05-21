import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Player, Team } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Plus, Search, UserPlus, Users, Filter } from 'lucide-react';

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all');

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          teams (
            id,
            name
          )
        `)
        .eq('role', 'player') // Filter to only get players
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = 
      (player.first_name + ' ' + player.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTeam = selectedTeam === 'all' || player.team_id === selectedTeam;
    
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Players</h1>
        <Link to="/players/new">
          <Button leftIcon={<UserPlus className="h-4 w-4" />}>
            Add New Player
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search players..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
                <option value="">No Team</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading players...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedTeam !== 'all' 
              ? "No players match your search criteria. Try adjusting your filters."
              : "You haven't added any players yet."}
          </p>
          <Link to="/players/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Add Your First Player
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map(player => {
            const teamName = teams.find(team => team.id === player.team_id)?.name || 'No Team';
            
            return (
              <Link key={player.id} to={`/players/${player.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mr-4">
                        {player.first_name[0]}{player.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{player.first_name} {player.last_name}</h3>
                        <p className="text-sm text-gray-500">{player.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Team</p>
                        <p className="font-medium">{teamName}</p>
                      </div>
                      
                      {player.position && (
                        <div>
                          <p className="text-gray-500">Position</p>
                          <p className="font-medium">{player.position}</p>
                        </div>
                      )}
                      
                      {player.date_of_birth && (
                        <div>
                          <p className="text-gray-500">Age</p>
                          <p className="font-medium">
                            {calculateAge(player.date_of_birth)}
                          </p>
                        </div>
                      )}
                      
                      {player.height_cm && (
                        <div>
                          <p className="text-gray-500">Height</p>
                          <p className="font-medium">{player.height_cm} cm</p>
                        </div>
                      )}
                      
                      {player.weight_kg && (
                        <div>
                          <p className="text-gray-500">Weight</p>
                          <p className="font-medium">{player.weight_kg} kg</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export default Players;
