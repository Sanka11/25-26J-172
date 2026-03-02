import re
from .embeddings import embed_texts
from .vector_store import query
from .llm import call_ollama
from .services.academic_service import (
    get_academic_deadlines,  # Use this instead of get_upcoming_deadlines
    get_module_details,
)


SYSTEM_INSTRUCTIONS = """
You are AcademiGuard, an academic assistant. You help students with:
1. Assignment and deadline information
2. Module registration timelines  
3. Payment deadlines
4. Lecturer in Charge (LIC) contact details and office hours
5. Important academic calendar dates
6. General academic integrity questions (from uploaded PDFs)

IMPORTANT: Keep answers brief and direct.
- For deadlines: Just state the date in a clear format (e.g., "February 28, 2026")
- For contact info: Name, email, and office hours only
- Avoid repetition and unnecessary details
- Don't list the same information multiple times
- Answer in 1-2 sentences unless specifically asked for more detail
- Do not mention documents, portals, policies, or internal sources
- Do not include disclaimers about access or capabilities
- If asked about a concept, give a concise definition only
- Use only the most relevant context; avoid mixing unrelated sources
"""

# Typo corrections for common academic terms
TYPO_CORRECTIONS = {
    # Plagiarism variations
    "plgrisam": "plagiarism",
    "plagiarims": "plagiarism",
    "plagrisim": "plagiarism",
    "plagarisam": "plagiarism",
    "plagarism": "plagiarism",
    "plagiarism": "plagiarism",
    "plaigiarism": "plagiarism",
    "plagiarism": "plagiarism",
    # Citation variations
    "citatoin": "citation",
    "citiation": "citation",
    "citaion": "citation",
    # Paraphrase variations
    "paraphrase": "paraphrase",
    "parafraze": "paraphrase",
    # Dishonesty variations
    "dishonesty": "academic dishonesty",
    "cheating": "academic cheating",
}

# Very fast, hard-coded responses for common small-talk so we
# don't have to call the embedding model or LLM for these.
SMALL_TALK_PATTERNS = [
    ("greeting", ["hi", "hello", "hey"],
     "Hello! I'm Arlo, How can I help you today?"),
    ("thanks", ["thank you", "thankyou", "thanks"],
     "You're welcome! If you have more questions about the LMS or academic integrity, feel free to ask."),
]


def _correct_typos(text: str) -> str:
    """Correct common academic term typos"""
    words = text.lower().split()
    corrected_words = []
    for word in words:
        # Clean punctuation for comparison
        clean_word = re.sub(r'[^\w]', '', word)
        if clean_word in TYPO_CORRECTIONS:
            corrected_words.append(TYPO_CORRECTIONS[clean_word])
        else:
            corrected_words.append(word)
    return " ".join(corrected_words)


def build_prompt(question: str, retrieved_docs: list):
    # retrieved_docs: list of documents and metadatas
    context_texts = []
    for doc, meta in zip(retrieved_docs['documents'][0], retrieved_docs['metadatas'][0]):
        context_texts.append(f"{doc}\n")
    context = "\n---\n".join(context_texts)
    prompt = (
        f"{SYSTEM_INSTRUCTIONS}\n\nContext:\n{context}\n\nQuestion: {question}\n"
        "Give a direct answer only. No references, no sources, no extra guidance."
    )
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


def _get_integrity_fallback(question: str) -> str:
    """Provide helpful fallback responses for common academic integrity questions"""
    q = question.lower()
    
    # Plagiarism-related questions
    if any(term in q for term in ["plagiarism", "plagiarise", "plagiarize", "copying", "paraphrase", "cite", "citation"]):
        return "Plagiarism means taking someone else's work, ideas, or words without giving them credit. Always cite your sources and put direct quotes in quotation marks. If you're unsure about what needs citation, ask your Lecturer in Charge or check the uploaded academic integrity policy documents."
    
    # Academic dishonesty questions
    if any(term in q for term in ["cheat", "dishonest", "fraud", "integrity"]):
        return "Academic integrity means being honest in your work. This includes not cheating, not plagiarizing, and following all academic rules. If you violate academic integrity, there can be serious consequences. Check the policy documents or contact your Lecturer in Charge for guidance."
    
    # General fallback
    return "For questions about academic integrity and policies, please check the uploaded documents or contact your Lecturer in Charge."


def answer_question(question: str, top_k: int = 3):
    """Enhanced RAG with academic data integration"""
    
    # Correct common typos in the question
    corrected_question = _correct_typos(question)
    original_question = question
    if corrected_question != question.lower():
        question = corrected_question
    
    # 1) Handle very common small-talk instantly.
    small_talk_answer = _check_small_talk(question)
    if small_talk_answer is not None:
        return {"answer": small_talk_answer, "sources": None}

    # 2) Check if question is about deadlines, modules, or LIC
    question_lower = question.lower()
    academic_context = ""
    is_deadline_q = any(
        keyword in question_lower
        for keyword in ["deadline", "due", "registration", "payment", "when is", "when's"]
    )
    is_definition_q = bool(re.search(r"\b(what is|define|meaning of|explain)\b", question_lower))
    is_lic_q = any(
        keyword in question_lower
        for keyword in ["lic", "lecturer in charge", "contact", "email", "office hours"]
    )
    
    # Check for academic integrity related keywords
    is_integrity_q = any(
        keyword in question_lower
        for keyword in ["plagiarism", "academic integrity", "dishonesty", "cheating", 
                       "citation", "paraphrase", "copyright", "originality"]
    )
    
    if is_deadline_q:
        deadlines = get_academic_deadlines()
        if deadlines:
            # Detect specific deadline type
            deadline_type_filter = None
            if "payment" in question_lower:
                deadline_type_filter = "payment"
            elif "registration" in question_lower:
                deadline_type_filter = "module_registration"
            elif "group" in question_lower:
                deadline_type_filter = "group_registration"
            elif "assignment" in question_lower:
                deadline_type_filter = "assignment"
            
            # Filter deadlines if specific type detected
            if deadline_type_filter:
                filtered = [d for d in deadlines if d.get('type') == deadline_type_filter]
            else:
                filtered = deadlines
            
            if filtered:
                # For deadline queries, provide simple format: just the date
                relevant = filtered[0]  # Get first matching deadline
                academic_context += f"{relevant.get('dueDate', '')}\n"
    
    # Only attach LIC/module info when a module code is explicitly mentioned.
    matches = re.findall(r'\b[A-Z]{2}\d{3}\b', question)
    if matches:
        for module_code in matches:
            module_info = get_module_details(module_code)
            if module_info:
                if is_lic_q:
                    # For LIC-only questions, only include LIC information
                    if 'lic' in module_info:
                        lic = module_info['lic']
                        academic_context += f"LIC: {lic.get('name')}\n"
                        academic_context += f"Email: {lic.get('email')}\n"
                        if lic.get('availability'):
                            academic_context += f"Office Hours: {lic.get('availability')}\n"
                else:
                    # For other queries, include full module info
                    academic_context += f"\n\nModule: {module_info.get('name')} ({module_code})\n"
                    if 'lic' in module_info:
                        lic = module_info['lic']
                        academic_context += f"Lecturer in Charge: {lic.get('name')}\n"
                        academic_context += f"Email: {lic.get('email')}\n"
                        academic_context += f"Office: {lic.get('office')}\n"
                        academic_context += f"Availability: {lic.get('availability')}\n"

    # 3) Embed question & retrieve from PDF vector DB
    # For academic integrity questions, try broader search terms
    search_question = question
    if is_integrity_q:
        # Map specific terms to broader concepts for better retrieval
        if "plagiarism" in question_lower or "plgrisam" in question_lower:
            search_question = "academic integrity plagiarism copying"
        elif "citation" in question_lower:
            search_question = "how to cite references academic integrity"
        elif "paraphrase" in question_lower:
            search_question = "paraphrasing plagiarism academic integrity"
    
    emb = embed_texts([search_question])[0]
    results = query(emb, n_results=top_k)
    
    # 4) Build enhanced prompt with strict context filtering
    context_texts = []
    if results.get("documents") and results["documents"][0]:
        for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
            context_texts.append(f"{doc}\n")
    
    pdf_context = "\n---\n".join(context_texts) if context_texts else ""
    has_module_code = bool(matches)

    if (is_deadline_q or (has_module_code and not is_definition_q)) and academic_context.strip():
        # For deadlines or module-specific questions, use only academic data.
        full_context = academic_context
    elif is_definition_q and pdf_context.strip():
        # For concept definitions, use only PDF context.
        full_context = pdf_context
    elif is_integrity_q and pdf_context.strip():
        # For academic integrity questions, prioritize PDF context
        full_context = pdf_context
    else:
        full_context = academic_context + ("\n\n" + pdf_context if pdf_context else "")
    
    if not full_context.strip():
        # Provide more helpful fallback messages based on question type
        if is_integrity_q:
            # Use corrected question for better detection of specific topics
            fallback = _get_integrity_fallback(question)
        elif is_definition_q:
            fallback = "I couldn't find a definition for that in the available documents. Please try rephrasing your question or contact academic support."
        else:
            fallback = "I couldn't find that information in the documents or academic database. Please try asking about assignment deadlines, module details, or academic integrity policies."
        
        return {
            "answer": fallback,
            "sources": results,
        }
    
    # Special handling for LIC queries - tell LLM to return exact format
    if is_lic_q and has_module_code:
        prompt = f"{SYSTEM_INSTRUCTIONS}\n\nContext:\n{full_context}\n\nQuestion: {question}\n\nReturn ONLY the lecturer's name, email, and office hours. Do not add any other information."
    elif is_deadline_q:
        prompt = f"{SYSTEM_INSTRUCTIONS}\n\nContext:\n{full_context}\n\nQuestion: {question}\n\nReturn ONLY the date. No titles, no explanations, just the date in format: Month Day, Year"
    else:
        prompt = f"{SYSTEM_INSTRUCTIONS}\n\nContext:\n{full_context}\n\nQuestion: {question}\n\nProvide a brief, direct answer."
    
    # 5) Generate answer with LLM
    answer = call_ollama(prompt)
    return {"answer": answer, "sources": results}