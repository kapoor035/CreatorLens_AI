import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Comparison, VideoMetadata
from app.schemas.chat import ChatRequest
from app.services.memory import ChatMemoryManager
from app.services.rag import rag_pipeline
logger = logging.getLogger(__name__)
router = APIRouter()
memory_manager = ChatMemoryManager()

@router.post("")
def chat_with_insights(payload: ChatRequest, db: Session = Depends(get_db)):
    """Streams chat responses about the comparison using the transcripts and metrics."""
    
    # 1. Fetch Comparison and Video records
    comparison = db.query(Comparison).filter(Comparison.id == payload.comparison_id).first()
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comparison with ID {payload.comparison_id} not found."
        )
        
    videos = db.query(VideoMetadata).filter(VideoMetadata.comparison_id == payload.comparison_id).all()
    if len(videos) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video metrics are incomplete or missing in the database."
        )

    # Sort so Video A is always index 0 (YouTube) and Video B is index 1 (Instagram Reels)
    video_a_db = next((v for v in videos if v.platform == "youtube"), videos[0])
    video_b_db = next((v for v in videos if v.platform == "instagram"), videos[1])

    # Convert model objects to serializable dicts for RAG
    video_a = {
        "platform": video_a_db.platform,
        "title": video_a_db.title,
        "creator_name": video_a_db.creator_name,
        "follower_count": video_a_db.follower_count,
        "views": video_a_db.views if video_a_db.views is not None else "N/A",
        "likes": video_a_db.likes,
        "comments": video_a_db.comments,
        "engagement_rate": video_a_db.engagement_rate if video_a_db.engagement_rate is not None else "N/A",
        "duration_seconds": video_a_db.duration_seconds,
        "upload_date": video_a_db.upload_date,
        "hashtags_str": video_a_db.hashtags_str,
        "transcript": video_a_db.transcript
    }
    
    video_b = {
        "platform": video_b_db.platform,
        "title": video_b_db.title,
        "creator_name": video_b_db.creator_name,
        "follower_count": video_b_db.follower_count,
        "views": video_b_db.views if video_b_db.views is not None else "N/A",
        "likes": video_b_db.likes,
        "comments": video_b_db.comments,
        "engagement_rate": video_b_db.engagement_rate if video_b_db.engagement_rate is not None else "N/A",
        "duration_seconds": video_b_db.duration_seconds,
        "upload_date": video_b_db.upload_date,
        "hashtags_str": video_b_db.hashtags_str,
        "transcript": video_b_db.transcript
    }

    # 2. Retrieve history from DB or Payload
    if payload.chat_history:
        history = [msg.model_dump() for msg in payload.chat_history]
    else:
        history = memory_manager.get_chat_history(db, payload.comparison_id)

    # Save User message to history database
    memory_manager.add_message(db, payload.comparison_id, "user", payload.message)

    async def event_generator():
        full_assistant_reply = ""
        try:
            # Get stream from LangChain RAG
            async for sse_chunk in rag_pipeline.stream_chat(
                comparison_id=payload.comparison_id,
                user_query=payload.message,
                chat_history=history,
                video_a=video_a,
                video_b=video_b
            ):
                # Accumulate tokens to save the complete answer when stream finishes
                if sse_chunk.startswith("data:"):
                    try:
                        # Extract the inner message
                        data_content = sse_chunk.replace("data: ", "").strip()
                        if data_content:
                            payload_data = json.loads(data_content)
                            if payload_data.get("type") == "token":
                                full_assistant_reply += payload_data.get("content", "")
                    except Exception:
                        pass
                
                yield sse_chunk
                
            # Save AI response to database
            if full_assistant_reply.strip():
                # Use a separate database session to save the message
                inner_db = next(get_db())
                try:
                    memory_manager.add_message(inner_db, payload.comparison_id, "assistant", full_assistant_reply)
                except Exception as save_err:
                    logger.error(f"Error saving stream logs to database: {save_err}")
                finally:
                    inner_db.close()
                    
        except Exception as e:
            logger.error(f"Error yielding SSE stream: {e}")
            yield f"data: {json.dumps({'type': 'token', 'content': ' [Internal server processing error. Chat session aborted.]'})}\n\n"
            yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
