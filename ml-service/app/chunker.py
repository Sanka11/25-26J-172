# ml-service/app/chunker.py
import re
import math


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200, section_aware: bool = True):
    """Split text into chunks while respecting document structure.
    
    If section_aware=True, tries to break at section/subsection headers first.
    Falls back to character-based chunking for very large sections.
    
    Args:
        text: The text to chunk
        chunk_size: Target size for character-based chunks
        overlap: Character overlap between chunks (for character-based only)
        section_aware: If True, respect section boundaries
    
    Returns:
        List of text chunks
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0:
        raise ValueError("overlap must be non-negative")

    if not section_aware:
        # Original character-based chunking
        return _chunk_by_characters(text, chunk_size, overlap)
    
    # Try section-aware chunking first
    return _chunk_by_sections(text, chunk_size, overlap)


def _chunk_by_sections(text: str, chunk_size: int = 1000, overlap: int = 200) -> list:
    """Break text at section headers, then apply character chunking if needed."""
    
    # Define section patterns (for policies, manuals, etc.)
    section_patterns = [
        r'^SECTION \d+:',          # "SECTION 03: PASSWORD POLICY"
        r'^\d+\. ',                # "1. ", "3.1 ", "3.2 "
        r'^###+ ',                 # "### Header"
        r'^== .+ ==$',             # "== Header =="
    ]
    
    # Split by any section pattern
    section_delimiter = r'(?=^(?:' + '|'.join(section_patterns) + r'))'
    sections = re.split(section_delimiter, text, flags=re.MULTILINE)
    
    chunks = []
    for section in sections:
        if not section.strip():
            continue
        
        # If section is small enough, keep it as one chunk
        if len(section) <= chunk_size:
            chunks.append(section)
        else:
            # If section is too large, further chunk it by characters
            sub_chunks = _chunk_by_characters(section, chunk_size, overlap)
            chunks.extend(sub_chunks)
    
    return chunks


def _chunk_by_characters(text: str, chunk_size: int, overlap: int) -> list:
    """Original character-based chunking implementation."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    
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
