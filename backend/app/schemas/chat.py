# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Dict, Optional

class ChatMessageSchema(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    comparison_id: str
    message: str
    chat_history: Optional[List[ChatMessageSchema]] = None
