import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Loader2, ClipboardList, BarChart } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { supabase } from '@/lib/supabase';

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
  is_club_test: boolean;
}

const PhysicalTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<PhysicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data, error } = await supabase
          .from('physical_tests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTests(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tests');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleDeleteTest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('physical_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTests(tests.filter(test => test.id !== id));
    } catch (err) {
      console.error('Error deleting test:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>Error loading tests: {error}</p>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Physical Tests</h1>
          <Button onClick={() => navigate('/physical-test-creator')}>
            Create New Test
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No physical tests found</p>
            <Button onClick={() => navigate('/physical-test-creator')}>
              Create New Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Physical Tests</h1>
        <Button onClick={() => navigate('/physical-test-creator')}>
          Create New Test
        </Button>
      </div>
      
      {tests.map((test) => (
        <Card key={test.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium">{test.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{test.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                test.is_club_test ? 'bg-secondary text-white' : 'bg-primary/10 text-primary'
              }`}>
                {test.type}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {test.metrics.map((metric, index) => (
                <span key={index} className="text-xs bg-muted px-2 py-1 rounded-full">
                  {metric.name} ({metric.unit})
                </span>
              ))}
              {test.equipment?.map((item, index) => (
                <span key={index} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                  {item}
                </span>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/physical-tests/${test.id}/results`)}
              >
                <BarChart className="h-4 w-4 mr-1" />
                Log Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/physical-tests/${test.id}/record`)}
              >
                <ClipboardList className="h-4 w-4 mr-1" />
                Record Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/physical-tests/${test.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive" // Changed from outline
                size="sm"
                onClick={() => handleDeleteTest(test.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PhysicalTests;
