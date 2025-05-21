import { supabase } from './supabase';

async function resetExercises() {
  try {
    console.log('Deleting all exercises...');
    
    const { error } = await supabase
      .from('exercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      console.error('Error deleting exercises:', error);
      return;
    }

    console.log('Successfully deleted all exercises.');
    console.log('You can now import your exercises again.');

  } catch (err) {
    console.error('Error resetting exercises:', err);
  }
}

// Run the reset
resetExercises();
