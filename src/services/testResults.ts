import { supabase } from '../lib/supabaseClient';

interface TestResultData {
  athleteId: string;
  testId: string;
  date: Date;
  results: Record<string, any>;
}

export const saveTestResult = async (data: TestResultData) => {
  const { athleteId, testId, date, results } = data;
  
  // Check if a result already exists for this athlete, test, and date
  const { data: existingResults, error: fetchError } = await supabase
    .from('test_results')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('test_id', testId)
    .eq('date', date.toISOString().split('T')[0]);
  
  if (fetchError) {
    throw fetchError;
  }
  
  // If result exists, update it; otherwise, insert a new one
  if (existingResults && existingResults.length > 0) {
    const { error } = await supabase
      .from('test_results')
      .update({
        results: results,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingResults[0].id);
    
    if (error) {
      throw error;
    }
    
    return existingResults[0].id;
  } else {
    const { data: newResult, error } = await supabase
      .from('test_results')
      .insert({
        athlete_id: athleteId,
        test_id: testId,
        date: date.toISOString().split('T')[0],
        results: results,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      throw error;
    }
    
    return newResult.id;
  }
};

export const getTestResults = async (athleteId: string, testId: string) => {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('test_id', testId)
    .order('date', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data || [];
};

export const getLatestTestResult = async (athleteId: string, testId: string) => {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('test_id', testId)
    .order('date', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    throw error;
  }
  
  return data || null;
};
