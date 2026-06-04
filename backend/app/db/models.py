import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    youtube_url = Column(String, nullable=False)
    instagram_url = Column(String, nullable=False)

    # Relationships
    videos = relationship("VideoMetadata", back_populates="comparison", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="comparison", cascade="all, delete-orphan")


class VideoMetadata(Base):
    __tablename__ = "video_metadata"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    comparison_id = Column(String, ForeignKey("comparisons.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String, nullable=False)  # "youtube" or "instagram"
    video_external_id = Column(String, nullable=False)  # original video ID/shortcode
    title = Column(String, nullable=False)
    creator_name = Column(String, nullable=False)
    follower_count = Column(Integer, default=0)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    upload_date = Column(String, nullable=True)
    hashtags_str = Column(String, default="")  # stored as comma-separated values
    transcript = Column(Text, default="")

    # Relationship
    comparison = relationship("Comparison", back_populates="videos")

    @property
    def hashtags(self):
        if not self.hashtags_str:
            return []
        return [h.strip() for h in self.hashtags_str.split(",") if h.strip()]


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    comparison_id = Column(String, ForeignKey("comparisons.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    comparison = relationship("Comparison", back_populates="chat_messages")
