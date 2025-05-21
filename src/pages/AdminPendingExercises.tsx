import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/UI/Card';
import Button from '../components/UI/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ExerciseRow {
  id: string;
  name: string;
  description: string;
  muscle_groups: string[];
  equipment: string[];
  approved: boolean;
}

export default function AdminPendingExercises() {
  const [pending, setPending] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from<ExerciseRow>('exercises')
      .select('*')
      .eq('approved', false);

    if (error) setError(error.message);
    else setPending(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const updateApproval = async (id: string, approve: boolean) => {
    const { error } = await supabase
      .from('exercises')
      .update({ approved: approve })
      .eq('id', id);
    if (error) console.error('Approval update error:', error.message);
    else fetchPending();
  };

  if (loading) return <p className="p-4">Loading pending exercises…</p>;

  return (
    <div className="p-4 grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Pending Exercise Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          {pending.length === 0 ? (
            <p>No exercises awaiting approval.</p>
          ) : (
            pending.map((ex) => (
              <Card key={ex.id} className="mb-4 p-4">
                <h3 className="text-lg font-semibold mb-2">{ex.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{ex.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ex.muscle_groups.map((mg) => (
                    <span key={mg} className="px-2 py-1 border rounded text-xs">
                      {mg}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ex.equipment.map((eq) => (
                    <span
                      key={eq}
                      className="px-2 py-1 border rounded italic text-xs"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => updateApproval(ex.id, true)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateApproval(ex.id, false)}
                  >
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
