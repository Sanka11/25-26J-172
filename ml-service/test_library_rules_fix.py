"""Test that library rules questions return actual content, not generic fallback"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.rag import answer_question

def test_library_rules_fix():
    """Test library rules question returns actual content"""
    
    print("\n" + "="*80)
    print("TESTING LIBRARY RULES FIX")
    print("="*80)
    
    test_cases = [
        "what are the sliit library rules",
        "what are the library policies?",
        "can you tell me the library borrowing rules?",
        "what are library late fees",
    ]
    
    for query in test_cases:
        print(f"\n▶ Query: '{query}'")
        print("-" * 80)
        
        response = answer_question(query, top_k=3)
        answer = response.get('answer', 'No answer')
        
        # Check if answer contains actual library rules content (not generic fallback)
        has_rules = any(term in answer for term in [
            "borrowing", "loan period", "late fees", "library hours",
            "books", "overdue", "facilities", "SLIIT Library"
        ])
        
        if has_rules:
            print("✅ SUCCESS: Returns actual library rules content")
        else:
            print("❌ FAIL: Returns generic fallback")
        
        # Show first 400 characters
        print(f"\n📄 Answer preview:\n{answer[:400]}...")
        print()

if __name__ == "__main__":
    test_library_rules_fix()
