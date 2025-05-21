import { supabase } from './supabase';

async function findDuplicateExercises() {
  try {
    console.log('Checking for duplicate exercises...');
    
    const { data, error } = await supabase
      .from('exercises')
      .select('name, id')
      .order('name');

    if (error) {
      console.error('Error fetching exercises:', error);
      return;
    }

    // Create a map to store exercise names and their count
    const exerciseMap = new Map<string, string[]>();
    
    // Group exercises by name
    data.forEach(exercise => {
      const name = exercise.name.toLowerCase().trim();
      const existing = exerciseMap.get(name) || [];
      exerciseMap.set(name, [...existing, exercise.id]);
    });

    // Find entries with more than one occurrence
    const duplicates = Array.from(exerciseMap.entries())
      .filter(([_, ids]) => ids.length > 1);

    if (duplicates.length === 0) {
      console.log('No duplicate exercises found.');
      return;
    }

    console.log('\nDuplicate exercises found:');
    console.log('==========================');
    
    for (const [name, ids] of duplicates) {
      console.log(`\nExercise: "${name}"`);
      console.log(`Found ${ids.length} instances:`);
      for (const id of ids) {
        console.log(`- ID: ${id}`);
      }
    }

  } catch (err) {
    console.error('Error checking for duplicates:', err);
  }
}

// Run the check
findDuplicateExercises();
