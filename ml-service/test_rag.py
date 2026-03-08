#!/usr/bin/env python
from app.rag import answer_question

# Test improved RAG with plagiarism question
result = answer_question('what is plagiarism')
print('✓ Improved RAG working')
answer_text = result['answer']
print(f'Response: {answer_text}')
print()

# Test with misspelled term
result2 = answer_question('what is plgrisam')
print('Test 2 - Misspelled query:')
print(f'Response: {result2["answer"]}')
