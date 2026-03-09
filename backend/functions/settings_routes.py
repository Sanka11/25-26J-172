"""
backend/functions/settings_routes.py
FastAPI routes for user settings management
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
from firebase import get_user_from_token, auth_required
from app.services.firestore_service import FirestoreService
from app.services.chat_history_service import ChatHistoryService

router = APIRouter(prefix="/api/settings", tags=["settings"])

# Initialize services
firestore_service = FirestoreService()
chat_history_service = ChatHistoryService()


# Pydantic models
class ResponseModeChange(BaseModel):
    """Model for changing response mode"""
    mode: str  # "document", "web", or "hybrid"


class NotificationPreferences(BaseModel):
    """Model for notification preferences"""
    examReminders: bool = True
    attendanceWarnings: bool = True
    assignmentDeadlines: bool = True
    paymentNotifications: bool = True


class AppearancePreferences(BaseModel):
    """Model for appearance preferences"""
    theme: str  # "light", "dark", or "system"
    responseLength: str  # "brief", "balanced", or "detailed"


class UserSettings(BaseModel):
    """Complete user settings model"""
    userId: str
    responseMode: str
    notifications: NotificationPreferences
    appearance: AppearancePreferences
    dataPrivacy: bool
    lastUpdated: str
    createdAt: str


class ChatHistoryExport(BaseModel):
    """Model for exported chat history"""
    userId: str
    exportDate: str
    totalMessages: int
    conversations: List[Dict[str, Any]]


@router.get("/{user_id}", response_model=UserSettings)
@auth_required
async def get_user_settings(user_id: str, current_user: dict = Depends(get_user_from_token)):
    """
    Retrieve user settings from Firestore
    
    Args:
        user_id: The user ID
        current_user: Authenticated user from token
        
    Returns:
        UserSettings: Complete user settings object
        
    Raises:
        HTTPException: If settings not found or unauthorized
    """
    # Verify user is accessing their own settings
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's settings"
        )

    try:
        settings = firestore_service.get_user_settings(user_id)
        
        if not settings:
            # Return default settings if none exist
            return UserSettings(
                userId=user_id,
                responseMode="hybrid",
                notifications=NotificationPreferences(),
                appearance=AppearancePreferences(theme="system", responseLength="balanced"),
                dataPrivacy=True,
                lastUpdated=datetime.now().isoformat(),
                createdAt=datetime.now().isoformat(),
            )
        
        return UserSettings(**settings)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving settings: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserSettings)
@auth_required
async def update_user_settings(
    user_id: str,
    settings: UserSettings,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Update user settings in Firestore
    
    Args:
        user_id: The user ID
        settings: Updated settings object
        current_user: Authenticated user from token
        
    Returns:
        UserSettings: Updated settings object
        
    Raises:
        HTTPException: If update fails or unauthorized
    """
    # Verify user is updating their own settings
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's settings"
        )

    try:
        # Update last modified timestamp
        settings.lastUpdated = datetime.now().isoformat()
        
        # Save to Firestore
        firestore_service.update_user_settings(user_id, settings.dict())
        
        return settings
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating settings: {str(e)}"
        )


@router.post("/{user_id}/mode", response_model=ResponseModeChange)
@auth_required
async def change_response_mode(
    user_id: str,
    mode_change: ResponseModeChange,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Change response mode for user
    
    Args:
        user_id: The user ID
        mode_change: New response mode
        current_user: Authenticated user from token
        
    Returns:
        ResponseModeChange: Confirmation of mode change
        
    Raises:
        HTTPException: If mode is invalid or update fails
    """
    # Verify user is updating their own settings
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's settings"
        )

    # Validate mode
    valid_modes = ["document", "web", "hybrid"]
    if mode_change.mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid mode. Must be one of: {', '.join(valid_modes)}"
        )

    try:
        # Get current settings
        current_settings = firestore_service.get_user_settings(user_id)
        
        # Update response mode
        current_settings['responseMode'] = mode_change.mode
        current_settings['lastUpdated'] = datetime.now().isoformat()
        
        # Save to Firestore
        firestore_service.update_user_settings(user_id, current_settings)
        
        return mode_change
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error changing response mode: {str(e)}"
        )


@router.get("/{user_id}/notifications", response_model=NotificationPreferences)
@auth_required
async def get_notification_preferences(
    user_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Get user's notification preferences
    
    Args:
        user_id: The user ID
        current_user: Authenticated user from token
        
    Returns:
        NotificationPreferences: User's notification settings
    """
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's settings"
        )

    try:
        settings = firestore_service.get_user_settings(user_id)
        
        if settings and 'notifications' in settings:
            return NotificationPreferences(**settings['notifications'])
        
        return NotificationPreferences()
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving notification preferences: {str(e)}"
        )


@router.put("/{user_id}/notifications", response_model=NotificationPreferences)
@auth_required
async def update_notification_preferences(
    user_id: str,
    preferences: NotificationPreferences,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Update user's notification preferences
    
    Args:
        user_id: The user ID
        preferences: Updated notification preferences
        current_user: Authenticated user from token
        
    Returns:
        NotificationPreferences: Updated notification settings
    """
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's settings"
        )

    try:
        # Get current settings
        current_settings = firestore_service.get_user_settings(user_id)
        
        # Update notifications
        current_settings['notifications'] = preferences.dict()
        current_settings['lastUpdated'] = datetime.now().isoformat()
        
        # Save to Firestore
        firestore_service.update_user_settings(user_id, current_settings)
        
        return preferences
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating notification preferences: {str(e)}"
        )


@router.get("/{user_id}/appearance", response_model=AppearancePreferences)
@auth_required
async def get_appearance_preferences(
    user_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Get user's appearance preferences
    
    Args:
        user_id: The user ID
        current_user: Authenticated user from token
        
    Returns:
        AppearancePreferences: User's appearance settings
    """
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's settings"
        )

    try:
        settings = firestore_service.get_user_settings(user_id)
        
        if settings and 'appearance' in settings:
            return AppearancePreferences(**settings['appearance'])
        
        return AppearancePreferences(theme="system", responseLength="balanced")
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving appearance preferences: {str(e)}"
        )


@router.put("/{user_id}/appearance", response_model=AppearancePreferences)
@auth_required
async def update_appearance_preferences(
    user_id: str,
    preferences: AppearancePreferences,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Update user's appearance preferences
    
    Args:
        user_id: The user ID
        preferences: Updated appearance preferences
        current_user: Authenticated user from token
        
    Returns:
        AppearancePreferences: Updated appearance settings
    """
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's settings"
        )

    try:
        # Get current settings
        current_settings = firestore_service.get_user_settings(user_id)
        
        # Update appearance
        current_settings['appearance'] = preferences.dict()
        current_settings['lastUpdated'] = datetime.now().isoformat()
        
        # Save to Firestore
        firestore_service.update_user_settings(user_id, current_settings)
        
        return preferences
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating appearance preferences: {str(e)}"
        )


# Chat History Routes

@router.get("/{user_id}/chat-history/export", response_model=ChatHistoryExport)
@auth_required
async def export_chat_history(
    user_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Export user's complete chat history as JSON
    
    Args:
        user_id: The user ID
        current_user: Authenticated user from token
        
    Returns:
        ChatHistoryExport: Exported chat history data
        
    Raises:
        HTTPException: If export fails or unauthorized
    """
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot export other user's chat history"
        )

    try:
        conversations = chat_history_service.get_user_chat_history(user_id)
        
        return ChatHistoryExport(
            userId=user_id,
            exportDate=datetime.now().isoformat(),
            totalMessages=len(conversations),
            conversations=conversations
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting chat history: {str(e)}"
        )


@router.delete("/{user_id}/chat-history")
@auth_required
async def delete_chat_history(
    user_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Delete all chat history for user
    
    Args:
        user_id: The user ID
        current_user: Authenticated user from token
        
    Returns:
        dict: Confirmation of deletion
        
    Raises:
        HTTPException: If deletion fails or unauthorized
    """
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete other user's chat history"
        )

    try:
        deleted_count = chat_history_service.delete_user_chat_history(user_id)
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} messages",
            "deletedAt": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting chat history: {str(e)}"
        )


@router.get("/{user_id}/chat-history/stats")
@auth_required
async def get_chat_statistics(
    user_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Get chat statistics for user
    
    Args:
        user_id: The user ID
        current_user: Authenticated user from token
        
    Returns:
        dict: Chat statistics and summary
    """
    if current_user['uid'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's statistics"
        )

    try:
        statistics = chat_history_service.get_chat_statistics(user_id)
        
        return {
            "userId": user_id,
            "totalMessages": statistics.get('total_messages', 0),
            "totalConversations": statistics.get('total_conversations', 0),
            "averageResponseTime": statistics.get('avg_response_time', 0),
            "topTopics": statistics.get('top_topics', []),
            "lastActivity": statistics.get('last_activity'),
            "joinedDate": statistics.get('joined_date'),
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving chat statistics: {str(e)}"
        )
