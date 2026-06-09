/**
 * Quizzes API Service - Frontend
 * Handles all quiz CRUD, response submission, and leaderboard operations
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  label: string;
  options?: string[];
  correct_answer?: string;
  points?: number;
  explanation?: string;
}

export interface Quiz {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  title: string;
  description?: string;
  questions: string; // JSON string of QuizQuestion[]
  created_by: string;
  status: 'draft' | 'active' | 'closed';
  is_public: boolean;
  time_limit_seconds?: number;
  city?: string;
  country?: string;
  page_url?: string;
  response_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  questions: QuizQuestion[];
  created_by: string;
  status?: 'draft' | 'active' | 'closed';
  is_public?: boolean;
  time_limit_seconds?: number;
  city?: string;
  country?: string;
  page_url?: string;
}

export interface UpdateQuizData {
  title?: string;
  description?: string;
  questions?: QuizQuestion[];
  status?: 'draft' | 'active' | 'closed';
  is_public?: boolean;
  time_limit_seconds?: number;
  city?: string;
  country?: string;
}

export interface QuizSubmissionData {
  respondent_email?: string;
  respondent_name?: string;
  answers: Record<string, any>;
  time_taken_seconds?: number;
  city?: string;
  country?: string;
}

export interface QuizResponse {
  $id: string;
  $createdAt?: string;
  quiz_id: string;
  respondent_email?: string;
  respondent_name?: string;
  answers: string; // JSON string
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds?: number;
  city?: string;
  country?: string;
  submitted_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  respondent_email: string;
  respondent_name: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds?: number;
  city?: string;
  country?: string;
  quiz_id?: string;
  quiz_count?: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  total: number;
  scope: string;
  filter_value?: string | null;
}

// ============================================================================
// QUIZ CRUD
// ============================================================================

export async function createQuiz(data: CreateQuizData): Promise<Quiz> {
  const response = await fetch(`${BACKEND_URL}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create quiz');
  }
  return response.json();
}

export async function listQuizzes(params?: {
  created_by?: string;
  status?: string;
  is_public?: boolean;
  city?: string;
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<{ documents: Quiz[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.created_by) searchParams.set('created_by', params.created_by);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.is_public !== undefined) searchParams.set('is_public', params.is_public.toString());
  if (params?.city) searchParams.set('city', params.city);
  if (params?.country) searchParams.set('country', params.country);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const response = await fetch(`${BACKEND_URL}/api/quizzes?${searchParams.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list quizzes');
  }
  return response.json();
}

export async function getQuiz(quizId: string, includeAnswers = false, userEmail?: string): Promise<Quiz> {
  const params = new URLSearchParams();
  if (includeAnswers) params.set('include_answers', 'true');
  if (userEmail) params.set('user_email', userEmail);

  const response = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get quiz');
  }
  return response.json();
}

export async function updateQuiz(quizId: string, data: UpdateQuizData, userEmail: string): Promise<Quiz> {
  const response = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}?user_email=${encodeURIComponent(userEmail)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update quiz');
  }
  return response.json();
}

export async function deleteQuiz(quizId: string, userEmail: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}?user_email=${encodeURIComponent(userEmail)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete quiz');
  }
}

// ============================================================================
// QUIZ RESPONSES
// ============================================================================

export async function submitQuizResponse(quizId: string, data: QuizSubmissionData): Promise<QuizResponse> {
  const response = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit quiz response');
  }
  return response.json();
}

export interface CheckAnswerResult {
  correct: boolean;
  correct_answer: string;
  explanation?: string | null;
  points: number;
}

export async function checkAnswer(quizId: string, questionId: string, answer: string): Promise<CheckAnswerResult> {
  const response = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}/check-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, answer }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to check answer');
  }
  return response.json();
}

export async function listQuizResponses(
  quizId: string,
  limit = 100,
  offset = 0
): Promise<{ documents: QuizResponse[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  const response = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}/responses?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list quiz responses');
  }
  return response.json();
}

// ============================================================================
// LEADERBOARDS
// ============================================================================

export async function getQuizLeaderboard(
  quizId: string,
  scope: 'global' | 'country' | 'city' = 'global',
  filterValue?: string,
  limit = 50
): Promise<LeaderboardResult> {
  const params = new URLSearchParams({ scope, limit: limit.toString() });
  if (filterValue) params.set('filter_value', filterValue);

  const response = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}/leaderboard?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get leaderboard');
  }
  return response.json();
}

export async function getPublicLeaderboard(
  scope: 'global' | 'country' | 'city' = 'global',
  filterValue?: string,
  limit = 50
): Promise<LeaderboardResult> {
  const params = new URLSearchParams({ scope, limit: limit.toString() });
  if (filterValue) params.set('filter_value', filterValue);

  const response = await fetch(`${BACKEND_URL}/api/leaderboard/public?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get public leaderboard');
  }
  return response.json();
}
