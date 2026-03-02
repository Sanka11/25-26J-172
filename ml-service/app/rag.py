import re
import os
from urllib.parse import quote
from .embeddings import embed_texts
from .vector_store import query, list_documents
from .llm import call_ollama
from .services.academic_service import (
    get_academic_deadlines,
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


ML_PUBLIC_BASE_URL = os.getenv("ML_PUBLIC_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


def _build_download_url(pdf_filename: str) -> str:
    encoded_name = quote(pdf_filename)
    return f"{ML_PUBLIC_BASE_URL}/documents/{encoded_name}"


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


def _extract_pdf_sources(results: dict) -> list:
    """Extract unique PDF filenames from query results"""
    pdfs = set()
    if results.get("metadatas") and results["metadatas"][0]:
        for meta in results["metadatas"][0]:
            if meta and "pdf_name" in meta:
                pdfs.add(meta["pdf_name"])
    return sorted(list(pdfs))


def _suggest_pdfs(question: str) -> list:
    """Suggest relevant PDFs based on question keywords"""
    q = question.lower()
    keyword_to_pdf = {
        # Library policies
        ("policy", "policies", "regulation", "guidelines", "rules", "borrowing", "late", "fine", "overdue"): "library_policies.pdf",
        ("library", "book", "borrow", "reserve", "collection"): "library_policies.pdf",
        
        # Academic integrity
        ("plagiarism", "plagiarise", "plagiarize", "integrity", "cheating", "dishonesty", "cite", "citation"): "academic_integrity.pdf",
        ("honesty", "ethics", "academic", "conduct", "misconduct"): "academic_integrity.pdf",
        
        # Student handbook
        ("student", "handbook", "code of conduct", "dress code", "behavior", "attendance"): "student_handbook.pdf",
        
        # Fee structure
        ("fee", "fees", "tuition", "cost", "payment", "financial", "scholarship"): "fee_structure.pdf",
        
        # Academic calendar
        ("semester", "calendar", "term", "break", "holiday", "schedule"): "academic_calendar.pdf",
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
    matching_files = []
    
    # Score each file based on keyword matches
    file_scores = {}
    
    # Define keyword-to-file mappings for real content
    keyword_mappings = {
        "Library Rules final -17th July 2024.pdf": ["library", "borrowing", "book", "loan", "overdue", "late fee", "rules"],
        "Academic Integrity Policy for Students .pdf": ["plagiarism", "integrity", "cheating", "citation", "academic honesty", "dishonesty"],
        "Dress_Code_for_SLIIT_Students.pdf": ["dress", "attire", "clothing"],
        "SLIIT Rule Book.pdf": ["rule", "student", "conduct", "regulation", "handbook"],
        "Computer Laboratory Usage rules and regulations.pdf": ["computer", "lab", "laboratory"],
        "Acceptable IT Use Policy For Students of SLIIT and SLIIT Subsidiaries V1.1.pdf": ["it", "acceptable", "technology", "computer use"],
    }
    
    # Check direct keyword mappings
    for pdf_name, keywords in keyword_mappings.items():
        if pdf_name in all_files:
            score = sum(1 for kw in keywords if kw in q_lower)
            if score > 0:
                file_scores[pdf_name] = score
    
    # Also add generated PDFs if nothing matches
    generated_pdfs = {
        "library_policies.pdf": ["library", "borrowing", "book", "fee"],
        "academic_integrity.pdf": ["plagiarism", "integrity", "cheating"],
        "student_handbook.pdf": ["conduct", "dress", "behavior", "attendance"],
        "fee_structure.pdf": ["fee", "cost", "payment", "tuition"],
        "academic_calendar.pdf": ["calendar", "semester", "schedule"],
    }
    
    for pdf_name, keywords in generated_pdfs.items():
        if pdf_name in all_files and pdf_name not in file_scores:
            score = sum(1 for kw in keywords if kw in q_lower)
            if score > 0:
                file_scores[pdf_name] = score
    
    # Sort by score and return
    if file_scores:
        sorted_files = sorted(file_scores.items(), key=lambda x: x[1], reverse=True)
        matching_files = [f[0] for f in sorted_files]
    
    return matching_files


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
    
    # Check if user is asking for a PDF directly
    is_pdf_request = any(
        keyword in question_lower
        for keyword in ["pdf", "give me", "show me", "rules", "policy", "policies", 
                       "document", "file", "download", "fee", "fees", "fee structure",
                       "academic calendar", "calendar", "conduct code", "integrity policy"]
    )
    
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
    
    emb = embed_texts([search_question])[0]
    results = query(emb, n_results=top_k)
    
    # 4) Build enhanced prompt with strict context filtering
    context_texts = []
    if results.get("documents") and results["documents"][0]:
        for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
            context_texts.append(f"{doc}\n")
    
    pdf_context = "\n---\n".join(context_texts) if context_texts else ""
    has_module_code = bool(matches)

    # List suggested PDFs early (for all request types)
    suggested_pdfs = _suggest_pdfs(question)
    source_pdfs = _extract_pdf_sources(results)
    
    # Handle explicit PDF requests - return document content directly
    if is_pdf_request and pdf_context.strip():
        # User is asking for PDFs specifically, return the raw document content
        return {
            "answer": f"**{', '.join(suggested_pdfs) if suggested_pdfs else 'Document Content'}**\n\n{pdf_context}",
            "sources": results,
            "source_pdfs": source_pdfs,
            "suggested_pdfs": suggested_pdfs,
            "is_pdf_request": True
        }
    
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
        # Special handling for PDF requests without results
        if is_pdf_request:
            # Try to find matching actual PDF files first
            matching_pdfs = _find_matching_pdf_files(question)
            
            if matching_pdfs:
                # Use the best matching actual PDF file
                best_pdf = matching_pdfs[0]
                download_url = _build_download_url(best_pdf)
                
                result = {
                    "answer": f"Here's the PDF you requested:\n\n📄 **{best_pdf}**",
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
                    "answer": fallback,
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
        elif is_definition_q:
            fallback = "I couldn't find a definition for that in the available documents. Please try rephrasing your question or contact academic support."
        else:
            fallback = "I couldn't find that information in the documents or academic database. Please try asking about assignment deadlines, module details, or academic integrity policies."
        
        return {
            "answer": fallback,
            "sources": results,
            "suggested_pdfs": suggested_pdfs,
            "is_pdf_request": is_pdf_request
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
    
    # Add PDF reference to answer if sources were found
    pdf_reference = ""
    if source_pdfs:
        pdf_reference = f"\n\n[From: {', '.join(source_pdfs)}]"
    elif suggested_pdfs:
        pdf_reference = f"\n\n[Suggested to check: {', '.join(suggested_pdfs)}]"
    
    return {
        "answer": answer + pdf_reference,
        "sources": results,
        "source_pdfs": source_pdfs,
        "suggested_pdfs": suggested_pdfs,
        "is_pdf_request": is_pdf_request
    }