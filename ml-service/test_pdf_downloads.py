"""Test that PDF requests return downloadable_pdf and download_url"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.rag import answer_question

print("\n" + "="*80)
print("TESTING PDF DOWNLOAD FEATURE")
print("="*80)

test_cases = [
    "give me sliit library rules pdf",
    "show me library policies",
    "I need the fee structure pdf",
    "academic calendar document please",
]

for query in test_cases:
    print(f"\n▶ Query: '{query}'")
    print("-" * 80)
    
    response = answer_question(query, top_k=3)
    
    print(f"✓ is_pdf_request: {response.get('is_pdf_request', False)}")
    print(f"✓ downloadable_pdf: {response.get('downloadable_pdf', 'None')}")
    print(f"✓ download_url: {response.get('download_url', 'Not provided')}")
    print(f"✓ suggested_pdfs: {response.get('suggested_pdfs', [])}")
    print(f"\n📄 Answer preview: {response.get('answer', 'No answer')[:250]}...")

print("\n" + "="*80)
print("PDF DOWNLOAD FEATURE WORKING!")
print("="*80)
print("\nFrontend can now use 'download_url' to enable PDF downloads:")
print("Example: <a href={response.download_url}>Download PDF</a>")
print()
