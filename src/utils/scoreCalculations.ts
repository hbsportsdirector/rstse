/**
 * Interface for category scores
 */
export interface CategoryScores {
  mobilityPoints: number;
  endurancePoints: number;
  strengthPoints: number;
  powerPoints: number;
  totalScore: number;
}

/**
 * Interface for test inputs
 */
interface TestInputs {
  mobilityScore: number;
  masTimeInSeconds: number;
  squats: number;
  benchPress: number;
  squatJump: number;
  cmj: number;
  cmjArms: number;
  brutalBench: number;
  stabilityTest: boolean;
}

/**
 * Calculate fitness scores based on test inputs
 * @param inputs Test measurement inputs
 * @returns Object containing category scores and total score
 */
export function calculateScore(inputs: TestInputs): CategoryScores {
  // Calculate mobility points (max 25)
  const mobilityPoints = calculateMobilityPoints(inputs.mobilityScore, inputs.stabilityTest);
  
  // Calculate endurance points (max 25)
  const endurancePoints = calculateEndurancePoints(inputs.masTimeInSeconds);
  
  // Calculate strength points (max 25)
  const strengthPoints = calculateStrengthPoints(inputs.squats, inputs.benchPress, inputs.brutalBench);
  
  // Calculate power points (max 25)
  const powerPoints = calculatePowerPoints(inputs.squatJump, inputs.cmj, inputs.cmjArms);
  
  // Calculate total score (max 100)
  const totalScore = mobilityPoints + endurancePoints + strengthPoints + powerPoints;
  
  return {
    mobilityPoints,
    endurancePoints,
    strengthPoints,
    powerPoints,
    totalScore
  };
}

/**
 * Calculate mobility points
 * @param mobilityScore Mobility score (0-10)
 * @param stabilityTest Whether stability test was passed
 * @returns Mobility points (0-25)
 */
function calculateMobilityPoints(mobilityScore: number, stabilityTest: boolean): number {
  // Mobility score (0-10) is worth up to 20 points
  const basePoints = (mobilityScore / 10) * 20;
  
  // Stability test is worth 5 points
  const stabilityPoints = stabilityTest ? 5 : 0;
  
  return Math.round(basePoints + stabilityPoints);
}

/**
 * Calculate endurance points
 * @param masTimeInSeconds MAS test time in seconds
 * @returns Endurance points (0-25)
 */
function calculateEndurancePoints(masTimeInSeconds: number): number {
  // Convert seconds to minutes for easier calculation
  const masTimeInMinutes = masTimeInSeconds / 60;
  
  // MAS test scoring (example scale - adjust as needed)
  // < 3 minutes: 0-5 points
  // 3-4 minutes: 5-15 points
  // 4-5 minutes: 15-20 points
  // > 5 minutes: 20-25 points
  let points = 0;
  
  if (masTimeInMinutes < 3) {
    // Linear scale from 0-5 points for times under 3 minutes
    points = (masTimeInMinutes / 3) * 5;
  } else if (masTimeInMinutes < 4) {
    // Linear scale from 5-15 points for times between 3-4 minutes
    points = 5 + ((masTimeInMinutes - 3) / 1) * 10;
  } else if (masTimeInMinutes < 5) {
    // Linear scale from 15-20 points for times between 4-5 minutes
    points = 15 + ((masTimeInMinutes - 4) / 1) * 5;
  } else {
    // Linear scale from 20-25 points for times over 5 minutes, capping at 25
    points = Math.min(20 + ((masTimeInMinutes - 5) / 2) * 5, 25);
  }
  
  return Math.round(points);
}

/**
 * Calculate strength points
 * @param squats Squat weight (kg)
 * @param benchPress Bench press weight (kg)
 * @param brutalBench Brutal bench reps
 * @returns Strength points (0-25)
 */
function calculateStrengthPoints(squats: number, benchPress: number, brutalBench: number): number {
  // Example scoring (adjust based on your standards)
  // Squats: up to 10 points
  // Bench press: up to 10 points
  // Brutal bench: up to 5 points
  
  // Squat scoring (example)
  // 0kg: 0 points, 100kg: 5 points, 200kg: 10 points
  const squatPoints = Math.min((squats / 20), 10);
  
  // Bench press scoring (example)
  // 0kg: 0 points, 50kg: 5 points, 100kg: 10 points
  const benchPressPoints = Math.min((benchPress / 10), 10);
  
  // Brutal bench scoring (example)
  // 0 reps: 0 points, 10 reps: 2.5 points, 20 reps: 5 points
  const brutalBenchPoints = Math.min((brutalBench / 4), 5);
  
  return Math.round(squatPoints + benchPressPoints + brutalBenchPoints);
}

/**
 * Calculate power points
 * @param squatJump Squat jump height (cm)
 * @param cmj Countermovement jump height (cm)
 * @param cmjArms Countermovement jump with arms height (cm)
 * @returns Power points (0-25)
 */
function calculatePowerPoints(squatJump: number, cmj: number, cmjArms: number): number {
  // Example scoring (adjust based on your standards)
  // Squat jump: up to 8 points
  // CMJ: up to 8 points
  // CMJ with arms: up to 9 points
  
  // Squat jump scoring (example)
  // 0cm: 0 points, 30cm: 4 points, 60cm: 8 points
  const squatJumpPoints = Math.min((squatJump / 7.5), 8);
  
  // CMJ scoring (example)
  // 0cm: 0 points, 30cm: 4 points, 60cm: 8 points
  const cmjPoints = Math.min((cmj / 7.5), 8);
  
  // CMJ with arms scoring (example)
  // 0cm: 0 points, 30cm: 4.5 points, 60cm: 9 points
  const cmjArmsPoints = Math.min((cmjArms / 6.67), 9);
  
  return Math.round(squatJumpPoints + cmjPoints + cmjArmsPoints);
}
