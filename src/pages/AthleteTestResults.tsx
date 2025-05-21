import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { 
  AlertCircle, 
  BarChart, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PhysicalTest {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: {
    name: string;
    unit: string;
  }[];
}

interface TestResult {
  id: string;
  date: string;
  metrics: Record<string, any>;
  notes?: string;
  test: PhysicalTest;
}

export default function AthleteTestResults() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [selectedType, setSelectedType] = useState<string>('');
  const [testTypes, setTestTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch test results with test details
        const { data, error } = await supabase
          .from('test_results')
          .select(`
            *,
            test:physical_tests(*)
          `)
          .eq('user_id', user?.id)
          .order('date', { ascending: false });

        if (error) throw error;

        // Transform the data to match our interface
        const transformedResults = data?.map(item => ({
          id: item.id,
          date: item.date,
          metrics: item.metrics,
          notes: item.notes,
          test: item.test as PhysicalTest
        })) || [];

        setResults(transformedResults);
        setFilteredResults(transformedResults);

        // Extract unique test types
        const types = [...new Set(transformedResults.map(result => result.test.type))];
        setTestTypes(types);

      } catch (err: any) {
        console.error('Error fetching test results:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchResults();
    }
  }, [user]);

  useEffect(() => {
    // Filter results based on search term and selected type
    let filtered = [...results];
    
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.test.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType) {
      filtered = filtered.filter(result => result.test.type === selectedType);
    }
    
    setFilteredResults(filtered);
  }, [searchTerm, selectedType, results]);

  const toggleResultExpansion = (resultId: string) => {
    setExpandedResults(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
  };

  const getProgressIndicator = (result: TestResult, metricName: string) => {
    // Find previous results for the same test
    const sameTestResults = results.filter(r => 
      r.test.id === result.test.id && 
      new Date(r.date) < new Date(result.date)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sameTestResults.length === 0) return null;
    
    const previousResult = sameTestResults[0];
    const currentValue = parseFloat(result.metrics[metricName]);
    const previousValue = parseFloat(previousResult.metrics[metricName]);
    
    if (isNaN(currentValue) || isNaN(previousValue)) return null;
    
    const difference = currentValue - previousValue;
    const percentChange = (difference / previousValue) * 100;
    
    if (Math.abs(percentChange) < 1) return null;
    
    return (
      <span className={`text-xs ml-1 ${difference > 0 ? 'text-success' : 'text-error'}`}>
        {difference > 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
      </span>
    );
  };

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please log in to view your test results.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/login')}
              >
                Log In
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
              <p className="text-muted-foreground">Loading your test results...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Test Results</h1>
          <p className="text-muted-foreground">
            View and track your performance over time
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {[...new Set(results.map(r => r.test.id))].length} different test types
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Test</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <>
                <div className="text-lg font-medium">{results[0].test.name}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(parseISO(results[0].date), 'MMM d, yyyy')}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No tests recorded yet</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Frequent Test</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <>
                <div className="text-lg font-medium">
                  {Object.entries(
                    results.reduce((acc, result) => {
                      acc[result.test.name] = (acc[result.test.name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1])[0][0]}
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  {Object.entries(
                    results.reduce((acc, result) => {
                      acc[result.test.name] = (acc[result.test.name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1])[0][1]} times
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No tests recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="input-field pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  className="input-field pl-9"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">All test types</option>
                  {testTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={!searchTerm && !selectedType}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredResults.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Test Results Found</h2>
              <p className="text-muted-foreground">
                {results.length > 0 
                  ? "Try adjusting your filters to see more results."
                  : "You haven't taken any physical tests yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <Card key={result.id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => toggleResultExpansion(result.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{result.test.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(parseISO(result.date), 'MMMM d, yyyy')}
                      <span className="mx-2">•</span>
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {result.test.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {expandedResults[result.id] ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedResults[result.id] && (
                <CardContent className="pt-0 pb-4 px-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {Object.entries(result.metrics).map(([key, value], index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                        <span className="text-sm font-medium">{key}</span>
                        <div className="flex items-center">
                          <span>
                            {value} 
                            {result.test.metrics.find(m => m.name === key.split('_').pop())?.unit}
                          </span>
                          {getProgressIndicator(result, key)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {result.notes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">{result.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to a detailed view if you have one
                        // navigate(`/test-results/${result.id}`);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      View Progress
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
