"""
Test script for Hybrid Retrieval System
Tests both RAG and web search fallback functionality
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.web_search_service import web_search_service, perform_web_search, format_web_results
from app.config import RAG_SIMILARITY_THRESHOLD


def test_web_search_configuration():
    """Test if web search is properly configured"""
    print("=" * 60)
    print("Testing Web Search Configuration")
    print("=" * 60)
    
    if web_search_service.is_configured:
        print("✅ Web search is CONFIGURED")
        print(f"   API Key: {'*' * 10}{web_search_service.api_key[-4:] if len(web_search_service.api_key) > 4 else 'NOT SET'}")
        print(f"   Search Engine CX: {web_search_service.cx[:10]}..." if web_search_service.cx else "NOT SET")
    else:
        print("❌ Web search is NOT configured")
        print("   Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX environment variables")
    
    print()


def test_web_search_basic():
    """Test basic web search functionality"""
    print("=" * 60)
    print("Testing Basic Web Search")
    print("=" * 60)
    
    if not web_search_service.is_configured:
        print("⚠️  Skipping - Web search not configured")
        print()
        return
    
    test_query = "What is machine learning?"
    print(f"Query: '{test_query}'")
    print()
    
    try:
        results = perform_web_search(test_query, num_results=3)
        
        if results:
            print(f"✅ Retrieved {len(results)} results")
            print()
            
            for idx, result in enumerate(results, 1):
                print(f"Result {idx}:")
                print(f"  Title: {result.get('title', 'N/A')}")
                print(f"  URL: {result.get('link', 'N/A')}")
                print(f"  Snippet: {result.get('snippet', 'N/A')[:100]}...")
                print()
        else:
            print("❌ No results returned")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()


def test_web_search_formatting():
    """Test web search result formatting"""
    print("=" * 60)
    print("Testing Web Search Result Formatting")
    print("=" * 60)
    
    # Mock results for testing
    mock_results = [
        {
            "title": "Introduction to AI",
            "link": "https://example.com/ai",
            "snippet": "Artificial Intelligence is the simulation of human intelligence..."
        },
        {
            "title": "Machine Learning Basics",
            "link": "https://example.com/ml",
            "snippet": "Machine learning is a subset of AI that enables systems to learn..."
        }
    ]
    
    formatted = format_web_results(mock_results, max_results=2)
    
    print("Formatted Output:")
    print("-" * 60)
    print(formatted)
    print("-" * 60)
    print()
    
    if formatted:
        print("✅ Formatting works correctly")
    else:
        print("❌ Formatting failed")
    
    print()


def test_threshold_configuration():
    """Test similarity threshold configuration"""
    print("=" * 60)
    print("Testing Threshold Configuration")
    print("=" * 60)
    
    print(f"Current RAG Similarity Threshold: {RAG_SIMILARITY_THRESHOLD}")
    print()
    
    print("Threshold Guide:")
    print("  0.8 = Very strict (only very similar documents)")
    print("  1.2 = Moderate (balanced, default)")
    print("  1.5 = Lenient (accepts more distant matches)")
    print()
    
    if 0.5 <= RAG_SIMILARITY_THRESHOLD <= 2.0:
        print("✅ Threshold is in reasonable range")
    else:
        print("⚠️  Threshold may need adjustment")
    
    print()


def test_hybrid_retrieval_simulation():
    """Simulate hybrid retrieval decision logic"""
    print("=" * 60)
    print("Testing Hybrid Retrieval Decision Logic")
    print("=" * 60)
    
    # Simulate different distance scenarios
    test_cases = [
        (0.5, "Very similar - should use RAG"),
        (1.0, "Similar - should use RAG"),
        (1.5, "Distant - should use web search"),
        (2.0, "Very distant - should use web search"),
    ]
    
    threshold = RAG_SIMILARITY_THRESHOLD
    
    for distance, description in test_cases:
        should_use_rag = distance <= threshold
        decision = "RAG" if should_use_rag else "Web Search"
        status = "✅" if should_use_rag == (distance <= threshold) else "❌"
        
        print(f"{status} Distance: {distance:.2f} → {decision} ({description})")
    
    print()


def test_import_check():
    """Check if all required modules can be imported"""
    print("=" * 60)
    print("Testing Module Imports")
    print("=" * 60)
    
    modules_to_test = [
        ("app.rag", "answer_question"),
        ("app.vector_store", "query"),
        ("app.embeddings", "embed_texts"),
        ("app.services.web_search_service", "perform_web_search"),
        ("app.config", "RAG_SIMILARITY_THRESHOLD"),
    ]
    
    all_passed = True
    
    for module_name, item_name in modules_to_test:
        try:
            module = __import__(module_name, fromlist=[item_name])
            getattr(module, item_name)
            print(f"✅ {module_name}.{item_name}")
        except Exception as e:
            print(f"❌ {module_name}.{item_name} - Error: {e}")
            all_passed = False
    
    print()
    
    if all_passed:
        print("✅ All imports successful")
    else:
        print("❌ Some imports failed")
    
    print()


def run_all_tests():
    """Run all tests"""
    print("\n")
    print("*" * 60)
    print("HYBRID RETRIEVAL SYSTEM - TEST SUITE")
    print("*" * 60)
    print("\n")
    
    test_import_check()
    test_web_search_configuration()
    test_threshold_configuration()
    test_hybrid_retrieval_simulation()
    test_web_search_formatting()
    test_web_search_basic()
    
    print("*" * 60)
    print("TEST SUITE COMPLETED")
    print("*" * 60)
    print("\n")


if __name__ == "__main__":
    run_all_tests()
