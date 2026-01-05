import re
from .embeddings import embed_texts
from .vector_store import query
from .llm import call_ollama


SYSTEM_INSTRUCTIONS = """
You are a helpful assistant that answers student academic questions using the provided document excerpts.
Answer clearly in your own words based only on the provided context.
Do not list sources, page numbers, or document names in your answer.
If the answer is not found in the excerpts, say "I couldn't find that in the documents provided."
"""

# Very fast, hard-coded responses for common small-talk so we
# don't have to call the embedding model or LLM for these.
SMALL_TALK_PATTERNS = [
    ("greeting", ["hi", "hello", "hey"],
     "Hello! I'm Arlo, How can I help you today?"),
    ("thanks", ["thank you", "thankyou", "thanks"],
     "You're welcome! If you have more questions about the LMS or academic integrity, feel free to ask."),
]


def build_prompt(question: str, retrieved_docs: list):
    # retrieved_docs: list of documents and metadatas
    context_texts = []
    for doc, meta in zip(retrieved_docs['documents'][0], retrieved_docs['metadatas'][0]):
        context_texts.append(f"[source: {meta.get('pdf_name','unknown')} page:{meta.get('page','n/a')}]\n{doc}\n")
    context = "\n---\n".join(context_texts)
    prompt = f"{SYSTEM_INSTRUCTIONS}\n\nContext:\n{context}\n\nQuestion: {question}\nProvide a concise, student-friendly answer."
    return prompt


def _check_small_talk(question: str):
    q = question.lower().strip()
    # simple tokenisation to avoid matching substrings like "hi" in "this"
    words = re.findall(r"\b\w+\b", q)
    joined = " ".join(words)
    for _name, keywords, response in SMALL_TALK_PATTERNS:
        if any(kw in words or kw in joined for kw in keywords):
            return response
    return None


def answer_question(question: str, top_k: int = 3):
    # 1) Handle very common small-talk instantly.
    small_talk_answer = _check_small_talk(question)
    if small_talk_answer is not None:
        return {"answer": small_talk_answer, "sources": None}

    # 2) Embed question & retrieve from Chroma.
    emb = embed_texts([question])[0]
    results = query(emb, n_results=top_k)
    if not results.get("documents") or not results["documents"][0]:
        return {
            "answer": "I couldn't find that in the documents provided.",
            "sources": results,
        }

    # 3) Build prompt and call the LLM as usual.
    prompt = build_prompt(question, results)
    answer = call_ollama(prompt)
    return {"answer": answer, "sources": results}
