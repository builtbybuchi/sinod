"""
Quizzes API Routes
Handles quiz CRUD, response submission with auto-scoring, and leaderboards
"""

import json
import logging
from fastapi import APIRouter, HTTPException, Query as QueryParam
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime, timezone
from appwrite.query import Query
from appwrite.id import ID

from models.quiz_models import (
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuizListResponse,
    QuizSubmission,
    QuizSubmissionResponse,
    QuizSubmissionListResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    CheckAnswerRequest,
    CheckAnswerResponse,
)
from services.appwrite_service import get_appwrite_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

QUIZZES_COLLECTION = settings.APPWRITE_QUIZZES_COLLECTION_ID
QUIZ_RESPONSES_COLLECTION = settings.APPWRITE_QUIZ_RESPONSES_COLLECTION_ID


def _score_quiz(questions_json: str, answers: dict) -> dict:
    """
    Score a quiz submission by comparing answers to correct answers.
    Returns dict with score, total_questions, correct_answers.
    """
    questions = json.loads(questions_json)
    total = len(questions)
    correct = 0
    total_points = 0
    earned_points = 0

    for q in questions:
        q_id = q.get("id", "")
        correct_answer = q.get("correct_answer")
        points = q.get("points", 1)
        total_points += points

        user_answer = answers.get(q_id)
        if user_answer is not None and correct_answer is not None:
            # Normalize comparison
            if str(user_answer).strip().lower() == str(correct_answer).strip().lower():
                correct += 1
                earned_points += points

    return {
        "score": earned_points,
        "total_questions": total,
        "correct_answers": correct,
        "total_points": total_points,
    }


def _strip_answers_from_questions(quiz_doc: dict) -> dict:
    """Remove correct_answer and explanation from questions before sending to respondent."""
    try:
        questions = json.loads(quiz_doc.get("questions", "[]"))
        for q in questions:
            q.pop("correct_answer", None)
            q.pop("explanation", None)
        quiz_doc["questions"] = json.dumps(questions)
    except Exception:
        pass
    return quiz_doc


# ============================================================================
# QUIZ CRUD
# ============================================================================

@router.post("/quizzes", response_model=QuizResponse)
async def create_quiz(quiz: QuizCreate):
    """Create a new quiz"""
    try:
        appwrite = get_appwrite_service()
        now = datetime.now(timezone.utc).isoformat()

        questions_json = json.dumps([q.model_dump() for q in quiz.questions])

        data = {
            "title": quiz.title,
            "description": quiz.description or "",
            "questions": questions_json,
            "created_by": quiz.created_by,
            "status": quiz.status or "active",
            "is_public": quiz.is_public,
            "time_limit_seconds": quiz.time_limit_seconds or 0,
            "city": quiz.city or "",
            "country": quiz.country or "",
            "response_count": 0,
            "created_at": now,
            "updated_at": now,
        }

        # Use page_url as document ID (short slug) if provided, else auto-generate
        document_id = (quiz.page_url or "").strip() or ID.unique()
        data["page_url"] = document_id

        result = appwrite.create_document(
            collection_id=QUIZZES_COLLECTION,
            data=data,
            document_id=document_id,
        )

        logger.info(f"Created quiz: {result['$id']} by {quiz.created_by}")
        return QuizResponse(**result)

    except Exception as e:
        logger.error(f"Error creating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quizzes")
async def list_quizzes(
    created_by: Optional[str] = QueryParam(None, description="Filter by creator email"),
    status: Optional[str] = QueryParam(None, description="Filter by status"),
    is_public: Optional[bool] = QueryParam(None, description="Filter by public/private"),
    city: Optional[str] = QueryParam(None, description="Filter by city"),
    country: Optional[str] = QueryParam(None, description="Filter by country"),
    limit: int = QueryParam(50, ge=1, le=100),
    offset: int = QueryParam(0, ge=0),
):
    """List quizzes"""
    try:
        appwrite = get_appwrite_service()

        queries = [
            Query.order_desc("$createdAt"),
            Query.limit(limit),
            Query.offset(offset),
        ]

        if created_by:
            queries.append(Query.equal("created_by", created_by))
        if status:
            queries.append(Query.equal("status", status))
        if is_public is not None:
            queries.append(Query.equal("is_public", is_public))
        if city:
            queries.append(Query.equal("city", city))
        if country:
            queries.append(Query.equal("country", country))

        result = appwrite.list_documents(
            collection_id=QUIZZES_COLLECTION,
            queries=queries,
        )

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error listing quizzes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quizzes/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    include_answers: bool = QueryParam(False, description="Include correct answers (owner only)"),
    user_email: Optional[str] = QueryParam(None, description="Requesting user's email"),
):
    """Get a single quiz. Strips correct answers unless the requester is the owner."""
    try:
        appwrite = get_appwrite_service()
        result = appwrite.get_document(
            collection_id=QUIZZES_COLLECTION,
            document_id=quiz_id,
        )

        # Strip correct answers unless owner requests them
        if not include_answers or result.get("created_by") != user_email:
            result = _strip_answers_from_questions(result)

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error getting quiz {quiz_id}: {e}")
        if "could not be found" in str(e):
            raise HTTPException(status_code=404, detail="Quiz not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/quizzes/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: str,
    quiz: QuizUpdate,
    user_email: str = QueryParam(..., description="Owner email for authorization"),
):
    """Update a quiz (only the owner can update)"""
    try:
        appwrite = get_appwrite_service()

        existing = appwrite.get_document(
            collection_id=QUIZZES_COLLECTION,
            document_id=quiz_id,
        )
        if existing.get("created_by") != user_email:
            raise HTTPException(status_code=403, detail="Only the quiz owner can update it")

        update_data = {}
        if quiz.title is not None:
            update_data["title"] = quiz.title
        if quiz.description is not None:
            update_data["description"] = quiz.description
        if quiz.questions is not None:
            update_data["questions"] = json.dumps([q.model_dump() for q in quiz.questions])
        if quiz.status is not None:
            update_data["status"] = quiz.status
        if quiz.is_public is not None:
            update_data["is_public"] = quiz.is_public
        if quiz.time_limit_seconds is not None:
            update_data["time_limit_seconds"] = quiz.time_limit_seconds
        if quiz.city is not None:
            update_data["city"] = quiz.city
        if quiz.country is not None:
            update_data["country"] = quiz.country

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = appwrite.update_document(
            collection_id=QUIZZES_COLLECTION,
            document_id=quiz_id,
            data=update_data,
        )

        logger.info(f"Updated quiz: {quiz_id}")
        return QuizResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quiz {quiz_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/quizzes/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    user_email: str = QueryParam(..., description="Owner email for authorization"),
):
    """Delete a quiz and all its responses"""
    try:
        appwrite = get_appwrite_service()

        existing = appwrite.get_document(
            collection_id=QUIZZES_COLLECTION,
            document_id=quiz_id,
        )
        if existing.get("created_by") != user_email:
            raise HTTPException(status_code=403, detail="Only the quiz owner can delete it")

        # Delete all responses
        try:
            responses = appwrite.list_documents(
                collection_id=QUIZ_RESPONSES_COLLECTION,
                queries=[Query.equal("quiz_id", quiz_id), Query.limit(500)],
            )
            for doc in responses.get("documents", []):
                appwrite.delete_document(
                    collection_id=QUIZ_RESPONSES_COLLECTION,
                    document_id=doc["$id"],
                )
        except Exception:
            pass

        appwrite.delete_document(
            collection_id=QUIZZES_COLLECTION,
            document_id=quiz_id,
        )

        logger.info(f"Deleted quiz: {quiz_id}")
        return {"message": "Quiz deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quiz {quiz_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# QUIZ RESPONSES (SUBMISSIONS) — auto-scored
# ============================================================================

@router.post("/quizzes/{quiz_id}/responses", response_model=QuizSubmissionResponse)
async def submit_quiz_response(quiz_id: str, submission: QuizSubmission):
    """Submit a quiz response. Auto-scores by comparing to correct answers."""
    try:
        appwrite = get_appwrite_service()

        quiz = appwrite.get_document(
            collection_id=QUIZZES_COLLECTION,
            document_id=quiz_id,
        )
        if quiz.get("status") == "closed":
            raise HTTPException(status_code=400, detail="This quiz is no longer accepting responses")

        # Auto-score
        scoring = _score_quiz(quiz.get("questions", "[]"), submission.answers)

        now = datetime.now(timezone.utc).isoformat()
        answers_json = json.dumps(submission.answers)

        data = {
            "quiz_id": quiz_id,
            "respondent_name": submission.respondent_name or "Anonymous",
            "answers": answers_json,
            "score": scoring["score"],
            "total_questions": scoring["total_questions"],
            "correct_answers": scoring["correct_answers"],
            "time_taken_seconds": submission.time_taken_seconds or 0,
            "city": submission.city or "",
            "country": submission.country or "",
            "submitted_at": now,
        }

        # Only include respondent_email if provided (Appwrite email type rejects empty strings)
        if submission.respondent_email:
            data["respondent_email"] = submission.respondent_email

        result = appwrite.create_document(
            collection_id=QUIZ_RESPONSES_COLLECTION,
            data=data,
        )

        # Increment response count
        try:
            current_count = quiz.get("response_count", 0) or 0
            appwrite.update_document(
                collection_id=QUIZZES_COLLECTION,
                document_id=quiz_id,
                data={"response_count": current_count + 1},
            )
        except Exception:
            pass

        logger.info(f"Quiz response submitted for quiz {quiz_id}, score: {scoring['score']}/{scoring['total_points']}")
        return QuizSubmissionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quiz response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quizzes/{quiz_id}/check-answer", response_model=CheckAnswerResponse)
async def check_answer(quiz_id: str, req: CheckAnswerRequest):
    """Check a single answer for a quiz question. Returns whether correct, the correct answer, and explanation."""
    try:
        appwrite = get_appwrite_service()

        quiz = appwrite.get_document(
            collection_id=QUIZZES_COLLECTION,
            document_id=quiz_id,
        )

        questions = json.loads(quiz.get("questions", "[]"))
        target = None
        for q in questions:
            if q.get("id") == req.question_id:
                target = q
                break

        if target is None:
            raise HTTPException(status_code=404, detail="Question not found")

        correct_answer = target.get("correct_answer", "")
        is_correct = str(req.answer).strip().lower() == str(correct_answer).strip().lower()
        points = target.get("points", 1) if is_correct else 0

        return CheckAnswerResponse(
            correct=is_correct,
            correct_answer=correct_answer,
            explanation=target.get("explanation"),
            points=points,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking answer for quiz {quiz_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quizzes/{quiz_id}/responses")
async def list_quiz_responses(
    quiz_id: str,
    limit: int = QueryParam(100, ge=1, le=500),
    offset: int = QueryParam(0, ge=0),
):
    """List all responses for a quiz"""
    try:
        appwrite = get_appwrite_service()

        queries = [
            Query.equal("quiz_id", quiz_id),
            Query.order_desc("score"),
            Query.limit(limit),
            Query.offset(offset),
        ]

        result = appwrite.list_documents(
            collection_id=QUIZ_RESPONSES_COLLECTION,
            queries=queries,
        )

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error listing quiz responses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# LEADERBOARDS
# ============================================================================

@router.get("/quizzes/{quiz_id}/leaderboard")
async def get_quiz_leaderboard(
    quiz_id: str,
    scope: str = QueryParam("global", description="Scope: global, country, city"),
    filter_value: Optional[str] = QueryParam(None, description="City or country name to filter"),
    limit: int = QueryParam(50, ge=1, le=100),
):
    """
    Get leaderboard for a specific quiz.
    Scope can be 'global', 'country', or 'city'.
    """
    try:
        appwrite = get_appwrite_service()

        queries = [
            Query.equal("quiz_id", quiz_id),
            Query.order_desc("score"),
            Query.limit(limit),
        ]

        if scope == "country" and filter_value:
            queries.append(Query.equal("country", filter_value))
        elif scope == "city" and filter_value:
            queries.append(Query.equal("city", filter_value))

        result = appwrite.list_documents(
            collection_id=QUIZ_RESPONSES_COLLECTION,
            queries=queries,
        )

        entries = []
        for idx, doc in enumerate(result.get("documents", []), start=1):
            entries.append({
                "rank": idx,
                "respondent_email": doc.get("respondent_email", ""),
                "respondent_name": doc.get("respondent_name", "Anonymous"),
                "score": doc.get("score", 0),
                "total_questions": doc.get("total_questions", 0),
                "correct_answers": doc.get("correct_answers", 0),
                "time_taken_seconds": doc.get("time_taken_seconds", 0),
                "city": doc.get("city", ""),
                "country": doc.get("country", ""),
                "quiz_id": quiz_id,
            })

        return {
            "entries": entries,
            "total": result.get("total", 0),
            "scope": scope,
            "filter_value": filter_value,
        }

    except Exception as e:
        logger.error(f"Error getting leaderboard for quiz {quiz_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard/public")
async def get_public_leaderboard(
    scope: str = QueryParam("global", description="Scope: global, country, city"),
    filter_value: Optional[str] = QueryParam(None, description="City or country name to filter"),
    limit: int = QueryParam(50, ge=1, le=100),
):
    """
    Aggregated public leaderboard across all public quizzes.
    Sums scores per respondent across all public quizzes.
    """
    try:
        appwrite = get_appwrite_service()

        # First, get all public quiz IDs
        quiz_queries = [
            Query.equal("is_public", True),
            Query.equal("status", "active"),
            Query.limit(200),
        ]

        quizzes_result = appwrite.list_documents(
            collection_id=QUIZZES_COLLECTION,
            queries=quiz_queries,
        )

        public_quiz_ids = [q["$id"] for q in quizzes_result.get("documents", [])]

        if not public_quiz_ids:
            return {
                "entries": [],
                "total": 0,
                "scope": scope,
                "filter_value": filter_value,
            }

        # Fetch responses for all public quizzes
        # (Appwrite supports Query.equal with array of values)
        response_queries = [
            Query.equal("quiz_id", public_quiz_ids),
            Query.limit(500),
        ]

        if scope == "country" and filter_value:
            response_queries.append(Query.equal("country", filter_value))
        elif scope == "city" and filter_value:
            response_queries.append(Query.equal("city", filter_value))

        responses_result = appwrite.list_documents(
            collection_id=QUIZ_RESPONSES_COLLECTION,
            queries=response_queries,
        )

        # Aggregate scores per respondent email
        aggregated = {}
        for doc in responses_result.get("documents", []):
            email = doc.get("respondent_email", "")
            if not email:
                continue
            if email not in aggregated:
                aggregated[email] = {
                    "respondent_email": email,
                    "respondent_name": doc.get("respondent_name", "Anonymous"),
                    "score": 0,
                    "total_questions": 0,
                    "correct_answers": 0,
                    "time_taken_seconds": 0,
                    "city": doc.get("city", ""),
                    "country": doc.get("country", ""),
                    "quiz_count": 0,
                }
            aggregated[email]["score"] += doc.get("score", 0)
            aggregated[email]["total_questions"] += doc.get("total_questions", 0)
            aggregated[email]["correct_answers"] += doc.get("correct_answers", 0)
            aggregated[email]["time_taken_seconds"] += doc.get("time_taken_seconds", 0)
            aggregated[email]["quiz_count"] += 1

        # Sort by score descending
        sorted_entries = sorted(aggregated.values(), key=lambda x: x["score"], reverse=True)

        entries = []
        for idx, entry in enumerate(sorted_entries[:limit], start=1):
            entries.append({
                "rank": idx,
                **entry,
            })

        return {
            "entries": entries,
            "total": len(sorted_entries),
            "scope": scope,
            "filter_value": filter_value,
        }

    except Exception as e:
        logger.error(f"Error getting public leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
