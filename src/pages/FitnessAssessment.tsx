import React from 'react';
import { FitnessCalculator } from '../components/FitnessCalculator';
import { Card, CardContent, CardHeader, CardTitle } from "../components/UI/Card";

const FitnessAssessment: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Fitness Assessment</h1>
        <p className="text-gray-600">Calculate and record athlete fitness scores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fitness Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <FitnessCalculator />
        </CardContent>
      </Card>
    </div>
  );
};

export default FitnessAssessment;
