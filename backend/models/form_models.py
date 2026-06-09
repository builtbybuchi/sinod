"""
Pydantic Models for Forms and Form Responses API

Questions are stored as a single JSON string column. Each question object has:
  - id: unique string identifier
  - type: "text" | "textarea" | "number" | "email" | "select" | "multiselect" | "radio" | "checkbox" | "date" | "file"
  - label: the question text
  - required: bool
  - options: list of strings (for select/multiselect/radio types)
  - placeholder: optional hint text

Responses are stored as a single JSON string column. Each answer maps question_id -> value.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ============================================================================
# QUESTION SCHEMA (for validation, stored as JSON string)
# ============================================================================

class FormQuestion(BaseModel):
    """Schema for a single form question"""
    id: str
    type: str = Field(..., description="text|textarea|number|email|select|multiselect|radio|checkbox|date|file")
    label: str = Field(..., min_length=1, max_length=500)
    required: bool = False
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None


# ============================================================================
# FORM MODELS
# ============================================================================

class FormCreate(BaseModel):
    """Model for creating a new form"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    questions: List[FormQuestion] = Field(..., min_length=1)
    created_by: EmailStr
    status: Optional[str] = "active"
    is_public: bool = True
    event_id: Optional[str] = None  # Link form to an event (e.g. for custom registration questions)
    page_url: Optional[str] = None  # Short URL slug (e.g. "a3f-k9z-2b7")


class FormUpdate(BaseModel):
    """Model for updating a form"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    questions: Optional[List[FormQuestion]] = None
    status: Optional[str] = None  # draft | active | closed
    is_public: Optional[bool] = None


class FormResponse(BaseModel):
    """Model for form response from database"""
    id: str = Field(alias="$id")
    title: str
    description: Optional[str] = None
    questions: str  # JSON string of questions
    created_by: str
    status: Optional[str] = "active"
    is_public: Optional[bool] = True
    event_id: Optional[str] = None
    page_url: Optional[str] = None
    response_count: Optional[int] = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True


class FormListResponse(BaseModel):
    """Model for list of forms"""
    documents: List[FormResponse]
    total: int


# ============================================================================
# FORM RESPONSE (SUBMISSION) MODELS
# ============================================================================

class FormSubmission(BaseModel):
    """Model for submitting a form response"""
    respondent_email: Optional[EmailStr] = None
    respondent_name: Optional[str] = Field("Anonymous", max_length=255)
    answers: dict[str, Any] = Field(..., description="Map of question_id -> answer value")


class FormSubmissionResponse(BaseModel):
    """Model for form submission response from database"""
    id: str = Field(alias="$id")
    form_id: str
    respondent_email: Optional[str] = None
    respondent_name: Optional[str] = "Anonymous"
    answers: str  # JSON string of answers
    submitted_at: Optional[str] = None

    class Config:
        populate_by_name = True


class FormSubmissionListResponse(BaseModel):
    """Model for list of form submissions"""
    documents: List[FormSubmissionResponse]
    total: int
