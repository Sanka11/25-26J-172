import chromadb
from .config import CHROMA_PERSIST_DIR
import re

# Create or load a persistent Chroma database
client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)

# collection name
COLLECTION_NAME = "university_docs"


def get_collection():
    try:
        return client.get_collection(COLLECTION_NAME)
    except:
        return client.create_collection(name=COLLECTION_NAME)


def add_documents(doc_id_prefix, chunks, metadatas, embeddings):
    col = get_collection()

    ids = [f"{doc_id_prefix}_{i}" for i in range(len(chunks))]

    # Convert embeddings to list if needed (handle both numpy arrays and lists)
    embeddings_list = embeddings if isinstance(embeddings, list) else embeddings.tolist()

    col.add(
        documents=chunks,
        metadatas=metadatas,
        ids=ids,
        embeddings=embeddings_list
    )


def list_documents():
    """Return a de-duplicated list of uploaded documents based on stored metadata.

    Each document entry includes: doc_id, pdf_name, uploaded_at.
    """
    col = get_collection()

    try:
        res = col.get()
    except Exception:
        return []

    metadatas = res.get("metadatas") or []
    docs = {}

    for meta in metadatas:
        if not meta:
            continue

        doc_id = meta.get("doc_id")
        pdf_name = meta.get("pdf_name")
        uploaded_at = meta.get("uploaded_at")

        if not doc_id:
            # Older entries without explicit doc_id are skipped from listing
            continue

        existing = docs.get(doc_id)
        if not existing:
            docs[doc_id] = {
                "doc_id": doc_id,
                "pdf_name": pdf_name,
                "uploaded_at": uploaded_at,
            }
        else:
            # Keep earliest uploaded_at if multiple chunks disagree
            if (
                uploaded_at is not None
                and existing.get("uploaded_at") is not None
                and uploaded_at < existing["uploaded_at"]
            ):
                existing["uploaded_at"] = uploaded_at

    # Return as a simple list
    return list(docs.values())


def delete_documents(doc_id: str):
    """Delete all chunks in the collection that belong to the given doc_id."""
    col = get_collection()
    try:
        col.delete(where={"doc_id": doc_id})
    except Exception as e:
        # Log and re-raise so callers can handle appropriately
        print(f"Error deleting documents for doc_id {doc_id}: {e}")
        raise


def query(text_embedding, n_results=4):
    """
    Query the vector database for similar documents.
    
    Args:
        text_embedding: Query embedding vector
        n_results: Number of results to return
    
    Returns:
        Dictionary containing documents, metadatas, distances, and ids
        Note: ChromaDB returns 'distances' where lower is better (more similar)
    """
    col = get_collection()

    results = col.query(
        query_embeddings=[text_embedding.tolist()],
        n_results=n_results,
        include=['documents', 'metadatas', 'distances']  # Explicitly request distances
    )
    
    total_in_collection = len(col.get(include=[])['ids']) if col.get(include=[]) else 0
    distances = results.get('distances', [[]])[0] if results.get('distances') else []
    
    # Log distance info for debugging
    if distances:
        min_dist = min(distances) if distances else None
        max_dist = max(distances) if distances else None
        avg_dist = sum(distances) / len(distances) if distances else None
        print(f"[VectorDB] Query: Total chunks in DB: {total_in_collection}, "
              f"Results returned: {len(results.get('documents', [[]])[0])}, "
              f"Distance range: [{min_dist:.3f}, {max_dist:.3f}], Avg: {avg_dist:.3f}")
    else:
        print(f"[VectorDB] Query: Total chunks in DB: {total_in_collection}, "
              f"Results returned: {len(results.get('documents', [[]])[0])}")

    return results


def keyword_search(query_text: str, n_results: int = 6):
    """Optimized lexical fallback search over stored chunks.

    This helps when semantic retrieval misses short/definition-style queries.
    Returns a Chroma-like shape: {"documents": [[...]], "metadatas": [[...]]}
    Uses fast approximation techniques to avoid scanning all documents.
    """
    col = get_collection()

    try:
        res = col.get(include=["documents", "metadatas"])
    except Exception:
        return {"documents": [[]], "metadatas": [[]]}

    documents = res.get("documents") or []
    metadatas = res.get("metadatas") or []

    if not documents:
        return {"documents": [[]], "metadatas": [[]]}

    # Keep the tokenizer intentionally lightweight and dependency-free.
    stop_words = {
        "the", "is", "are", "a", "an", "of", "to", "for", "in", "on", "and",
        "or", "what", "define", "meaning", "explain", "please", "from", "with",
        "that", "this", "about", "can", "you", "me", "tell"
    }
    terms = [
        t for t in re.findall(r"\b[a-zA-Z0-9]{2,}\b", (query_text or "").lower())
        if t not in stop_words
    ]

    if not terms:
        return {"documents": [[]], "metadatas": [[]]}

    scored = []
    term_set = set(terms)
    
    # Optimize: limit scan to first 500 documents, sample rest if collection is huge
    doc_sample = documents[:500] if len(documents) > 500 else documents
    
    for idx, doc in enumerate(doc_sample):
        if not doc:
            continue
        doc_lower = doc.lower()
        # Fast scoring: only count unique term occurrences (no density)
        unique_hits = sum(1 for t in term_set if t in doc_lower)
        if unique_hits > 0:
            scored.append((unique_hits, idx))

    if not scored:
        return {"documents": [[]], "metadatas": [[]]}

    # Sort by score (descending)
    scored.sort(key=lambda item: item[0], reverse=True)
    top_indices = [idx for _, idx in scored[:n_results]]

    return {
        "documents": [[documents[i] for i in top_indices]],
        "metadatas": [[metadatas[i] if i < len(metadatas) else {} for i in top_indices]],
    }
