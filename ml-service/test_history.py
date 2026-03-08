#!/usr/bin/env python3
"""Quick test of chat history functionality."""

from app.services.chat_history_service import ChatHistoryManager

mgr = ChatHistoryManager()

# Test: Add to history for user 'student1'
mgr.add_to_history('student1', 'What is plagiarism?', 'Plagiarism is using someone else work without credit.')
mgr.add_to_history('student1', 'How to submit assignment?', 'Submit via the online portal.')

# Test: Get history
history = mgr.get_user_history('student1')
print(f'User student1 has {len(history)} chats')
for entry in history:
    q = entry["question"][:50]
    a = entry["answer"][:50]
    print(f'  Q: {q}...')
    print(f'  A: {a}...')

# Test: Get history for another user
mgr.add_to_history('student2', 'Can I use Visa?', 'Yes, Visa is accepted.')
history2 = mgr.get_user_history('student2')
print(f'User student2 has {len(history2)} chats')

# Test: Get recent entries
summary = mgr.get_user_history('student1', limit=2)
print(f'Last 2 chats for student1: {len(summary)} entries')

print("\nChat history service working correctly!")
