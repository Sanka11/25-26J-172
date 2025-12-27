# ml-service/app/config.py
ML_HOST = "0.0.0.0"
ML_PORT = 8000

# Chroma directory
CHROMA_PERSIST_DIR = "./chroma_db"

# Sentence Transformer model
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Ollama model name (replace with your pulled model)
OLLAMA_MODEL = "llama3.1"
OLLAMA_TIMEOUT = 60
