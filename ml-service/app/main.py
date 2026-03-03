# app/main.py

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
# Risk SERVICES
# ----------------------------
from app.services.risk_service import predict_risk_score
from app.services.risk_service import predict_risk_score
from app.schemas.risk import RiskRequest, RiskResponse

# ----------------------------
# RAG MODULES
# ----------------------------
from app.rag import answer_question
from app.pdf_reader import extract_text_from_pdf_bytes
from app.chunker import chunk_text
from app.embeddings import embed_texts
from app.vector_store import add_documents

app = FastAPI(title="AcademiGuard ML Service")


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

# ----------------------------
# CORS MIDDLEWARE
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------
# EXISTING ENDPOINTS (DO NOT REMOVE)
# -----------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(payload: RiskRequest):
    score = predict_risk_score(payload)
    return RiskResponse(risk_score=score)
    
@app.post("/recommendations", response_model=RecommendationResponse)
def get_student_recommendations(request: RecommendationRequest):
    """
    Analyzes a batch of students, calculates their Recommendation Index using the ML Model (.pkl), 
    and generates personalized academic/wellness advice via LLM (Ollama).
    """
    return predict_recommendations(request)


@app.post("/struggle", response_model=StruggleResponse)
def struggle(request: StruggleRequest):
    return {
        "user_id": request.user_id,
        **predict_struggle(request)
    }

# -----------------------------------------------------------
# NEW ENDPOINT: UPLOAD PDF → AUTO EMBED → VECTOR DB
# Supports BOTH:
#   A) Multipart file upload (recommended)
#   B) Base64 form upload (your current method)
# -----------------------------------------------------------

@app.post("/upload_pdf")
async def upload_pdf(
    request: Request,
    # Option A: real file upload (best)
    file: UploadFile | None = File(default=None),
):
    """
    Upload PDF → Extract text → Chunk → Embed → Store in vector DB
    Accepts both multipart file upload and JSON with base64 data.
    """
    
    print(f"\n=== UPLOAD_PDF REQUEST ===")
    print(f"Content-Type: {request.headers.get('content-type')}")
    print(f"File received: {file is not None}")
    if file:
        print(f"File name: {file.filename}")
        print(f"File content-type: {file.content_type}")

    # ----------- Get PDF bytes -----------
    pdf_bytes: bytes
    used_filename: str

    if file is not None:
        # Multipart file upload
        pdf_bytes = await file.read()
        used_filename = file.filename or "uploaded.pdf"
        print(f"PDF bytes read: {len(pdf_bytes)}")
    else:
        # Try to get JSON body with base64 data
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

            # Some frontends send: "data:application/pdf;base64,AAAA..."
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
        print("ERROR: PDF bytes is empty")
        raise HTTPException(status_code=400, detail="Empty PDF data received")

    # ----------- Persist PDF file for listing/viewing -----------
    try:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        upload_dir = os.path.join(base_dir, "uploaded_pdfs")
        os.makedirs(upload_dir, exist_ok=True)

        # Use a filesystem-safe version of the original filename
        original_name = used_filename.split("/")[-1].split("\\")[-1]
        if not original_name.lower().endswith(".pdf"):
            original_name = f"{original_name}.pdf"

        stored_filename = original_name
        stored_path = os.path.join(upload_dir, stored_filename)
        with open(stored_path, "wb") as f:
            f.write(pdf_bytes)

        print(f"Saved uploaded PDF to {stored_path}")
    except Exception as e:
        # If saving the file fails, continue with vector DB pipeline
        print(f"Warning: failed to persist uploaded PDF file: {e}")

    # ----------- Extract text -----------
    print(f"Extracting text from PDF...")
    text = extract_text_from_pdf_bytes(pdf_bytes)
    if not text or not text.strip():
        print(f"ERROR: No text extracted from PDF")
        raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
    
    print(f"Text extracted: {len(text)} characters")

    # ----------- Chunk -----------
    print(f"Chunking text...")
    chunks = chunk_text(text, chunk_size=1000, overlap=200)
    if not chunks:
        print(f"ERROR: No chunks produced")
        raise HTTPException(status_code=400, detail="Chunking produced no chunks")
    
    print(f"Chunks created: {len(chunks)}")

    # ----------- Metadata -----------
    uploaded_at = time.time()
    doc_id = f"{used_filename}_{str(uuid.uuid4())[:8]}"  # Add doc_id field
    metadatas = [
        {"doc_id": doc_id, "pdf_name": used_filename, "uploaded_at": uploaded_at, "chunk": i}
        for i in range(len(chunks))
    ]

    # ----------- Embeddings -----------
    print(f"Generating embeddings...")
    embeddings = embed_texts(chunks)
    print(f"Embeddings generated: {len(embeddings)}")

    # ----------- Store in Vector DB -----------
    print(f"Storing in vector database...")
    doc_prefix = f"{used_filename}_{str(uuid.uuid4())[:8]}"
    add_documents(doc_prefix, chunks, metadatas, embeddings)
    print(f"Successfully stored with doc_prefix: {doc_prefix}, doc_id: {doc_id}")

    return {"status": "ok", "chunks": len(chunks), "doc_prefix": doc_prefix}

# -----------------------------------------------------------
# NEW ENDPOINT: CHAT (RAG PIPELINE)
# -----------------------------------------------------------

@app.post("/chat")
def chat(question: str = Form(...)):
    """
    Query → Retrieve from vector DB → LLM → Return answer
    """
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is empty")
    return answer_question(question)


@app.get("/list_pdfs")
def list_pdfs():
    """
    List all uploaded PDF documents with their metadata.
    Helps users know what documents are available.
    """
    from app.vector_store import list_documents
    try:
        documents = list_documents()
        return {
            "status": "ok",
            "count": len(documents),
            "documents": documents
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "documents": []
        }

# -----------------------------------------------------------
# NEW ENDPOINT: FEEDBACK
# -----------------------------------------------------------

@app.post("/feedback")
async def feedback(request: Request):
    """
    Store user feedback for chatbot responses.
    Accepts JSON payload with rating, comment, timestamps, etc.
    """
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

        # Log feedback (in production, save to database)
        print("\n=== FEEDBACK RECEIVED ===")
        print(f"Rating: {feedback_doc.get('rating')}")
        print(f"Comment: {feedback_doc.get('comment')}")
        print(f"Question: {feedback_doc.get('last_question')}")
        print(f"Answer: {feedback_doc.get('last_answer')}")
        print(f"Timestamp: {feedback_doc.get('created_at')}")
        print("========================\n")
        
        return {"status": "ok", "message": "Feedback received successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid feedback data: {str(e)}")


@app.get("/feedback/stats")
def feedback_stats():
    """Return feedback rating statistics stored in ML service."""
    items = _load_feedback_items()
    ratings = [float(item.get("rating")) for item in items if isinstance(item, dict) and isinstance(item.get("rating"), (int, float))]

    if not ratings:
        return {"average_rating": 0, "total_ratings": 0}

    average = sum(ratings) / len(ratings)
    return {
        "average_rating": round(average, 2),
        "total_ratings": len(ratings),
    }


# -----------------------------------------------------------
# NEW ENDPOINTS: MANAGE UPLOADED DOCUMENTS
# -----------------------------------------------------------

@app.get("/documents")
def list_documents():
    """Return a simple list of uploaded document prefixes.

    NOTE: This is a placeholder implementation that reads from the
    `uploaded_pdfs` folder and returns file names as `doc_id`.
    It can be replaced with a more robust metadata store later.
    """
    base_dir = os.path.dirname(os.path.dirname(__file__))
    upload_dir = os.path.join(base_dir, "uploaded_pdfs")

    if not os.path.isdir(upload_dir):
      return {"documents": []}

    docs = []
    for name in os.listdir(upload_dir):
        full = os.path.join(upload_dir, name)
        if os.path.isfile(full) and name.lower().endswith(".pdf"):
            docs.append(
                {
                    "doc_id": name,
                    "pdf_name": name,
                    # no timestamp available yet; frontend treats missing timestamp as empty
                }
            )

    return {"documents": docs}


@app.get("/documents/{doc_id}")
def get_document(doc_id: str):
    """Serve a raw PDF from the uploaded_pdfs folder by filename."""
    import os
    from fastapi.responses import FileResponse

    base_dir = os.path.dirname(os.path.dirname(__file__))
    upload_dir = os.path.join(base_dir, "uploaded_pdfs")
    path = os.path.join(upload_dir, doc_id)

    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Document not found")

    return FileResponse(path, media_type="application/pdf", filename=doc_id)


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """Delete a PDF from the uploaded_pdfs folder by filename."""
    import os

    base_dir = os.path.dirname(os.path.dirname(__file__))
    upload_dir = os.path.join(base_dir, "uploaded_pdfs")
    path = os.path.join(upload_dir, doc_id)

    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Document not found")

    os.remove(path)
    return {"status": "ok"}
