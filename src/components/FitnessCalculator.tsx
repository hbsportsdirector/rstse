import React, { useState } from 'react';
import { format } from "date-fns";
import { CalendarIcon, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./UI/Card";
import { Input } from "./UI/Input";
import Button from "./UI/Button";
import { Label } from "./UI/Label";
import { Switch } from "./UI/Switch";
import { Calendar } from "./UI/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./UI/Popover";
import { useToast } from "../hooks/useToast";
import { cn } from "../lib/utils";
import { calculateScore, CategoryScores } from '../utils/scoreCalculations';
import { ScoreGauge } from './ScoreGauge';
import { TeamSelector } from './TeamSelector';
import { AthleteSelector } from './AthleteSelector';
import { saveTestResult } from '../services/testResults';
import { TestInstructionsDialog } from './TestInstructionsDialog';

interface TestResult extends CategoryScores {
  date: Date;
  mobilityScore: number;
  masMinutes: number;
  masSeconds: number;
  squats: number;
  benchPress: number;
  squatJump: number;
  cmj: number;
  cmjArms: number;
  brutalBench: number;
  stabilityTest: boolean;
}

export const FitnessCalculator = () => {
  const { toast } = useToast();
  
  const [results, setResults] = useState<TestResult>({
    date: new Date(), // Default to today's date
    mobilityScore: 0,
    masMinutes: 4,
    masSeconds: 0,
    squats: 0,
    benchPress: 0,
    squatJump: 0,
    cmj: 0,
    cmjArms: 0,
    brutalBench: 0,
    stabilityTest: false,
    mobilityPoints: 0,
    endurancePoints: 0,
    strengthPoints: 0,
    powerPoints: 0,
    totalScore: 0
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setResults(prev => ({ ...prev, [name]: checked }));
    } else {
      const numValue = name === 'mobilityScore' ? parseFloat(value) : parseInt(value, 10);
      setResults(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setResults(prev => ({ ...prev, date }));
    }
  };

  const calculateResults = () => {
    setIsCalculating(true);
    
    try {
      // Calculate MAS time in seconds
      const masTimeInSeconds = (results.masMinutes * 60) + results.masSeconds;
      
      // Calculate scores using the utility function
      const scores = calculateScore({
        mobilityScore: results.mobilityScore,
        masTimeInSeconds,
        squats: results.squats,
        benchPress: results.benchPress,
        squatJump: results.squatJump,
        cmj: results.cmj,
        cmjArms: results.cmjArms,
        brutalBench: results.brutalBench,
        stabilityTest: results.stabilityTest
      });
      
      // Update results with calculated scores
      setResults(prev => ({
        ...prev,
        ...scores
      }));
      
      toast({
        title: "Scores calculated",
        description: "Fitness scores have been calculated successfully."
      });
    } catch (error) {
      toast({
        title: "Calculation error",
        description: "There was an error calculating the scores.",
        variant: "destructive"
      });
      console.error("Calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAthleteId) {
      toast({
        title: "No athlete selected",
        description: "Please select an athlete before saving results.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Calculate MAS time in seconds for saving
      const masTimeInSeconds = (results.masMinutes * 60) + results.masSeconds;
      
      await saveTestResult({
        athleteId: selectedAthleteId,
        testId: "fitness-assessment", // ID of the fitness assessment test
        date: results.date,
        results: {
          mobilityScore: results.mobilityScore,
          masTimeInSeconds,
          squats: results.squats,
          benchPress: results.benchPress,
          squatJump: results.squatJump,
          cmj: results.cmj,
          cmjArms: results.cmjArms,
          brutalBench: results.brutalBench,
          stabilityTest: results.stabilityTest,
          mobilityPoints: results.mobilityPoints,
          endurancePoints: results.endurancePoints,
          strengthPoints: results.strengthPoints,
          powerPoints: results.powerPoints,
          totalScore: results.totalScore
        }
      });
      
      toast({
        title: "Results saved",
        description: "Test results have been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Save error",
        description: "There was an error saving the test results.",
        variant: "destructive"
      });
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Test Information</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="date">Test Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !results.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {results.date ? format(results.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={results.date}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-4">
              <TeamSelector 
                selectedTeamId={selectedTeamId} 
                onTeamSelect={setSelectedTeamId} 
              />
              
              <AthleteSelector 
                teamId={selectedTeamId} 
                selectedAthleteId={selectedAthleteId} 
                onAthleteSelect={setSelectedAthleteId} 
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Test Measurements</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="mobilityScore">Mobility Score (0-10)</Label>
                <Input
                  id="mobilityScore"
                  name="mobilityScore"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={results.mobilityScore}
                  onChange={handleInputChange}
                />
                <TestInstructionsDialog testName="mobility" />
              </div>
              
              <div>
                <Label>MAS Test Time</Label>
                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <Label htmlFor="masMinutes">Minutes</Label>
                    <Input
                      id="masMinutes"
                      name="masMinutes"
                      type="number"
                      min="0"
                      value={results.masMinutes}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="w-1/2">
                    <Label htmlFor="masSeconds">Seconds</Label>
                    <Input
                      id="masSeconds"
                      name="masSeconds"
                      type="number"
                      min="0"
                      max="59"
                      value={results.masSeconds}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <TestInstructionsDialog testName="mas" />
              </div>
              
              <div>
                <Label htmlFor="squats">Squats (kg)</Label>
                <Input
                  id="squats"
                  name="squats"
                  type="number"
                  min="0"
                  value={results.squats}
                  onChange={handleInputChange}
                />
                <TestInstructionsDialog testName="squats" />
              </div>
              
              <div>
                <Label htmlFor="benchPress">Bench Press (kg)</Label>
                <Input
                  id="benchPress"
                  name="benchPress"
                  type="number"
                  min="0"
                  value={results.benchPress}
                  onChange={handleInputChange}
                />
                <TestInstructionsDialog testName="benchPress" />
              </div>
              
              <div>
                <Label htmlFor="squatJump">Squat Jump (cm)</Label>
                <Input
                  id="squatJump"
                  name="squatJump"
                  type="number"
                  min="0"
                  value={results.squatJump}
                  onChange={handleInputChange}
                />
                <TestInstructionsDialog testName="squatJump" />
              </div>
              
              <div>
                <Label htmlFor="cmj">CMJ (cm)</Label>
                <Input
                  id="cmj"
                  name="cmj"
                  type="number"
                  min="0"
                  value={results.cmj}
                  onChange={handleInputChange}
                />
                <TestInstructionsDialog testName="cmj" />
              </div>
              
              <div>
                <Label htmlFor="cmjArms">CMJ with Arms (cm)</Label>
                <Input
                  id="cmjArms"
                  name="cmjArms"
                  type="number"
                  min="0"
                  value={results.cmjArms}
                  onChange={handleInputChange}
                />
                <TestInstructionsDialog testName="cmjArms" />
              </div>
              
              <div>
                <Label htmlFor="brutalBench">Brutal Bench (reps)</Label>
                <Input
                  id="brutalBench"
                  name="brutalBench"
                  type="number"
                  min="0"
                  value={results.brutalBench}
                  onChange={handleInputChange}
                />
                <TestInstructionsDialog testName="brutalBench" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="stabilityTest"
                  name="stabilityTest"
                  checked={results.stabilityTest}
                  onCheckedChange={(checked) => 
                    setResults(prev => ({ ...prev, stabilityTest: checked }))
                  }
                />
                <Label htmlFor="stabilityTest">Stability Test Passed</Label>
                <TestInstructionsDialog testName="stabilityTest" />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Results</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Mobility</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={results.mobilityPoints} maxScore={25} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Endurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={results.endurancePoints} maxScore={25} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Strength</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={results.strengthPoints} maxScore={25} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Power</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={results.powerPoints} maxScore={25} />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Fitness Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <ScoreGauge score={results.totalScore} maxScore={100} size="large" />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex space-x-4">
              <Button 
                onClick={calculateResults} 
                disabled={isCalculating}
                className="flex-1"
              >
                {isCalculating ? "Calculating..." : "Calculate Scores"}
              </Button>
              
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !selectedAthleteId || results.totalScore === 0}
                className="flex-1"
                variant="outline"
              >
                {isSaving ? "Saving..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Results
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
