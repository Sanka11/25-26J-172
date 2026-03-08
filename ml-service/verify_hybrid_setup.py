"""
Quick verification script for hybrid retrieval setup
This script performs basic checks without loading heavy dependencies
"""

import os
import sys

def check_files_exist():
    """Check if all required files exist"""
    print("=" * 60)
    print("Checking File Structure")
    print("=" * 60)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    required_files = [
        "app/services/web_search_service.py",
        "app/config.py",
        "app/vector_store.py",
        "app/rag.py",
        ".env.example",
        "HYBRID_RETRIEVAL_SETUP.md",
    ]
    
    all_exist = True
    for file_path in required_files:
        full_path = os.path.join(base_path, file_path)
        exists = os.path.exists(full_path)
        status = "✅" if exists else "❌"
        print(f"{status} {file_path}")
        if not exists:
            all_exist = False
    
    print()
    return all_exist


def check_env_variables():
    """Check environment variable configuration"""
    print("=" * 60)
    print("Checking Environment Variables")
    print("=" * 60)
    
    api_key = os.getenv("GOOGLE_CSE_API_KEY", "")
    cx = os.getenv("GOOGLE_CSE_CX", "")
    
    if api_key and api_key != "your_google_api_key_here":
        print(f"✅ GOOGLE_CSE_API_KEY is set (***{api_key[-4:] if len(api_key) > 4 else ''})")
    else:
        print("❌ GOOGLE_CSE_API_KEY not configured")
        print("   Set this in your .env file to enable web search")
    
    if cx and cx != "your_search_engine_id_here":
        print(f"✅ GOOGLE_CSE_CX is set ({cx[:10]}...)")
    else:
        print("❌ GOOGLE_CSE_CX not configured")
        print("   Set this in your .env file to enable web search")
    
    print()
    
    web_configured = bool(api_key and cx and 
                         api_key != "your_google_api_key_here" and 
                         cx != "your_search_engine_id_here")
    
    if web_configured:
        print("✅ Web search is fully configured")
    else:
        print("⚠️  Web search not configured - system will use fallback answers")
        print("   See HYBRID_RETRIEVAL_SETUP.md for setup instructions")
    
    print()
    return web_configured


def check_code_additions():
    """Check if key code additions are present"""
    print("=" * 60)
    print("Checking Code Modifications")
    print("=" * 60)
    
    checks = []
    
    # Check config.py for threshold
    try:
        with open("app/config.py", "r") as f:
            config_content = f.read()
            has_threshold = "RAG_SIMILARITY_THRESHOLD" in config_content
            checks.append(("RAG_SIMILARITY_THRESHOLD in config.py", has_threshold))
    except Exception as e:
        checks.append(("config.py readable", False))
    
    # Check vector_store.py for distances
    try:
        with open("app/vector_store.py", "r") as f:
            vector_content = f.read()
            has_distances = "distances" in vector_content and "include=['documents', 'metadatas', 'distances']" in vector_content
            checks.append(("Distance tracking in vector_store.py", has_distances))
    except Exception as e:
        checks.append(("vector_store.py readable", False))
    
    # Check rag.py for hybrid functions
    try:
        with open("app/rag.py", "r") as f:
            rag_content = f.read()
            has_relevance_check = "_check_rag_relevance" in rag_content
            has_web_answer = "_generate_web_search_answer" in rag_content
            has_web_import = "from .services.web_search_service import" in rag_content
            checks.append(("_check_rag_relevance function in rag.py", has_relevance_check))
            checks.append(("_generate_web_search_answer function in rag.py", has_web_answer))
            checks.append(("Web search service imported in rag.py", has_web_import))
    except Exception as e:
        checks.append(("rag.py readable", False))
    
    all_passed = True
    for check_name, passed in checks:
        status = "✅" if passed else "❌"
        print(f"{status} {check_name}")
        if not passed:
            all_passed = False
    
    print()
    return all_passed


def main():
    """Run all verification checks"""
    print("\n")
    print("*" * 60)
    print("HYBRID RETRIEVAL SYSTEM - QUICK VERIFICATION")
    print("*" * 60)
    print("\n")
    
    files_ok = check_files_exist()
    env_ok = check_env_variables()
    code_ok = check_code_additions()
    
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if files_ok and code_ok:
        print("✅ Implementation is complete")
        print()
        if env_ok:
            print("✅ Web search is configured and ready to use")
        else:
            print("⚠️  Web search needs configuration (see HYBRID_RETRIEVAL_SETUP.md)")
        print()
        print("Next steps:")
        print("1. Configure Google Custom Search API (if not done)")
        print("2. Start the ML service")
        print("3. Test with queries not in your PDF database")
    else:
        print("❌ Implementation incomplete - please review errors above")
    
    print("=" * 60)
    print("\n")


if __name__ == "__main__":
    main()
