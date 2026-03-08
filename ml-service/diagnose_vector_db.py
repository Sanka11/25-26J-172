#!/usr/bin/env python3
"""
Diagnostic script to check vector database and uploaded PDFs status.
Run this to verify PDFs are being indexed correctly.
"""

import os
import sys
from app.vector_store import get_collection, list_documents
from app.pdf_reader import extract_text_from_pdf_bytes

print("\n" + "="*70)
print("VECTOR DATABASE DIAGNOSTIC")
print("="*70 + "\n")

# 1. Check uploaded_pdfs folder
base_dir = os.path.dirname(__file__)
uploaded_pdfs_dir = os.path.join(base_dir, "uploaded_pdfs")

print(f"1. UPLOADED PDFs FOLDER: {uploaded_pdfs_dir}")
if os.path.isdir(uploaded_pdfs_dir):
    pdf_files = [f for f in os.listdir(uploaded_pdfs_dir) if f.lower().endswith('.pdf')]
    print(f"   Status: EXISTS")
    print(f"   PDF files: {len(pdf_files)}")
    for pdf in pdf_files:
        file_path = os.path.join(uploaded_pdfs_dir, pdf)
        file_size = os.path.getsize(file_path)
        print(f"      - {pdf} ({file_size} bytes)")
else:
    print(f"   Status: NOT FOUND")

# 2. Check vector database
print(f"\n2. VECTOR DATABASE STATUS")
try:
    col = get_collection()
    print(f"   Status: CONNECTED")
    
    # Get all documents count
    all_data = col.get(include=[])
    total_chunks = len(all_data.get('ids', []))
    print(f"   Total chunks indexed: {total_chunks}")
    
    # Get metadata details
    if total_chunks > 0:
        all_data_with_meta = col.get(include=['metadatas'])
        metadatas = all_data_with_meta.get('metadatas', [])
        
        # Count chunks per PDF
        pdf_chunks = {}
        for meta in metadatas:
            if meta:
                pdf_name = meta.get('pdf_name', 'unknown')
                pdf_chunks[pdf_name] = pdf_chunks.get(pdf_name, 0) + 1
        
        print(f"   Chunks per PDF:")
        for pdf_name, count in sorted(pdf_chunks.items()):
            print(f"      - {pdf_name}: {count} chunks")
    
except Exception as e:
    print(f"   Status: ERROR")
    print(f"   Error: {e}")

# 3. Test a simple retrieval
print(f"\n3. RETRIEVAL TEST")
try:
    from app.embeddings import embed_texts
    from app.vector_store import query
    
    test_question = "library borrowing period"
    print(f"   Test question: '{test_question}'")
    
    emb = embed_texts([test_question])[0]
    results = query(emb, n_results=3)
    
    docs_found = results.get('documents', [[]])[0]
    print(f"   Results found: {len(docs_found)}")
    if docs_found:
        for i, doc in enumerate(docs_found, 1):
            print(f"      [{i}] {doc[:100]}...")
    
except Exception as e:
    print(f"   Status: ERROR")
    print(f"   Error: {e}")

# 4. Try local PDF extraction
print(f"\n4. LOCAL PDF EXTRACTION TEST")
if pdf_files:
    pdf_path = os.path.join(uploaded_pdfs_dir, pdf_files[0])
    try:
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        text = extract_text_from_pdf_bytes(pdf_bytes)
        print(f"   First PDF: {pdf_files[0]}")
        print(f"   Text extracted: {len(text)} characters")
        if text:
            print(f"   Sample: {text[:150]}...")
    except Exception as e:
        print(f"   Error extracting from PDF: {e}")

print("\n" + "="*70)
print("END DIAGNOSTIC")
print("="*70 + "\n")
