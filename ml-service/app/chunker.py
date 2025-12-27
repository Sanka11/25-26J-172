# ml-service/app/chunker.py
import math

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    # chunk_size = ~1000 characters (~200 tokens depending)
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
        if start < 0:
            start = 0
        if start >= length:
            break
    return chunks
