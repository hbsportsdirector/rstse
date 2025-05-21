import React from 'react';
import { Dumbbell } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <Dumbbell className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-lg font-medium text-gray-700">Loading...</h2>
      </div>
    </div>
  );
}
