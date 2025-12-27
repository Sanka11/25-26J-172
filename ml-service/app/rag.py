from .embeddings import embed_texts
from .vector_store import query
from .llm import call_ollama


SYSTEM_INSTRUCTIONS = """
You are a helpful assistant that answers student academic questions using the provided document excerpts. 
Cite the source metadata for each relevant excerpt (pdf_name and page).
If the answer is not found in the excerpts, say "I couldn't find that in the documents provided."
"""

def build_prompt(question: str, retrieved_docs: list):
    # retrieved_docs: list of documents and metadatas
    context_texts = []
    for doc, meta in zip(retrieved_docs['documents'][0], retrieved_docs['metadatas'][0]):
        context_texts.append(f"[source: {meta.get('pdf_name','unknown')} page:{meta.get('page','n/a')}]\n{doc}\n")
    context = "\n---\n".join(context_texts)
    prompt = f"{SYSTEM_INSTRUCTIONS}\n\nContext:\n{context}\n\nQuestion: {question}\nAnswer concisely and list sources at the end."
    return prompt

def answer_question(question: str, top_k:int=4):
    # embed question
    emb = embed_texts([question])[0]
    results = query(emb, n_results=top_k)
    prompt = build_prompt(question, results)
    answer = call_ollama(prompt)
    return {"answer": answer, "sources": results}
