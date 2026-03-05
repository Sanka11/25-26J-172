# ml-service/app/embeddings.py
from sentence_transformers import SentenceTransformer
from .config import EMBED_MODEL_NAME
from functools import lru_cache
import hashlib

_model = None

# Cache for recently computed embeddings (max 128 queries)
_embedding_cache = {}
_max_cache_size = 128

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL_NAME)
    return _model

def _get_cache_key(text: str) -> str:
    """Generate a deterministic cache key for a text."""
    return hashlib.md5(text.encode()).hexdigest()

def embed_texts(texts: list):
    """Embed texts with caching to avoid redundant computations."""
    model = get_model()
    
    # Check cache first
    to_embed = []
    to_embed_indices = []
    cached_results = {}
    
    for i, text in enumerate(texts):
        cache_key = _get_cache_key(text)
        if cache_key in _embedding_cache:
            cached_results[i] = _embedding_cache[cache_key]
        else:
            to_embed.append(text)
            to_embed_indices.append(i)
    
    # Only encode texts not in cache
    if to_embed:
        embeddings = model.encode(to_embed, show_progress_bar=False, convert_to_numpy=True)
        
        # Store in cache
        for idx, text, emb in zip(to_embed_indices, to_embed, embeddings):
            cache_key = _get_cache_key(text)
            _embedding_cache[cache_key] = emb
            cached_results[idx] = emb
            
            # Simple cache eviction: if too large, clear oldest
            if len(_embedding_cache) > _max_cache_size:
                _embedding_cache.clear()
    
    # Return results in original order
    return [cached_results[i] for i in range(len(texts))]
