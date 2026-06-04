from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Any
from datetime import datetime

class AnalysisRequest(BaseModel):
    youtube_url: str
    instagram_url: str

class VideoDetail(BaseModel):
    platform: str
    video_id: str
    title: str
    creator: str
    follower_count: int
    views: Any
    likes: int
    comments: int
    engagement_rate: Any
    duration_seconds: int
    upload_date: str
    hashtags: List[str]
    transcript_snippet: str

class AnalysisResponse(BaseModel):
    comparison_id: str
    created_at: datetime
    videos: Dict[str, VideoDetail]
