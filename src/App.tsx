import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import ExerciseDetail from './pages/ExerciseDetail';
import Players from './pages/Players';
import PlayerForm from './pages/PlayerForm';
import TeamManagement from './pages/TeamManagement';
import TeamPlayers from './pages/TeamPlayers';
import PhysicalTestForm from './pages/PhysicalTestForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="programs" element={<Programs />} />
            <Route path="programs/:id" element={<ProgramDetail />} />
            <Route path="exercises/:id" element={<ExerciseDetail />} />
            <Route path="players" element={<Players />} />
            <Route path="players/new" element={<PlayerForm />} />
            <Route path="players/:id" element={<PlayerForm />} />
            <Route path="teams" element={<TeamManagement />} />
            <Route path="team/:teamId/players" element={<TeamPlayers />} />
            <Route path="physical-test" element={<PhysicalTestForm />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
