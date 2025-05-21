import React from 'react';
import { 
  Dumbbell, 
  BookOpen, 
  BarChart, 
  Calendar, 
  Clock, 
  TrendingUp, 
  LineChart,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Mock data for dashboard
  const upcomingWorkouts = [
    { id: 1, name: 'Upper Body Strength', date: '2025-04-22T10:00:00', duration: 60 },
    { id: 2, name: 'Cardio Intervals', date: '2025-04-24T15:30:00', duration: 45 },
  ];

  const recentTests = [
    { id: 1, name: 'Speed Test', score: '8.2s', date: '2025-04-18T09:00:00' },
    { id: 2, name: 'Vertical Jump', score: '65cm', date: '2025-04-15T14:00:00' },
  ];

  const notifications = [
    { id: 1, message: 'New workout plan has been assigned to you', time: '2 hours ago' },
    { id: 2, message: 'Coach has reviewed your last test results', time: '1 day ago' },
    { id: 3, message: 'Team meeting scheduled for tomorrow', time: '2 days ago' },
  ];

  const stats = [
    { name: 'Workouts Completed', value: 24, icon: Dumbbell, color: 'bg-primary/10 text-primary' },
    { name: 'Tests Taken', value: 8, icon: BarChart, color: 'bg-secondary/10 text-secondary' },
    { name: 'Training Hours', value: 45, icon: Clock, color: 'bg-accent/10 text-accent' },
    { name: 'Progress Score', value: '85%', icon: TrendingUp, color: 'bg-success/10 text-success' },
  ];

  // Conditional sections based on user role
  const renderRoleSpecificSections = () => {
    if (user.role === 'coach') {
      return (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Team Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Player Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p>8 players have updated their training logs this week</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">View Details</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <p>2 physical tests scheduled for next week</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Manage Tests</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }
    
    if (user.role === 'admin') {
      return (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Club Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p>4 active teams, 86 players total</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Manage Teams</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Coach Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p>12 coaches active this week</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">View Details</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p>2 new features available</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Review Updates</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            leftIcon={<Calendar className="h-4 w-4" />}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="animate-fade-in">
            <CardContent className="flex items-center p-4">
              <div className={`p-2 rounded-full mr-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-primary" />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md">
            <p className="text-muted-foreground">Progress chart visualization will appear here</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-secondary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full">View All Notifications</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="animate-slide-up delay-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Dumbbell className="h-5 w-5 mr-2 text-primary" />
              Upcoming Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingWorkouts.map((workout) => (
                <div key={workout.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{workout.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} 
                      {' • '}
                      {new Date(workout.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' • '}
                      {workout.duration} min
                    </p>
                  </div>
                  <Button size="sm">Start</Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full">View All Workouts</Button>
          </CardFooter>
        </Card>

        <Card className="animate-slide-up delay-150">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-secondary" />
              Recent Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTests.map((test) => (
                <div key={test.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{test.score}</p>
                    <p className="text-xs text-success">+5% improvement</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full">View All Tests</Button>
          </CardFooter>
        </Card>
      </div>

      {renderRoleSpecificSections()}
    </div>
  );
}
