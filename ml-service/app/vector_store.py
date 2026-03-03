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

    col.add(
        documents=chunks,
        metadatas=metadatas,
        ids=ids,
        embeddings=embeddings.tolist()
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
    col = get_collection()

    results = col.query(
        query_embeddings=[text_embedding.tolist()],
        n_results=n_results
    )
    
    total_in_collection = len(col.get(include=[])['ids']) if col.get(include=[]) else 0
    print(f"[VectorDB] Query: Total chunks in DB: {total_in_collection}, Results returned: {len(results.get('documents', [[]])[0])}")

    return results


def keyword_search(query_text: str, n_results: int = 6):
    """Simple lexical fallback search over stored chunks.

    This helps when semantic retrieval misses short/definition-style queries.
    Returns a Chroma-like shape: {"documents": [[...]], "metadatas": [[...]]}
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
    for idx, doc in enumerate(documents):
        if not doc:
            continue
        doc_lower = doc.lower()
        unique_hits = sum(1 for t in set(terms) if t in doc_lower)
        density_hits = sum(doc_lower.count(t) for t in terms)
        score = (unique_hits * 3) + density_hits
        if score > 0:
            scored.append((score, idx))

    if not scored:
        return {"documents": [[]], "metadatas": [[]]}

    scored.sort(key=lambda item: item[0], reverse=True)
    top_indices = [idx for _, idx in scored[:n_results]]

    return {
        "documents": [[documents[i] for i in top_indices]],
        "metadatas": [[metadatas[i] if i < len(metadatas) else {} for i in top_indices]],
    }
