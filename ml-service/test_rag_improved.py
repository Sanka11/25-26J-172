#!/usr/bin/env python
from app.rag import answer_question

print("=" * 70)
print("Testing improved RAG with plagiarism misspellings")
print("=" * 70)

# Test with first misspelling
test1 = "what is plgrisam?"
result1 = answer_question(test1)
print(f"\nQuery: {test1}")
print(f"Response: {result1['answer']}")

# Test with second misspelling (the one user reported)
test2 = "what is plagarisam?"
result2 = answer_question(test2)
print(f"\nQuery: {test2}")
print(f"Response: {result2['answer']}")

# Test with correct spelling
test3 = "what is plagiarism?"
result3 = answer_question(test3)
print(f"\nQuery: {test3}")
print(f"Response: {result3['answer']}")

# Test other integrity questions
test4 = "how do i cite my sources?"
result4 = answer_question(test4)
print(f"\nQuery: {test4}")
print(f"Response: {result4['answer']}")

print("\n" + "=" * 70)
print("✓ All tests completed")
print("=" * 70)
