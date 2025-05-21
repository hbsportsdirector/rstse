import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle, ChevronLeft, Save, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TestCategory {
  name: string;
  tests: {
    name: string;
    unit: string;
    description?: string;
    min?: number;
    max?: number;
  }[];
}

interface Team {
  id: string;
  name: string;
}

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string | null;
}

export default function TestResultsLogger() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [testName, setTestName] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [testDate, setTestDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Test categories and specific tests
  const [testCategories, setTestCategories] = useState<TestCategory[]>([
    {
      name: 'Mobility Tests',
      tests: [
        { name: 'Mobility Score', unit: 'points', min: 0, max: 100 }
      ]
    },
    {
      name: 'Endurance Tests',
      tests: [
        { name: 'MAS Test Time', unit: 'minutes:seconds', description: '(4-6 minutes)' }
      ]
    },
    {
      name: 'Strength Tests',
      tests: [
        { name: 'Squats', unit: '% of body weight' },
        { name: 'Bench Press', unit: '% of body weight' }
      ]
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch test name if ID is provided
        if (id) {
          const { data: testData, error: testError } = await supabase
            .from('physical_tests')
            .select('name')
            .eq('id', id)
            .single();
          
          if (testError) throw testError;
          if (testData) setTestName(testData.name);
          
          // Fetch test categories and metrics
          const { data: metricsData, error: metricsError } = await supabase
            .from('physical_tests')
            .select('*')
            .eq('id', id)
            .single();
            
          if (metricsError) throw metricsError;
          if (metricsData && metricsData.metrics) {
            // Transform the metrics into our test categories format
            const categories: TestCategory[] = [
              {
                name: metricsData.type || 'Test Metrics',
                tests: metricsData.metrics.map((metric: any) => ({
                  name: metric.name,
                  unit: metric.unit,
                  min: metric.min,
                  max: metric.max
                }))
              }
            ];
            setTestCategories(categories);
          }
        }
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name')
          .order('name');
        
        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
        
        // Fetch all athletes
        const { data: athletesData, error: athletesError } = await supabase
          .from('users')
          .select('id, first_name, last_name, team_id')
          .eq('role', 'player')
          .order('last_name');
        
        if (athletesError) throw athletesError;
        setAthletes(athletesData || []);
        setFilteredAthletes(athletesData || []);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Filter athletes when team selection changes
  useEffect(() => {
    if (selectedTeam) {
      setFilteredAthletes(athletes.filter(athlete => athlete.team_id === selectedTeam));
    } else {
      setFilteredAthletes(athletes);
    }
    // Reset selected athlete when team changes
    setSelectedAthlete(null);
  }, [selectedTeam, athletes]);
  
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value || null;
    setSelectedTeam(teamId);
  };
  
  const handleAthleteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAthlete(e.target.value || null);
  };
  
  const handleInputChange = (category: string, testName: string, value: string) => {
    setTestResults(prev => ({
      ...prev,
      [`${category}_${testName}`]: value
    }));
  };
  
  const handleTimeInputChange = (testKey: string, minutes: string, seconds: string) => {
    setTestResults(prev => ({
      ...prev,
      [testKey]: { minutes, seconds }
    }));
  };
  
  const handleSubmit = async () => {
    if (!selectedAthlete) {
      setError('Please select an athlete');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Format the results for storage
      const formattedResults: Record<string, any> = {};
      
      Object.entries(testResults).forEach(([key, value]) => {
        // Handle time values (objects with minutes and seconds)
        if (typeof value === 'object' && value !== null && 'minutes' in value && 'seconds' in value) {
          const { minutes, seconds } = value as { minutes: string, seconds: string };
          formattedResults[key] = `${minutes}:${seconds.padStart(2, '0')}`;
        } else {
          formattedResults[key] = value;
        }
      });
      
      // Submit to database
      const { error: submitError } = await supabase
        .from('test_results')
        .insert({
          test_id: id,
          user_id: selectedAthlete,
          date: testDate,
          metrics: formattedResults
        });
      
      if (submitError) throw submitError;
      
      setSuccess(true);
      // Reset form
      setSelectedAthlete(null);
      setTestResults({});
      
      // Show success message briefly then redirect
      setTimeout(() => {
        navigate('/physical-tests');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error submitting results:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/physical-tests')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{testName || 'Record Test Results'}</h1>
      </div>
      
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
          <p className="text-success">Results saved successfully!</p>
        </div>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Athlete Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="team">Team</label>
              <select
                id="team"
                className="input-field"
                value={selectedTeam || ''}
                onChange={handleTeamChange}
              >
                <option value="">Select team (optional)</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="athlete">Athlete</label>
              <select
                id="athlete"
                className="input-field"
                value={selectedAthlete || ''}
                onChange={handleAthleteChange}
              >
                <option value="">Select athlete...</option>
                {filteredAthletes.map(athlete => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.first_name} {athlete.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
            <input
              type="date"
              className="input-field"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      {testCategories.map((category, categoryIndex) => (
        <Card key={categoryIndex} className="mb-6">
          <CardHeader>
            <CardTitle>{category.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {category.tests.map((test, testIndex) => {
                const testKey = `${category.name}_${test.name}`;
                
                return (
                  <div key={testIndex}>
                    <label className="form-label">
                      {test.name} {test.description && <span className="text-muted-foreground text-sm">
                        {test.description}
                      </span>}
                    </label>
                    
                    {test.unit === 'minutes:seconds' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label text-sm">Minutes</label>
                          <input
                            type="number"
                            className="input-field"
                            min="0"
                            max="59"
                            value={testResults[testKey]?.minutes || ''}
                            onChange={(e) => handleTimeInputChange(testKey, e.target.value, testResults[testKey]?.seconds || '0')}
                            placeholder="Minutes"
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm">Seconds</label>
                          <input
                            type="number"
                            className="input-field"
                            min="0"
                            max="59"
                            value={testResults[testKey]?.seconds || ''}
                            onChange={(e) => handleTimeInputChange(testKey, testResults[testKey]?.minutes || '0', e.target.value)}
                            placeholder="Seconds"
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="input-field"
                        value={testResults[testKey] || ''}
                        onChange={(e) => handleInputChange(category.name, test.name, e.target.value)}
                        placeholder={`Enter ${test.name.toLowerCase()}`}
                      />
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {test.unit}
                      {test.min !== undefined && test.max !== undefined && 
                        ` (${test.min}-${test.max})`
                      }
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Button
        onClick={handleSubmit}
        className="w-full"
        isLoading={isSubmitting}
      >
        <Save className="h-4 w-4 mr-2" />
        Save Results
      </Button>
    </div>
  );
}
