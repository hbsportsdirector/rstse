import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, BookOpen, Users, FileText, PlayCircle, Info, Search, Edit, Trash2, Eye, ArrowUpDown, User, Users2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Test {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  is_group_test: boolean;
  time_limit: number | null;
  created_by: string;
  creator?: {
    first_name: string;
    last_name: string;
    email: string;
    team_id: string | null;
  };
}

interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  team_id: string | null;
}

interface Team {
  id: string;
  name: string;
  coach_id: string;
}

export default function LearningHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tests' | 'study-groups' | 'resources'>('tests');
  const [tests, setTests] = useState<Test[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'title' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamSortDirection, setTeamSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name', { ascending: teamSortDirection === 'asc' });

        if (teamsError) throw teamsError;
        setTeams(data || []);
      } catch (err: any) {
        console.error('Error fetching teams:', err);
      }
    };

    fetchTeams();
  }, [teamSortDirection]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let query = supabase
          .from('users')
          .select('id, first_name, last_name, email, team_id')
          .in('role', ['coach', 'admin'])
          .order('first_name');

        // Handle team filtering
        if (selectedTeam === 'none') {
          query = query.is('team_id', null);
        } else if (selectedTeam) {
          query = query.eq('team_id', selectedTeam);
        }
        // If user is a coach, only show users from their teams
        else if (user.role === 'coach' && user.teamId) {
          query = query.eq('team_id', user.teamId);
        }

        const { data, error: usersError } = await query;
        if (usersError) throw usersError;
        setUsers(data || []);
      } catch (err: any) {
        console.error('Error fetching users:', err);
      }
    };

    if (user.role === 'coach' || user.role === 'admin') {
      fetchUsers();
    }
  }, [user, selectedTeam]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        console.log('Fetching tests with params:', {
          sortField,
          sortDirection,
          searchQuery,
          selectedUser,
          selectedTeam
        });

        let query = supabase
          .from('learning_tests')
          .select(`
            *,
            creator:users!learning_tests_created_by_fkey (
              first_name,
              last_name,
              email,
              team_id
            )
          `)
          .order(sortField, { ascending: sortDirection === 'asc' });

        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`);
        }

        if (selectedUser) {
          query = query.eq('created_by', selectedUser);
        }

        if (selectedTeam === 'none') {
          query = query.is('creator.team_id', null);
        } else if (selectedTeam) {
          query = query.eq('creator.team_id', selectedTeam);
        } else if (user.role === 'coach' && user.teamId) {
          // If coach hasn't selected a specific team, show tests from their team
          query = query.eq('creator.team_id', user.teamId);
        }

        const { data, error: fetchError } = await query;
        console.log('Query result:', { data, error: fetchError });

        if (fetchError) throw fetchError;
        setTests(data || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching tests:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTests();
  }, [sortField, sortDirection, searchQuery, selectedUser, selectedTeam, user]);

  if (!user) return null;

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const { error } = await supabase
        .from('learning_tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      setTests(tests.filter(test => test.id !== testId));
    } catch (err: any) {
      console.error('Error deleting test:', err);
      alert('Failed to delete test. Please try again.');
    }
  };

  const toggleSort = (field: 'title' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleTeamSort = () => {
    setTeamSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Mock data for study groups
  const studyGroups = [
    {
      id: '1',
      name: 'Defensive Tactics',
      members: 5,
      description: 'Group focused on defensive strategies and techniques',
      lastActive: '2025-04-18T14:30:00'
    },
    {
      id: '2',
      name: 'Game Analysis',
      members: 8,
      description: 'Study group for analyzing professional games and strategies',
      lastActive: '2025-04-19T09:15:00'
    }
  ];

  // Mock data for learning resources
  const resources = [
    {
      id: '1',
      title: 'Understanding Zone Defense',
      type: 'article',
      author: 'Coach Johnson',
      duration: '10 min read',
      icon: FileText
    },
    {
      id: '2',
      title: 'Offensive Patterns Video Series',
      type: 'video',
      author: 'Coach Williams',
      duration: '45 min',
      icon: PlayCircle
    },
    {
      id: '3',
      title: 'Tactical Decision Making',
      type: 'article',
      author: 'Prof. Smith',
      duration: '15 min read',
      icon: FileText
    }
  ];

  const isCoachOrAdmin = user.role === 'coach' || user.role === 'admin';

  // Render based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'tests':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Tests</h3>
                {isCoachOrAdmin && (
                  <Button onClick={() => navigate('/learning/create-test')}>
                    Create Test
                  </Button>
                )}
              </div>

              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-10"
                      placeholder="Search tests by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {isCoachOrAdmin && (
                    <div className="relative">
                      <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <div className="flex gap-2">
                        <select
                          className="select-field pl-10 flex-1"
                          value={selectedTeam}
                          onChange={(e) => {
                            setSelectedTeam(e.target.value);
                            setSelectedUser(''); // Reset user selection when team changes
                          }}
                        >
                          <option value="">All Teams</option>
                          <option value="none">No Team</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={toggleTeamSort}
                          className="px-2"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {isCoachOrAdmin && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        className="select-field pl-10"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                      >
                        <option value="">All Users</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.first_name} {u.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={sortField === 'title' ? 'primary' : 'outline'}
                    onClick={() => toggleSort('title')}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button
                    size="sm"
                    variant={sortField === 'created_at' ? 'primary' : 'outline'}
                    onClick={() => toggleSort('created_at')}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Button>
                </div>
              </div>

              {loading ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground">Loading tests...</p>
                  </CardContent>
                </Card>
              ) : error ? (
                <Card>
                  <CardContent className="py-6 text-center text-error">
                    <p>{error}</p>
                  </CardContent>
                </Card>
              ) : tests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tests.map((test) => (
                    <Card key={test.id} className="animate-fade-in">
                      <CardHeader>
                        <CardTitle>{test.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{test.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {test.is_group_test && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              Group Test
                            </span>
                          )}
                          {test.time_limit && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {test.time_limit} min
                            </span>
                          )}
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            Created: {new Date(test.created_at).toLocaleDateString()}
                          </span>
                          {test.creator && (
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                              By: {test.creator.first_name} {test.creator.last_name}
                            </span>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        {isCoachOrAdmin ? (
                          <div className="flex gap-2 w-full">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => navigate(`/learning/edit-test/${test.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => navigate(`/take-test/${test.id}?preview=true`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDeleteTest(test.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => navigate(`/take-test/${test.id}`)}
                          >
                            Start Test
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground">No tests available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      
      case 'study-groups':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Your Study Groups</h3>
              {studyGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyGroups.map((group) => (
                    <Card key={group.id} className="animate-fade-in">
                      <CardHeader>
                        <CardTitle>{group.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{group.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            {group.members} members
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            Active: {new Date(group.lastActive).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button size="sm" className="w-full">Open Group</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground">You are not part of any study groups yet</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {user.role === 'coach' && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Create Study Group</h3>
                </div>
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Create a New Study Group</h3>
                      <p className="text-sm text-muted-foreground mt-2 mb-4">
                        Form a group to collaborate on learning topics and share knowledge
                      </p>
                      <Button>Create Study Group</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
      
      case 'resources':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Search resources..."
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Learning Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <Card key={resource.id} className="animate-fade-in">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="p-3 rounded-full bg-muted mb-4">
                          <resource.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-medium mb-2">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{resource.author}</p>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full mb-4">
                          {resource.duration}
                        </span>
                        <Button size="sm" className="w-full">
                          {resource.type === 'article' ? 'Read Article' : 'Watch Video'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {user.role === 'coach' && (
              <div className="mt-8">
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Add Learning Resource</h3>
                      <p className="text-sm text-muted-foreground mt-2 mb-4">
                        Share articles, videos, and other materials to help players learn
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button>Upload Resource</Button>
                        <Button variant="outline">Create Article</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learning Hub</h1>
      </div>

      <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-primary mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Learning Hub Guide</h3>
            <p className="text-sm text-gray-600 mt-1">
              Take tests to assess your knowledge, join study groups to learn with teammates, and access educational resources to improve your understanding of the game.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tests')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tests'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tests
            </button>
            <button
              onClick={() => setActiveTab('study-groups')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'study-groups'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Study Groups
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resources'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resources
            </button>
          </nav>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
