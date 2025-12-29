# ml-service/app/pdf_reader.py
from PyPDF2 import PdfReader
import io, base64

def extract_text_from_pdf_bytes(b64pdf: str):
    pdf_bytes = base64.b64decode(b64pdf)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = []
    for p in reader.pages:
        pages.append(p.extract_text() or "")
    return "\n\n".join(pages)
