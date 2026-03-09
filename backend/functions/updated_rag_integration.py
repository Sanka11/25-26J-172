"""
backend/functions/updated_rag_integration.py
Updated RAG integration with response mode support

This file shows the modifications needed in app/rag.py to support
response modes (Document, Web, Hybrid)
"""

# Add this to the existing imports in app/rag.py:
"""
from app.services.web_search_service import WebSearchService
from app.config import RAG_SIMILARITY_THRESHOLD
import logging

logger = logging.getLogger(__name__)
web_search_service = WebSearchService()
"""


def answer_question(
    question: str,
    user_id: str,
    response_mode: str = "hybrid",
    personalization_context: str = None,
    response_length: str = "balanced"
) -> dict:
    """
    Main question answering function with response mode support
    
    Args:
        question: The user's question
        user_id: The user's ID for personalization
        response_mode: The response mode - "document", "web", or "hybrid"
        personalization_context: Additional context about the user
        response_length: Response detail level - "brief", "balanced", or "detailed"
        
    Returns:
        dict: Answer with source information
    """
    
    # Validate response mode
    valid_modes = ["document", "web", "hybrid"]
    if response_mode not in valid_modes:
        logger.warning(f"Invalid response mode: {response_mode}, defaulting to hybrid")
        response_mode = "hybrid"
    
    # DOCUMENT MODE: RAG ONLY
    if response_mode == "document":
        logger.info(f"Document mode - RAG only search for user {user_id}")
        result = _search_rag_only(
            question=question,
            user_id=user_id,
            personalization_context=personalization_context,
            response_length=response_length
        )
        return result
    
    # WEB MODE: WEB SEARCH ONLY
    elif response_mode == "web":
        logger.info(f"Web mode - Web search only for user {user_id}")
        result = _search_web_only(
            question=question,
            user_id=user_id,
            response_length=response_length
        )
        return result
    
    # HYBRID MODE: RAG FIRST, WEB FALLBACK (DEFAULT)
    else:  # "hybrid"
        logger.info(f"Hybrid mode - RAG with web fallback for user {user_id}")
        result = _search_hybrid(
            question=question,
            user_id=user_id,
            personalization_context=personalization_context,
            response_length=response_length
        )
        return result


def _search_rag_only(
    question: str,
    user_id: str,
    personalization_context: str,
    response_length: str
) -> dict:
    """Search RAG only, no web fallback"""
    
    # Search vector database
    rag_results = vector_store.query(
        query_text=question,
        n_results=5,
        user_id=user_id
    )
    
    # Check if results meet quality threshold
    if _check_rag_relevance(rag_results):
        # Generate answer from RAG results
        answer = _generate_answer_from_rag(
            question=question,
            rag_results=rag_results,
            personalization_context=personalization_context,
            response_length=response_length
        )
        
        return {
            "answer": answer,
            "answer_source": "document",
            "sources": rag_results.get('sources', []),
            "confidence": rag_results.get('confidence', 0.7),
            "mode": "document"
        }
    else:
        # No good RAG results in document mode
        return {
            "answer": "I don't have information about this in my knowledge base. "
                     "Please try asking differently or consult the official documents.",
            "answer_source": "document",
            "sources": [],
            "confidence": 0.0,
            "mode": "document"
        }


def _search_web_only(
    question: str,
    user_id: str,
    response_length: str
) -> dict:
    """Search web only, no RAG"""
    
    logger.info(f"Performing web search for: {question}")
    
    web_results = web_search_service.search(question)
    
    if web_results and len(web_results) > 0:
        # Generate answer from web results
        answer = _generate_web_search_answer(
            question=question,
            web_results=web_results,
            response_length=response_length
        )
        
        return {
            "answer": answer,
            "answer_source": "web_search",
            "web_sources": web_results,
            "confidence": web_results[0].get('confidence', 0.5),
            "mode": "web"
        }
    else:
        return {
            "answer": "I couldn't find information about this topic. Please try rephrasing your question.",
            "answer_source": "web_search",
            "web_sources": [],
            "confidence": 0.0,
            "mode": "web"
        }


def _search_hybrid(
    question: str,
    user_id: str,
    personalization_context: str,
    response_length: str
) -> dict:
    """
    Hybrid search: RAG first with web fallback
    """
    
    # Step 1: Try RAG first
    logger.info(f"Hybrid mode: Starting RAG search for user {user_id}")
    
    rag_results = vector_store.query(
        query_text=question,
        n_results=5,
        user_id=user_id
    )
    
    # Step 2: Check if RAG results are relevant
    if _check_rag_relevance(rag_results):
        logger.info("RAG results meet similarity threshold, using RAG answer")
        
        # RAG results are good enough
        answer = _generate_answer_from_rag(
            question=question,
            rag_results=rag_results,
            personalization_context=personalization_context,
            response_length=response_length
        )
        
        return {
            "answer": answer,
            "answer_source": "document",
            "sources": rag_results.get('sources', []),
            "confidence": rag_results.get('confidence', 0.7),
            "mode": "hybrid"
        }
    
    # Step 3: RAG results not sufficient, try web search
    logger.info("RAG results below threshold, falling back to web search")
    
    web_results = web_search_service.search(question)
    
    if web_results and len(web_results) > 0:
        logger.info("Web search successful, using web results")
        
        # Generate enhanced answer combining both sources
        answer = _generate_web_search_answer(
            question=question,
            web_results=web_results,
            response_length=response_length
        )
        
        # Note: Include RAG context as supplementary if available
        combined_answer = answer
        if rag_results.get('documents') and len(rag_results['documents']) > 0:
            combined_answer += "\n\n*Note: We also have some internal resources on this topic.*"
        
        return {
            "answer": combined_answer,
            "answer_source": "web_search",
            "sources": rag_results.get('sources', []),  # Reference internal sources
            "web_sources": web_results,
            "confidence": web_results[0].get('confidence', 0.5),
            "mode": "hybrid"
        }
    
    # Step 4: Both RAG and web search failed
    logger.warning("Both RAG and web search returned no good results")
    
    return {
        "answer": "I apologize, but I couldn't find reliable information about this topic. "
                 "Please try:\n1. Rephrasing your question\n2. Checking the official university documents\n3. Contacting student services directly.",
        "answer_source": "none",
        "sources": [],
        "web_sources": [],
        "confidence": 0.0,
        "mode": "hybrid"
    }


def _check_rag_relevance(rag_results: dict) -> bool:
    """
    Check if RAG results meet the similarity threshold
    
    Args:
        rag_results: Results from vector_store.query()
        
    Returns:
        bool: True if results meet threshold, False otherwise
    """
    if not rag_results or not rag_results.get('distances'):
        return False
    
    # Get the best match distance (L2 distance, lower is better)
    best_distance = min(rag_results['distances'])
    
    # Compare against threshold (configured in config.py)
    meets_threshold = best_distance <= RAG_SIMILARITY_THRESHOLD
    
    logger.info(f"RAG relevance check - Best distance: {best_distance:.4f}, "
               f"Threshold: {RAG_SIMILARITY_THRESHOLD}, Passes: {meets_threshold}")
    
    return meets_threshold


def _generate_answer_from_rag(
    question: str,
    rag_results: dict,
    personalization_context: str,
    response_length: str
) -> str:
    """Generate answer using RAG results"""
    
    # Extract sources
    documents = rag_results.get('documents', [])[0] if rag_results.get('documents') else []
    metadatas = rag_results.get('metadatas', [])[0] if rag_results.get('metadatas') else {}
    
    # Build prompt with personalization
    system_prompt = """You are AcademiGuard, an intelligent university assistant helping students find accurate information."""
    
    if personalization_context:
        system_prompt += f"\nUser Context: {personalization_context}"
    
    # Format response based on length preference
    length_instructions = {
        "brief": "Provide a concise answer in 2-3 sentences.",
        "balanced": "Provide a comprehensive answer in 3-5 sentences with key details.",
        "detailed": "Provide a thorough, detailed answer with all relevant information."
    }
    
    system_prompt += f"\n{length_instructions.get(response_length, length_instructions['balanced'])}"
    
    # Create RAG context
    context = f"Question: {question}\n\nRelevant Information:\n{documents}"
    
    # Call LLM to generate answer
    answer = llm_service.generate_answer(
        system_prompt=system_prompt,
        user_query=context,
        max_tokens=500 if response_length == "brief" else 1000
    )
    
    return answer


def _generate_web_search_answer(
    question: str,
    web_results: list,
    response_length: str
) -> str:
    """Generate answer using web search results"""
    
    # Format web results
    formatted_results = web_search_service.format_results_for_llm(web_results)
    
    # Build prompt
    system_prompt = """You are AcademiGuard, an intelligent university assistant. 
Provide accurate information based on the search results provided."""
    
    # Format response based on length preference
    length_instructions = {
        "brief": "Provide a concise answer in 2-3 sentences.",
        "balanced": "Provide a comprehensive answer in 3-5 sentences with key details.",
        "detailed": "Provide a thorough, detailed answer with all relevant information."
    }
    
    system_prompt += f"\n{length_instructions.get(response_length, length_instructions['balanced'])}"
    
    # Create web context
    context = f"Question: {question}\n\nSearch Results:\n{formatted_results}"
    
    # Generate answer
    answer = llm_service.generate_answer(
        system_prompt=system_prompt,
        user_query=context,
        max_tokens=500 if response_length == "brief" else 1000
    )
    
    return answer


# CONFIGURATION FOR RESPONSE MODES
"""
Update config.py with these settings:

RAG_SIMILARITY_THRESHOLD = 1.2  # L2 distance threshold for relevance
# Tuning guide:
# - 0.8: Very strict, only top matches included
# - 1.2: Balanced (default), good mix of precision and recall
# - 1.5: More lenient, includes more candidates
# - 2.0: Very lenient, includes most results

RESPONSE_MODES = {
    "document": {
        "description": "Search university documents and PDFs only",
        "fallback": False,
        "web_search": False
    },
    "web": {
        "description": "Search web only, use internet sources",
        "fallback": False,
        "web_search": True
    },
    "hybrid": {
        "description": "Try documents first, fall back to web search",
        "fallback": True,
        "web_search": True
    }
}

RESPONSE_LENGTH_TOKENS = {
    "brief": 300,
    "balanced": 800,
    "detailed": 1500
}
"""
