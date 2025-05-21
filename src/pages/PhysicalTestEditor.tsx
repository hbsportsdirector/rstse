import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle, Plus, Trash2, GripVertical, Image, Video, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Metric {
  name: string;
  unit: string;
}

export default function PhysicalTestEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'strength' | 'speed' | 'endurance' | 'agility' | 'power'>('strength');
  const [metrics, setMetrics] = useState<Metric[]>([{ name: '', unit: '' }]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [isClubTest, setIsClubTest] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data: test, error: fetchError } = await supabase
          .from('physical_tests')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        setName(test.name);
        setDescription(test.description);
        setType(test.type);
        setMetrics(test.metrics);
        setEquipment(test.equipment || []);
        setInstructions(test.instructions);
        setIsClubTest(test.is_club_test);
      } catch (err: any) {
        console.error('Error fetching test:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTest();
    }
  }, [id]);

  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only coaches and administrators can edit physical tests.
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

  if (isLoading) {
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

  const addMetric = () => {
    setMetrics([...metrics, { name: '', unit: '' }]);
  };

  const updateMetric = (index: number, field: keyof Metric, value: string) => {
    const updatedMetrics = [...metrics];
    updatedMetrics[index] = { ...updatedMetrics[index], [field]: value };
    setMetrics(updatedMetrics);
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const updatedInstructions = [...instructions];
    updatedInstructions[index] = value;
    setInstructions(updatedInstructions);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate inputs
      if (!name.trim()) throw new Error('Test name is required');
      if (!description.trim()) throw new Error('Description is required');
      if (!metrics.length) throw new Error('At least one metric is required');
      if (!instructions.length) throw new Error('At least one instruction is required');

      // Validate metrics
      const validMetrics = metrics.filter(m => m.name.trim() && m.unit.trim());
      if (!validMetrics.length) throw new Error('At least one valid metric is required');

      // Validate instructions
      const validInstructions = instructions.filter(i => i.trim());
      if (!validInstructions.length) throw new Error('At least one valid instruction is required');

      // Update test
      const { error: updateError } = await supabase
        .from('physical_tests')
        .update({
          name,
          description,
          type,
          metrics: validMetrics,
          equipment: equipment.filter(e => e.trim()),
          instructions: validInstructions,
          is_club_test: isClubTest
        })
        .eq('id', id);

      if (updateError) throw updateError;

      navigate('/physical-tests');
    } catch (err: any) {
      console.error('Error updating test:', err);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Physical Test</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/physical-tests')}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Changes
          </Button>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="form-label" htmlFor="name">
                Test Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Enter test name"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="Enter test description"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="type">
                Test Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="select-field"
              >
                <option value="strength">Strength</option>
                <option value="speed">Speed</option>
                <option value="endurance">Endurance</option>
                <option value="agility">Agility</option>
                <option value="power">Power</option>
              </select>
            </div>

            <div>
              <label className="form-label">Equipment (Optional)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={equipment.join(', ')}
                  onChange={(e) => setEquipment(e.target.value.split(',').map(item => item.trim()))}
                  className="input-field"
                  placeholder="Enter equipment (comma separated)"
                />
                <p className="text-sm text-muted-foreground">
                  Separate multiple items with commas (e.g., "Barbell, Dumbbells, Timer")
                </p>
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isClubTest"
                  checked={isClubTest}
                  onChange={(e) => setIsClubTest(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isClubTest" className="text-sm font-medium text-gray-700">
                  Create as Club Test
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Metrics</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={addMetric}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Metric
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={metric.name}
                    onChange={(e) => updateMetric(index, 'name', e.target.value)}
                    className="input-field mb-2"
                    placeholder="Metric name (e.g., Distance, Weight)"
                  />
                  <input
                    type="text"
                    value={metric.unit}
                    onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                    className="input-field"
                    placeholder="Unit (e.g., meters, kg)"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMetric(index)}
                  disabled={metrics.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Instructions</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={addInstruction}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {index + 1}
                    </span>
                  </div>
                  <textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder={`Enter instruction step ${index + 1}`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInstruction(index)}
                  disabled={instructions.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
