# ml-service/app/chunker.py
import math


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    """Split text into overlapping character chunks.

    This implementation guarantees forward progress to avoid infinite
    loops and associated MemoryError issues for very short texts.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0:
        raise ValueError("overlap must be non-negative")

    # Cap overlap so it's always smaller than chunk_size
    if overlap >= chunk_size:
        overlap = max(0, chunk_size // 2)

    step = chunk_size - overlap
    length = len(text)
    chunks = []
    for start in range(0, length, step):
        end = min(start + chunk_size, length)
        chunks.append(text[start:end])
    return chunks
