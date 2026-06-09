"""
AI Routes
Handles AI chat and assistance endpoints
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import json
import asyncio
from services.gemini_service import get_gemini_service
from services.context_service import get_context_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI"])

# ============================================================================
# Request/Response Models
# ============================================================================

class ChatRequest(BaseModel):
    """Request model for AI chat"""
    user_email: EmailStr
    user_name: str
    message: str
    conversation_id: Optional[str] = None
    include_events: bool = True
    include_documents: bool = False
    include_tasks: bool = False
    event_ids: Optional[List[str]] = None
    document_ids: Optional[List[str]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    """Response model for AI chat"""
    response: str
    conversation_id: str


class ContextRequest(BaseModel):
    """Request model for context aggregation"""
    user_email: EmailStr
    include_events: bool = True
    include_documents: bool = False
    include_tasks: bool = False
    event_ids: Optional[List[str]] = None
    document_ids: Optional[List[str]] = None


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message to La Presi AI and get a response
    """
    try:
        # Get services
        gemini = get_gemini_service()
        context_service = get_context_service()
        
        # Get user context
        context = await context_service.get_user_context(
            user_email=request.user_email,
            include_events=request.include_events,
            include_documents=request.include_documents,
            include_tasks=request.include_tasks,
            event_ids=request.event_ids,
            document_ids=request.document_ids
        )
        
        # Add user info to context
        context['user'] = {
            'email': request.user_email,
            'name': request.user_name
        }
        
        # Get AI response
        response = gemini.chat(
            user_message=request.message,
            context=context,
            conversation_history=request.conversation_history
        )
        
        return ChatResponse(
            response=response,
            conversation_id=request.conversation_id or "new"
        )
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream AI responses in real-time with conversation history
    """
    async def generate():
        try:
            # Get services
            gemini = get_gemini_service()
            context_service = get_context_service()
            
            # Fetch conversation history from database
            conversation_history = []
            if request.conversation_id:
                from appwrite.client import Client
                from appwrite.services.databases import Databases
                from appwrite.query import Query
                from config import settings
                import concurrent.futures
                
                # Setup Appwrite client
                client = Client()
                client.set_endpoint(settings.APPWRITE_ENDPOINT)
                client.set_project(settings.APPWRITE_PROJECT_ID)
                client.set_key(settings.APPWRITE_API_KEY)
                databases = Databases(client)
                
                # Fetch last 20 messages from conversation (in thread to avoid blocking)
                def fetch_messages():
                    try:
                        result = databases.list_documents(
                            database_id=settings.APPWRITE_DATABASE_ID,
                            collection_id=settings.APPWRITE_MESSAGES_COLLECTION_ID,
                            queries=[
                                Query.equal('conversationId', request.conversation_id),
                                Query.order_desc('$createdAt'),
                                Query.limit(20)
                            ]
                        )
                        # Support both old ('documents') and new ('rows') Appwrite response format
                        return result.get('documents', result.get('rows', []))
                    except Exception as e:
                        logger.error(f"Error fetching messages: {e}")
                        return []
                
                loop = asyncio.get_event_loop()
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    messages = await loop.run_in_executor(executor, fetch_messages)
                
                # Build history in chronological order (oldest first)
                for msg in reversed(messages):
                    try:
                        role = "model" if msg.get('senderId') == 'ai@lapresi.sinod' else "user"
                        content = msg.get('content', '')
                        if not content:
                            logger.warning(f"Message {msg.get('$id')} has no content. Available keys: {list(msg.keys())}")
                            continue
                        conversation_history.append({
                            "role": role,
                            "parts": [content]
                        })
                    except Exception as e:
                        logger.error(f"Error processing message {msg.get('$id', 'unknown')}: {e}")
                        logger.error(f"Message data: {msg}")
                        continue
            
            # Get user context
            context = await context_service.get_user_context(
                user_email=request.user_email,
                include_events=request.include_events,
                include_documents=request.include_documents,
                include_tasks=request.include_tasks,
                event_ids=request.event_ids,
                document_ids=request.document_ids
            )
            
            # Add user info to context
            context['user'] = {
                'email': request.user_email,
                'name': request.user_name
            }
            
            # Stream AI response with history
            for chunk in gemini.stream_chat(
                user_message=request.message,
                context=context,
                conversation_history=conversation_history
            ):
                # Send as JSON chunks
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                await asyncio.sleep(0.01)  # Small delay for smooth streaming
            
            # Send completion signal
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/context")
async def get_context(request: ContextRequest) -> Dict[str, Any]:
    """
    Get aggregated context for AI assistance
    """
    try:
        context_service = get_context_service()
        
        context = await context_service.get_user_context(
            user_email=request.user_email,
            include_events=request.include_events,
            include_documents=request.include_documents,
            include_tasks=request.include_tasks,
            event_ids=request.event_ids,
            document_ids=request.document_ids
        )
        
        return context
        
    except Exception as e:
        logger.error(f"Error getting context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check if AI service is healthy"""
    try:
        gemini = get_gemini_service()
        return {
            "status": "healthy",
            "service": "La Presi AI",
            "model": "gemini-2.0-flash-lite"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="AI service unavailable")
