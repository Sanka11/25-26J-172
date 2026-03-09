"""
backend/functions/chat_routes.py
Main chat endpoint with response mode integration
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
import logging

from firebase import get_user_from_token, auth_required
from app.rag import answer_question
from app.services.firestore_service import FirestoreService
from app.services.chat_history_service import ChatHistoryService
from app.services.personalization_service import PersonalizationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

# Initialize services
firestore_service = FirestoreService()
chat_history_service = ChatHistoryService()
personalization_service = PersonalizationService()


class UserPreferences(BaseModel):
    """User preferences for response formatting"""
    theme: Optional[str] = "system"
    responseLength: Optional[str] = "balanced"


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    question: str
    responseMode: Optional[str] = "hybrid"  # "document", "web", or "hybrid"
    userId: str
    userPreferences: Optional[UserPreferences] = None
    conversationId: Optional[str] = None
    context: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    answer: str
    answer_source: str  # "document", "web_search", or "hybrid"
    sources: Optional[List[Dict[str, Any]]] = None
    web_sources: Optional[List[Dict[str, Any]]] = None
    responseTime: float
    reminders: Optional[List[Dict[str, str]]] = None
    confidence: Optional[float] = None


@router.post("/chat", response_model=ChatResponse)
@auth_required
async def chat_endpoint(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Main chat endpoint with response mode support
    
    Args:
        chat_request: Chat request with question and mode
        current_user: Authenticated user from token
        
    Returns:
        ChatResponse: Answer with metadata
        
    Raises:
        HTTPException: If chat fails
    """
    import time
    start_time = time.time()
    
    # Verify user is sending their own request
    if current_user['uid'] != chat_request.userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot process chat for other users"
        )

    try:
        # Get user profile for personalization
        user_profile = personalization_service.get_user_profile(chat_request.userId)
        
        # Build personalized context
        personalization_context = personalization_service.build_personalization_context(
            user_profile,
            chat_request.context
        )
        
        # Call RAG with response mode
        logger.info(f"Processing chat request - Mode: {chat_request.responseMode}, User: {chat_request.userId}")
        
        result = answer_question(
            question=chat_request.question,
            user_id=chat_request.userId,
            response_mode=chat_request.responseMode,  # Pass the selected mode
            personalization_context=personalization_context,
            response_length=chat_request.userPreferences.responseLength if chat_request.userPreferences else "balanced"
        )
        
        # Extract response details
        answer = result.get('answer', '')
        answer_source = result.get('answer_source', 'document')
        sources = result.get('sources', [])
        web_sources = result.get('web_sources', [])
        confidence = result.get('confidence', 0.0)
        
        # Get academic reminders if applicable
        reminders = []
        if chat_request.userPreferences and not chat_request.userPreferences.theme == "dark":
            reminders = personalization_service.get_academic_reminders(
                user_id=chat_request.userId,
                topic=chat_request.question
            )
        
        # Save conversation to history
        conversation_message = {
            "userId": chat_request.userId,
            "conversationId": chat_request.conversationId,
            "question": chat_request.question,
            "answer": answer,
            "answer_source": answer_source,
            "response_mode": chat_request.responseMode,
            "sources": sources,
            "web_sources": web_sources,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat(),
            "userProfile": user_profile.get('id', 'unknown'),
            "responseTime": time.time() - start_time
        }
        
        await chat_history_service.save_message(conversation_message)
        
        # Log successful completion
        logger.info(f"Chat completed successfully - Source: {answer_source}, Time: {time.time() - start_time:.2f}s")
        
        return ChatResponse(
            answer=answer,
            answer_source=answer_source,
            sources=sources,
            web_sources=web_sources,
            responseTime=time.time() - start_time,
            reminders=reminders,
            confidence=confidence
        )
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat request: {str(e)}"
        )


@router.post("/chat/batch")
@auth_required
async def chat_batch_endpoint(
    requests: List[ChatRequest],
    current_user: dict = Depends(get_user_from_token)
):
    """
    Batch chat endpoint for multiple questions
    
    Args:
        requests: List of chat requests
        current_user: Authenticated user from token
        
    Returns:
        List[ChatResponse]: List of responses
    """
    results = []
    
    for req in requests:
        # Verify user ownership
        if current_user['uid'] != req.userId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot process chat for other users"
            )
        
        # Process each request
        response = await chat_endpoint(req, current_user)
        results.append(response)
    
    return results


@router.get("/chat/conversation/{conversation_id}")
@auth_required
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Retrieve a specific conversation
    
    Args:
        conversation_id: The conversation ID
        current_user: Authenticated user from token
        
    Returns:
        dict: Conversation with all messages
    """
    try:
        conversation = chat_history_service.get_conversation(conversation_id)
        
        # Verify ownership
        if conversation.get('userId') != current_user['uid']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access other user's conversations"
            )
        
        return conversation
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversation: {str(e)}"
        )


@router.get("/chat/recent")
@auth_required
async def get_recent_chats(
    limit: int = 10,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Get recent chat conversations for user
    
    Args:
        limit: Maximum number of conversations to return
        current_user: Authenticated user from token
        
    Returns:
        List[dict]: Recent conversations
    """
    try:
        conversations = chat_history_service.get_recent_conversations(
            current_user['uid'],
            limit=limit
        )
        return conversations
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving recent chats: {str(e)}"
        )


@router.get("/chat/search")
@auth_required
async def search_chats(
    query: str,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Search through user's chat history
    
    Args:
        query: Search query
        current_user: Authenticated user from token
        
    Returns:
        List[dict]: Matching conversations
    """
    try:
        results = chat_history_service.search_conversations(
            current_user['uid'],
            query
        )
        return results
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching chats: {str(e)}"
        )
