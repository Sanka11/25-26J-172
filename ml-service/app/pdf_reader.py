# ml-service/app/pdf_reader.py
from PyPDF2 import PdfReader
import io

def extract_text_from_pdf_bytes(pdf_bytes: bytes):
    """
    Extract text from PDF bytes.
    Args:
        pdf_bytes: Raw PDF file bytes
    Returns:
        Extracted text from all pages
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = []
    for p in reader.pages:
        pages.append(p.extract_text() or "")
    return "\n\n".join(pages)
