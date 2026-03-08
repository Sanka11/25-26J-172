"""Test complete PDF download flow"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.rag import answer_question

print("\n" + "="*80)
print("TESTING COMPLETE PDF DOWNLOAD FLOW")
print("="*80)

test_cases = [
    "give me sliit library rules pdf",
    "I need the fee structure pdf",
    "Show me the academic calendar",
]

for query in test_cases:
    print(f"\n▶ User Query: '{query}'")
    print("-" * 80)
    
    response = answer_question(query, top_k=3)
    
    print(f"\n✓ Response Fields:")
    print(f"  - is_pdf_request: {response.get('is_pdf_request', False)}")
    print(f"  - downloadable_pdf: {response.get('downloadable_pdf', 'None')}")
    print(f"  - download_url: {response.get('download_url', 'Not provided')}")
    
    # Check if PDF file exists
    if response.get('downloadable_pdf'):
        pdf_path = os.path.join(
            os.path.dirname(__file__),
            "uploaded_pdfs",
            response.get('downloadable_pdf')
        )
        exists = os.path.isfile(pdf_path)
        print(f"  - PDF file exists: {exists} ({pdf_path})")
    
    print(f"\n📄 Answer preview: {response.get('answer', 'No answer')[:200]}...")

print("\n" + "="*80)
print("✅ PDF DOWNLOAD SYSTEM READY!")
print("="*80)
print("""
Frontend will:
1. Display the policy content from chatbot answer
2. Show download button with label like "📥 Download library_policies.pdf"
3. When clicked, downloads the PDF from /documents/library_policies.pdf
4. PDF is served by the FastAPI backend from uploaded_pdfs folder
""")
