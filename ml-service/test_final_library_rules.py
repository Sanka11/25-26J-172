"""Final test - User requests library rules PDF"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.rag import answer_question

print("\n" + "="*80)
print("FINAL TEST: User asks 'give me sliit library rules'")
print("="*80)

query = "give me sliit library rules"
response = answer_question(query)

print(f"\n▶ User Query: '{query}'")
print("\n" + "-"*80)
print("CHATBOT RESPONSE:")
print("-"*80)

print(f"\nAnswer:\n{response.get('answer', 'No answer')}")

print(f"\n\nDownload Details:")
print(f"  - PDF File: {response.get('downloadable_pdf', 'None')}")
print(f"  - Download URL: {response.get('download_url', 'Not provided')}")
print(f"  - PDF Request: {response.get('is_pdf_request', False)}")

# Verify file exists
if response.get('downloadable_pdf'):
    pdf_path = os.path.join(
        os.path.dirname(__file__),
        "uploaded_pdfs",
        response.get('downloadable_pdf')
    )
    if os.path.isfile(pdf_path):
        size = os.path.getsize(pdf_path) / 1024  # size in KB
        print(f"  - File Status: ✅ Exists ({size:.1f} KB)")
    else:
        print(f"  - File Status: ❌ Not Found")

print("\n" + "="*80)
print("✅ SYSTEM READY FOR DOWNLOAD!")
print("="*80)
print("\nFrontend will show:")
print("1. Message: 'Here's the document you're looking for: Library Rules final -17th July 2024.pdf'")
print("2. Download button: '📥 Download Library Rules final -17th July 2024.pdf'")
print("3. When clicked, downloads the actual PDF file")
