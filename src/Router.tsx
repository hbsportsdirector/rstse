// src/Router.tsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from './components/Layout/AuthLayout';
import AppLayout from './components/Layout/AppLayout';

// Public (no‐auth) pages
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';

// Protected (auth) pages
import Dashboard from './pages/Dashboard';
import TrainingHub from './pages/TrainingHub';
import CreateExercise from './pages/CreateExercise';
import AdminPendingExercises from './pages/AdminPendingExercises';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import LearningHub from './pages/LearningHub';
import PhysicalTestEditor from './pages/PhysicalTestEditor';
import TeamManagement from './pages/TeamManagement';
import TestEditor from './pages/TestEditor';
import TestCreator from './pages/TestCreator';
import WorkoutProgramAssignments from './pages/WorkoutProgramAssignments';
import WorkoutLogs from './pages/WorkoutLogs';
import PhysicalTests from './pages/PhysicalTests';
import PhysicalTestResults from './pages/PhysicalTestResults';
import PhysicalTestCreator from './pages/PhysicalTestCreator';
import PhysicalTestForm from './pages/PhysicalTestForm';
import WorkoutGroups from './pages/WorkoutGroups';
import WorkoutProgramCreator from './pages/WorkoutProgramCreator';
import TakeTest from './pages/TakeTest';
import TestResultsLogger from './pages/TestResultsLogger';
import AthleteTestResults from './pages/AthleteTestResults';
import FitnessAssessment from './pages/FitnessAssessment';

export const router = createBrowserRouter([
  // 1) Public
  {
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginForm /> },
      { path: 'login', element: <LoginForm /> },
      { path: 'register', element: <RegisterForm /> },
      // any other "public" URL → bounce back to login
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },

  // 2) Protected
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'training', element: <TrainingHub /> },
      { path: 'create-exercise', element: <CreateExercise /> },
      { path: 'admin/exercises', element: <AdminPendingExercises /> },
      { path: 'players', element: <Players /> },
      { path: 'players/:id', element: <PlayerProfile /> },
      { path: 'learning', element: <LearningHub /> },
      { path: 'learning/create-test', element: <TestCreator /> },
      { path: 'learning/edit-test/:id', element: <TestEditor /> },
      { path: 'physical-test-editor', element: <PhysicalTestEditor /> },
      { path: 'team-management', element: <TeamManagement /> },
      { path: 'test-editor', element: <TestEditor /> },
      { path: 'test-creator', element: <TestCreator /> },
      {
        path: 'training/programs/assignments',
        element: <WorkoutProgramAssignments />,
      },
      { path: 'workout-logs', element: <WorkoutLogs /> },
      { path: 'physical-tests', element: <PhysicalTests /> },
      { path: 'physical-tests/:id/record', element: <PhysicalTestForm /> },
      { path: 'physical-tests/:id/results', element: <TestResultsLogger /> },
      { path: 'physical-test-results', element: <PhysicalTestResults /> },
      { path: 'physical-test-creator', element: <PhysicalTestCreator /> },
      { path: 'workout-groups', element: <WorkoutGroups /> },
      { path: 'workout-program-creator', element: <WorkoutProgramCreator /> },
      { path: 'take-test/:id', element: <TakeTest /> },
      { path: 'my-test-results', element: <AthleteTestResults /> },
      { path: 'fitness-assessment', element: <FitnessAssessment /> },

      // fallback for any other "inside" URL
      {
        path: '*',
        element: (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <h1>404</h1>
            <p>Page not found</p>
          </div>
        ),
      },
    ],
  },

  // 3) Catch‐all (at the very end)
  { path: '*', element: <Navigate to="/" replace /> },
]);
