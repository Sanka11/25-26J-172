# ml-service/app/main.py
# ================================================
# AcademiGuard ML Service — All components EXCEPT XAI Risk
# XAI Risk runs separately via main_xai.py on port 8000
# Run: uvicorn app.main:app --port 8002 --host 0.0.0.0
# ================================================

import base64
import time
import uuid
import os
import json
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

# RECOMMENDATION SCHEMAS & SERVICES
from app.schemas.recommendation_schema import (
    RecommendationRequest,
    RecommendationResponse
)
from app.services.recommendation_service import predict_recommendations

# ----------------------------
# struggle SCHEMAS & service
# ----------------------------
from app.schemas.struggle import StruggleRequest, StruggleResponse
from app.services.struggle_service import predict_struggle

# ----------------------------
# RAG MODULES
# ----------------------------
from app.rag import answer_question
from app.pdf_reader import extract_text_from_pdf_bytes
from app.chunker import chunk_text
from app.embeddings import embed_texts
from app.vector_store import add_documents

# ----------------------------
# STUDENT PROFILE & PERSONALIZATION
# ----------------------------
from app.services.student_profile_service import get_profile_manager
from app.services.chat_history_service import get_history_manager
from app.services.personalized_intervention_service import (
    get_personalized_intervention_service,
)

# ----------------------------
# Disengagement Router
# ----------------------------
# from app.disengagement.router import router as disengagement_router


app = FastAPI(title="AcademiGuard ML Service")

# ----------------------------
# CORS MIDDLEWARE (MUST BE BEFORE ROUTERS)
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(disengagement_router)


def _feedback_file_path() -> str:
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "chat_feedback.json")


def _load_feedback_items() -> list:
    path = _feedback_file_path()
    if not os.path.isfile(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_feedback_items(items: list) -> None:
    path = _feedback_file_path()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


# -----------------------------------------------------------
# HEALTH
# -----------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# -----------------------------------------------------------
# RECOMMENDATIONS
# -----------------------------------------------------------

@app.post("/recommendations", response_model=RecommendationResponse)
def get_student_recommendations(request: RecommendationRequest):
    return predict_recommendations(request)


# -----------------------------------------------------------
# STRUGGLE
# -----------------------------------------------------------

@app.post("/struggle", response_model=StruggleResponse)
def struggle(request: StruggleRequest):
    return {
        "user_id": request.user_id,
        **predict_struggle(request)
    }


# -----------------------------------------------------------
# UPLOAD PDF → AUTO EMBED → VECTOR DB
# -----------------------------------------------------------

@app.post("/upload_pdf")
async def upload_pdf(
    request: Request,
    file: UploadFile | None = File(default=None),
):
    print(f"\n=== UPLOAD_PDF REQUEST ===")
    print(f"Content-Type: {request.headers.get('content-type')}")
    print(f"File received: {file is not None}")
    if file:
        print(f"File name: {file.filename}")
        print(f"File content-type: {file.content_type}")

    pdf_bytes: bytes
    used_filename: str

    if file is not None:
        pdf_bytes = await file.read()
        used_filename = file.filename or "uploaded.pdf"
        print(f"PDF bytes read: {len(pdf_bytes)}")
    else:
        try:
            data = await request.json()
            file_b64 = data.get("file_b64")
            filename = data.get("filename")
        except Exception as e:
            print(f"JSON parsing error: {e}")
            raise HTTPException(
                status_code=400,
                detail="Provide either a PDF file (multipart) or JSON body with file_b64.",
            )

        if file_b64 is not None:
            used_filename = filename or "uploaded.pdf"
            if "," in file_b64:
                file_b64 = file_b64.split(",", 1)[1]
            try:
                pdf_bytes = base64.b64decode(file_b64)
                print(f"PDF bytes decoded from base64: {len(pdf_bytes)}")
            except Exception as e:
                print(f"Base64 decode error: {e}")
                raise HTTPException(status_code=400, detail="Invalid base64 PDF payload")
        else:
            print("ERROR: No file_b64 in JSON body")
            raise HTTPException(
                status_code=400,
                detail="Provide either a PDF file (multipart) or file_b64 (base64).",
            )

    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty PDF data received")

    try:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        upload_dir = os.path.join(base_dir, "uploaded_pdfs")
        os.makedirs(upload_dir, exist_ok=True)
        original_name = used_filename.split("/")[-1].split("\\")[-1]
        if not original_name.lower().endswith(".pdf"):
            original_name = f"{original_name}.pdf"
        stored_path = os.path.join(upload_dir, original_name)
        with open(stored_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"Saved uploaded PDF to {stored_path}")
    except Exception as e:
        print(f"Warning: failed to persist uploaded PDF file: {e}")

    text = extract_text_from_pdf_bytes(pdf_bytes)
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")

    chunks = chunk_text(text, chunk_size=600, overlap=100, section_aware=True)
    if not chunks:
        raise HTTPException(status_code=400, detail="Chunking produced no chunks")

    uploaded_at = time.time()
    doc_id = f"{used_filename}_{str(uuid.uuid4())[:8]}"
    metadatas = [
        {"doc_id": doc_id, "pdf_name": used_filename, "uploaded_at": uploaded_at, "chunk": i}
        for i in range(len(chunks))
    ]

    embeddings = embed_texts(chunks)
    doc_prefix = f"{used_filename}_{str(uuid.uuid4())[:8]}"
    add_documents(doc_prefix, chunks, metadatas, embeddings)

    return {"status": "ok", "chunks": len(chunks), "doc_prefix": doc_prefix}


# -----------------------------------------------------------
# CHAT (RAG PIPELINE)
# -----------------------------------------------------------

@app.post("/chat")
def chat(question: str = Form(...), user_id: str = Form(default="anonymous")):
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is empty")
    from app.services.chat_history_service import get_history_manager
    result = answer_question(question, user_id=user_id)
    answer = result.get("answer", "")
    try:
        history_manager = get_history_manager()
        history_manager.add_to_history(user_id, question, answer)
    except Exception as e:
        print(f"Warning: Could not save chat history: {e}")
    return result


# -----------------------------------------------------------
# CHAT HISTORY
# -----------------------------------------------------------

@app.get("/chat/history/{user_id}")
def get_chat_history(user_id: str, limit: int = None):
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")
    try:
        history_manager = get_history_manager()
        history = history_manager.get_user_history(user_id, limit=limit)
        return {"status": "ok", "user_id": user_id, "count": len(history), "history": history}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/chat/history/{user_id}")
def clear_chat_history(user_id: str):
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")
    try:
        history_manager = get_history_manager()
        success = history_manager.clear_user_history(user_id)
        return {
            "status": "ok" if success else "error",
            "user_id": user_id,
            "message": "Chat history cleared" if success else "Failed to clear history"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/chat/history/{user_id}/summary")
def get_chat_summary(user_id: str):
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")
    try:
        history_manager = get_history_manager()
        history = history_manager.get_user_history(user_id)
        recent_questions = [entry.get("question", "")[:80] for entry in history[-5:]] if history else []
        return {
            "status": "ok",
            "user_id": user_id,
            "total_conversations": len(history),
            "recent_questions": recent_questions,
            "first_chat": history[0].get("datetime") if history else None,
            "last_chat": history[-1].get("datetime") if history else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/list_pdfs")
def list_pdfs():
    from app.vector_store import list_documents
    try:
        documents = list_documents()
        return {"status": "ok", "count": len(documents), "documents": documents}
    except Exception as e:
        return {"status": "error", "message": str(e), "documents": []}


# -----------------------------------------------------------
# FEEDBACK
# -----------------------------------------------------------

@app.post("/feedback")
async def feedback(request: Request):
    try:
        data = await request.json()
        rating = data.get("rating")
        comment = data.get("comment")
        last_question = data.get("last_question")
        last_answer = data.get("last_answer")
        created_at = data.get("created_at")

        numeric_rating = float(rating)
        if numeric_rating < 1 or numeric_rating > 5:
            raise ValueError("rating must be between 1 and 5")

        feedback_doc = {
            "rating": numeric_rating,
            "comment": comment.strip() if isinstance(comment, str) else "",
            "last_question": last_question.strip() if isinstance(last_question, str) else None,
            "last_answer": last_answer.strip() if isinstance(last_answer, str) else None,
            "created_at": float(created_at) if isinstance(created_at, (int, float)) else time.time(),
        }

        existing = _load_feedback_items()
        existing.append(feedback_doc)
        _save_feedback_items(existing)

        return {"status": "ok", "message": "Feedback received successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid feedback data: {str(e)}")


@app.get("/feedback/stats")
def feedback_stats():
    items = _load_feedback_items()
    ratings = [float(item.get("rating")) for item in items if isinstance(item, dict) and isinstance(item.get("rating"), (int, float))]
    if not ratings:
        return {"average_rating": 0, "total_ratings": 0}
    average = sum(ratings) / len(ratings)
    return {"average_rating": round(average, 2), "total_ratings": len(ratings)}


# -----------------------------------------------------------
# DOCUMENTS
# -----------------------------------------------------------

@app.get("/documents")
def list_documents():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    upload_dir = os.path.join(base_dir, "uploaded_pdfs")
    if not os.path.isdir(upload_dir):
        return {"documents": []}
    docs = []
    for name in os.listdir(upload_dir):
        full = os.path.join(upload_dir, name)
        if os.path.isfile(full) and name.lower().endswith(".pdf"):
            docs.append({"doc_id": name, "pdf_name": name})
    return {"documents": docs}


@app.get("/documents/{doc_id}")
def get_document(doc_id: str):
    from fastapi.responses import FileResponse
    base_dir = os.path.dirname(os.path.dirname(__file__))
    upload_dir = os.path.join(base_dir, "uploaded_pdfs")
    path = os.path.join(upload_dir, doc_id)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(path, media_type="application/pdf", filename=doc_id)


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    base_dir = os.path.dirname(os.path.dirname(__file__))
    upload_dir = os.path.join(base_dir, "uploaded_pdfs")
    path = os.path.join(upload_dir, doc_id)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Document not found")
    os.remove(path)
    return {"status": "ok"}


# ========================================
# STUDENT PROFILE MANAGEMENT
# ========================================

@app.post("/student/profile")
def create_student_profile(user_id: str, attendance_percent: float, exam_marks: list, exams_missed: int = 0):
    try:
        profile_manager = get_profile_manager()
        profile = profile_manager.create_profile(user_id, attendance_percent, exam_marks, exams_missed)
        return {"status": "success", "profile": profile}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating profile: {str(e)}")


@app.get("/student/profile/{user_id}")
def get_student_profile(user_id: str):
    try:
        profile_manager = get_profile_manager()
        profile = profile_manager.get_profile(user_id)
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving profile: {str(e)}")


@app.put("/student/profile/{user_id}/attendance")
def update_student_attendance(user_id: str, attendance_percent: float):
    try:
        profile_manager = get_profile_manager()
        profile = profile_manager.update_attendance(user_id, attendance_percent)
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating attendance: {str(e)}")


@app.post("/student/profile/{user_id}/exam-mark")
def add_exam_mark(user_id: str, mark: float):
    try:
        profile_manager = get_profile_manager()
        profile = profile_manager.add_exam_mark(user_id, mark)
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding exam mark: {str(e)}")


@app.post("/student/profile/{user_id}/sync-from-firebase")
def sync_student_from_firebase(user_id: str):
    try:
        profile_manager = get_profile_manager()
        profile = profile_manager.sync_from_firebase(user_id, create_if_missing=True)
        if profile:
            return {
                "status": "success",
                "message": f"Synced student {user_id} from Firebase database (READ-ONLY)",
                "profile": profile,
                "personalization_ready": True,
                "source": profile.get("source", "unknown")
            }
        else:
            raise HTTPException(status_code=404, detail=f"Student {user_id} not found in Firebase database")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing from Firebase: {str(e)}")


@app.get("/student/intervention-reminder/{student_id}")
def get_personalized_intervention_reminder(student_id: str):
    try:
        service = get_personalized_intervention_service()
        result = service.generate_personalized_intervention(student_id)
        return {"status": "success", **result}
    except ValueError as e:
        return {
            "status": "not_found",
            "student_id": student_id,
            "classification": None,
            "reminders": [],
            "reminder_message": "",
            "detail": str(e),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating personalized intervention reminder: {str(e)}")


# ========================================
# PERSONALIZATION ANALYSIS
# ========================================

@app.post("/analysis/personalization-demo")
def personalization_demo(question: str, student1_id: str = "excellent_student", student2_id: str = "at_risk_student"):
    try:
        profile_manager = get_profile_manager()
        history_manager = get_history_manager()
        profile1 = profile_manager.get_profile(student1_id)
        profile2 = profile_manager.get_profile(student2_id)
        response1 = answer_question(question, user_id=student1_id)
        response2 = answer_question(question, user_id=student2_id)
        history_manager.add_to_history(student1_id, question, response1["answer"])
        history_manager.add_to_history(student2_id, question, response2["answer"])
        return {
            "status": "success",
            "question": question,
            "student1": {"user_id": student1_id, "profile": profile1, "response": response1["answer"], "adapted": "Yes - personalized guidance for high achiever"},
            "student2": {"user_id": student2_id, "profile": profile2, "response": response2["answer"], "adapted": "Yes - personalized support for at-risk student"},
            "research_insight": "The same question receives different guidance based on student academic status and risk factors."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in personalization demo: {str(e)}")


@app.get("/analysis/student-comparison")
def student_comparison(student_ids: list = None):
    try:
        if student_ids is None:
            student_ids = []
        profile_manager = get_profile_manager()
        history_manager = get_history_manager()
        students_data = []
        for student_id in student_ids:
            try:
                profile = profile_manager.get_profile(student_id)
                history = history_manager.get_user_history(student_id)
                students_data.append({
                    "user_id": student_id,
                    "profile": profile,
                    "chat_count": len(history) if history else 0,
                    "risk_factors": profile.get("risk_factors", []),
                    "status": profile.get("status", "unknown")
                })
            except Exception:
                continue
        return {"status": "success", "students_compared": len(students_data), "students": students_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing students: {str(e)}")


@app.post("/analysis/generate-research-report")
def generate_research_report(excellent_student_id: str = "student1", at_risk_student_id: str = "student2"):
    try:
        profile_manager = get_profile_manager()
        history_manager = get_history_manager()
        excellent_profile = profile_manager.get_profile(excellent_student_id)
        at_risk_profile = profile_manager.get_profile(at_risk_student_id)
        excellent_history = history_manager.get_user_history(excellent_student_id, limit=10)
        at_risk_history = history_manager.get_user_history(at_risk_student_id, limit=10)
        report = {
            "research_title": "Personalized Academic Chatbot System - Effectiveness Report",
            "timestamp": time.time(),
            "executive_summary": "This report demonstrates how AcademiGuard chatbot provides personalized support based on student academic profiles.",
            "student_profiles_comparison": {
                "excellent_student": {"profile": excellent_profile, "interpretation": "High achiever with excellent attendance and strong exam performance"},
                "at_risk_student": {"profile": at_risk_profile, "interpretation": "At-risk student with low attendance, missed exams, and low exam marks"},
                "key_difference": f"Attendance: {excellent_profile['attendance_percent']}% vs {at_risk_profile['attendance_percent']}%; Avg Marks: {excellent_profile['avg_exam_marks']:.1f} vs {at_risk_profile['avg_exam_marks']:.1f}"
            },
            "personalization_evidence": {
                "excellent_student_interactions": {"chat_count": len(excellent_history) if excellent_history else 0, "guidance_type": "Advanced topics, mentorship encouragement"},
                "at_risk_student_interactions": {"chat_count": len(at_risk_history) if at_risk_history else 0, "guidance_type": "Deadline emphasis, attendance reminders, support resources"}
            },
            "conclusion": [
                "The chatbot successfully adapts its responses based on student academic profiles.",
                "At-risk students receive emphasized support and deadline reminders.",
                "Excellent students receive encouragement for advanced topics.",
            ],
            "research_questions_answered": {
                "q1_personalization": "Yes - Responses vary based on student profile data",
                "q2_risk_detection": "Yes - System identifies at-risk students via attendance and exam performance metrics",
                "q3_adaptive_support": "Yes - Guidance changes based on student status"
            }
        }
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")