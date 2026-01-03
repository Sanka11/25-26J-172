# app/main.py

import base64
import time
import uuid
from fastapi import FastAPI, Form, UploadFile, File, HTTPException

# ----------------------------
# SCHEMAS (ABSOLUTE IMPORTS ONLY)
# ----------------------------
from app.schemas.risk import RiskRequest, RiskResponse
from app.schemas.struggle import StruggleRequest, StruggleResponse
from app.services.struggle_service import predict_struggle


# RECOMMENDATION SCHEMAS
from app.schemas.recommendation_schemas import (
    RecommendationRequest,
    RecommendationResponse,
)

# ----------------------------
# SERVICES
# ----------------------------
from app.services.risk_service import predict_risk_score
from app.services.struggle_service import predict_struggling_skills
from app.services.recommendation_service import generate_recommendations

# ----------------------------
# RAG MODULES
# ----------------------------
from app.rag import answer_question
from app.pdf_reader import extract_text_from_pdf_bytes
from app.chunker import chunk_text
from app.embeddings import embed_texts
from app.vector_store import add_documents

app = FastAPI(title="AcademiGuard ML Service")

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


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(payload: RecommendationRequest):
    # If your service already returns {"recommendations": [...]}, this is OK.
    # If it returns a list, wrap it in RecommendationResponse(...)
    return generate_recommendations(payload)


# @app.post("/predictStruggle", response_model=StruggleResponse)
# def struggle_endpoint(payload: StruggleRequest):
#     return predict_struggling_skills(payload)
@app.post("/struggle", response_model=StruggleResponse)
def struggle(request: StruggleRequest):
    return {
        "user_id": request.user_id,
        **predict_struggle(request)
    }
@app.post("/predictStruggle", response_model=StruggleResponse)
def struggle_endpoint(payload: StruggleRequest):
    return predict_struggling_skills(payload)

# -----------------------------------------------------------
# NEW ENDPOINT: UPLOAD PDF → AUTO EMBED → VECTOR DB
# Supports BOTH:
#   A) Multipart file upload (recommended)
#   B) Base64 form upload (your current method)
# -----------------------------------------------------------

@app.post("/upload_pdf")
async def upload_pdf(
    # Option A: real file upload (best)
    file: UploadFile | None = File(default=None),

    # Option B: base64 string (legacy)
    file_b64: str | None = Form(default=None),
    filename: str | None = Form(default=None),
):
    """
    Upload PDF → Extract text → Chunk → Embed → Store in vector DB
    """

    # ----------- Get PDF bytes -----------
    pdf_bytes: bytes
    used_filename: str

    if file is not None:
        pdf_bytes = await file.read()
        used_filename = file.filename or "uploaded.pdf"

    elif file_b64 is not None:
        used_filename = filename or "uploaded.pdf"

        # Some frontends send: "data:application/pdf;base64,AAAA..."
        if "," in file_b64:
            file_b64 = file_b64.split(",", 1)[1]

        try:
            pdf_bytes = base64.b64decode(file_b64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 PDF payload")

    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either a PDF file (multipart) or file_b64 (base64).",
        )

    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty PDF data received")

    # ----------- Extract text -----------
    text = extract_text_from_pdf_bytes(pdf_bytes)
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")

    # ----------- Chunk -----------
    chunks = chunk_text(text, chunk_size=1000, overlap=200)
    if not chunks:
        raise HTTPException(status_code=400, detail="Chunking produced no chunks")

    # ----------- Metadata -----------
    uploaded_at = time.time()
    metadatas = [
        {"pdf_name": used_filename, "uploaded_at": uploaded_at, "chunk": i}
        for i in range(len(chunks))
    ]

    # ----------- Embeddings -----------
    embeddings = embed_texts(chunks)

    # ----------- Store in Vector DB -----------
    doc_prefix = f"{used_filename}_{str(uuid.uuid4())[:8]}"
    add_documents(doc_prefix, chunks, metadatas, embeddings)

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
