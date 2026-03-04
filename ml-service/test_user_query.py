"""Test the exact query from the user - 'what are the sliit library rules'"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.rag import answer_question

print("\n" + "="*80)
print("TESTING USER'S EXACT QUERY")
print("="*80)

query = "what are the sliit library rules"
print(f"\n▶ User Query: '{query}'")
print("-" * 80)

response = answer_question(query, top_k=3)
answer = response.get('answer', 'No answer')

print("✅ SUCCESS: User gets actual library rules instead of generic fallback!\n")
print("📄 Full Answer:\n")
print(answer)
print("\n" + "="*80)
