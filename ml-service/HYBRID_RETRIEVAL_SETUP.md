# Hybrid Retrieval System Setup Guide

## Overview

The chatbot now uses a **Hybrid Retrieval System** that combines:

1. **RAG (Retrieval Augmented Generation)** - Primary source using PDF documents
2. **Web Search Fallback** - Google search when RAG doesn't find relevant information

## How It Works

### Retrieval Flow

```
User Question
    ↓
1. Vector Search (RAG) - Search PDF knowledge base
    ↓
2. Similarity Check - Is the match good enough?
    ↓
    ├─→ YES (distance ≤ threshold) → Generate answer from PDF
    │
    └─→ NO (distance > threshold) → Web Search
            ↓
        3. Google Custom Search API
            ↓
        4. Extract top 3 results
            ↓
        5. Generate summarized answer
```

### Similarity Threshold

- **Location**: `ml-service/app/config.py`
- **Variable**: `RAG_SIMILARITY_THRESHOLD`
- **Default**: `1.2`
- **Range**:
  - `0.8` = Very strict (only very similar documents)
  - `1.2` = Moderate (balanced, recommended)
  - `1.5` = Lenient (accepts more distant matches)

ChromaDB uses L2 distance where:

- `0.0` = Identical documents
- Higher values = Less similar documents

## Google Custom Search API Setup

### Step 1: Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Custom Search API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

### Step 2: Create Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. Configure:
   - **Sites to search**: Enter `*` to search the entire web
   - **Name**: Give it a descriptive name (e.g., "Student Assistant Search")
4. Click "Create"
5. Copy the **Search Engine ID (CX)**

### Step 3: Configure Environment Variables

Create or update your `.env` file in the `ml-service` directory:

```env
# Google Custom Search API Configuration
GOOGLE_CSE_API_KEY=your_api_key_here
GOOGLE_CSE_CX=your_search_engine_id_here

# ML Service Public Base URL (for PDF downloads)
ML_PUBLIC_BASE_URL=http://127.0.0.1:8000
```

**Important**: Replace the placeholder values with your actual credentials.

### Step 4: Verify Configuration

The system will automatically detect if the API is configured:

- ✅ **Configured**: Web search will activate when RAG relevance is low
- ❌ **Not Configured**: System will skip web search and use fallback answers

Check the logs for:

```
[WebSearch] Google Custom Search API not configured
```

## Configuration Options

### Adjust Similarity Threshold

Edit `ml-service/app/config.py`:

```python
# Make it more strict (only use PDFs if very relevant)
RAG_SIMILARITY_THRESHOLD = 0.8

# Make it more lenient (accept more distant matches)
RAG_SIMILARITY_THRESHOLD = 1.5
```

### Modify Number of Web Results

Edit `ml-service/app/rag.py` in the `answer_question` function:

```python
# Change from 3 to desired number (max 10)
web_results = perform_web_search(question, num_results=5)
```

## Response Format

### RAG Response (from PDFs)

```json
{
  "answer": "Answer from PDF documents...",
  "sources": {...},
  "source_pdfs": ["document1.pdf", "document2.pdf"],
  "suggested_pdfs": [...],
  "is_pdf_request": false,
  "answer_source": null
}
```

### Web Search Response

```json
{
  "answer": "Answer from web search...",
  "sources": {...},
  "source_pdfs": [],
  "suggested_pdfs": [...],
  "is_pdf_request": false,
  "web_sources": [
    {
      "title": "Article Title",
      "url": "https://example.com"
    }
  ],
  "answer_source": "web_search"
}
```

## Code Structure

### New Files

- `ml-service/app/services/web_search_service.py` - Web search service module

### Modified Files

- `ml-service/app/config.py` - Added threshold configuration
- `ml-service/app/vector_store.py` - Returns distance scores
- `ml-service/app/rag.py` - Hybrid retrieval logic

### Key Functions

#### `_check_rag_relevance(results, threshold)`

Checks if RAG results meet the similarity threshold.

#### `_generate_web_search_answer(question, web_results, user_id)`

Generates an answer from web search results using LLM.

#### `perform_web_search(query, num_results)`

Performs Google Custom Search and returns results.

## Testing

### Test Without API Configured

The system will gracefully fall back to existing behavior.

### Test With API Configured

1. Set up Google Custom Search API credentials
2. Ask a question not in your PDF knowledge base:
   ```
   "What is quantum computing?"
   ```
3. Check the logs:
   ```
   [RAG] Results below similarity threshold - attempting web search fallback
   [WebSearch] Retrieved 3 web results for query: 'What is quantum computing?'
   ```

### Monitor Performance

Watch for these log messages:

- `[RAG] Relevance check: min_distance=X.XXX, threshold=X.XXX, relevant=True/False`
- `[VectorDB] Distance range: [min, max], Avg: X.XXX`
- `[WebSearch] Retrieved N web results`

## API Costs

### Google Custom Search API

- **Free Tier**: 100 queries/day
- **Paid Tier**: $5 per 1,000 queries (after free tier)
- **Quota**: Check your usage in Google Cloud Console

### Recommendations

- Monitor usage to stay within free tier
- Consider caching frequent queries
- Use appropriate similarity threshold to minimize web searches

## Troubleshooting

### Web Search Not Working

1. **Check API credentials**:

   ```python
   from app.services.web_search_service import web_search_service
   print(f"Configured: {web_search_service.is_configured}")
   ```

2. **Verify environment variables**:

   ```bash
   echo $GOOGLE_CSE_API_KEY
   echo $GOOGLE_CSE_CX
   ```

3. **Check API quota**: Visit Google Cloud Console

### RAG Always Using Web Search

- **Issue**: Threshold too strict
- **Solution**: Increase `RAG_SIMILARITY_THRESHOLD` in `config.py`

### Web Search Never Activates

- **Issue**: Threshold too lenient
- **Solution**: Decrease `RAG_SIMILARITY_THRESHOLD` in `config.py`

## Compatibility

- ✅ Python 3.10.6
- ✅ NumPy 1.24.3
- ✅ scikit-learn 1.6.1
- ✅ TensorFlow 2.13.1
- ✅ Existing codebase architecture
- ✅ Asynchronous API calls supported

## Future Enhancements

Potential improvements:

- Cache web search results
- Support alternative search APIs (Bing, DuckDuckGo)
- Implement query rewriting for better search results
- Add confidence scores to responses
- Support multi-source fusion (combine PDF + web)
