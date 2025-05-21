import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Plus, Trash2, GripVertical, Image, Video, AlertCircle, Clock } from 'lucide-react';

interface Option {
  id: string;
  optionText: string;
  mediaType: 'none' | 'image';
  mediaUrl?: string;
  correctnessPercentage: number;
}

interface Question {
  id: string;
  orderIndex: number;
  questionText: string;
  questionType: 'multiple_choice' | 'short_answer';
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  videoTimestamp?: number;
  timeLimit?: number;
  options: Option[];
}

interface DBQuestion {
  id: string;
  options: { id: string }[];
}

export default function TestEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [isGroupTest, setIsGroupTest] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<DBQuestion[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        // Fetch test details
        const { data: test, error: testError } = await supabase
          .from('learning_tests')
          .select('*')
          .eq('id', id)
          .single();

        if (testError) throw testError;

        setTitle(test.title);
        setDescription(test.description || '');
        setTimeLimit(test.time_limit || '');
        setIsGroupTest(test.is_group_test);

        // Fetch questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from('test_questions')
          .select(`
            *,
            question_options (*)
          `)
          .eq('test_id', id)
          .order('order_index');

        if (questionsError) throw questionsError;

        // Store original questions for tracking deletions
        setOriginalQuestions(questionsData.map((q: any) => ({
          id: q.id,
          options: q.question_options.map((o: any) => ({ id: o.id }))
        })));

        // Map the data to our component's structure
        const mappedQuestions: Question[] = questionsData.map((question: any) => ({
          id: question.id,
          orderIndex: question.order_index,
          questionText: question.question_text,
          questionType: question.question_type,
          mediaType: question.media_type,
          mediaUrl: question.media_url,
          videoTimestamp: question.video_timestamp,
          timeLimit: question.time_limit,
          options: question.question_options.map((option: any) => ({
            id: option.id,
            optionText: option.option_text,
            mediaType: option.media_type,
            mediaUrl: option.media_url,
            correctnessPercentage: option.correctness_percentage
          }))
        }));

        setQuestions(mappedQuestions);
      } catch (err: any) {
        console.error('Error fetching test:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTest();
    }
  }, [id]);

  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to edit tests.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/learning')}
              >
                Return to Learning Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Loading test...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      orderIndex: questions.length,
      questionText: '',
      questionType: 'multiple_choice',
      mediaType: 'none',
      options: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    updatedQuestions.forEach((q, i) => q.orderIndex = i);
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    question.options.push({
      id: crypto.randomUUID(),
      optionText: '',
      mediaType: 'none',
      correctnessPercentage: 0
    });
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<Option>) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    question.options[optionIndex] = { ...question.options[optionIndex], ...updates };
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!title.trim()) throw new Error('Title is required');
      if (!questions.length) throw new Error('At least one question is required');
      
      questions.forEach((q, i) => {
        if (!q.questionText.trim()) {
          throw new Error(`Question ${i + 1} text is required`);
        }
        if (q.questionType === 'multiple_choice' && q.options.length < 2) {
          throw new Error(`Question ${i + 1} must have at least 2 options`);
        }
        if (q.questionType === 'multiple_choice') {
          const hasCorrectAnswer = q.options.some(opt => opt.correctnessPercentage > 0);
          if (!hasCorrectAnswer) {
            throw new Error(`Question ${i + 1} must have at least one correct answer`);
          }
        }
      });

      // Update test
      const { error: testError } = await supabase
        .from('learning_tests')
        .update({
          title,
          description,
          is_group_test: isGroupTest,
          time_limit: timeLimit || null
        })
        .eq('id', id);

      if (testError) throw testError;

      // Find questions to delete
      const currentQuestionIds = new Set(questions.map(q => q.id));
      const questionsToDelete = originalQuestions
        .filter(q => !currentQuestionIds.has(q.id))
        .map(q => q.id);

      // Delete removed questions
      if (questionsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('test_questions')
          .delete()
          .in('id', questionsToDelete);

        if (deleteError) throw deleteError;
      }

      // Update or insert questions
      for (const question of questions) {
        const questionData = {
          test_id: id,
          order_index: question.orderIndex,
          question_text: question.questionText,
          question_type: question.questionType,
          media_type: question.mediaType,
          media_url: question.mediaUrl,
          video_timestamp: question.videoTimestamp,
          time_limit: question.timeLimit
        };

        let questionId = question.id;
        
        if (!originalQuestions.some(q => q.id === question.id)) {
          // Insert new question
          const { data: newQuestion, error: insertError } = await supabase
            .from('test_questions')
            .insert(questionData)
            .select()
            .single();

          if (insertError) throw insertError;
          questionId = newQuestion.id;
        } else {
          // Update existing question
          const { error: updateError } = await supabase
            .from('test_questions')
            .update(questionData)
            .eq('id', question.id);

          if (updateError) throw updateError;
        }

        // Handle options
        if (question.questionType === 'multiple_choice') {
          // Find options to delete
          const originalQuestion = originalQuestions.find(q => q.id === question.id);
          if (originalQuestion) {
            const currentOptionIds = new Set(question.options.map(o => o.id));
            const optionsToDelete = originalQuestion.options
              .filter(o => !currentOptionIds.has(o.id))
              .map(o => o.id);

            // Delete removed options
            if (optionsToDelete.length > 0) {
              const { error: deleteOptionsError } = await supabase
                .from('question_options')
                .delete()
                .in('id', optionsToDelete);

              if (deleteOptionsError) throw deleteOptionsError;
            }
          }

          // Update or insert options
          for (const option of question.options) {
            const optionData = {
              question_id: questionId,
              option_text: option.optionText,
              media_type: option.mediaType,
              media_url: option.mediaUrl,
              correctness_percentage: option.correctnessPercentage
            };

            if (!originalQuestion?.options.some(o => o.id === option.id)) {
              // Insert new option
              const { error: insertOptionError } = await supabase
                .from('question_options')
                .insert(optionData);

              if (insertOptionError) throw insertOptionError;
            } else {
              // Update existing option
              const { error: updateOptionError } = await supabase
                .from('question_options')
                .update(optionData)
                .eq('id', option.id);

              if (updateOptionError) throw updateOptionError;
            }
          }
        }
      }

      navigate('/learning');
    } catch (err: any) {
      console.error('Error updating test:', err);
      setError(err.message || 'Failed to update test');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Test</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/learning')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="form-label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Enter test title"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="Enter test description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="timeLimit">
                  Time Limit (minutes)
                </label>
                <input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : '')}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="isGroupTest">
                  Test Type
                </label>
                <select
                  id="isGroupTest"
                  value={isGroupTest ? 'group' : 'individual'}
                  onChange={(e) => setIsGroupTest(e.target.value === 'group')}
                  className="select-field"
                >
                  <option value="individual">Individual Test</option>
                  <option value="group">Group Test</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((question, questionIndex) => (
          <Card key={question.id} className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-50 hover:opacity-100">
              <GripVertical className="h-5 w-5" />
            </div>
            
            <CardContent className="pl-10">
              <div className="space-y-4 py-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-medium">Question {questionIndex + 1}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(questionIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <label className="form-label">Question Text</label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) => updateQuestion(questionIndex, { questionText: e.target.value })}
                    className="input-field"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Question Type</label>
                    <select
                      value={question.questionType}
                      onChange={(e) => updateQuestion(questionIndex, {
                        questionType: e.target.value as 'multiple_choice' | 'short_answer'
                      })}
                      className="select-field"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Time Limit (seconds)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={question.timeLimit || ''}
                        onChange={(e) => updateQuestion(questionIndex, {
                          timeLimit: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="input-field pl-9"
                        placeholder="No limit"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Media Type</label>
                  <div className="flex gap-2">
                    <Button
                      variant={question.mediaType === 'none' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => updateQuestion(questionIndex, { mediaType: 'none' })}
                    >
                      None
                    </Button>
                    <Button
                      variant={question.mediaType === 'image' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => updateQuestion(questionIndex, { mediaType: 'image' })}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Image
                    </Button>
                    <Button
                      variant={question.mediaType === 'video' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => updateQuestion(questionIndex, { mediaType: 'video' })}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Video
                    </Button>
                  </div>
                </div>

                {question.mediaType !== 'none' && (
                  <div>
                    <label className="form-label">Media URL</label>
                    <input
                      type="url"
                      value={question.mediaUrl || ''}
                      onChange={(e) => updateQuestion(questionIndex, { mediaUrl: e.target.value })}
                      className="input-field"
                      placeholder={`Enter ${question.mediaType} URL`}
                    />
                    {question.mediaType === 'video' && (
                      <div className="mt-2">
                        <label className="form-label">Video Timestamp (seconds)</label>
                        <input
                          type="number"
                          min="0"
                          value={question.videoTimestamp || ''}
                          onChange={(e) => updateQuestion(questionIndex, {
                            videoTimestamp: parseInt(e.target.value) || 0
                          })}
                          className="input-field"
                        />
                      </div>
                    )}
                  </div>
                )}

                {question.questionType === 'multiple_choice' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">Options</label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(questionIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {question.options.map((option, optionIndex) => (
                        <div key={option.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={option.optionText}
                                onChange={(e) => updateOption(questionIndex, optionIndex, {
                                  optionText: e.target.value
                                })}
                                className="input-field mb-2"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              
                              <div className="flex gap-2 mb-2">
                                <Button
                                  variant={option.mediaType === 'none' ? 'primary' : 'outline'}
                                  size="sm"
                                  onClick={() => updateOption(questionIndex, optionIndex, { 
                                    mediaType: 'none',
                                    mediaUrl: undefined 
                                  })}
                                >
                                  Text Only
                                </Button>
                                <Button
                                  variant={option.mediaType === 'image' ? 'primary' : 'outline'}
                                  size="sm"
                                  onClick={() => updateOption(questionIndex, optionIndex, { 
                                    mediaType: 'image' 
                                  })}
                                >
                                  <Image className="h-4 w-4 mr-1" />
                                  Image
                                </Button>
                              </div>

                              {option.mediaType === 'image' && (
                                <input
                                  type="url"
                                  value={option.mediaUrl || ''}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, {
                                    mediaUrl: e.target.value
                                  })}
                                  className="input-field mb-2"
                                  placeholder="Enter image URL"
                                />
                              )}

                              <div>
                                <label className="form-label">Correctness %</label>
                                <div className="flex items-center gap-4">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="10"
                                    value={option.correctnessPercentage}
                                    onChange={(e) => updateOption(questionIndex, optionIndex, {
                                      correctnessPercentage: parseInt(e.target.value)
                                    })}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                  <span className="text-sm font-medium w-12 text-center">
                                    {option.correctnessPercentage}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {option.mediaType === 'image' && option.mediaUrl && (
                            <div className="mt-2">
                              <img
                                src={option.mediaUrl}
                                alt={option.optionText}
                                className="max-h-40 rounded-lg object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://placehold.co/400x300?text=Invalid+Image+URL';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={addQuestion}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  );
}
