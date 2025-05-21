import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle, ChevronLeft, Save, Calendar, Info, Clock, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PhysicalTest {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: {
    name: string;
    unit: string;
    target?: number;
  }[];
  instructions: string[];
  recommended_frequency_days?: number;
  recommended_months?: number[];
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  team_id: string | null;
}

interface TestResult {
  id: string;
  date: string;
  metrics: Record<string, number>;
  notes?: string;
}

interface PlayerResult {
  userId: string;
  metrics: Record<string, number>;
}

export default function PhysicalTestResults() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<PhysicalTest | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [results, setResults] = useState<Record<string, TestResult[]>>({});
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from('physical_tests')
          .select('*')
          .eq('id', id)
          .single();

        if (testError) throw testError;
        setTest(testData);

        // Fetch players (exclude coaches and admins)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role, team_id')
          .eq('role', 'player')
          .order('last_name');

        if (usersError) throw usersError;
        setPlayers(usersData || []);

        // Initialize player results
        setPlayerResults(
          (usersData || []).map(player => ({
            userId: player.id,
            metrics: testData.metrics.reduce((acc, metric) => ({
              ...acc,
              [metric.name]: 0
            }), {})
          }))
        );

        // Fetch existing results for all players
        const { data: resultsData, error: resultsError } = await supabase
          .from('test_results')
          .select('*')
          .eq('test_id', id)
          .order('date', { ascending: false });

        if (resultsError) throw resultsError;

        // Group results by user
        const groupedResults = (resultsData || []).reduce((acc, result) => {
          if (!acc[result.user_id]) {
            acc[result.user_id] = [];
          }
          acc[result.user_id].push(result);
          return acc;
        }, {} as Record<string, TestResult[]>);

        setResults(groupedResults);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleMetricChange = (playerIndex: number, metricName: string, value: string) => {
    const updatedResults = [...playerResults];
    updatedResults[playerIndex].metrics[metricName] = parseFloat(value) || 0;
    setPlayerResults(updatedResults);
  };

  const handleSubmit = async () => {
    if (!test) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Filter out results where all metrics are 0
      const validResults = playerResults.filter(result => 
        Object.values(result.metrics).some(value => value > 0)
      );

      if (validResults.length === 0) {
        throw new Error('Please enter at least one result');
      }

      // Insert all results
      const { error: submitError } = await supabase
        .from('test_results')
        .insert(
          validResults.map(result => ({
            test_id: id,
            user_id: result.userId,
            metrics: result.metrics,
            notes: notes.trim() || null
          }))
        );

      if (submitError) throw submitError;

      // Refresh results
      const { data: newResults, error: refreshError } = await supabase
        .from('test_results')
        .select('*')
        .eq('test_id', id)
        .order('date', { ascending: false });

      if (refreshError) throw refreshError;

      // Group new results by user
      const groupedResults = (newResults || []).reduce((acc, result) => {
        if (!acc[result.user_id]) {
          acc[result.user_id] = [];
        }
        acc[result.user_id].push(result);
        return acc;
      }, {} as Record<string, TestResult[]>);

      setResults(groupedResults);

      // Reset form
      setPlayerResults(
        players.map(player => ({
          userId: player.id,
          metrics: test.metrics.reduce((acc, metric) => ({
            ...acc,
            [metric.name]: 0
          }), {})
        }))
      );
      setNotes('');

    } catch (err: any) {
      console.error('Error submitting results:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLastTestDate = (userId: string): string | null => {
    const userResults = results[userId];
    if (!userResults || userResults.length === 0) return null;
    return userResults[0].date;
  };

  const getRecommendedTestingInfo = (): string => {
    if (!test) return '';
    
    let info = '';
    
    if (test.recommended_frequency_days) {
      info += `Recommended every ${test.recommended_frequency_days} days. `;
    }
    
    if (test.recommended_months && test.recommended_months.length > 0) {
      const monthNames = test.recommended_months.map(m => 
        new Date(2000, m - 1).toLocaleString('default', { month: 'long' })
      );
      info += `Recommended testing months: ${monthNames.join(', ')}`;
    }
    
    return info || 'No specific testing schedule recommended';
  };

  const viewPlayerHistory = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only coaches and administrators can record test results.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/physical-tests')}
              >
                Return to Physical Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Loading test details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Test Not Found</h2>
              <p className="text-muted-foreground">
                The test you're looking for doesn't exist or has been removed.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/physical-tests')}
              >
                Return to Physical Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/physical-tests')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{test.name}</h1>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Record Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Testing Schedule</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getRecommendedTestingInfo()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-medium p-2">Player</th>
                      <th className="text-left font-medium p-2">Last Test</th>
                      {test.metrics.map((metric, index) => (
                        <th key={index} className="text-left font-medium p-2">
                          {metric.name} ({metric.unit})
                        </th>
                      ))}
                      <th className="text-left font-medium p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, playerIndex) => (
                      <tr key={player.id} className="border-t">
                        <td className="p-2">
                          {player.first_name} {player.last_name}
                        </td>
                        <td className="p-2 text-sm">
                          {getLastTestDate(player.id) ? (
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(getLastTestDate(player.id)!))} ago
                            </span>
                          ) : (
                            <span className="text-warning">Never</span>
                          )}
                        </td>
                        {test.metrics.map((metric, metricIndex) => (
                          <td key={metricIndex} className="p-2">
                            <input
                              type="number"
                              value={playerResults[playerIndex].metrics[metric.name] || ''}
                              onChange={(e) => handleMetricChange(playerIndex, metric.name, e.target.value)}
                              className="input-field w-24"
                              step="0.01"
                            />
                          </td>
                        ))}
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewPlayerHistory(player.id)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="form-label" htmlFor="notes">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
                isLoading={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Results
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {test.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="font-medium text-muted-foreground">
                    {index + 1}.
                  </span>
                  <p>{instruction}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player History Modal */}
      {selectedPlayerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {players.find(p => p.id === selectedPlayerId)?.first_name} {players.find(p => p.id === selectedPlayerId)?.last_name} - Test History
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlayerId(null)}
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {results[selectedPlayerId]?.map((result, index) => (
                <div key={index} className="border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(result.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(result.metrics).map(([name, value]) => (
                      <div key={name} className="flex justify-between">
                        <span>{name}:</span>
                        <span className="font-medium">{value} {test.metrics.find(m => m.name === name)?.unit}</span>
                      </div>
                    ))}
                  </div>
                  {result.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{result.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
