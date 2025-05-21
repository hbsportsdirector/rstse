import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell } from 'lucide-react';

export default function AuthLayout() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
          </div>
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary to-accent">
        <div className="absolute inset-0 bg-opacity-75">
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-6">SportsClub Hub</h1>
            <p className="text-xl text-white opacity-90 max-w-md">
              Your all-in-one platform for physical training and team development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
