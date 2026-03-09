"""
backend/functions/app/services/firestore_service.py
Firestore database operations for user settings and profiles
"""

import firebase_admin
from firebase_admin import firestore
from datetime import datetime
import logging
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)


class FirestoreService:
    """Service for Firestore database operations"""
    
    def __init__(self):
        """Initialize Firestore client"""
        try:
            self.db = firestore.client()
            self.settings_collection = 'user_settings'
            self.users_collection = 'users'
            logger.info("FirestoreService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize FirestoreService: {e}")
            raise
    
    def get_user_settings(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve user settings from Firestore
        
        Args:
            user_id: The user's ID
            
        Returns:
            dict: User settings or None if not found
        """
        try:
            doc = self.db.collection(self.settings_collection).document(user_id).get()
            
            if doc.exists:
                logger.debug(f"Retrieved settings for user {user_id}")
                return doc.to_dict()
            
            logger.debug(f"No settings found for user {user_id}")
            return None
        
        except Exception as e:
            logger.error(f"Error retrieving settings for user {user_id}: {e}")
            raise
    
    def update_user_settings(self, user_id: str, settings: Dict[str, Any]) -> bool:
        """
        Update user settings in Firestore
        
        Args:
            user_id: The user's ID
            settings: Settings dictionary to update
            
        Returns:
            bool: True if successful
        """
        try:
            # Ensure timestamp is updated
            settings['lastUpdated'] = datetime.now().isoformat()
            
            # Set merge=True to update only specified fields
            self.db.collection(self.settings_collection).document(user_id).set(
                settings,
                merge=True
            )
            
            logger.info(f"Settings updated for user {user_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error updating settings for user {user_id}: {e}")
            raise
    
    def create_user_settings(self, user_id: str, defaults: Optional[Dict] = None) -> bool:
        """
        Create default settings for new user
        
        Args:
            user_id: The user's ID
            defaults: Optional default settings overrides
            
        Returns:
            bool: True if successful
        """
        try:
            defaults = defaults or {}
            
            settings = {
                'userId': user_id,
                'responseMode': defaults.get('responseMode', 'hybrid'),
                'notifications': {
                    'examReminders': True,
                    'attendanceWarnings': True,
                    'assignmentDeadlines': True,
                    'paymentNotifications': True
                },
                'appearance': {
                    'theme': defaults.get('theme', 'system'),
                    'responseLength': 'balanced'
                },
                'dataPrivacy': True,
                'notificationSettings': {
                    'enablePushNotifications': True,
                    'enableEmailNotifications': False,
                    'quietHours': {
                        'enabled': False,
                        'startTime': '22:00',
                        'endTime': '08:00'
                    }
                },
                'createdAt': datetime.now().isoformat(),
                'lastUpdated': datetime.now().isoformat()
            }
            
            self.db.collection(self.settings_collection).document(user_id).set(settings)
            logger.info(f"Default settings created for user {user_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error creating default settings for user {user_id}: {e}")
            raise
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get user profile for personalization
        
        Args:
            user_id: The user's ID
            
        Returns:
            dict: User profile data
        """
        try:
            doc = self.db.collection(self.users_collection).document(user_id).get()
            
            if doc.exists:
                profile = doc.to_dict()
                logger.debug(f"Retrieved profile for user {user_id}")
                return profile
            
            # Return default profile if not found
            default_profile = {
                'id': user_id,
                'displayName': 'Student',
                'email': '',
                'academicLevel': 'undergraduate',
                'department': '',
                'modules': [],
                'interests': [],
                'preferences': {},
                'joinedDate': datetime.now().isoformat()
            }
            
            logger.debug(f"No profile found for user {user_id}, returning defaults")
            return default_profile
        
        except Exception as e:
            logger.error(f"Error retrieving profile for user {user_id}: {e}")
            # Return default profile on error
            return {
                'id': user_id,
                'displayName': 'Student',
                'academicLevel': 'undergraduate',
                'modules': [],
                'interests': []
            }
    
    def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """
        Update user profile
        
        Args:
            user_id: The user's ID
            profile_data: Profile data to update
            
        Returns:
            bool: True if successful
        """
        try:
            profile_data['lastUpdated'] = datetime.now().isoformat()
            
            self.db.collection(self.users_collection).document(user_id).set(
                profile_data,
                merge=True
            )
            
            logger.info(f"Profile updated for user {user_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error updating profile for user {user_id}: {e}")
            raise
    
    def get_user_modules(self, user_id: str) -> list:
        """
        Get user's enrolled modules
        
        Args:
            user_id: The user's ID
            
        Returns:
            list: List of module IDs
        """
        try:
            profile = self.get_user_profile(user_id)
            return profile.get('modules', [])
        
        except Exception as e:
            logger.error(f"Error retrieving modules for user {user_id}: {e}")
            return []
    
    def add_user_module(self, user_id: str, module_id: str) -> bool:
        """
        Add a module to user's profile
        
        Args:
            user_id: The user's ID
            module_id: The module ID to add
            
        Returns:
            bool: True if successful
        """
        try:
            profile = self.get_user_profile(user_id)
            modules = profile.get('modules', [])
            
            if module_id not in modules:
                modules.append(module_id)
                return self.update_user_profile(user_id, {'modules': modules})
            
            return True
        
        except Exception as e:
            logger.error(f"Error adding module for user {user_id}: {e}")
            raise
    
    def remove_user_module(self, user_id: str, module_id: str) -> bool:
        """
        Remove a module from user's profile
        
        Args:
            user_id: The user's ID
            module_id: The module ID to remove
            
        Returns:
            bool: True if successful
        """
        try:
            profile = self.get_user_profile(user_id)
            modules = profile.get('modules', [])
            
            if module_id in modules:
                modules.remove(module_id)
                return self.update_user_profile(user_id, {'modules': modules})
            
            return True
        
        except Exception as e:
            logger.error(f"Error removing module for user {user_id}: {e}")
            raise
    
    def batch_get_settings(self, user_ids: list) -> Dict[str, Dict]:
        """
        Retrieve settings for multiple users
        
        Args:
            user_ids: List of user IDs
            
        Returns:
            dict: Mapping of user_id to settings
        """
        try:
            results = {}
            
            for user_id in user_ids:
                settings = self.get_user_settings(user_id)
                if settings:
                    results[user_id] = settings
            
            logger.info(f"Retrieved settings for {len(results)} users")
            return results
        
        except Exception as e:
            logger.error(f"Error batch retrieving settings: {e}")
            raise
    
    def delete_user_settings(self, user_id: str) -> bool:
        """
        Delete user settings (for account deletion)
        
        Args:
            user_id: The user's ID
            
        Returns:
            bool: True if successful
        """
        try:
            self.db.collection(self.settings_collection).document(user_id).delete()
            logger.info(f"Settings deleted for user {user_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error deleting settings for user {user_id}: {e}")
            raise
