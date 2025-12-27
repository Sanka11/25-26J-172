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


def query(text_embedding, n_results=4):
    col = get_collection()

    results = col.query(
        query_embeddings=[text_embedding.tolist()],
        n_results=n_results
    )

    return results
