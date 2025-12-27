# ml-service/app/embeddings.py
from sentence_transformers import SentenceTransformer
from .config import EMBED_MODEL_NAME



_model = None
def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL_NAME)
    return _model

def embed_texts(texts:list):
    model = get_model()
    return model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
