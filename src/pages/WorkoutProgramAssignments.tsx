import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle, Calendar, Users, Info, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Team {
  id: string;
  name: string;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  difficulty: string;
}

interface ProgramAssignment {
  id: string;
  program_id: string;
  team_id: string;
  start_date: string;
  end_date: string;
  program: WorkoutProgram;
  team: Team;
}

export default function WorkoutProgramAssignments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [coachTeams, setCoachTeams] = useState<Set<string>>(new Set());
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Log user info
      console.log('Current user:', {
        id: user?.id,
        role: user?.role
      });

      // If user is a coach, fetch their teams from team_coaches
      if (user?.role === 'coach') {
        const { data: coachTeamsData, error: coachTeamsError } = await supabase
          .from('team_coaches')
          .select('team_id')
          .eq('coach_id', user.id);

        if (coachTeamsError) throw coachTeamsError;
        
        const teamIds = new Set(coachTeamsData?.map(t => t.team_id) || []);
        setCoachTeams(teamIds);
        console.log('Coach teams:', teamIds);

        // Fetch only the teams this coach is assigned to
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', Array.from(teamIds))
          .order('name');

        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
      } else if (user?.role === 'admin') {
        // Admins can see all teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');

        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
      }

      // Fetch workout programs
      const { data: programsData, error: programsError } = await supabase
        .from('workout_programs')
        .select('*')
        .order('name');

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Fetch existing assignments
      const assignmentsQuery = supabase
        .from('workout_program_assignments')
        .select(`
          *,
          program:workout_programs(*),
          team:teams(*)
        `)
        .order('start_date', { ascending: false });

      // If user is a coach, only fetch assignments for their teams
      if (user?.role === 'coach') {
        const { data: coachTeamsData } = await supabase
          .from('team_coaches')
          .select('team_id')
          .eq('coach_id', user.id);

        const teamIds = coachTeamsData?.map(t => t.team_id) || [];
        if (teamIds.length > 0) {
          assignmentsQuery.in('team_id', teamIds);
        }
      }

      const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedProgram || !startDate || !endDate) return;

    try {
      setError(null);

      // Check if user has permission to assign programs to this team
      const hasPermission = user?.role === 'admin' || 
        (user?.role === 'coach' && coachTeams.has(selectedTeam));
      
      if (!hasPermission) {
        throw new Error('You do not have permission to assign programs to this team');
      }

      if (isEditMode && editingAssignmentId) {
        // Update existing assignment
        const { data: result, error: updateError } = await supabase
          .from('workout_program_assignments')
          .update({
            program_id: selectedProgram,
            team_id: selectedTeam,
            start_date: startDate,
            end_date: endDate,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAssignmentId)
          .select()
          .single();

        if (updateError) throw updateError;
        console.log('Assignment updated:', result);
      } else {
        // Create new assignment
        const { data: result, error: assignError } = await supabase
          .from('workout_program_assignments')
          .insert({
            program_id: selectedProgram,
            team_id: selectedTeam,
            start_date: startDate,
            end_date: endDate,
            created_by: user?.id
          })
          .select()
          .single();

        if (assignError) throw assignError;
        console.log('Assignment created:', result);
      }

      // Reset form
      resetForm();

      // Refresh assignments
      fetchData();
    } catch (err: any) {
      console.error('Error with program assignment:', err);
      setError(err.message);
    }
  };

  const handleEdit = (assignment: ProgramAssignment) => {
    setIsEditMode(true);
    setEditingAssignmentId(assignment.id);
    setSelectedTeam(assignment.team_id);
    setSelectedProgram(assignment.program_id);
    setStartDate(assignment.start_date);
    setEndDate(assignment.end_date);
    setShowForm(true);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setSelectedTeam('');
    setSelectedProgram('');
    setStartDate('');
    setEndDate('');
    setShowForm(false);
    setIsEditMode(false);
    setEditingAssignmentId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('workout_program_assignments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Refresh assignments
      fetchData();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.message);
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
                Only coaches and administrators can assign workout programs.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/training')}
              >
                Return to Training Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workout Program Assignments</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Assign Program
          </Button>
        )}
      </div>

      <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-primary mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Program Assignment Guide</h3>
            <p className="text-sm text-gray-600 mt-1">
              Assign workout programs to teams for specific date ranges. Players will see their assigned programs when logging workouts within these dates.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Workout Program Assignment' : 'Assign Workout Program'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="team">
                  Select Team
                </label>
                <select
                  id="team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">Select a team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="program">
                  Select Program
                </label>
                <select
                  id="program"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">Select a program...</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label" htmlFor="startDate">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="endDate">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                    required
                    min={startDate}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedTeam || !selectedProgram || !startDate || !endDate}
                >
                  {isEditMode ? 'Update Assignment' : 'Assign Program'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-muted-foreground">Loading assignments...</p>
              </div>
            </CardContent>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Programs Assigned</h3>
                <p className="text-muted-foreground mb-4">
                  Start by assigning workout programs to teams.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Assign Program
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg mb-1">
                      {assignment.program.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{assignment.team.name}</span>
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {assignment.program.description}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {assignment.program.difficulty}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit className="h-4 w-4" />}
                      onClick={() => handleEdit(assignment)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
