"""
backend/functions/app/services/chat_history_service.py
Chat history management service for storing and retrieving conversations
"""

import firebase_admin
from firebase_admin import firestore
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any, Optional
from collections import Counter

logger = logging.getLogger(__name__)


class ChatHistoryService:
    """Service for managing chat history"""
    
    def __init__(self):
        """Initialize chat history service"""
        try:
            self.db = firestore.client()
            self.history_collection = 'chat_history'
            self.message_retention_days = 90  # Default retention period
            logger.info("ChatHistoryService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ChatHistoryService: {e}")
            raise
    
    async def save_message(self, message: Dict[str, Any]) -> str:
        """
        Save a chat message to history
        
        Args:
            message: Message dictionary containing:
                - userId: User ID
                - question: User's question
                - answer: Bot's answer
                - answer_source: Source of answer (document/web_search/hybrid)
                - responseMode: Response mode used
                - confidence: Confidence score
                - timestamp: Message timestamp
                - conversationId: Optional conversation ID
                
        Returns:
            str: Document ID of saved message
        """
        try:
            # Prepare message data
            message_data = {
                'userId': message.get('userId'),
                'question': message.get('question'),
                'answer': message.get('answer'),
                'answer_source': message.get('answer_source', 'document'),
                'responseMode': message.get('responseMode', 'hybrid'),
                'sources': message.get('sources', []),
                'web_sources': message.get('web_sources', []),
                'confidence': message.get('confidence', 0.0),
                'responseTime': message.get('responseTime', 0),
                'userProfile': message.get('userProfile', 'unknown'),
                'timestamp': message.get('timestamp', datetime.now().isoformat()),
                'conversationId': message.get('conversationId'),
                'ttl': (datetime.now() + timedelta(days=self.message_retention_days)).isoformat()
            }
            
            # Save to Firestore
            user_id = message_data['userId']
            doc_ref = self.db.collection(self.history_collection).document(user_id).collection('messages').add(
                message_data
            )
            
            logger.info(f"Message saved for user {user_id} with ID {doc_ref[1].id}")
            return doc_ref[1].id
        
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise
    
    def get_user_chat_history(self, user_id: str, limit: Optional[int] = None) -> List[Dict]:
        """
        Get all chat history for user
        
        Args:
            user_id: The user's ID
            limit: Maximum number of messages to return
            
        Returns:
            list: List of messages ordered by timestamp (newest first)
        """
        try:
            query = self.db.collection(self.history_collection).document(user_id).collection('messages')
            
            # Order by timestamp descending
            query = query.order_by('timestamp', direction=firestore.Query.DESCENDING)
            
            if limit:
                query = query.limit(limit)
            
            docs = query.stream()
            
            messages = []
            for doc in docs:
                msg = doc.to_dict()
                msg['id'] = doc.id
                messages.append(msg)
            
            logger.info(f"Retrieved {len(messages)} messages for user {user_id}")
            return messages
        
        except Exception as e:
            logger.error(f"Error retrieving chat history for user {user_id}: {e}")
            raise
    
    def get_recent_conversations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """
        Get recent conversations (grouped by conversation ID)
        
        Args:
            user_id: The user's ID
            limit: Maximum number of conversations
            
        Returns:
            list: List of recent conversation messages
        """
        try:
            messages = self.get_user_chat_history(user_id, limit=limit * 10)
            
            # Group by conversation ID
            conversations = {}
            for msg in messages:
                conv_id = msg.get('conversationId', 'default')
                if conv_id not in conversations:
                    conversations[conv_id] = []
                conversations[conv_id].append(msg)
            
            # Return most recent conversations
            recent = list(conversations.values())[:limit]
            logger.info(f"Retrieved {len(recent)} recent conversations for user {user_id}")
            return recent
        
        except Exception as e:
            logger.error(f"Error retrieving recent conversations for user {user_id}: {e}")
            raise
    
    def get_conversation(self, conversation_id: str, user_id: str) -> Optional[Dict]:
        """
        Get specific conversation by ID
        
        Args:
            conversation_id: The conversation ID
            user_id: The user's ID (for authorization)
            
        Returns:
            dict: Conversation data or None if not found
        """
        try:
            messages = self.get_user_chat_history(user_id)
            
            # Filter by conversation ID
            conversation_messages = [
                msg for msg in messages 
                if msg.get('conversationId') == conversation_id
            ]
            
            if not conversation_messages:
                logger.warning(f"Conversation {conversation_id} not found for user {user_id}")
                return None
            
            return {
                'id': conversation_id,
                'userId': user_id,
                'messages': conversation_messages,
                'messageCount': len(conversation_messages),
                'startTime': conversation_messages[-1].get('timestamp'),  # First message
                'lastUpdate': conversation_messages[0].get('timestamp'),  # Last message
            }
        
        except Exception as e:
            logger.error(f"Error retrieving conversation {conversation_id}: {e}")
            raise
    
    def delete_user_chat_history(self, user_id: str) -> int:
        """
        Delete all chat history for user
        
        Args:
            user_id: The user's ID
            
        Returns:
            int: Number of messages deleted
        """
        try:
            messages_ref = self.db.collection(self.history_collection).document(user_id).collection('messages')
            docs = messages_ref.stream()
            
            count = 0
            batch = self.db.batch()
            
            for doc in docs:
                batch.delete(doc.reference)
                count += 1
                
                # Commit in batches of 500 (Firestore limit)
                if count % 500 == 0:
                    batch.commit()
                    batch = self.db.batch()
            
            # Final commit
            if count % 500 != 0:
                batch.commit()
            
            logger.info(f"Deleted {count} messages for user {user_id}")
            return count
        
        except Exception as e:
            logger.error(f"Error deleting chat history for user {user_id}: {e}")
            raise
    
    def delete_message(self, user_id: str, message_id: str) -> bool:
        """
        Delete a specific message
        
        Args:
            user_id: The user's ID
            message_id: The message ID to delete
            
        Returns:
            bool: True if successful
        """
        try:
            self.db.collection(self.history_collection).document(user_id).collection('messages').document(
                message_id
            ).delete()
            
            logger.info(f"Deleted message {message_id} for user {user_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error deleting message {message_id}: {e}")
            raise
    
    def search_conversations(self, user_id: str, query_text: str) -> List[Dict]:
        """
        Search through user's chat history
        
        Args:
            user_id: The user's ID
            query_text: Search query text
            
        Returns:
            list: Messages matching search query
        """
        try:
            messages = self.get_user_chat_history(user_id, limit=1000)
            
            query_lower = query_text.lower()
            results = []
            
            for msg in messages:
                # Search in question and answer
                if (query_lower in msg.get('question', '').lower() or 
                    query_lower in msg.get('answer', '').lower()):
                    results.append(msg)
            
            logger.info(f"Found {len(results)} messages matching '{query_text}' for user {user_id}")
            return results
        
        except Exception as e:
            logger.error(f"Error searching conversations for user {user_id}: {e}")
            raise
    
    def get_chat_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Get chat statistics for user
        
        Args:
            user_id: The user's ID
            
        Returns:
            dict: Statistics including message count, avg response time, top topics
        """
        try:
            messages = self.get_user_chat_history(user_id, limit=1000)
            
            if not messages:
                return {
                    'total_messages': 0,
                    'total_conversations': 0,
                    'avg_response_time': 0,
                    'last_activity': None,
                    'joined_date': None,
                    'top_topics': [],
                    'average_confidence': 0,
                    'message_sources': {}
                }
            
            # Calculate statistics
            total_messages = len(messages)
            avg_response_time = sum(m.get('responseTime', 0) for m in messages) / total_messages if messages else 0
            total_conversations = len(set(m.get('conversationId') for m in messages))
            
            # Get source distribution
            source_counts = Counter(m.get('answer_source', 'unknown') for m in messages)
            sources = {source: count for source, count in source_counts.items()}
            
            # Extract top topics from questions
            top_topics = self._extract_top_topics([m.get('question', '') for m in messages], limit=5)
            
            # Get average confidence
            avg_confidence = sum(m.get('confidence', 0) for m in messages) / total_messages if messages else 0
            
            stats = {
                'total_messages': total_messages,
                'total_conversations': total_conversations,
                'avg_response_time': round(avg_response_time, 2),
                'avg_confidence': round(avg_confidence, 2),
                'last_activity': messages[0].get('timestamp'),  # Newest message
                'joined_date': messages[-1].get('timestamp'),   # Oldest message
                'top_topics': top_topics,
                'message_sources': sources
            }
            
            logger.info(f"Generated statistics for user {user_id}: {total_messages} messages")
            return stats
        
        except Exception as e:
            logger.error(f"Error calculating statistics for user {user_id}: {e}")
            raise
    
    def _extract_top_topics(self, questions: List[str], limit: int = 5) -> List[str]:
        """
        Extract most common topics/keywords from questions
        
        Args:
            questions: List of question strings
            limit: Maximum number of topics to return
            
        Returns:
            list: Top topics/keywords
        """
        stop_words = {
            'what', 'when', 'where', 'how', 'why', 'is', 'the', 'a', 'an', 
            'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
        }
        
        keywords = []
        for question in questions:
            words = question.lower().split()
            # Filter out stop words and short words
            filtered = [w for w in words if w not in stop_words and len(w) > 3]
            keywords.extend(filtered)
        
        if not keywords:
            return []
        
        # Get most common keywords
        common = Counter(keywords).most_common(limit)
        return [word for word, count in common]
    
    def export_chat_history(self, user_id: str) -> Dict[str, Any]:
        """
        Export complete chat history for user
        
        Args:
            user_id: The user's ID
            
        Returns:
            dict: Exportable chat history data
        """
        try:
            messages = self.get_user_chat_history(user_id)
            
            export_data = {
                'userId': user_id,
                'exportDate': datetime.now().isoformat(),
                'totalMessages': len(messages),
                'messages': messages
            }
            
            logger.info(f"Prepared export of {len(messages)} messages for user {user_id}")
            return export_data
        
        except Exception as e:
            logger.error(f"Error exporting chat history for user {user_id}: {e}")
            raise
    
    def cleanup_expired_messages(self) -> int:
        """
        Clean up messages past retention period (admin operation)
        
        Returns:
            int: Number of messages deleted
        """
        try:
            expiration_date = datetime.now() - timedelta(days=self.message_retention_days)
            count = 0
            
            # Note: This requires a scheduled task
            logger.info(f"Cleanup would remove messages before {expiration_date}")
            return count
        
        except Exception as e:
            logger.error(f"Error in cleanup operation: {e}")
            raise
