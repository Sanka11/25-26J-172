"""
Web Search Service Module
--------------------------
Provides web search functionality as a fallback when RAG retrieval fails.
Uses Google Custom Search API to retrieve and process web results.
"""

import os
import requests
from typing import List, Dict, Optional
from urllib.parse import quote


# Environment variables for Google Custom Search API
GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY", "").strip()
GOOGLE_CSE_CX = os.getenv("GOOGLE_CSE_CX", "").strip()


class WebSearchService:
    """
    Service class for performing web searches and processing results.
    """
    
    def __init__(self, api_key: str = None, cx: str = None):
        """
        Initialize the web search service.
        
        Args:
            api_key: Google Custom Search API key
            cx: Google Custom Search Engine ID
        """
        self.api_key = api_key or GOOGLE_CSE_API_KEY
        self.cx = cx or GOOGLE_CSE_CX
        self.is_configured = bool(self.api_key and self.cx)
    
    def search(self, query: str, num_results: int = 3) -> List[Dict[str, str]]:
        """
        Perform a Google web search for the given query.
        
        Args:
            query: Search query string
            num_results: Number of results to retrieve (max 10)
        
        Returns:
            List of search results with title, link, and snippet
        """
        if not self.is_configured:
            print("[WebSearch] Google Custom Search API not configured")
            print("[WebSearch] Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX environment variables")
            return []
        
        try:
            # Call Google Custom Search API
            response = requests.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": self.api_key,
                    "cx": self.cx,
                    "q": query,
                    "num": max(1, min(num_results, 10)),  # Limit to 1-10 results
                },
                timeout=10,  # 10 second timeout
            )
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            items = data.get("items", []) or []
            
            # Extract relevant information
            results = []
            for item in items:
                results.append({
                    "title": item.get("title", "").strip(),
                    "link": item.get("link", "").strip(),
                    "snippet": item.get("snippet", "").strip(),
                })
            
            print(f"[WebSearch] Retrieved {len(results)} web results for query: '{query}'")
            return results
            
        except requests.exceptions.Timeout:
            print(f"[WebSearch] Request timeout for query: '{query}'")
            return []
        except requests.exceptions.RequestException as e:
            print(f"[WebSearch] Request failed: {e}")
            return []
        except Exception as e:
            print(f"[WebSearch] Unexpected error: {e}")
            return []
    
    def format_results_for_llm(self, results: List[Dict[str, str]], max_results: int = 3) -> str:
        """
        Format web search results as context for LLM.
        
        Args:
            results: List of search result dictionaries
            max_results: Maximum number of results to include
        
        Returns:
            Formatted string with search results
        """
        if not results:
            return ""
        
        formatted_lines = []
        for idx, result in enumerate(results[:max_results], start=1):
            title = result.get("title", "No Title")
            snippet = result.get("snippet", "No description available")
            link = result.get("link", "")
            
            formatted_lines.append(
                f"Result {idx}:\n"
                f"Title: {title}\n"
                f"Summary: {snippet}\n"
                f"Source: {link}\n"
            )
        
        return "\n".join(formatted_lines)
    
    def extract_snippets(self, results: List[Dict[str, str]]) -> str:
        """
        Extract and concatenate snippets from search results.
        
        Args:
            results: List of search result dictionaries
        
        Returns:
            Concatenated snippets as a single string
        """
        if not results:
            return ""
        
        snippets = [r.get("snippet", "") for r in results if r.get("snippet")]
        return " ".join(snippets)
    
    def get_result_sources(self, results: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Extract source information from search results for citation.
        
        Args:
            results: List of search result dictionaries
        
        Returns:
            List of dictionaries with title and link for each source
        """
        sources = []
        for result in results:
            if result.get("title") and result.get("link"):
                sources.append({
                    "title": result["title"],
                    "url": result["link"]
                })
        return sources


# Global instance for easy import
web_search_service = WebSearchService()


# Convenience functions
def perform_web_search(query: str, num_results: int = 3) -> List[Dict[str, str]]:
    """
    Perform a web search using the global web search service.
    
    Args:
        query: Search query string
        num_results: Number of results to retrieve
    
    Returns:
        List of search results
    """
    return web_search_service.search(query, num_results)


def format_web_results(results: List[Dict[str, str]], max_results: int = 3) -> str:
    """
    Format web search results for LLM context.
    
    Args:
        results: List of search result dictionaries
        max_results: Maximum number of results to include
    
    Returns:
        Formatted string
    """
    return web_search_service.format_results_for_llm(results, max_results)
