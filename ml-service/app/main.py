# app/main.py

import base64
import time
import uuid
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

# ----------------------------
# SCHEMAS (ABSOLUTE IMPORTS ONLY)
# ----------------------------
from app.schemas.risk import RiskRequest, RiskResponse
from app.schemas.struggle import StruggleRequest, StruggleResponse
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


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(payload: RecommendationRequest):
    # If your service already returns {"recommendations": [...]}, this is OK.
    # If it returns a list, wrap it in RecommendationResponse(...)
    return generate_recommendations(payload)


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
    metadatas = [
        {"pdf_name": used_filename, "uploaded_at": uploaded_at, "chunk": i}
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
    print(f"Successfully stored with doc_prefix: {doc_prefix}")

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
        # Log feedback (in production, save to database)
        print("\n=== FEEDBACK RECEIVED ===")
        print(f"Rating: {data.get('rating')}")
        print(f"Comment: {data.get('comment')}")
        print(f"Question: {data.get('last_question')}")
        print(f"Answer: {data.get('last_answer')}")
        print(f"Timestamp: {data.get('created_at')}")
        print("========================\n")
        
        return {"status": "ok", "message": "Feedback received successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid feedback data: {str(e)}")
