"""Test that explicit PDF requests return actual document content, not just suggestions"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ml-service'))

from app.rag import answer_question

def test_explicit_pdf_requests():
    """Test different explicit PDF request patterns"""
    
    test_cases = [
        "give me library rules pdf",
        "show me the library policies document",
        "I need the fee structure pdf",
        "get me the student conduct policy",
        "academic calendar file please",
        "what are the library rules?",  # Still a PDF request but with question format
    ]
    
    print("\n" + "="*80)
    print("TESTING EXPLICIT PDF REQUESTS")
    print("="*80)
    
    for query in test_cases:
        print(f"\n▶ Query: '{query}'")
        print("-" * 80)
        
        response = answer_question(query, top_k=3)
        
        print(f"✓ is_pdf_request: {response.get('is_pdf_request', False)}")
        print(f"✓ suggested_pdfs: {response.get('suggested_pdfs', [])}")
        print(f"✓ source_pdfs: {response.get('source_pdfs', [])}")
        print(f"\n📄 Answer:\n{response.get('answer', 'No answer')[:500]}...")  # First 500 chars
        print()

if __name__ == "__main__":
    test_explicit_pdf_requests()
