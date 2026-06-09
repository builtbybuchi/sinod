"""
Pydantic Models for Quizzes and Quiz Responses API

Questions are stored as a single JSON string column. Each question object has:
  - id: unique string identifier
  - type: "multiple_choice" | "true_false" | "short_answer"
  - label: the question text
  - options: list of strings (for multiple_choice)
  - correct_answer: the correct answer string
  - points: int (default 1)
  - explanation: optional explanation shown after answering

Responses are stored as a single JSON string column mapping question_id -> answer.
Score is computed server-side by comparing answers to correct_answers.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ============================================================================
# QUESTION SCHEMA (for validation, stored as JSON string)
# ============================================================================

class QuizQuestion(BaseModel):
    """Schema for a single quiz question"""
    id: str
    type: str = Field(..., description="multiple_choice|true_false|short_answer")
    label: str = Field(..., min_length=1, max_length=1000)
    options: Optional[List[str]] = None
    correct_answer: str = Field(..., min_length=1)
    points: int = 1
    explanation: Optional[str] = None


# ============================================================================
# QUIZ MODELS
# ============================================================================

class QuizCreate(BaseModel):
    """Model for creating a new quiz"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    questions: List[QuizQuestion] = Field(..., min_length=1)
    created_by: EmailStr
    status: Optional[str] = "active"
    is_public: bool = False
    time_limit_seconds: Optional[int] = 0  # 0 = no time limit
    city: Optional[str] = None
    country: Optional[str] = None
    page_url: Optional[str] = None  # Short URL slug (e.g. "a3f-k9z-2b7")


class QuizUpdate(BaseModel):
    """Model for updating a quiz"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    questions: Optional[List[QuizQuestion]] = None
    status: Optional[str] = None  # draft | active | closed
    is_public: Optional[bool] = None
    time_limit_seconds: Optional[int] = None
    city: Optional[str] = None
    country: Optional[str] = None


class QuizResponse(BaseModel):
    """Model for quiz response from database"""
    id: str = Field(alias="$id")
    title: str
    description: Optional[str] = None
    questions: str  # JSON string of questions (correct_answer stripped for public)
    created_by: str
    status: Optional[str] = "active"
    is_public: Optional[bool] = False
    time_limit_seconds: Optional[int] = 0
    city: Optional[str] = None
    country: Optional[str] = None
    page_url: Optional[str] = None
    response_count: Optional[int] = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True


class QuizListResponse(BaseModel):
    """Model for list of quizzes"""
    documents: List[QuizResponse]
    total: int


# ============================================================================
# QUIZ RESPONSE (SUBMISSION) MODELS
# ============================================================================

class QuizSubmission(BaseModel):
    """Model for submitting a quiz response"""
    respondent_email: Optional[EmailStr] = None
    respondent_name: Optional[str] = Field("Anonymous", max_length=255)
    answers: dict[str, Any] = Field(..., description="Map of question_id -> answer value")
    time_taken_seconds: Optional[int] = 0
    city: Optional[str] = None
    country: Optional[str] = None


class CheckAnswerRequest(BaseModel):
    """Model for checking a single answer"""
    question_id: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=0)


class CheckAnswerResponse(BaseModel):
    """Response from checking a single answer"""
    correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    points: int = 0


class QuizSubmissionResponse(BaseModel):
    """Model for quiz submission response from database"""
    id: str = Field(alias="$id")
    quiz_id: str
    respondent_email: Optional[str] = None
    respondent_name: Optional[str] = "Anonymous"
    answers: str  # JSON string of answers
    score: int = 0
    total_questions: int = 0
    correct_answers: int = 0
    time_taken_seconds: Optional[int] = 0
    city: Optional[str] = None
    country: Optional[str] = None
    submitted_at: Optional[str] = None

    class Config:
        populate_by_name = True


class QuizSubmissionListResponse(BaseModel):
    """Model for list of quiz submissions"""
    documents: List[QuizSubmissionResponse]
    total: int


# ============================================================================
# LEADERBOARD MODELS
# ============================================================================

class LeaderboardEntry(BaseModel):
    """A single entry in a leaderboard"""
    rank: int
    respondent_email: Optional[str] = None
    respondent_name: str
    score: int
    total_questions: int
    correct_answers: int
    time_taken_seconds: int
    quiz_id: Optional[str] = None
    quiz_title: Optional[str] = None
    submitted_at: Optional[str] = None


class LeaderboardResponse(BaseModel):
    """Leaderboard response"""
    entries: List[LeaderboardEntry]
    total: int
    scope: str  # "quiz" | "city" | "country" | "global"
    filter_value: Optional[str] = None  # e.g. city name or country name
