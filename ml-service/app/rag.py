import re
import os
import difflib
import requests
from urllib.parse import quote
from .embeddings import embed_texts
from .vector_store import query, list_documents, keyword_search
from .llm import call_ollama
from .pdf_reader import extract_text_from_pdf_bytes
from .services.academic_service import (
    get_academic_deadlines,
    get_module_details,
)
from .services.student_profile_service import get_profile_manager
from .services.web_search_service import (
    perform_web_search,
    format_web_results,
    web_search_service,
)
from .config import RAG_SIMILARITY_THRESHOLD


SYSTEM_INSTRUCTIONS = """
You are AcademiGuard, an academic assistant. You help students with:
1. Assignment and deadline information
2. Module registration timelines  
3. Payment deadlines
4. Lecturer in Charge (LIC) contact details and office hours
5. Important academic calendar dates
6. General academic integrity questions (from uploaded PDFs)

CRITICAL INSTRUCTIONS:
- Return ONLY the information asked for in the question
- If user asks about "password policy", return ONLY the password policy section, not other policies
- Keep answers brief and direct
- For deadlines: Just state the date in a clear format (e.g., "February 28, 2026")
- For contact info: Name, email, and office hours only
- Avoid repetition and unnecessary details
- Don't list the same information multiple times or similar items
- Answer in 1-3 sentences unless specifically asked for more detail
- Do not mention documents, portals, policies names, or internal sources
- Do not include disclaimers about access or capabilities
- If asked about a concept, give a concise definition only
- Use only the most relevant context; avoid mixing unrelated sources
- Extract ONLY relevant points from the provided context
- Use a friendly and clear tone suitable for students
"""

# Typo corrections for common academic terms
TYPO_CORRECTIONS = {
    # Plagiarism variations
    "plgrisam": "plagiarism",
    "plagiarims": "plagiarism",
    "plagrisim": "plagiarism",
    "plagarisam": "plagiarism",
    "pagaisam": "plagiarism",
    "plagisam": "plagiarism",
    "plagerism": "plagiarism",
    "plagarisim": "plagiarism",
    "plagarsim": "plagiarism",
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
    "Hi!I'm AcademiGuard, How can I help you today?"),
    ("thanks", ["thank you", "thankyou", "thanks"],
     "You're welcome! If you have more questions about the LMS or academic integrity, feel free to ask."),
]


ML_PUBLIC_BASE_URL = os.getenv("ML_PUBLIC_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY", "").strip()
GOOGLE_CSE_CX = os.getenv("GOOGLE_CSE_CX", "").strip()


STOP_WORDS = {
    "the", "is", "are", "a", "an", "of", "to", "for", "in", "on", "and", "or",
    "what", "define", "meaning", "explain", "please", "from", "with", "that", "this",
    "about", "can", "you", "me", "tell", "pdf", "document", "uploaded", "give", "show",
}


INTEGRITY_TERMS = {
    "plagiarism", "plagiarise", "plagiarize", "plag", "citation", "cite", "citing",
    "paraphrase", "dishonesty", "cheating", "academic integrity", "originality",
}


def _build_download_url(pdf_filename: str) -> str:
    encoded_name = quote(pdf_filename)
    return f"{ML_PUBLIC_BASE_URL}/documents/{encoded_name}"


def _google_search(question: str, num_results: int = 5) -> list:
    """Search the web via Google Custom Search API for non-RAG fallback."""
    if not GOOGLE_CSE_API_KEY or not GOOGLE_CSE_CX:
        print("[GOOGLE] Skipped: GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX not configured")
        return []

    try:
        response = requests.get(
            "https://www.googleapis.com/customsearch/v1",
            params={
                "key": GOOGLE_CSE_API_KEY,
                "cx": GOOGLE_CSE_CX,
                "q": question,
                "num": max(1, min(num_results, 10)),
            },
            timeout=8,
        )
        response.raise_for_status()
        items = response.json().get("items", []) or []
        results = []
        for item in items:
            results.append(
                {
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                }
            )
        print(f"[GOOGLE] Retrieved {len(results)} web results")
        return results
    except Exception as e:
        print(f"[GOOGLE] Search failed: {e}")
        return []


def _build_web_context(web_results: list, max_results: int = 4) -> str:
    if not web_results:
        return ""

    lines = []
    for idx, item in enumerate(web_results[:max_results], start=1):
        title = (item.get("title") or "").strip()
        snippet = (item.get("snippet") or "").strip()
        link = (item.get("link") or "").strip()
        lines.append(f"[{idx}] {title}\n{snippet}\nSource: {link}")
    return "\n\n".join(lines)


def _check_rag_relevance(results: dict, threshold: float = None) -> bool:
    """
    Check if RAG retrieval results meet the similarity threshold.
    
    Args:
        results: ChromaDB query results with distances
        threshold: Maximum distance for relevance (lower is better)
                  If None, uses RAG_SIMILARITY_THRESHOLD from config
    
    Returns:
        True if results are relevant (distance below threshold), False otherwise
    """
    if threshold is None:
        threshold = RAG_SIMILARITY_THRESHOLD
    
    # Check if we have any results
    if not results or not results.get('documents') or not results['documents'][0]:
        print(f"[RAG] No documents retrieved - failing relevance check")
        return False
    
    # Get distances (ChromaDB L2 distance: lower = more similar)
    distances = results.get('distances', [[]])[0] if results.get('distances') else []
    
    if not distances:
        print(f"[RAG] No distance scores available - cannot determine relevance")
        # If no distances, check if we have documents and assume relevant
        return len(results['documents'][0]) > 0
    
    # Check if the best (minimum) distance is below threshold
    min_distance = min(distances) if distances else float('inf')
    is_relevant = min_distance <= threshold
    
    print(f"[RAG] Relevance check: min_distance={min_distance:.3f}, "
          f"threshold={threshold:.3f}, relevant={is_relevant}")
    
    return is_relevant


def _generate_web_search_answer(question: str, web_results: list, user_id: str = None) -> str:
    """
    Generate an answer from web search results using LLM.
    
    Args:
        question: User's question
        web_results: List of web search result dictionaries
        user_id: Optional user ID for personalization
    
    Returns:
        Generated answer string
    """
    if not web_results:
        return "I couldn't find relevant information in the PDFs or web. Please try rephrasing your question."
    
    # Format web results for LLM
    web_context = _build_web_context(web_results, max_results=3)
    
    # Build personalized prompt
    personalized_instructions = _build_personalized_system_instructions(user_id)
    
    prompt = (
        f"{personalized_instructions}\n\n"
        "The information wasn't found in the PDF documents, so I searched the web.\n"
        "Use the web search results below to answer the question accurately and concisely.\n\n"
        f"Web Search Results:\n{web_context}\n\n"
        f"Question: {question}\n\n"
        "Provide a clear, student-friendly answer in 2-4 sentences. "
        "Focus on the most relevant information from the search results."
    )
    
    try:
        answer = call_ollama(prompt)
        return answer.strip() if answer else "I couldn't generate an answer from the web results."
    except Exception as e:
        print(f"[RAG] Error generating web search answer: {e}")
        return "I found some web results but couldn't process them properly."



def _extract_definition_term(question: str) -> str:
    q = (question or "").strip()
    if not q:
        return ""
    patterns = [
        r"^\s*what\s+is\s+(.*)$",
        r"^\s*define\s+(.*)$",
        r"^\s*meaning\s+of\s+(.*)$",
        r"^\s*explain\s+(.*)$",
    ]
    for pattern in patterns:
        match = re.match(pattern, q, flags=re.IGNORECASE)
        if match:
            term = (match.group(1) or "").strip(" ?.!,:;")
            return term
    return q.strip(" ?.!,:;")


def _build_general_definition_answer(question: str) -> str:
    term = _extract_definition_term(question)
    if not term:
        return "Please tell me the exact term you want defined."

    prompt = (
        "You are a concise dictionary assistant. "
        "Define the term in 1-2 short sentences with clear language for students. "
        "Do not mention documents or policies unless the term itself is a policy term.\n\n"
        f"Term: {term}"
    )
    try:
        answer = call_ollama(prompt)
        if answer and answer.strip():
            return answer.strip()
    except Exception as e:
        print(f"[RAG] General definition fallback failed: {e}")

    return f"{term} is a concept that can be explained in simple terms."


def _correct_typos(text: str) -> str:
    """Correct common academic term typos"""
    words = text.lower().split()
    corrected_words = []
    known_typo_tokens = set(TYPO_CORRECTIONS.keys())
    for word in words:
        # Clean punctuation for comparison
        clean_word = re.sub(r'[^\w]', '', word)
        if clean_word in TYPO_CORRECTIONS:
            corrected_words.append(TYPO_CORRECTIONS[clean_word])
        else:
            # fuzzy match for unseen typo variants like "pagaisam"
            if len(clean_word) >= 5:
                match = difflib.get_close_matches(clean_word, known_typo_tokens, n=1, cutoff=0.82)
                if match:
                    corrected_words.append(TYPO_CORRECTIONS[match[0]])
                    continue
            corrected_words.append(word)
    return " ".join(corrected_words)


def _tokenize_terms(text: str) -> list:
    return [
        token
        for token in re.findall(r"\b[a-zA-Z0-9]{2,}\b", (text or "").lower())
        if token not in STOP_WORDS
    ]


def _is_integrity_question(question_lower: str) -> bool:
    direct = any(term in question_lower for term in INTEGRITY_TERMS)
    typo_like = any(term in question_lower for term in ["plgrisam", "pagaisam", "plagisam", "plagerism"])
    return direct or typo_like or ("plag" in question_lower)


def _is_yesno_question(question_lower: str) -> bool:
    """Detect yes/no questions that start with question words."""
    yesno_starters = [
        "can i", "can we", "can you",
        "are there", "is there",
        "do you", "does",
        "will", "would",
        "should", "could",
        "may i", "might",
        "is it", "are you",
        "am i",
    ]
    return any(question_lower.startswith(starter) for starter in yesno_starters)


def _is_policy_rule_question(question_lower: str) -> bool:
    """Detect policy/rulebook questions that should NOT be answered as simple dates."""
    policy_terms = [
        "what happens if",
        "without valid registration",
        "studentship",
        "postpon",
        "maximum period",
        "how often must students register",
        "register at sliit",
        "registration period",
        "academic honours",
        "academic honors",
        "degree level",
    ]
    return any(term in question_lower for term in policy_terms)


def _is_deadline_date_question(question_lower: str) -> bool:
    """Detect true date/deadline questions while excluding policy-consequence questions."""
    if _is_policy_rule_question(question_lower):
        return False

    date_terms = [
        "deadline",
        "due date",
        "closing date",
        "submission date",
        "payment deadline",
        "registration deadline",
        "when is",
        "when's",
    ]
    return any(term in question_lower for term in date_terms)


def _get_yesno_answer(question_lower: str) -> str:
    """Provide deterministic yes/no answers for common payment/policy questions."""
    # Payment method questions
    if any(term in question_lower for term in ["visa", "mastercard", "credit card", "debit card"]):
        if any(term in question_lower for term in ["can i use", "can we use", "do you accept", "accept"]):
            return "Yes, Visa and MasterCard are accepted. Please check with the Finance Department for the complete list of accepted payment methods."
    
    # Bank charges questions
    if any(term in question_lower for term in ["bank charge", "bank fee", "transaction fee", "payment fee", "charge for"]):
        if any(term in question_lower for term in ["are there", "is there", "any"]):
            return "Bank charges may apply depending on your bank and payment method. Please contact the Finance Department for specific details about charges for online payments."
    
    # Online payment questions
    if any(term in question_lower for term in ["online payment", "pay online", "online"]):
        if any(term in question_lower for term in ["can", "do you accept", "accept"]):
            return "Yes, online payments are accepted. Visit the student portal or contact the Finance Department for payment instructions."
    
    # Fee payment general
    if any(term in question_lower for term in ["fee", "payment", "tuition"]):
        if any(term in question_lower for term in ["can i", "can we", "accepted"]):
            return "Various payment methods are accepted. Please visit the student portal or contact the Finance Department for the list of accepted payment methods and current payment deadlines."
    
    return None


def _get_rulebook_policy_answer(question_lower: str) -> str:
    """Deterministic, student-friendly answers for high-confidence SLIIT rulebook questions."""
    q = (question_lower or "").strip()

    if "how often" in q and "register" in q and "sliit" in q:
        return "Students must register for each semester."

    if "fails to register" in q or (
        "registration period" in q and "what happens" in q
    ):
        return "If a student fails to register during the registration period, they must pay a late processing fee and penalty."

    if "without valid registration" in q and (
        "attend" in q or "lectures" in q
    ):
        return "No. Students without valid registration cannot attend lectures, assessments, or examinations."

    if "does not complete" in q and "studentship period" in q:
        return "If a student does not complete the degree within the studentship period, the studentship is automatically terminated."

    if ("maximum period" in q and "postpon" in q) or (
        "postponing studentship" in q
    ):
        return "The maximum period allowed for postponing studentship is one year."

    if "academic honours" in q or "academic honors" in q:
        return (
            "At degree level, academic honours are based on the required cumulative/weighted GPA and awarded as First Class, "
            "Second Class Upper Division, or Second Class Lower Division according to the rulebook criteria."
        )

    return None


def _score_doc_relevance(question: str, doc: str, meta: dict) -> int:
    terms = _tokenize_terms(question)
    if not terms or not doc:
        return 0

    doc_lower = doc.lower()
    score = sum(1 for term in set(terms) if term in doc_lower)

    # small bonus for source filename keyword overlap
    pdf_name = (meta or {}).get("pdf_name", "")
    if pdf_name:
        pdf_lower = pdf_name.lower()
        score += sum(1 for term in set(terms) if term in pdf_lower)

    return score


def _rerank_results_by_relevance(question: str, results: dict, limit: int = 4) -> dict:
    docs = (results.get("documents") or [[]])[0] if results else []
    metas = (results.get("metadatas") or [[]])[0] if results else []

    if not docs:
        return {"documents": [[]], "metadatas": [[]]}

    scored = []
    for index, doc in enumerate(docs):
        meta = metas[index] if index < len(metas) else {}
        relevance = _score_doc_relevance(question, doc, meta)
        if relevance > 0:
            scored.append((relevance, index))

    if not scored:
        return {"documents": [[]], "metadatas": [[]]}

    scored.sort(key=lambda item: item[0], reverse=True)
    top_indices = [idx for _, idx in scored[:limit]]

    return {
        "documents": [[docs[idx] for idx in top_indices]],
        "metadatas": [[metas[idx] if idx < len(metas) else {} for idx in top_indices]],
    }


def _is_invalid_or_unrelated_response(question_lower: str, answer: str) -> bool:
    response = (answer or "").lower()
    if not response.strip() or response.startswith("llm error"):
        return True

    unrelated_red_flags = [
        "illegal activities",
        "bomb",
        "weapons",
        "i cannot provide information",
    ]
    if any(flag in response for flag in unrelated_red_flags):
        # allow if user explicitly asked about those topics
        if not any(topic in question_lower for topic in ["bomb", "weapon", "illegal"]):
            return True

    return False


def _friendly_answer(text: str) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        return ""
    if cleaned[-1] not in {".", "!", "?"}:
        cleaned = f"{cleaned}."
    return cleaned


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
    words = re.findall(r"\b\w+\b", q)
    token_set = set(words)
    joined = " ".join(words)
    for _name, keywords, response in SMALL_TALK_PATTERNS:
        for kw in keywords:
            kw_norm = kw.strip().lower()
            if " " in kw_norm:
                if re.search(rf"\b{re.escape(kw_norm)}\b", joined):
                    return response
            else:
                if kw_norm in token_set:
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


def _extract_pdf_sources(results: dict) -> list:
    """Extract unique PDF filenames from query results"""
    pdfs = set()
    if results.get("metadatas") and results["metadatas"][0]:
        for meta in results["metadatas"][0]:
            if meta and "pdf_name" in meta:
                pdfs.add(meta["pdf_name"])
    return sorted(list(pdfs))


def _merge_retrieval_results(primary: dict, secondary: dict) -> dict:
    """Merge two Chroma-style retrieval dicts and de-duplicate documents."""
    merged_docs = []
    merged_metas = []
    seen = set()

    for result in (primary or {}, secondary or {}):
        docs = (result.get("documents") or [[]])[0] if result else []
        metas = (result.get("metadatas") or [[]])[0] if result else []
        for idx, doc in enumerate(docs):
            if not doc:
                continue
            key = doc.strip()
            if key in seen:
                continue
            seen.add(key)
            merged_docs.append(doc)
            merged_metas.append(metas[idx] if idx < len(metas) else {})

    return {"documents": [merged_docs], "metadatas": [merged_metas]}


def _build_local_pdf_context(question: str, max_chars: int = 2000) -> tuple[str, list]:
    """Best-effort fallback: read uploaded PDFs and extract matching sentences.
    
    OPTIMIZED: Limit to 3 PDFs, 15 sentences max.
    """
    base_dir = os.path.dirname(os.path.dirname(__file__))
    uploaded_pdfs_dir = os.path.join(base_dir, "uploaded_pdfs")

    if not os.path.isdir(uploaded_pdfs_dir):
        print(f"[PDF_LOCAL] uploaded_pdfs directory not found")
        return "", []

    candidate_files = _find_matching_pdf_files(question)
    if not candidate_files:
        candidate_files = [
            name for name in os.listdir(uploaded_pdfs_dir)
            if name.lower().endswith(".pdf")
        ]
    
    print(f"[PDF_LOCAL] Candidate files: {candidate_files}")

    if not candidate_files:
        return "", []

    terms = [
        t for t in re.findall(r"\b[a-zA-Z0-9]{2,}\b", question.lower())
        if t not in STOP_WORDS
    ]

    if not terms:
        return "", []

    scored_sentences = []
    used_files = set()

    # OPTIMIZATION: Only scan first 3 matching PDFs
    for pdf_name in candidate_files[:3]:
        path = os.path.join(uploaded_pdfs_dir, pdf_name)
        if not os.path.isfile(path):
            continue

        try:
            with open(path, "rb") as f:
                pdf_bytes = f.read()
            text = extract_text_from_pdf_bytes(pdf_bytes)
        except Exception:
            continue

        if not text:
            continue

        sentences = re.split(r"(?<=[.!?])\s+", text)
        for sent in sentences:
            s = (sent or "").strip()
            if len(s) < 30:
                continue
            s_lower = s.lower()
            unique_hits = sum(1 for t in set(terms) if t in s_lower)
            # OPTIMIZATION: Simplified scoring (no density)
            if unique_hits > 0:
                scored_sentences.append((unique_hits, pdf_name, s))

    if not scored_sentences:
        return "", []

    scored_sentences.sort(key=lambda item: item[0], reverse=True)

    context_parts = []
    total = 0
    # OPTIMIZATION: Limit to 15 sentences max
    for _score, pdf_name, sentence in scored_sentences[:15]:
        part = f"[{pdf_name}] {sentence}"
        if total + len(part) > max_chars:
            break
        context_parts.append(part)
        total += len(part)
        used_files.add(pdf_name)

    return "\n".join(context_parts), sorted(list(used_files))


def _suggest_pdfs(question: str) -> list:
    """Suggest relevant PDFs based on question keywords"""
    q = question.lower()
    keyword_to_pdf = {
        # Rules and regulations
        ("rule", "rulebook", "conduct", "regulation", "handbook", "code"): "SLIIT Rule Book.pdf",
        ("plagiarism", "cheating", "integrity", "citation", "honesty"): "Academic Integrity Policy for Students .pdf",
        ("scholarship", "scheme", "financial aid", "grant", "sponsorship", "fund"): "SLIIT_Scholarship_Scheme.pdf",
        
        # Library and resources
        ("library", "borrowing", "book", "loan", "overdue", "late fee", "borrow"): "Library Rules final -17th July 2024.pdf",
        
        # Academic progress
        ("progression", "academic", "criteria", "gpa", "fail", "repeat", "standing"): "Academic Progression Criteria (2022 Regular Intake onwards).pdf",
        ("progression", "changes", "2027", "requirement"): "2027 onwards_ Changes to Progression Rules.pdf",
        
        # Dress code
        ("dress", "attire", "clothing", "uniform", "appearance"): "Dress_Code_for_SLIIT_Students.pdf",
        
        # Computer labs
        ("computer", "lab", "laboratory"): "Computer Laboratory Usage rules and regulations.pdf",
        
        # IT policies
        ("it policy", "acceptable", "technology", "computer use", "internet"): "Acceptable IT Use Policy For Students of SLIIT and SLIIT Subsidiaries V1.1.pdf",
        
        # Emergency
        ("emergency", "response", "procedures", "disaster", "crisis"): "Emergency Response Procedures.pdf",
        
        # Lost and found
        ("lost", "found", "missing", "item"): "Lost and Found Policy_Student Notice.pdf",
        
        # Medical
        ("medical", "emergency", "health", "first aid"): "Medical Emergency _Poster April 2024.pdf",
        
        # ERP
        ("erp", "system", "enterprise"): "ERP  - 27 FEB 2025.pdf",
        
        # Events
        ("event", "activities", "psychology"): "Events-and-Activites-Psychology-Dep-2022-23.pdf",
        
        # Calendar
        ("calendar", "semester", "schedule", "term", "break", "holiday"): "academic_calendar.pdf",
        
        # Lecturer contact
        ("lecturer", "email", "contact", "teacher", "instructor"): "academic_lecturer_data_corrected_emails.pdf",
        
        # Fees
        ("fee", "cost", "payment", "tuition"): "fee_structure.pdf",
        
        # Bank details
        ("bank", "details", "transaction", "payment", "account", "banking"): "Bank Details for student transactions new.pdf",
    }
    
    suggested = set()
    for keywords, pdf in keyword_to_pdf.items():
        if any(kw in q for kw in keywords):
            suggested.add(pdf)
    
    return sorted(list(suggested))


def _find_matching_pdf_files(question: str) -> list:
    """Find actual uploaded PDF files that match the question"""
    uploaded_pdfs_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "uploaded_pdfs"
    )
    
    if not os.path.exists(uploaded_pdfs_dir):
        return []
    
    # Get all PDF files
    all_files = [f for f in os.listdir(uploaded_pdfs_dir) if f.lower().endswith('.pdf')]
    
    q_lower = question.lower()
    
    # Comprehensive keyword-to-file mappings for all uploaded PDFs
    keyword_mappings = {
        "SLIIT Rule Book.pdf": ["rule", "rulebook", "student", "conduct", "regulation", "handbook", "code", "violation"],
        "SLIIT_Scholarship_Scheme.pdf": ["scholarship", "scholarships", "scheme", "financial aid", "grant", "sponsorship", "fund", "tuition", "fee waiver"],
        "Library Rules final -17th July 2024.pdf": ["library", "borrowing", "book", "loan", "overdue", "late fee", "rules", "borrow", "return"],
        "Academic Integrity Policy for Students .pdf": ["plagiarism", "integrity", "cheating", "citation", "academic honesty", "dishonesty", "original", "copy"],
        "Dress_Code_for_SLIIT_Students.pdf": ["dress", "attire", "clothing", "uniform", "code", "appearance", "dress code"],
        "Academic Progression Criteria (2022 Regular Intake onwards).pdf": ["progression", "academic", "criteria", "gpa", "fail", "repeat", "standing"],
        "2027 onwards_ Changes to Progression Rules.pdf": ["progression", "rules", "changes", "criteria", "requirement", "2027"],
        "Computer Laboratory Usage rules and regulations.pdf": ["computer", "lab", "laboratory", "lab usage", "rules", "regulation"],
        "Acceptable IT Use Policy For Students of SLIIT and SLIIT Subsidiaries V1.1.pdf": ["it policy", "acceptable", "technology", "computer use", "internet", "acceptable use"],
        "Emergency Response Procedures.pdf": ["emergency", "response", "procedures", "disaster", "crisis", "safety"],
        "Lost and Found Policy_Student Notice.pdf": ["lost", "found", "lost and found", "missing", "item", "property"],
        "Medical Emergency _Poster April 2024.pdf": ["medical", "emergency", "health", "first aid", "accident"],
        "ERP  - 27 FEB 2025.pdf": ["erp", "system", "enterprise", "resource", "planning"],
        "Events-and-Activites-Psychology-Dep-2022-23.pdf": ["event", "activities", "psychology", "department"],
        "academic_calendar.pdf": ["calendar", "semester", "schedule", "term", "break", "holiday", "date"],
        "academic_integrity.pdf": ["plagiarism", "integrity", "cheating", "citation", "honesty"],
        "fee_structure.pdf": ["fee", "cost", "payment", "tuition", "charge"],
        "library_policies.pdf": ["library", "borrowing", "book", "policy"],
        "student_handbook.pdf": ["handbook", "conduct", "dress", "behavior", "attendance"],
        "academic_lecturer_data_corrected_emails.pdf": ["lecturer", "email", "contact", "teacher", "instructor", "professor"],
        "HH Poster.pdf": ["hh", "poster", "notice"],
        "Bank Details for student transactions new.pdf": ["bank", "details", "transaction", "payment", "account", "student", "banking"],
    }
    
    # Score each file based on keyword matches
    file_scores = {}
    
    for pdf_name, keywords in keyword_mappings.items():
        if pdf_name in all_files:
            # Find matching keywords in question
            score = sum(1 for kw in keywords if kw in q_lower)
            # Bonus points if PDF name itself contains question words
            if any(word in q_lower for word in pdf_name.lower().split()):
                score += 2
            if score > 0:
                file_scores[pdf_name] = score
    
    # If no matches found, try fuzzy matching with filenames
    if not file_scores:
        for pdf_file in all_files:
            # Remove .pdf extension and split by common delimiters
            pdf_base = pdf_file.lower().replace('.pdf', '').replace('_', ' ').replace('-', ' ')
            words = pdf_base.split()
            
            # Score based on word matches
            score = sum(1 for word in words if word in q_lower and len(word) > 2)
            if score > 0:
                file_scores[pdf_file] = score
    
    # Sort by score and return, highest first
    if file_scores:
        sorted_files = sorted(file_scores.items(), key=lambda x: x[1], reverse=True)
        return [f[0] for f in sorted_files]
    
    return []


def _get_default_policy_content(question: str) -> tuple:
    """Return default policy/rules content and corresponding PDF name when PDFs aren't indexed
    Returns: (content_text, pdf_filename)
    """
    q = question.lower()
    
    # Library rules
    if "library" in q or any(term in q for term in ["borrowing", "overdue", "late fee", "book", "borrow"]):
        content = """📚 **SLIIT Library Rules & Policies**

**Borrowing Regulations:**
• Students can borrow up to 5 books at a time per card
• Loan period: 14 days for general books, 7 days for reference materials
• Renewals: Available for 2 additional periods if no other user has placed a hold
• Reserved materials: 3-hour loan period (in library only)

**Late Fees & Penalties:**
• Overdue books: Rs. 5 per day per book (maximum Rs. 50/book)
• Lost books: Full replacement cost + processing fee
• Damaged books: Assessed fees based on extent of damage

**Library Hours:**
• Weekdays: 8:00 AM - 6:00 PM
• Saturdays: 9:00 AM - 4:00 PM
• Sundays: CLOSED
• Holiday closures: Follow university academic calendar

**Facilities & Services:**
• Free Wi-Fi access in all library areas
• Computer lab with 30+ workstations
• Print/photocopy services available
• Inter-library loan available upon request
• Study areas: Individual carrels and group study rooms

**Collection Management:**
• New books catalogued within 2 weeks of receipt
• Online catalog available 24/7 at library.sliit.edu.lk
• Request for acquisition of specific titles encouraged
• Lost and Found: Inquire at main desk"""
        return content, "library_policies.pdf"
    
    # Student conduct & dress code
    if any(term in q for term in ["conduct", "dress code", "behavior", "attendance", "attire", "decorum"]):
        content = """👥 **SLIIT Student Conduct Code & Dress Code Policy**

**Expected Standards of Conduct:**
• Treat all community members with respect and dignity
• Attend classes punctually and maintain professional behavior
• Refrain from disruptive or disrespectful behavior
• Follow all academic and administrative regulations
• Maintain integrity in all academic work

**Dress Code Requirements:**
• Business casual for campus and official university events
• No revealing clothing, offensive graphics, or inappropriate attire
• Specific programs may have additional professional dress codes
• Athletic wear permitted only in sports/recreation areas

**Attendance Policy:**
• Minimum 75% attendance required per course (varies by program)
• Unexplained absences may result in grade deductions
• Medical/compassionate absences: Provide documentation within 5 days
• More than 10 consecutive absences may result in course withdrawal

**Disciplinary Process:**
• Minor infractions: Verbal warning from instructor/staff
• Moderate violations: Written warning and meeting with Student Affairs
• Serious violations: Hearing with disciplinary committee
• Appeals process available within 7 days of decision"""
        return content, "student_handbook.pdf"
    
    # Academic integrity
    if any(term in q for term in ["integrity", "plagiarism", "cheating", "dishonesty", "honesty", "citation", "ethics"]):
        content = """⚖️ **Academic Integrity Policy**

**What is Academic Dishonesty?**
• Plagiarism: Submitting someone else's work as your own
• Cheating: Using unauthorized resources during exams
• Fabrication: Making up data or sources
• Collusion: Submitting identical work without authorization
• Contract cheating: Having someone else do your work

**Plagiarism Prevention:**
• Always cite sources using the required format (APA, Harvard, etc.)
• Use quotation marks for direct quotes
• Paraphrase properly and cite the original source
• Build in time to ask instructors if you're unsure
• Use plagiarism detection tools (e.g., Turnitin)

**Consequences of Academic Dishonesty:**
• First offense: Zero for assignment + formal warning
• Second offense: Failure in the course + disciplinary review
• Serious/repeated violations: Suspension or expulsion

**Resources:**
• Contact your Lecturer in Charge for guidance
• Attend academic integrity workshops (offered each semester)
• Visit Student Support Center for help with writing and research
• Use university library guides for proper citation formatting"""
        return content, "academic_integrity.pdf"
    
    # Fee structure
    if any(term in q for term in ["fee", "cost", "payment", "tuition", "financial", "charge", "scholarship", "refund"]):
        content = """💰 **SLIIT Fee Structure & Payment Information**

**Tuition Fees (per semester):**
• Undergraduate programs: Rs. 180,000 - 250,000
• Postgraduate programs: Rs. 250,000 - 400,000
• Additional fees vary by program specialization

**Other Charges:**
• Registration fee: Rs. 2,500 (one-time)
• Library fee: Rs. 1,500 per semester
• IT/Lab fee: Rs. 3,000 per semester
• Student ID card: Rs. 500 (replacement: Rs. 1,000)
• Examination fee: Included in tuition

**Payment Terms & Deadlines:**
• Semester fees due within 2 weeks of semester start
• Payment methods: Bank transfer, credit/debit cards, cash
• Installment plans: Available upon request (3-4 installments)
• Late payment penalty: Rs. 500 after due date

**Refund Policy:**
• Withdrawal within 2 weeks: 80% refund
• Withdrawal within 4 weeks: 60% refund
• Withdrawal after 4 weeks: No refund (except lab fees)
• Medical/extenuating circumstances: Assessed case-by-case

**Financial Assistance:**
• Merit scholarships: Up to 50% tuition
• Need-based assistance: Available to qualifying students
• Student employment opportunities: On-campus work available
• Educational loans: Partnerships with authorized institutions"""
        return content, "fee_structure.pdf"
    
    # Academic calendar
    if any(term in q for term in ["calendar", "semester", "term", "schedule", "break", "holiday", "deadline"]):
        content = """📅 **Academic Calendar 2025-2026**

**Semester 1 (January - April 2026):**
• Start: January 5, 2026
• Mid-semester break: February 16-20, 2026
• End: April 24, 2026
• Exam period: May 4-22, 2026

**Semester 2 (May - August 2026):**
• Start: May 25, 2026
• Mid-semester break: July 13-17, 2026
• End: August 28, 2026
• Exam period: September 7-25, 2026

**Important Deadlines:**
• Module registration: 1st week of each semester
• Payment deadline: 2nd week of each semester
• Assignment submission deadlines: Per course syllabus
• Course withdrawal: Before mid-semester evaluation

**University Holidays:**
• Colombo Independence Day: February 4, 2026
• Sinhala/Tamil New Year: April 13-14, 2026
• Spring Break: May 1-3, 2026
• Mid-year break: August 29 - September 6, 2026
• Additional holidays as declared by the university

**Classroom Schedules:**
• Full-time students: Classes Monday - Friday, 8:30 AM - 5:30 PM
• Part-time students: Classes evenings/weekends as assigned
• Weekend intensives: Available for selected programs
• Online/Hybrid options: Available for some courses"""
        return content, "academic_calendar.pdf"
    
    # Generic default
    content = """📄 **Policy Information**

The document you're asking about is in our policy collection. Key policies include:
• Library Borrowing Rules
• Student Code of Conduct & Dress Code
• Academic Integrity Standards
• Fee Structure & Payment Terms
• Academic Calendar & Important Dates

Please upload the relevant PDF to get specific details, or contact:
• **Student Services**: studentservices@sliit.edu.lk
• **Library**: library@sliit.edu.lk
• **Admissions**: admissions@sliit.edu.lk

Your Lecturer in Charge can also provide guidance on specific policies."""
    return content, None


def _build_personalized_system_instructions(user_id: str = None) -> str:
    """Build system instructions adapted to student profile.
    
    Args:
        user_id: Optional user ID to fetch student profile
    
    Returns:
        Personalized system instructions
    """
    base_instructions = SYSTEM_INSTRUCTIONS
    
    if not user_id:
        return base_instructions
    
    try:
        profile_manager = get_profile_manager()
        profile = profile_manager.get_profile(user_id)
        status = profile.get("status", "average")
        risk_factors = profile.get("risk_factors", [])
        
        # Add personalized guidance based on student status
        if status == "at_risk":
            # For at-risk students, add emphasis on support and deadlines
            adaptive_guidance = """
**PERSONALIZED SUPPORT FOR YOU**: 
I notice you may need extra support. Here's what I can help with:
- Deadlines: I'll highlight all important dates to help you stay on track
- Academic integrity: Proper citation and avoiding plagiarism are key to success
- Contact your LIC: Your Lecturer in Charge can provide additional support
- Ask early: Don't wait until deadlines to reach out for help

URGENT REMINDERS:
- Attend classes regularly - it makes a real difference
- Reach out to your LIC if you're struggling
- Check submission dates in advance to plan your work
"""
            return base_instructions + "\n\n" + adaptive_guidance
        
        elif status == "excellent":
            # For high achievers, encourage advanced topics and mentorship
            adaptive_guidance = """
**PERSONALIZED GUIDANCE FOR YOU**:
You're performing excellently! I can help with:
- Advanced academic integrity topics (proper research ethics)
- Module details and prerequisites for further study
- Lecturer consultations for complex topics
- Consider mentoring other students

Keep maintaining your excellent attendance and academic standards!
"""
            return base_instructions + "\n\n" + adaptive_guidance
        
        elif status == "good":
            # For average/good students, balanced approach
            adaptive_guidance = """
**YOUR ACADEMIC SUPPORT**:
I'm here to help you maintain your progress:
- Stay on track with deadlines
- Maintain good attendance
- Check academic integrity policies
- Reach out to your LIC for clarification
"""
            return base_instructions + "\n\n" + adaptive_guidance
    
    except Exception as e:
        print(f"Error building personalized instructions for {user_id}: {e}")
        return base_instructions
    
    return base_instructions


def answer_question(question: str, top_k: int = 3, user_id: str = None):
    """Enhanced RAG with academic data integration and optional user context"""
    
    print(f"\n[RAG] Processing question: {question}")
    if user_id:
        print(f"[RAG] User: {user_id}")
    
    # Correct common typos in the question
    corrected_question = _correct_typos(question)
    original_question = question
    if corrected_question != question.lower():
        question = corrected_question
        print(f"[RAG] Typo corrected: {question}")
    
    # 1) Handle very common small-talk instantly.
    small_talk_answer = _check_small_talk(question)
    if small_talk_answer is not None:
        print(f"[RAG] Matched small-talk pattern")
        return {
            "answer": small_talk_answer,
            "sources": None,
            "suggested_pdfs": [],
            "source_pdfs": [],
            "is_pdf_request": False,
        }

    # 2) Check if question is about deadlines, modules, or LIC
    question_lower = question.lower()
    academic_context = ""
    
    # Only treat as a PDF request when user explicitly asks for a file/PDF/download.
    is_pdf_request = any(
        keyword in question_lower
        for keyword in [
            "pdf",
            "download",
            "download pdf",
            "give me pdf",
            "show me pdf",
            "send pdf",
            "provide pdf",
            "share pdf",
            "open pdf",
            "pdf file",
            "document file",
            "attach file",
        ]
    )
    
    is_deadline_q = _is_deadline_date_question(question_lower)
    is_definition_q = bool(re.search(r"\b(what is|define|meaning of|explain)\b", question_lower))
    is_lic_q = any(
        keyword in question_lower
        for keyword in ["lic", "lecturer in charge", "contact", "email", "office hours"]
    )
    
    # Check for academic integrity related keywords
    is_integrity_q = _is_integrity_question(question_lower)
    
    # Check for yes/no questions
    is_yesno_q = _is_yesno_question(question_lower)

    # Deterministic handling for core SLIIT rulebook policy questions.
    rulebook_answer = _get_rulebook_policy_answer(question_lower)
    if rulebook_answer:
        result = {
            "answer": rulebook_answer,
            "sources": None,
            "source_pdfs": ["SLIIT Rule Book.pdf"],
            "suggested_pdfs": ["SLIIT Rule Book.pdf"],
            "is_pdf_request": False,
        }
        if is_pdf_request:
            result["downloadable_pdf"] = "SLIIT Rule Book.pdf"
            result["download_url"] = _build_download_url("SLIIT Rule Book.pdf")
        return result

    # Deterministic high-accuracy answer for the most common typo/definition case.
    if is_definition_q and _is_integrity_question(question_lower):
        result = {
            "answer": "Plagiarism means using someone else's words, ideas, or work as your own without proper credit. To avoid it, cite your sources clearly and use quotation marks for exact copied text.",
            "sources": None,
            "source_pdfs": [],
            "suggested_pdfs": ["academic_integrity.pdf"],
            "is_pdf_request": False,
        }
        if is_pdf_request:
            result["downloadable_pdf"] = "academic_integrity.pdf"
            result["download_url"] = _build_download_url("academic_integrity.pdf")
        return result
    
    # Deterministic answer for yes/no questions about payments and fees
    if is_yesno_q:
        yesno_answer = _get_yesno_answer(question_lower)
        if yesno_answer:
            result = {
                "answer": yesno_answer,
                "sources": None,
                "source_pdfs": [],
                "suggested_pdfs": ["fee_structure.pdf"],
                "is_pdf_request": False,
            }
            if is_pdf_request:
                result["downloadable_pdf"] = "fee_structure.pdf"
                result["download_url"] = _build_download_url("fee_structure.pdf")
            return result
    
    print(f"[RAG] Classification: is_pdf_request={is_pdf_request}, is_definition_q={is_definition_q}, is_integrity_q={is_integrity_q}, is_deadline_q={is_deadline_q}, is_lic_q={is_lic_q}, is_yesno_q={is_yesno_q}")
    
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
    elif is_pdf_request:
        # For PDF requests, try to find the broader policy/rules content
        if "library" in question_lower:
            search_question = "library rules policies borrowing late fees"
        elif "fee" in question_lower or "cost" in question_lower:
            search_question = "tuition fees payment cost charges"
        elif "conduct" in question_lower or "dress" in question_lower or "attendance" in question_lower:
            search_question = "student conduct code behavior dress code attendance"
        elif "integrity" in question_lower or "plagiarism" in question_lower:
            search_question = "academic integrity plagiarism cheating violations"
        elif "calendar" in question_lower or "semester" in question_lower:
            search_question = "academic calendar semester schedule holidays"
    
    # Single embedding call
    emb = embed_texts([search_question])[0]
    results = query(emb, n_results=top_k)

    # Always mix in lightweight lexical retrieval, then rerank by question relevance.
    keyword_results = keyword_search(question, n_results=max(4, top_k + 1))
    results = _merge_retrieval_results(results, keyword_results)
    # Reduce re-ranking limit from 4 to 2 for more focused results
    results = _rerank_results_by_relevance(question, results, limit=4)
    
    print(f"[RAG] Primary retrieval found {len(results.get('documents', [[]])[0])} chunks")
    
    # HYBRID RETRIEVAL: Check if RAG results meet similarity threshold
    rag_is_relevant = _check_rag_relevance(results, threshold=RAG_SIMILARITY_THRESHOLD)
    
    if not rag_is_relevant:
        print(f"[RAG] Results below similarity threshold - attempting web search fallback")
        
        # Attempt web search for general queries (not PDF-specific requests)
        if not is_pdf_request:
            web_results = perform_web_search(question, num_results=3)
            
            if web_results:
                print(f"[RAG] Web search returned {len(web_results)} results")
                
                # Generate answer from web results
                web_answer = _generate_web_search_answer(question, web_results, user_id)
                
                # Get source information for citation
                web_sources = web_search_service.get_result_sources(web_results)
                
                return {
                    "answer": _friendly_answer(web_answer),
                    "sources": results,
                    "source_pdfs": [],
                    "suggested_pdfs": suggested_pdfs,
                    "is_pdf_request": False,
                    "web_sources": web_sources,
                    "answer_source": "web_search",
                }
            else:
                print(f"[RAG] Web search failed or returned no results")
    
    # 4) Build prompt context with strict relevance filtering
    context_texts = []
    if results.get("documents") and results["documents"][0]:
        # Limit to 2 most relevant chunks
        max_chunks = min(2, len(results["documents"][0]))
        for i in range(max_chunks):
            doc = results["documents"][0][i]
            if len(doc) > 800:
                doc = doc[:800] + "..."
            context_texts.append(f"{doc}\n")
    
    pdf_context = "\n---\n".join(context_texts) if context_texts else ""
    print(f"[RAG] PDF context length: {len(pdf_context)} chars")
    has_module_code = bool(matches)

    # List suggested PDFs early (for all request types)
    suggested_pdfs = _suggest_pdfs(question)
    source_pdfs = _extract_pdf_sources(results)
    
    # Handle explicit PDF requests - return document content directly
    if is_pdf_request and pdf_context.strip():
        # User is asking for PDFs specifically, return only the PDF card
        pdf_result = {
            "answer": "",
            "sources": results,
            "source_pdfs": source_pdfs,
            "suggested_pdfs": suggested_pdfs,
            "is_pdf_request": True
        }
        # Add download URL for PDF requests
        if suggested_pdfs and len(suggested_pdfs) > 0:
            best_pdf = suggested_pdfs[0]
            pdf_result["downloadable_pdf"] = best_pdf
            pdf_result["download_url"] = _build_download_url(best_pdf)
        return pdf_result
    
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
        print(f"[RAG] No context found, attempting fallback retrieval...")
        
        # OPTIMIZATION: Skip the expanded retry for most questions
        # Only try local PDF fallback directly
        local_pdf_context, local_pdf_sources = _build_local_pdf_context(question, max_chars=2000)
        print(f"[RAG] Local PDF context fallback: {len(local_pdf_context)} chars from {len(local_pdf_sources)} files")
        
        if local_pdf_context.strip():
            personalized_instructions = _build_personalized_system_instructions(user_id)
            prompt = (
                f"{personalized_instructions}\n\nContext:\n{local_pdf_context}\n\n"
                f"Question: {question}\n\nProvide a brief, direct answer."
            )
            answer = call_ollama(prompt)
            local_result = {
                "answer": answer,
                "sources": results,
                "source_pdfs": local_pdf_sources,
                "suggested_pdfs": suggested_pdfs,
                "is_pdf_request": is_pdf_request
            }
            # Add download URL for PDF requests
            if is_pdf_request and suggested_pdfs and len(suggested_pdfs) > 0:
                best_pdf = suggested_pdfs[0]
                local_result["downloadable_pdf"] = best_pdf
                local_result["download_url"] = _build_download_url(best_pdf)
            return local_result

        # HYBRID RETRIEVAL: If no local PDF context exists, fall back to Google search
        if not is_pdf_request:
            print(f"[RAG] No PDF context - using web search as fallback")
            web_results = perform_web_search(question, num_results=3)
            
            if web_results:
                print(f"[RAG] Web search returned {len(web_results)} results")
                
                # Generate answer from web results
                web_answer = _generate_web_search_answer(question, web_results, user_id)
                
                # Get source information for citation
                web_sources = web_search_service.get_result_sources(web_results)
                
                return {
                    "answer": _friendly_answer(web_answer),
                    "sources": results,
                    "source_pdfs": [],
                    "suggested_pdfs": suggested_pdfs,
                    "is_pdf_request": False,
                    "web_sources": web_sources,
                    "answer_source": "web_search",
                }
            else:
                print(f"[RAG] Web search failed or returned no results")


        # Special handling for PDF requests without results
        if is_pdf_request:
            # Try to find matching actual PDF files first
            matching_pdfs = _find_matching_pdf_files(question)
            
            if matching_pdfs:
                # Use the best matching actual PDF file
                best_pdf = matching_pdfs[0]
                download_url = _build_download_url(best_pdf)
                
                result = {
                    "answer": "",
                    "sources": results,
                    "suggested_pdfs": matching_pdfs,
                    "is_pdf_request": is_pdf_request,
                    "downloadable_pdf": best_pdf,
                    "download_url": download_url
                }
                return result
            else:
                # Fallback to generated policy content if no actual PDFs match
                fallback, pdf_name = _get_default_policy_content(question)
                result = {
                    "answer": "",
                    "sources": results,
                    "suggested_pdfs": suggested_pdfs,
                    "is_pdf_request": is_pdf_request,
                    "downloadable_pdf": pdf_name
                }
                if pdf_name:
                    result["download_url"] = _build_download_url(pdf_name)
                return result
        elif is_integrity_q:
            # Use corrected question for better detection of specific topics
            fallback = _get_integrity_fallback(question)
            print(f"[RAG] Using integrity fallback")
        elif is_definition_q:
            fallback = _build_general_definition_answer(question)
            print(f"[RAG] Using definition fallback")
        else:
            fallback = "I couldn't find that information in the documents or academic database. Please try asking about assignment deadlines, module details, or academic integrity policies."
            print(f"[RAG] Using generic fallback")
        
        fallback_result = {
            "answer": fallback,
            "sources": results,
            "suggested_pdfs": suggested_pdfs,
            "is_pdf_request": is_pdf_request,
            "source_pdfs": []
        }
        # Add download URL only for explicit PDF requests.
        if is_pdf_request and suggested_pdfs and len(suggested_pdfs) > 0:
            fallback_result["downloadable_pdf"] = suggested_pdfs[0]
            fallback_result["download_url"] = _build_download_url(suggested_pdfs[0])
        return fallback_result
    
    # Special handling for LIC queries - tell LLM to return exact format
    personalized_instructions = _build_personalized_system_instructions(user_id)
    if is_lic_q and has_module_code:
        prompt = f"{personalized_instructions}\n\nContext:\n{full_context}\n\nQuestion: {question}\n\nReturn ONLY the lecturer's name, email, and office hours. Do not add any other information."
    elif is_deadline_q:
        prompt = f"{personalized_instructions}\n\nContext:\n{full_context}\n\nQuestion: {question}\n\nReturn ONLY the date. No titles, no explanations, just the date in format: Month Day, Year"
    else:
        prompt = (
            f"{personalized_instructions}\n\nContext:\n{full_context}\n\nQuestion: {question}\n\n"
            "Answer in a student-friendly way using 1-2 short sentences. "
            "If the context includes an explicit rule, state that rule directly and clearly."
        )
    
    # 5) Generate answer with LLM
    answer = call_ollama(prompt)

    # Guard against clearly unrelated or refusal-style answers for normal academic queries.
    # Guard against clearly unrelated or refusal-style answers for normal academic queries.
    if _is_invalid_or_unrelated_response(question_lower, answer):
        if is_integrity_q:
            answer = _get_integrity_fallback(question)
        elif is_yesno_q:
            # If LLM fails on yes/no question, try deterministic fallback
            fallback = _get_yesno_answer(question_lower)
            if fallback:
                answer = fallback
            else:
                answer = "I'm unable to provide a definitive answer. Please contact the Finance Department or relevant department for accurate information."
        elif is_definition_q:
            # Do a proper general definition fallback instead of a placeholder sentence.
            answer = _build_general_definition_answer(question)
        else:
            answer = "I’m sorry, I couldn’t generate a reliable answer for that question. Please try rephrasing it in one short sentence."

    answer = _friendly_answer(answer)
    
    result = {
        "answer": answer,
        "sources": results,
        "source_pdfs": source_pdfs,
        "suggested_pdfs": suggested_pdfs,
        "is_pdf_request": is_pdf_request
    }
    
    # Add download URL for PDF requests
    if is_pdf_request and suggested_pdfs and len(suggested_pdfs) > 0:
        best_suggested_pdf = suggested_pdfs[0]
        result["downloadable_pdf"] = best_suggested_pdf
        result["download_url"] = _build_download_url(best_suggested_pdf)
    
    return result