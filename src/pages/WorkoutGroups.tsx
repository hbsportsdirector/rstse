import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface WorkoutGroup {
  id: string;
  name: string;
  description: string | null;
  criteria: {
    age?: number[];
    experience?: string[];
    position?: string[];
    skill_level?: string[];
  };
  team_id: string | null;
}

const WorkoutGroups: React.FC = () => {
  const [groups, setGroups] = useState<WorkoutGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchWorkoutGroups();
  }, []);

  const fetchWorkoutGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_groups')
        .select('*');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching workout groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = () => {
    // Implement group creation logic
  };

  const handleEditGroup = (groupId: string) => {
    // Implement group editing logic
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('workout_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      setGroups(groups.filter(group => group.id !== groupId));
    } catch (error) {
      console.error('Error deleting workout group:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Workout Groups</h1>
        <Button onClick={handleCreateGroup}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="relative">
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditGroup(group.id)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteGroup(group.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
            {group.description && (
              <p className="text-gray-600 mb-4">{group.description}</p>
            )}
            <div className="space-y-2">
              {Object.entries(group.criteria).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium capitalize">{key}: </span>
                  <span className="text-gray-600">
                    {Array.isArray(value) ? value.join(', ') : value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkoutGroups;
