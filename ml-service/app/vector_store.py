import chromadb
from .config import CHROMA_PERSIST_DIR

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

    return results
