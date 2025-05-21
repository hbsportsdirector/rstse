import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  Loader2, 
  Users, 
  Calendar,
  Info,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Metric {
  name: string;
  unit: string;
}

interface PhysicalTest {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: Metric[];
  equipment?: string[];
  instructions: string[];
  is_club_test: boolean;
  created_at: string;
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  team_id?: string;
}

interface TestResult {
  player_id: string;
  metrics: Record<string, string | number>;
  notes?: string;
}

const PhysicalTestForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [test, setTest] = useState<PhysicalTest | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [teams, setTeams] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchTestAndPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          throw new Error('Test ID is required');
        }
        
        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from('physical_tests')
          .select('*')
          .eq('id', id)
          .single();
        
        if (testError) throw testError;
        setTest(testData);
        
        // Fetch teams for filtering
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name');
          
        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
        
        // Fetch players
        let query = supabase
          .from('players')
          .select('id, first_name, last_name, profile_image_url, team_id');
          
        if (teamFilter !== 'all') {
          query = query.eq('team_id', teamFilter);
        }
        
        const { data: playersData, error: playersError } = await query;
        
        if (playersError) throw playersError;
        setPlayers(playersData || []);
        
        // Initialize results object with empty values for all metrics
        if (testData && playersData) {
          const initialResults: Record<string, TestResult> = {};
          playersData.forEach(player => {
            const metricValues: Record<string, string | number> = {};
            testData.metrics.forEach(metric => {
              metricValues[metric.name] = '';
            });
            
            initialResults[player.id] = {
              player_id: player.id,
              metrics: metricValues,
              notes: ''
            };
          });
          
          setResults(initialResults);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestAndPlayers();
  }, [id, teamFilter]);

  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map(player => player.id));
    }
  };

  const handleMetricChange = (playerId: string, metricName: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        metrics: {
          ...prev[playerId].metrics,
          [metricName]: value
        }
      }
    }));
  };

  const handleNotesChange = (playerId: string, notes: string) => {
    setResults(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        notes
      }
    }));
  };

  const validateResults = () => {
    // Only validate selected players
    for (const playerId of selectedPlayers) {
      const playerResult = results[playerId];
      
      // Check if at least one metric has a value
      const hasValue = Object.values(playerResult.metrics).some(value => 
        value !== undefined && value !== null && value !== ''
      );
      
      if (!hasValue) {
        return `Please enter at least one metric value for ${
          players.find(p => p.id === playerId)?.first_name || 'selected player'
        }`;
      }
    }
    
    return null;
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      if (!test) {
        throw new Error('Test data is missing');
      }
      
      if (selectedPlayers.length === 0) {
        throw new Error('Please select at least one player');
      }
      
      const validationError = validateResults();
      if (validationError) {
        throw new Error(validationError);
      }
      
      // Prepare results for selected players only
      const resultsToSave = selectedPlayers.map(playerId => ({
        test_id: id,
        player_id: playerId,
        date: testDate,
        results: results[playerId].metrics,
        notes: results[playerId].notes || null,
        recorded_by: user?.id
      }));
      
      // Save to database
      const { error: saveError } = await supabase
        .from('physical_test_results')
        .insert(resultsToSave);
      
      if (saveError) throw saveError;
      
      setSuccess(true);
      
      // Reset selection after successful save
      setSelectedPlayers([]);
      
      // Optionally navigate back after a delay
      setTimeout(() => {
        navigate('/physical-tests');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error saving results:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>Error loading test: {error}</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/physical-tests')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Physical Tests
          </Button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Test not found</p>
            <Button onClick={() => navigate('/physical-tests')}>
              Back to Physical Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate('/physical-tests')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{test.name} - Record Results</h1>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={saving || selectedPlayers.length === 0}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Results
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <p>Results saved successfully!</p>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600">{test.description}</p>
              
              <h3 className="font-medium mt-4 mb-2">Metrics</h3>
              <div className="flex flex-wrap gap-2">
                {test.metrics.map((metric, index) => (
                  <span key={index} className="text-sm bg-muted px-3 py-1 rounded-full">
                    {metric.name} ({metric.unit})
                  </span>
                ))}
              </div>
              
              {test.equipment && test.equipment.length > 0 && (
                <>
                  <h3 className="font-medium mt-4 mb-2">Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {test.equipment.map((item, index) => (
                      <span key={index} className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                {test.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Test Date
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <input
              type="date"
              className="input-field"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Select Players
            </CardTitle>
            <div className="flex items-center gap-4">
              <div>
                <select
                  className="select-field"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedPlayers.length === players.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map(player => (
              <div 
                key={player.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPlayers.includes(player.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => handlePlayerSelection(player.id)}
              >
                <div className="flex items-center">
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
                    <p className="font-medium">{player.first_name} {player.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {teams.find(t => t.id === player.team_id)?.name || 'No team'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {players.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No players found. Try changing the team filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Record Results ({selectedPlayers.length} players selected)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {selectedPlayers.map(playerId => {
                const player = players.find(p => p.id === playerId);
                if (!player) return null;
                
                return (
                  <div key={playerId} className="border-b pb-6 last:border-b-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-lg">
                        {player.first_name} {player.last_name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayerSelection(playerId)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {test.metrics.map((metric, index) => (
                        <div key={index}>
                          <label className="form-label">
                            {metric.name} ({metric.unit})
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder={`Enter ${metric.name}`}
                            value={results[playerId]?.metrics[metric.name] || ''}
                            onChange={(e) => handleMetricChange(playerId, metric.name, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <label className="form-label">Notes (Optional)</label>
                      <textarea
                        className="input-field"
                        rows={2}
                        placeholder="Add any observations or notes about this player's performance"
                        value={results[playerId]?.notes || ''}
                        onChange={(e) => handleNotesChange(playerId, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedPlayers.length > 0 && (
        <div className="flex justify-end">
          <Button 
            size="lg"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Results
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhysicalTestForm;
