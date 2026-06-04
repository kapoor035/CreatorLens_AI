from typing import List, Dict
from sqlalchemy.orm import Session
from app.db.models import ChatMessage

class ChatMemoryManager:
    
    @staticmethod
    def get_chat_history(db: Session, comparison_id: str) -> List[Dict[str, str]]:
        """Retrieves and formats prior chat turns for a specific comparison session."""
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.comparison_id == comparison_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

    @staticmethod
    def add_message(db: Session, comparison_id: str, role: str, content: str) -> ChatMessage:
        """Persists a new message turn into the relational chat history table."""
        db_message = ChatMessage(
            comparison_id=comparison_id,
            role=role,
            content=content
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        return db_message
