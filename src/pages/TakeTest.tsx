import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle, ChevronLeft, ChevronRight, Timer } from 'lucide-react';

interface Option {
  id: string;
  optionText: string;
  mediaType: 'none' | 'image';
  mediaUrl?: string;
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

interface Test {
  id: string;
  title: string;
  description: string;
  timeLimit: number | null;
  questions: Question[];
}

export default function TakeTest() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data: testData, error: testError } = await supabase
          .from('learning_tests')
          .select('*')
          .eq('id', id)
          .single();

        if (testError) throw testError;

        const { data: questionsData, error: questionsError } = await supabase
          .from('test_questions')
          .select(`
            *,
            question_options (*)
          `)
          .eq('test_id', id)
          .order('order_index');

        if (questionsError) throw questionsError;

        const questions = questionsData.map((q: any) => ({
          id: q.id,
          orderIndex: q.order_index,
          questionText: q.question_text,
          questionType: q.question_type,
          mediaType: q.media_type,
          mediaUrl: q.media_url,
          videoTimestamp: q.video_timestamp,
          timeLimit: q.time_limit,
          options: q.question_options.map((o: any) => ({
            id: o.id,
            optionText: o.option_text,
            mediaType: o.media_type,
            mediaUrl: o.media_url
          }))
        }));

        setTest({
          id: testData.id,
          title: testData.title,
          description: testData.description,
          timeLimit: testData.time_limit,
          questions
        });

        if (testData.time_limit) {
          setTimeLeft(testData.time_limit * 60); // Convert minutes to seconds
        }
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

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Please log in to take this test.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/login')}
              >
                Log In
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

  if (!test) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Test Not Found</h2>
              <p className="text-muted-foreground">
                The test you're looking for doesn't exist or has been removed.
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

  const currentQuestion = test.questions[currentQuestionIndex];

  const handleAnswerChange = (value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleSubmit = async () => {
    if (!isPreview) {
      try {
        // Submit test results
        const { error: resultError } = await supabase
          .from('test_results')
          .insert({
            test_id: test.id,
            user_id: user.id,
            answers: answers,
            submitted_at: new Date().toISOString()
          });

        if (resultError) throw resultError;
      } catch (err: any) {
        console.error('Error submitting test:', err);
        setError(err.message);
        return;
      }
    }

    navigate('/learning');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{test.title}</h1>
        {timeLeft !== null && (
          <div className="flex items-center text-lg font-medium">
            <Timer className="h-5 w-5 mr-2" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {isPreview && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
          <p className="text-warning font-medium">Preview Mode</p>
          <p className="text-sm text-warning/80">
            This is a preview of how the test will appear to players. Answers submitted in preview mode won't be recorded.
          </p>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Question {currentQuestionIndex + 1} of {test.questions.length}</h3>
              <p className="text-gray-600">{currentQuestion.questionText}</p>
            </div>

            {currentQuestion.mediaType !== 'none' && currentQuestion.mediaUrl && (
              <div className="mt-4">
                {currentQuestion.mediaType === 'image' ? (
                  <img
                    src={currentQuestion.mediaUrl}
                    alt="Question media"
                    className="max-h-64 rounded-lg object-contain mx-auto"
                  />
                ) : (
                  <video
                    src={currentQuestion.mediaUrl}
                    controls
                    className="w-full rounded-lg"
                    currentTime={currentQuestion.videoTimestamp || 0}
                  />
                )}
              </div>
            )}

            <div className="space-y-4">
              {currentQuestion.questionType === 'multiple_choice' ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAnswerChange(option.id)}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={answers[currentQuestion.id] === option.id}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p>{option.optionText}</p>
                        {option.mediaType === 'image' && option.mediaUrl && (
                          <img
                            src={option.mediaUrl}
                            alt={option.optionText}
                            className="mt-2 max-h-32 rounded-lg object-contain"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[currentQuestion.id] as string || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="Enter your answer..."
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        {currentQuestionIndex === test.questions.length - 1 ? (
          <Button onClick={handleSubmit}>
            Submit Test
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={currentQuestionIndex === test.questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
