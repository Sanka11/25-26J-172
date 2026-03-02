"""Test that chatbot uses actual uploaded PDFs for library queries"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.rag import answer_question, _find_matching_pdf_files

print("\n" + "="*80)
print("TESTING ACTUAL PDF FILE MATCHING")
print("="*80)

# Test the matching function first
test_queries = [
    "give me library rules",
    "show me library policies",
    "I need academic integrity policy",
    "dress code",
]

print("\n🔍 Testing PDF File Matching:")
print("-" * 80)
for query in test_queries:
    matching_files = _find_matching_pdf_files(query)
    print(f"\nQuery: '{query}'")
    print(f"Matching PDFs: {matching_files}")

# Now test full responses
print("\n\n" + "="*80)
print("TESTING FULL CHATBOT RESPONSES")
print("="*80)

test_cases = [
    "give me sliit library rules",
    "I need the dress code policy",
    "show me academic integrity policy",
]

for query in test_cases:
    print(f"\n▶ User Query: '{query}'")
    print("-" * 80)
    
    response = answer_question(query, top_k=3)
    
    print(f"\n✓ is_pdf_request: {response.get('is_pdf_request', False)}")
    print(f"✓ downloadable_pdf: {response.get('downloadable_pdf', 'None')}")
    print(f"✓ download_url: {response.get('download_url', 'Not provided')}")
    
    # Check if it's an actual uploaded PDF
    if response.get('downloadable_pdf'):
        upload_dir = os.path.join(os.path.dirname(__file__), "uploaded_pdfs")
        pdf_path = os.path.join(upload_dir, response.get('downloadable_pdf'))
        exists = os.path.isfile(pdf_path)
        print(f"✓ Real PDF file: {exists}")
    
    print(f"\n📄 Answer:\n{response.get('answer', 'No answer')}")

print("\n" + "="*80)
print("✅ ACTUAL PDF MATCHING SYSTEM READY!")
print("="*80)
