"""Service for managing user-specific chat history."""

import os
import json
import time
from datetime import datetime


class ChatHistoryManager:
    """Manages chat history for individual users."""

    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.dirname(__file__))
        self.history_dir = os.path.join(base_dir, "chat_history")
        os.makedirs(self.history_dir, exist_ok=True)

    def _get_user_history_file(self, user_id: str) -> str:
        """Get the file path for a user's chat history."""
        # Sanitize user_id to prevent directory traversal
        safe_user_id = "".join(c for c in user_id if c.isalnum() or c in "-_")
        return os.path.join(self.history_dir, f"{safe_user_id}_history.json")

    def _load_user_history(self, user_id: str) -> list:
        """Load chat history for a user."""
        history_file = self._get_user_history_file(user_id)
        if not os.path.isfile(history_file):
            return []
        
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Error loading history for user {user_id}: {e}")
            return []

    def _save_user_history(self, user_id: str, history: list) -> None:
        """Save chat history for a user."""
        history_file = self._get_user_history_file(user_id)
        try:
            with open(history_file, "w", encoding="utf-8") as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving history for user {user_id}: {e}")

    def add_to_history(self, user_id: str, question: str, answer: str) -> dict:
        """Add a question-answer pair to user's history."""
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        user_id = str(user_id).strip()
        history = self._load_user_history(user_id)
        
        entry = {
            "timestamp": time.time(),
            "datetime": datetime.now().isoformat(),
            "question": question.strip(),
            "answer": answer.strip(),
        }
        
        history.append(entry)
        self._save_user_history(user_id, history)
        
        return entry

    def get_user_history(self, user_id: str, limit: int = None) -> list:
        """Get chat history for a user, optionally limited to recent N entries."""
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        user_id = str(user_id).strip()
        history = self._load_user_history(user_id)
        
        if limit and limit > 0:
            history = history[-limit:]
        
        return history

    def get_user_context(self, user_id: str, limit: int = 3) -> str:
        """Get recent chat history as context for answering new questions."""
        if not user_id or not user_id.strip():
            return ""
        
        history = self.get_user_history(user_id, limit=limit)
        if not history:
            return ""
        
        context_lines = ["Recent conversation history:"]
        for entry in history:
            q = entry.get("question", "")[:100]  # Truncate for context
            a = entry.get("answer", "")[:100]
            context_lines.append(f"Q: {q}")
            context_lines.append(f"A: {a}")
        
        return "\n".join(context_lines)

    def clear_user_history(self, user_id: str) -> bool:
        """Clear all chat history for a user."""
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        history_file = self._get_user_history_file(user_id)
        try:
            if os.path.isfile(history_file):
                os.remove(history_file)
            return True
        except Exception as e:
            print(f"Error clearing history for user {user_id}: {e}")
            return False

    def delete_history_entry(self, user_id: str, index: int) -> bool:
        """Delete a specific history entry by index."""
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        user_id = str(user_id).strip()
        history = self._load_user_history(user_id)
        
        if 0 <= index < len(history):
            del history[index]
            self._save_user_history(user_id, history)
            return True
        return False


# Global instance
_history_manager = None


def get_history_manager() -> ChatHistoryManager:
    """Get or create the singleton ChatHistoryManager instance."""
    global _history_manager
    if _history_manager is None:
        _history_manager = ChatHistoryManager()
    return _history_manager
