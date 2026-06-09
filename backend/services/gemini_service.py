"""
Gemini AI Service
Handles all interactions with Google Gemini API
"""
import google.generativeai as genai
from typing import Generator, Optional, Dict, Any
import logging
from config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini API with credentials"""
        api_key = settings.GEMINI_API_KEY
        model_name = settings.GEMINI_MODEL
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        
        # System prompt for La Presi
        self.system_prompt = """You are "La Presi", an intelligent AI assistant for Sinod event management platform by Lexrunit.

Your role is to help users with:
- Event planning (agenda, budgets, venue suggestions, logistics)
- Content creation (invitations, emails, announcements, summaries)
- Scheduling and calendar management
- Document collaboration and editing suggestions
- Post-event analysis and insights
- Team coordination and task management

Be proactive, friendly, professional, and concise. When given context about events, documents, or tasks, use it to provide specific, actionable advice. Always prioritize the user's goals and constraints."""

    def chat(
        self, 
        user_message: str, 
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[list] = None
    ) -> str:
        """
        Send a message to Gemini and get a response
        
        Args:
            user_message: The user's message
            context: Optional context (events, docs, tasks)
            conversation_history: Previous messages for context
            
        Returns:
            AI response as string
        """
        try:
            # Build full prompt with context
            full_prompt = self._build_prompt(user_message, context, conversation_history)
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error in Gemini chat: {e}")
            raise

    def stream_chat(
        self, 
        user_message: str, 
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[list] = None
    ) -> Generator[str, None, None]:
        """
        Stream a response from Gemini
        
        Args:
            user_message: The user's message
            context: Optional context (events, docs, tasks)
            conversation_history: Previous messages for context
            
        Yields:
            Chunks of AI response
        """
        try:
            # Build full prompt with context
            full_prompt = self._build_prompt(user_message, context, conversation_history)
            
            # Stream response
            response = self.model.generate_content(full_prompt, stream=True)
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Error in Gemini streaming: {e}")
            raise

    def _build_prompt(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]],
        conversation_history: Optional[list]
    ) -> str:
        """Build the complete prompt with system prompt, context, and history"""
        parts = [self.system_prompt]
        
        # Add context if provided
        if context:
            context_str = self._format_context(context)
            if context_str:
                parts.append(f"\n\n=== USER CONTEXT ===\n{context_str}")
        
        # Add conversation history
        if conversation_history:
            history_str = "\n".join([
                f"{msg['role']}: {msg.get('parts', [''])[0] if isinstance(msg.get('parts'), list) else msg.get('content', '')}" 
                for msg in conversation_history[-10:]  # Last 10 messages
            ])
            parts.append(f"\n\n=== CONVERSATION HISTORY ===\n{history_str}")
        
        # Add current message
        parts.append(f"\n\nUser: {user_message}")
        
        return "\n".join(parts)

    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context data into a readable string"""
        formatted_parts = []
        
        # Events context
        if context.get('events'):
            events = context['events']
            formatted_parts.append(f"EVENTS ({len(events)} total):")
            for event in events[:5]:  # Limit to 5 events
                formatted_parts.append(
                    f"- {event.get('title', 'Untitled')} "
                    f"({event.get('startDate', 'No date')}) "
                    f"- {event.get('description', 'No description')[:100]}"
                )
        
        # Documents context
        if context.get('documents'):
            docs = context['documents']
            formatted_parts.append(f"\nDOCUMENTS ({len(docs)} total):")
            for doc in docs[:3]:  # Limit to 3 docs
                formatted_parts.append(
                    f"- {doc.get('title', 'Untitled')}: "
                    f"{doc.get('content', 'No content')[:200]}"
                )
        
        # Tasks context
        if context.get('tasks'):
            tasks = context['tasks']
            formatted_parts.append(f"\nTASKS ({len(tasks)} total):")
            for task in tasks[:5]:
                formatted_parts.append(
                    f"- {task.get('title', 'Untitled')} "
                    f"[{task.get('status', 'unknown')}]"
                )
        
        # User profile
        if context.get('user'):
            user = context['user']
            formatted_parts.append(
                f"\nUSER: {user.get('name', 'Unknown')} "
                f"({user.get('email', 'no email')})"
            )
        
        return "\n".join(formatted_parts)


# Singleton instance
_gemini_service = None

def get_gemini_service() -> GeminiService:
    """Get or create the Gemini service singleton"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
