"""
backend/functions/test_backend_integration.py
Integration tests for backend services

Run this to verify all backend components are properly integrated
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BackendIntegrationTester:
    """Test all backend services integration"""
    
    def __init__(self):
        """Initialize tester"""
        self.test_results = []
        self.test_user_id = "test-user-12345"
        logger.info("Backend Integration Tester initialized")
    
    async def test_firestore_service(self) -> bool:
        """Test Firestore Service"""
        try:
            logger.info("\n" + "="*60)
            logger.info("🔍 Testing FirestoreService...")
            logger.info("="*60)
            
            from app.services import FirestoreService
            fs = FirestoreService()
            
            # Test 1: Create default settings
            logger.info("✓ Test 1: Creating default settings...")
            fs.create_user_settings(self.test_user_id, {'responseMode': 'hybrid'})
            logger.info("  ✅ Default settings created")
            
            # Test 2: Get settings
            logger.info("✓ Test 2: Retrieving settings...")
            settings = fs.get_user_settings(self.test_user_id)
            assert settings is not None
            assert settings['userId'] == self.test_user_id
            logger.info("  ✅ Settings retrieved successfully")
            
            # Test 3: Update settings
            logger.info("✓ Test 3: Updating settings...")
            fs.update_user_settings(self.test_user_id, {'responseMode': 'web'})
            updated = fs.get_user_settings(self.test_user_id)
            assert updated['responseMode'] == 'web'
            logger.info("  ✅ Settings updated successfully")
            
            # Test 4: Get user profile
            logger.info("✓ Test 4: Getting user profile...")
            profile = fs.get_user_profile(self.test_user_id)
            assert profile is not None
            logger.info(f"  ✅ User profile retrieved: {profile['id']}")
            
            # Test 5: Module operations
            logger.info("✓ Test 5: Testing module operations...")
            fs.add_user_module(self.test_user_id, "CS101")
            modules = fs.get_user_modules(self.test_user_id)
            assert "CS101" in modules
            logger.info("  ✅ Module operations working")
            
            logger.info("\n✅ FirestoreService: ALL TESTS PASSED\n")
            self.test_results.append(("FirestoreService", True, "All tests passed"))
            return True
        
        except Exception as e:
            logger.error(f"\n❌ FirestoreService: TEST FAILED - {str(e)}\n")
            self.test_results.append(("FirestoreService", False, str(e)))
            return False
    
    async def test_chat_history_service(self) -> bool:
        """Test Chat History Service"""
        try:
            logger.info("="*60)
            logger.info("🔍 Testing ChatHistoryService...")
            logger.info("="*60)
            
            from app.services import ChatHistoryService
            chs = ChatHistoryService()
            
            # Test 1: Save message
            logger.info("✓ Test 1: Saving chat message...")
            message = {
                'userId': self.test_user_id,
                'question': 'What is Python?',
                'answer': 'Python is a programming language.',
                'answer_source': 'web_search',
                'responseMode': 'web',
                'confidence': 0.85,
                'timestamp': datetime.now().isoformat()
            }
            msg_id = await chs.save_message(message)
            assert msg_id is not None
            logger.info(f"  ✅ Message saved with ID: {msg_id}")
            
            # Test 2: Get chat history
            logger.info("✓ Test 2: Retrieving chat history...")
            history = chs.get_user_chat_history(self.test_user_id, limit=10)
            assert isinstance(history, list)
            logger.info(f"  ✅ Retrieved {len(history)} messages")
            
            # Test 3: Search conversations
            logger.info("✓ Test 3: Searching conversations...")
            results = chs.search_conversations(self.test_user_id, "Python")
            assert isinstance(results, list)
            logger.info(f"  ✅ Found {len(results)} matching messages")
            
            # Test 4: Get statistics
            logger.info("✓ Test 4: Calculating chat statistics...")
            stats = chs.get_chat_statistics(self.test_user_id)
            assert 'total_messages' in stats
            logger.info(f"  ✅ Statistics: {stats['total_messages']} messages, "
                       f"avg confidence: {stats['avg_confidence']:.2f}")
            
            logger.info("\n✅ ChatHistoryService: ALL TESTS PASSED\n")
            self.test_results.append(("ChatHistoryService", True, "All tests passed"))
            return True
        
        except Exception as e:
            logger.error(f"\n❌ ChatHistoryService: TEST FAILED - {str(e)}\n")
            self.test_results.append(("ChatHistoryService", False, str(e)))
            return False
    
    async def test_personalization_service(self) -> bool:
        """Test Personalization Service"""
        try:
            logger.info("="*60)
            logger.info("🔍 Testing PersonalizationService...")
            logger.info("="*60)
            
            from app.services import PersonalizationService
            ps = PersonalizationService()
            
            # Test 1: Get user profile
            logger.info("✓ Test 1: Getting user profile...")
            profile = ps.get_user_profile(self.test_user_id)
            assert profile is not None
            assert 'id' in profile
            logger.info(f"  ✅ Profile retrieved: {profile['displayName']}")
            
            # Test 2: Build personalization context
            logger.info("✓ Test 2: Building personalization context...")
            context = ps.build_personalization_context(profile)
            assert isinstance(context, str)
            logger.info(f"  ✅ Context: {context[:60]}...")
            
            # Test 3: Get academic reminders
            logger.info("✓ Test 3: Getting academic reminders...")
            reminders = ps.get_academic_reminders(self.test_user_id, "exam")
            assert isinstance(reminders, list)
            logger.info(f"  ✅ Generated {len(reminders)} reminders for 'exam'")
            
            # Test 4: Update learning preferences
            logger.info("✓ Test 4: Updating learning preferences...")
            preferences = {
                'learningStyle': 'analytical',
                'responseLength': 'detailed'
            }
            result = ps.update_learning_preferences(self.test_user_id, preferences)
            assert result is True
            logger.info("  ✅ Preferences updated")
            
            # Test 5: Get adaptive response length
            logger.info("✓ Test 5: Calculating adaptive response length...")
            tokens = ps.get_adaptive_response_length(
                self.test_user_id,
                preferred_length='detailed',
                query_complexity='complex'
            )
            assert isinstance(tokens, int)
            assert tokens > 0
            logger.info(f"  ✅ Allocated {tokens} tokens for response")
            
            logger.info("\n✅ PersonalizationService: ALL TESTS PASSED\n")
            self.test_results.append(("PersonalizationService", True, "All tests passed"))
            return True
        
        except Exception as e:
            logger.error(f"\n❌ PersonalizationService: TEST FAILED - {str(e)}\n")
            self.test_results.append(("PersonalizationService", False, str(e)))
            return False
    
    async def test_response_modes(self) -> bool:
        """Test response mode configuration"""
        try:
            logger.info("="*60)
            logger.info("🔍 Testing Response Modes Configuration...")
            logger.info("="*60)
            
            from app.config import RESPONSE_MODES, RAG_SIMILARITY_THRESHOLD
            
            logger.info("✓ Checking configured response modes...")
            assert 'document' in RESPONSE_MODES
            assert 'web' in RESPONSE_MODES
            assert 'hybrid' in RESPONSE_MODES
            logger.info("  ✅ All response modes configured")
            
            logger.info("✓ Checking mode descriptions...")
            for mode, config in RESPONSE_MODES.items():
                logger.info(f"  - {mode}: {config.get('description')}")
            
            logger.info(f"✓ Similarity threshold: {RAG_SIMILARITY_THRESHOLD}")
            assert RAG_SIMILARITY_THRESHOLD > 0
            logger.info("  ✅ Threshold configured")
            
            logger.info("\n✅ Response Modes: CONFIGURATION VALID\n")
            self.test_results.append(("ResponseModes", True, "Configuration valid"))
            return True
        
        except Exception as e:
            logger.error(f"\n❌ Response Modes: TEST FAILED - {str(e)}\n")
            self.test_results.append(("ResponseModes", False, str(e)))
            return False
    
    async def run_all_tests(self):
        """Run all integration tests"""
        logger.info("\n" + "🚀"*30)
        logger.info("BACKEND INTEGRATION TEST SUITE")
        logger.info("🚀"*30 + "\n")
        
        # Run all tests
        await self.test_firestore_service()
        await self.test_chat_history_service()
        await self.test_personalization_service()
        await self.test_response_modes()
        
        # Print summary
        logger.info("\n" + "="*60)
        logger.info("TEST SUMMARY")
        logger.info("="*60 + "\n")
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        for service_name, success, message in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"{status}: {service_name}")
            if not success:
                logger.info(f"   Error: {message}")
        
        logger.info("\n" + "-"*60)
        logger.info(f"Results: {passed}/{total} tests passed")
        logger.info("-"*60 + "\n")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Backend is ready for integration.\n")
            return True
        else:
            logger.warning(f"⚠️  {total - passed} test(s) failed. Review errors above.\n")
            return False


async def main():
    """Main test runner"""
    tester = BackendIntegrationTester()
    success = await tester.run_all_tests()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
