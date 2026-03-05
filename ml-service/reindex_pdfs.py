#!/usr/bin/env python3
"""
Re-index all PDFs from uploaded_pdfs folder into the vector database.
Run this ONCE to populate the empty vector DB with existing PDF chunks.
"""

import os
import sys
import time
import uuid

print("\n" + "="*70)
print("RE-INDEXING PDFs INTO VECTOR DATABASE")
print("="*70 + "\n")

try:
    from app.pdf_reader import extract_text_from_pdf_bytes
    from app.chunker import chunk_text
    from app.embeddings import embed_texts
    from app.vector_store import add_documents
    
    base_dir = os.path.dirname(__file__)
    uploaded_pdfs_dir = os.path.join(base_dir, "uploaded_pdfs")
    
    if not os.path.isdir(uploaded_pdfs_dir):
        print(f"ERROR: {uploaded_pdfs_dir} does not exist")
        sys.exit(1)
    
    # Get all PDF files
    pdf_files = sorted([
        f for f in os.listdir(uploaded_pdfs_dir) 
        if f.lower().endswith('.pdf')
    ])
    
    if not pdf_files:
        print("No PDFs found in uploaded_pdfs folder")
        sys.exit(0)
    
    print(f"Found {len(pdf_files)} PDFs to index:\n")
    
    for pdf_name in pdf_files:
        pdf_path = os.path.join(uploaded_pdfs_dir, pdf_name)
        
        try:
            print(f"[{pdf_name}]")
            
            # 1. Extract text
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()
            
            text = extract_text_from_pdf_bytes(pdf_bytes)
            if not text or not text.strip():
                print(f"  ✗ No text extracted\n")
                continue
            
            print(f"  ✓ Extracted {len(text)} characters")
            
            # 2. Chunk text
            chunks = chunk_text(text, chunk_size=1000, overlap=200)
            if not chunks:
                print(f"  ✗ No chunks created\n")
                continue
            
            print(f"  ✓ Created {len(chunks)} chunks")
            
            # 3. Create metadata with doc_id
            uploaded_at = time.time()
            doc_id = f"{pdf_name}_{str(uuid.uuid4())[:8]}"
            metadatas = [
                {"doc_id": doc_id, "pdf_name": pdf_name, "uploaded_at": uploaded_at, "chunk": i}
                for i in range(len(chunks))
            ]
            
            # 4. Generate embeddings
            embeddings = embed_texts(chunks)
            print(f"  ✓ Generated {len(embeddings)} embeddings")
            
            # 5. Store in vector DB
            doc_prefix = f"{pdf_name}_{str(uuid.uuid4())[:8]}"
            add_documents(doc_prefix, chunks, metadatas, embeddings)
            print(f"  ✓ Stored in vector DB with doc_id: {doc_id}\n")
            
        except Exception as e:
            print(f"  ✗ ERROR: {e}\n")
            continue
    
    print("="*70)
    print("RE-INDEXING COMPLETE")
    print("="*70 + "\n")
    
except ImportError as e:
    print(f"ERROR: Could not import required modules: {e}")
    sys.exit(1)
