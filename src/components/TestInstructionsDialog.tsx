import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TestInstructionsDialogProps {
  testName: string;
}

export const TestInstructionsDialog: React.FC<TestInstructionsDialogProps> = ({ testName }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getInstructions = () => {
    switch (testName) {
      case 'mobility':
        return {
          title: 'Mobility Assessment',
          instructions: [
            'Assess the athlete\'s mobility on a scale from 0-10.',
            'Consider joint range of motion, flexibility, and movement quality.',
            'Score 0-3: Poor mobility with significant restrictions',
            'Score 4-6: Average mobility with some limitations',
            'Score 7-10: Excellent mobility with full range of motion'
          ]
        };
      case 'mas':
        return {
          title: 'MAS (Maximal Aerobic Speed) Test',
          instructions: [
            'The athlete runs at progressively increasing speeds until exhaustion.',
            'Record the total time completed before the athlete cannot maintain the required pace.',
            'Better endurance is indicated by longer times.',
            'Ensure proper warm-up before the test.',
            'The test should be performed on a track or measured course.'
          ]
        };
      case 'squats':
        return {
          title: 'Squat Test',
          instructions: [
            'Record the maximum weight (in kg) the athlete can lift for a single repetition.',
            'Ensure proper form: depth to parallel, knees tracking over toes, neutral spine.',
            'Allow 3 attempts with adequate rest between attempts.',
            'The athlete should warm up properly with lighter weights before maximal attempts.'
          ]
        };
      case 'benchPress':
        return {
          title: 'Bench Press Test',
          instructions: [
            'Record the maximum weight (in kg) the athlete can lift for a single repetition.',
            'Ensure proper form: bar touches chest, full extension of arms, feet on floor, hips on bench.',
            'Allow 3 attempts with adequate rest between attempts.',
            'The athlete should warm up properly with lighter weights before maximal attempts.'
          ]
        };
      case 'squatJump':
        return {
          title: 'Squat Jump Test',
          instructions: [
            'Measure vertical jump height (in cm) from a static squat position.',
            'The athlete starts in a squat position (knees at 90°) with hands on hips.',
            'No countermovement is allowed before jumping.',
            'Take the best of 3 attempts.',
            'Use a jump mat, force plate, or vertical jump device for measurement.'
          ]
        };
      case 'cmj':
        return {
          title: 'Countermovement Jump (CMJ) Test',
          instructions: [
            'Measure vertical jump height (in cm) with a countermovement.',
            'The athlete starts standing upright with hands on hips.',
            'Perform a quick downward movement followed by an explosive upward jump.',
            'Hands must remain on hips throughout the jump.',
            'Take the best of 3 attempts.',
            'Use a jump mat, force plate, or vertical jump device for measurement.'
          ]
        };
      case 'cmjArms':
        return {
          title: 'Countermovement Jump with Arms Test',
          instructions: [
            'Measure vertical jump height (in cm) with arm swing.',
            'The athlete starts standing upright with arms by their sides.',
            'Perform a quick downward movement while swinging arms back.',
            'Use arm swing to assist in the explosive upward jump.',
            'Take the best of 3 attempts.',
            'Use a jump mat, force plate, or vertical jump device for measurement.'
          ]
        };
      case 'brutalBench':
        return {
          title: 'Brutal Bench Test',
          instructions: [
            'Count the maximum number of repetitions performed.',
            'The athlete performs bench press with a weight equal to 70% of their body weight.',
            'Each repetition must touch the chest and reach full arm extension.',
            'No rest is allowed between repetitions.',
            'The test ends when the athlete cannot complete another repetition with proper form.'
          ]
        };
      case 'stabilityTest':
        return {
          title: 'Stability Test',
          instructions: [
            'The athlete must hold a plank position for 3 minutes.',
            'Proper form must be maintained: neutral spine, engaged core, straight line from head to heels.',
            'The test is passed if the athlete maintains proper form for the full duration.',
            'The test is failed if form breaks down before 3 minutes.',
            'No rest or breaks are allowed during the test.'
          ]
        };
      default:
        return {
          title: 'Test Instructions',
          instructions: ['Instructions not available for this test.']
        };
    }
  };

  const { title, instructions } = getInstructions();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
      >
        <Info className="h-4 w-4 mr-1" />
        Instructions
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">{title}</h3>
              
              <ul className="space-y-2 list-disc pl-5 mb-6">
                {instructions.map((instruction, index) => (
                  <li key={index} className="text-gray-700">{instruction}</li>
                ))}
              </ul>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
