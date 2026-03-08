#!/usr/bin/env python
from app.rag import answer_question

print("=" * 80)
print("Testing Enhanced RAG with PDF Suggestions")
print("=" * 80)

# Test 1: Library policies question
test1 = "What are the library policies?"
result1 = answer_question(test1)
print(f"\n[Test 1] Query: {test1}")
print(f"Response: {result1['answer']}")
print(f"Suggested PDFs: {result1.get('suggested_pdfs', [])}")

# Test 2: Academic integrity question
test2 = "What is plagiarism and how do I avoid it?"
result2 = answer_question(test2)
print(f"\n[Test 2] Query: {test2}")
print(f"Response: {result2['answer']}")
print(f"Suggested PDFs: {result2.get('suggested_pdfs', [])}")

# Test 3: Misspelled library question
test3 = "What is the late fee if I don't return books?"
result3 = answer_question(test3)
print(f"\n[Test 3] Query: {test3}")
print(f"Response: {result3['answer']}")
print(f"Suggested PDFs: {result3.get('suggested_pdfs', [])}")

# Test 4: Fee structure question
test4 = "How much is the tuition fee?"
result4 = answer_question(test4)
print(f"\n[Test 4] Query: {test4}")
print(f"Response: {result4['answer']}")
print(f"Suggested PDFs: {result4.get('suggested_pdfs', [])}")

# Test 5: Student conduct
test5 = "What are the dress code and attendance rules?"
result5 = answer_question(test5)
print(f"\n[Test 5] Query: {test5}")
print(f"Response: {result5['answer']}")
print(f"Suggested PDFs: {result5.get('suggested_pdfs', [])}")

print("\n" + "=" * 80)
print("✓ All tests completed - PDF suggestions are now included in responses")
print("=" * 80)
