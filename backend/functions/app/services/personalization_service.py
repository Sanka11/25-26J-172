"""
backend/functions/app/services/personalization_service.py
Personalization service for user context and recommendation
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class PersonalizationService:
    """Service for personalizing responses based on user profile"""
    
    def __init__(self):
        """Initialize personalization service"""
        logger.info("PersonalizationService initialized")
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get user profile data
        
        Note: In production, this would fetch from Firestore.
        For now, it returns a template structure.
        
        Args:
            user_id: The user's ID
            
        Returns:
            dict: User profile data
        """
        return {
            'id': user_id,
            'displayName': 'Student',
            'academicLevel': 'undergraduate',
            'modules': [],
            'interests': [],
            'previousQuestions': [],
            'learningStyle': 'balanced'
        }
    
    def build_personalization_context(
        self, 
        user_profile: Dict[str, Any], 
        context: Optional[str] = None
    ) -> str:
        """
        Build personalized context for LLM
        
        Args:
            user_profile: User profile dictionary
            context: Additional context string
            
        Returns:
            str: Personalization context for LLM prompt
        """
        try:
            # Build base context
            academic_level = user_profile.get('academicLevel', 'student').lower()
            context_str = f"The user is an {academic_level} student"
            
            # Add modules if available
            modules = user_profile.get('modules', [])
            if modules:
                modules_str = ', '.join(modules[:3])
                context_str += f" studying {modules_str}"
                
                if len(modules) > 3:
                    context_str += f" and {len(modules) - 3} other modules"
            
            # Add learning style preference
            learning_style = user_profile.get('learningStyle', 'balanced')
            if learning_style == 'visual':
                context_str += ". The user prefers visual explanations with diagrams and examples"
            elif learning_style == 'analytical':
                context_str += ". The user prefers detailed, analytical explanations"
            elif learning_style == 'practical':
                context_str += ". The user prefers practical examples and applications"
            
            # Add additional context if provided
            if context:
                context_str += f". {context}"
            
            logger.debug(f"Built personalization context for user {user_profile.get('id')}")
            return context_str
        
        except Exception as e:
            logger.error(f"Error building personalization context: {e}")
            return "The user is a student"
    
    def get_academic_reminders(
        self, 
        user_id: str, 
        topic: str
    ) -> List[Dict[str, str]]:
        """
        Get relevant academic reminders based on query topic
        
        Args:
            user_id: The user's ID
            topic: The search topic
            
        Returns:
            list: List of reminders with type and message
        """
        try:
            reminders = []
            topic_lower = topic.lower()
            
            # Exam-related reminders
            if any(word in topic_lower for word in ['exam', 'test', 'assessment', 'final', 'midterm']):
                reminders.append({
                    'type': 'exam',
                    'message': '📚 Tip: Check your exam schedule and start studying early. Visit the Examination Office portal for details.',
                    'priority': 'high'
                })
                reminders.append({
                    'type': 'exam',
                    'message': '⏰ Reminder: Exams require proper time management. Create a study schedule today.',
                    'priority': 'medium'
                })
            
            # Assignment-related reminders
            if any(word in topic_lower for word in ['assignment', 'submission', 'deadline', 'project', 'coursework']):
                reminders.append({
                    'type': 'assignment',
                    'message': '📝 Deadline Alert: Check the assignment portal for submission deadlines and requirements.',
                    'priority': 'high'
                })
                reminders.append({
                    'type': 'assignment',
                    'message': '✓ Pro Tip: Submit your work early to avoid last-minute technical issues.',
                    'priority': 'medium'
                })
            
            # Attendance-related reminders
            if any(word in topic_lower for word in ['attendance', 'class', 'lecture', 'tutorial', 'practical', 'session']):
                reminders.append({
                    'type': 'attendance',
                    'message': '📍 Remember: Regular attendance is crucial for your academic success and may impact your grades.',
                    'priority': 'high'
                })
                reminders.append({
                    'type': 'attendance',
                    'message': '📅 Check your timetable for upcoming lectures and mark them on your calendar.',
                    'priority': 'medium'
                })
            
            # Academic integrity reminders
            if any(word in topic_lower for word in ['plagiarism', 'academic integrity', 'cheating', 'ethics', 'referencing']):
                reminders.append({
                    'type': 'integrity',
                    'message': '⚖️ Academic Integrity: Always cite your sources properly. Plagiarism has serious consequences.',
                    'priority': 'high'
                })
            
            # Module registration/change reminders
            if any(word in topic_lower for word in ['register', 'enroll', 'module', 'course', 'add', 'drop']):
                reminders.append({
                    'type': 'admin',
                    'message': '🗂️ Module Registration: Check the registration deadline and ensure all your modules are confirmed.',
                    'priority': 'high'
                })
            
            # Payment/fee reminders
            if any(word in topic_lower for word in ['payment', 'fee', 'tuition', 'bill', 'invoice', 'payment plan']):
                reminders.append({
                    'type': 'payment',
                    'message': '💳 Payment Reminder: Ensure your fees are paid on time to maintain your enrollment status.',
                    'priority': 'high'
                })
                reminders.append({
                    'type': 'payment',
                    'message': '📊 Check if you qualify for financial aid or fee reductions.',
                    'priority': 'medium'
                })
            
            # General academic support
            if len(reminders) == 0:
                reminders.append({
                    'type': 'general',
                    'message': '💡 Academic Success: Utilize university resources like tutoring, writing centers, and counseling services.',
                    'priority': 'low'
                })
            
            logger.info(f"Generated {len(reminders)} reminders for user {user_id} on topic: {topic}")
            return reminders[:3]  # Return top 3 reminders
        
        except Exception as e:
            logger.error(f"Error generating reminders for user {user_id}: {e}")
            return []
    
    def update_learning_preferences(
        self, 
        user_id: str, 
        preferences: Dict[str, Any]
    ) -> bool:
        """
        Update user learning preferences
        
        Args:
            user_id: The user's ID
            preferences: Dictionary containing:
                - learningStyle: 'visual', 'analytical', or 'practical'
                - responseLength: 'brief', 'balanced', or 'detailed'
                - responseFormat: 'text', 'bullet-points', or 'structured'
                
        Returns:
            bool: True if successful
        """
        try:
            # Validate preferences
            valid_styles = ['visual', 'analytical', 'practical', 'balanced']
            valid_lengths = ['brief', 'balanced', 'detailed']
            valid_formats = ['text', 'bullet-points', 'structured']
            
            learning_style = preferences.get('learningStyle', 'balanced')
            if learning_style not in valid_styles:
                logger.warning(f"Invalid learning style: {learning_style}, using default")
                learning_style = 'balanced'
            
            response_length = preferences.get('responseLength', 'balanced')
            if response_length not in valid_lengths:
                response_length = 'balanced'
            
            response_format = preferences.get('responseFormat', 'text')
            if response_format not in valid_formats:
                response_format = 'text'
            
            # In production, save to Firestore
            logger.info(
                f"Updated learning preferences for user {user_id}: "
                f"style={learning_style}, length={response_length}, format={response_format}"
            )
            
            return True
        
        except Exception as e:
            logger.error(f"Error updating preferences for user {user_id}: {e}")
            return False
    
    def get_adaptive_response_length(
        self, 
        user_id: str,
        preferred_length: Optional[str] = None,
        query_complexity: str = 'medium'
    ) -> int:
        """
        Get adaptive response length based on user preferences and query complexity
        
        Args:
            user_id: The user's ID
            preferred_length: User's preferred length ('brief', 'balanced', 'detailed')
            query_complexity: Query complexity level ('simple', 'medium', 'complex')
            
        Returns:
            int: Maximum tokens for response
        """
        try:
            # Base token allocation by length preference
            length_tokens = {
                'brief': 300,
                'balanced': 800,
                'detailed': 1500
            }
            
            # Complexity multipliers
            complexity_multipliers = {
                'simple': 0.8,
                'medium': 1.0,
                'complex': 1.3
            }
            
            preferred_length = preferred_length or 'balanced'
            base_tokens = length_tokens.get(preferred_length, 800)
            multiplier = complexity_multipliers.get(query_complexity, 1.0)
            
            max_tokens = int(base_tokens * multiplier)
            
            logger.debug(
                f"Adaptive response length for user {user_id}: "
                f"{max_tokens} tokens (length={preferred_length}, complexity={query_complexity})"
            )
            
            return max_tokens
        
        except Exception as e:
            logger.error(f"Error calculating adaptive response length: {e}")
            return 800  # Default
    
    def rank_search_results(
        self,
        results: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        user_modules: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Rank search results based on user context
        
        Args:
            results: List of search results
            user_profile: User profile dictionary
            user_modules: User's enrolled modules
            
        Returns:
            list: Re-ranked results
        """
        try:
            # Scoring function
            def score_result(result: Dict) -> float:
                score = 0.0
                
                # Base relevance score
                score += result.get('relevance_score', 0.5) * 100
                
                # Boost for user's modules
                result_modules = result.get('modules', [])
                for module in result_modules:
                    if module in user_modules:
                        score += 50
                
                # Boost for matching academic level
                result_level = result.get('academic_level', '')
                if result_level == user_profile.get('academicLevel'):
                    score += 20
                
                # Recency bonus
                if 'date' in result:
                    days_old = (datetime.now() - datetime.fromisoformat(result['date'])).days
                    if days_old < 30:
                        score += 30
                    elif days_old < 90:
                        score += 15
                
                return score
            
            # Score and sort
            scored_results = results.copy()
            for result in scored_results:
                result['personalization_score'] = score_result(result)
            
            ranked = sorted(scored_results, key=lambda x: x['personalization_score'], reverse=True)
            
            logger.info(f"Ranked {len(ranked)} results for user {user_profile.get('id')}")
            return ranked
        
        except Exception as e:
            logger.error(f"Error ranking search results: {e}")
            return results  # Return original order on error
    
    def should_show_reminder(
        self,
        reminder_key: str,
        user_id: str,
        last_shown: Optional[datetime] = None,
        min_interval_hours: int = 24
    ) -> bool:
        """
        Determine if a reminder should be shown based on frequency limits
        
        Args:
            reminder_key: Unique identifier for reminder
            user_id: The user's ID
            last_shown: When reminder was last shown
            min_interval_hours: Minimum hours between showing same reminder
            
        Returns:
            bool: True if reminder should be shown
        """
        try:
            if last_shown is None:
                return True
            
            time_since_last_shown = datetime.now() - last_shown
            min_interval = timedelta(hours=min_interval_hours)
            
            should_show = time_since_last_shown >= min_interval
            
            logger.debug(
                f"Reminder '{reminder_key}' for user {user_id}: "
                f"should_show={should_show} (interval={time_since_last_shown})"
            )
            
            return should_show
        
        except Exception as e:
            logger.error(f"Error checking reminder frequency: {e}")
            return True  # Show reminder by default on error
