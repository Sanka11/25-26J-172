import time
import uuid
from fastapi import FastAPI, Form, UploadFile, File

# RISK
from app.schemas.risk import RiskRequest, RiskResponse
from app.services.risk_service import predict_risk_score

# STRUGGLE
from app.schemas.struggle import StruggleRequest, StruggleResponse
from app.services.struggle_service import predict_struggling_skills

# RECOMMENDATION
from app.schemas.recommendation_schemas import (
    RecommendationRequest,
    RecommendationResponse,
)
from app.services.recommendation_service import generate_recommendations

# RAG
from app.rag import answer_question
from app.pdf_reader import extract_text_from_pdf_bytes
from app.chunker import chunk_text
from app.embeddings import embed_texts
from app.vector_store import add_documents

app = FastAPI(title="AcademiGuard ML Service")

# -----------------------------------------------------------
# EXISTING ENDPOINTS
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
    return generate_recommendations(payload)

@app.post("/predictStruggle", response_model=StruggleResponse)
def struggle_endpoint(payload: StruggleRequest):
    return predict_struggling_skills(payload)

# -----------------------------------------------------------
# NEW ENDPOINT: UPLOAD PDF → EMBED → CHROMA
# -----------------------------------------------------------

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    1) Read PDF bytes
    2) Extract text
    3) Chunk
    4) Embed
    5) Store in Chroma
    """
    pdf_bytes = await file.read()
    filename = file.filename or "uploaded.pdf"

    text = extract_text_from_pdf_bytes(pdf_bytes)
    chunks = chunk_text(text, chunk_size=1000, overlap=200)

    metadatas = [
        {"pdf_name": filename, "uploaded_at": time.time(), "chunk": i}
        for i in range(len(chunks))
    ]

    embeddings = embed_texts(chunks)

    doc_prefix = f"{filename}_{str(uuid.uuid4())[:8]}"
    add_documents(doc_prefix, chunks, metadatas, embeddings)

    return {"status": "ok", "chunks": len(chunks), "doc_prefix": doc_prefix}

# -----------------------------------------------------------
# NEW ENDPOINT: CHAT (RAG)
# -----------------------------------------------------------

@app.post("/chat")
def chat(question: str = Form(...)):
    return answer_question(question)
