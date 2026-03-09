"""
Web Search Service Module
--------------------------
Provides web search functionality as a fallback when RAG retrieval fails.
Uses Google Custom Search API to retrieve and process web results.
Optimized for speed with caching and connection pooling.
"""

import os
import time
import hashlib
import requests
from typing import List, Dict, Optional
from collections import OrderedDict


# Environment variables for Google Custom Search API
GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY", "").strip()
GOOGLE_CSE_CX = os.getenv("GOOGLE_CSE_CX", "").strip()


class LRUCache:
    """Simple LRU cache with TTL (Time-To-Live) for web search results."""
    
    def __init__(self, max_size: int = 100, ttl_seconds: int = 300):
        """
        Initialize cache.
        
        Args:
            max_size: Maximum number of cached items
            ttl_seconds: Time-to-live in seconds (default: 5 minutes)
        """
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.hits = 0
        self.misses = 0
    
    def _make_key(self, query: str, num_results: int) -> str:
        """Generate cache key from query and num_results."""
        key_str = f"{query.lower().strip()}:{num_results}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, query: str, num_results: int) -> Optional[List[Dict[str, str]]]:
        """Get cached results if available and not expired."""
        key = self._make_key(query, num_results)
        
        if key in self.cache:
            timestamp, results = self.cache[key]
            
            # Check if cache entry is still valid
            if time.time() - timestamp < self.ttl_seconds:
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                self.hits += 1
                return results
            else:
                # Expired, remove it
                del self.cache[key]
        
        self.misses += 1
        return None
    
    def set(self, query: str, num_results: int, results: List[Dict[str, str]]):
        """Store results in cache."""
        key = self._make_key(query, num_results)
        
        # Remove oldest if at max size
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
        
        self.cache[key] = (time.time(), results)
    
    def clear(self):
        """Clear all cached items."""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
            "size": len(self.cache)
        }


class WebSearchService:
    """
    Service class for performing web searches and processing results.
    Optimized with connection pooling and result caching.
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
        
        # Initialize cache (5 min TTL, 100 max items)
        self.cache = LRUCache(max_size=100, ttl_seconds=300)
        
        # Create persistent session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; AcademiGuard/1.0)',
            'Accept': 'application/json',
        })

    def _search_duckduckgo(self, query: str, num_results: int = 3) -> List[Dict[str, str]]:
        """Fallback web search that does not require API keys."""
        try:
            response = self.session.get(
                "https://api.duckduckgo.com/",
                params={
                    "q": query,
                    "format": "json",
                    "no_redirect": 1,
                    "no_html": 1,
                    "skip_disambig": 1,
                },
                timeout=4,
            )
            response.raise_for_status()
            data = response.json() or {}

            results: List[Dict[str, str]] = []

            abstract = (data.get("AbstractText") or "").strip()
            abstract_url = (data.get("AbstractURL") or "").strip()
            heading = (data.get("Heading") or "DuckDuckGo Result").strip()
            if abstract:
                results.append(
                    {
                        "title": heading,
                        "link": abstract_url,
                        "snippet": abstract,
                    }
                )

            for topic in data.get("RelatedTopics", []) or []:
                if len(results) >= max(1, min(num_results, 10)):
                    break

                text = (topic.get("Text") or "").strip()
                first_url = (topic.get("FirstURL") or "").strip()
                if text:
                    results.append(
                        {
                            "title": text[:80],
                            "link": first_url,
                            "snippet": text,
                        }
                    )

            print(f"[WebSearch] DuckDuckGo fallback returned {len(results)} results for query: '{query}'")
            return results
        except Exception as e:
            print(f"[WebSearch] DuckDuckGo fallback failed: {e}")
            return []
    
    def search(self, query: str, num_results: int = 3) -> List[Dict[str, str]]:
        """
        Perform a Google web search for the given query with caching.
        
        Args:
            query: Search query string
            num_results: Number of results to retrieve (max 10)
        
        Returns:
            List of search results with title, link, and snippet
        """
        if not self.is_configured:
            print("[WebSearch] Google Custom Search API not configured")
            print("[WebSearch] Falling back to DuckDuckGo search")
            return self._search_duckduckgo(query, num_results)
        
        # Check cache first
        cached_results = self.cache.get(query, num_results)
        if cached_results is not None:
            print(f"[WebSearch] ✓ Cache hit for query: '{query}' ({len(cached_results)} results)")
            return cached_results
        
        try:
            # Call Google Custom Search API with optimized timeout
            response = self.session.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": self.api_key,
                    "cx": self.cx,
                    "q": query,
                    "num": max(1, min(num_results, 10)),  # Limit to 1-10 results
                },
                timeout=5,  # Reduced from 10 to 5 seconds for faster response
            )
            response.raise_for_status()
            
            # Parse response and extract results efficiently
            data = response.json()
            items = data.get("items", []) or []
            
            # Use list comprehension for faster processing
            results = [
                {
                    "title": item.get("title", "").strip(),
                    "link": item.get("link", "").strip(),
                    "snippet": item.get("snippet", "").strip(),
                }
                for item in items
            ]
            
            # Store in cache
            if results:
                self.cache.set(query, num_results, results)
            
            print(f"[WebSearch] Retrieved {len(results)} web results for query: '{query}'")
            return results
            
        except requests.exceptions.Timeout:
            print(f"[WebSearch] Request timeout (5s) for query: '{query}'")
            return []
        except requests.exceptions.RequestException as e:
            print(f"[WebSearch] Request failed: {e}")
            return []
        except Exception as e:
            print(f"[WebSearch] Unexpected error: {e}")
            return []
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache performance statistics."""
        return self.cache.get_stats()
    
    def clear_cache(self):
        """Clear the search results cache."""
        self.cache.clear()
        print("[WebSearch] Cache cleared")
    
    def format_results_for_llm(self, results: List[Dict[str, str]], max_results: int = 3) -> str:
        """
        Format web search results as context for LLM (optimized).
        
        Args:
            results: List of search result dictionaries
            max_results: Maximum number of results to include
        
        Returns:
            Formatted string with search results
        """
        if not results:
            return ""
        
        # Use list comprehension for faster formatting
        formatted_lines = [
            f"Result {idx}:\n"
            f"Title: {result.get('title', 'No Title')}\n"
            f"Summary: {result.get('snippet', 'No description available')}\n"
            f"Source: {result.get('link', '')}\n"
            for idx, result in enumerate(results[:max_results], start=1)
        ]
        
        return "\n".join(formatted_lines)
    
    def extract_snippets(self, results: List[Dict[str, str]]) -> str:
        """
        Extract and concatenate snippets from search results (optimized).
        
        Args:
            results: List of search result dictionaries
        
        Returns:
            Concatenated snippets as a single string
        """
        if not results:
            return ""
        
        # Use list comprehension with filter for faster processing
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
