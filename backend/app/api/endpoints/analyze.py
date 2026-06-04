import uuid
import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Comparison, VideoMetadata
from app.schemas.analyze import AnalysisRequest, AnalysisResponse, VideoDetail
from app.services.extractor import VideoExtractor
from app.services.rag import rag_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()
extractor = VideoExtractor()

@router.post("", response_model=AnalysisResponse)
def analyze_videos(payload: AnalysisRequest, db: Session = Depends(get_db)):
    """Fetches data for YouTube and Instagram Reels and saves it to SQLite and Chroma DB."""
    
    # 1. Validate URLs can be parsed (extract IDs)
    yt_id = extractor.extract_youtube_id(payload.youtube_url)
    ig_shortcode = extractor.extract_instagram_shortcode(payload.instagram_url)
    
    if not yt_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract a valid video ID from the provided YouTube URL."
        )
    if not ig_shortcode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract a valid shortcode from the provided Instagram Reel URL."
        )

    # Generate consistent unique ID
    comparison_id = f"comp_{uuid.uuid4().hex[:8]}_{uuid.uuid4().hex[:4]}"

    try:
        # 2. Fetch video data
        logger.info(f"Extracting video analytics for comparison: {comparison_id}")
        extracted_data = extractor.extract_and_analyze(payload.youtube_url, payload.instagram_url)
        
        # 3. Create Comparison Record in Database
        db_comparison = Comparison(
            id=comparison_id,
            youtube_url=payload.youtube_url,
            instagram_url=payload.instagram_url
        )
        db.add(db_comparison)
        
        # 4. Save Video Metadata records
        er_a = extracted_data["A"]["engagement_rate"]
        er_b = extracted_data["B"]["engagement_rate"]
        views_a = extracted_data["A"]["views"]
        views_b = extracted_data["B"]["views"]

        db_video_a = VideoMetadata(
            comparison_id=comparison_id,
            platform="youtube",
            video_external_id=yt_id,
            title=extracted_data["A"]["title"],
            creator_name=extracted_data["A"]["creator_name"],
            follower_count=extracted_data["A"]["follower_count"],
            views=None if views_a == "N/A" else views_a,
            likes=extracted_data["A"]["likes"],
            comments=extracted_data["A"]["comments"],
            engagement_rate=None if er_a == "N/A" else er_a,
            duration_seconds=extracted_data["A"]["duration_seconds"],
            upload_date=extracted_data["A"]["upload_date"],
            hashtags_str=extracted_data["A"]["hashtags_str"],
            transcript=extracted_data["A"]["transcript"]
        )
        
        db_video_b = VideoMetadata(
            comparison_id=comparison_id,
            platform="instagram",
            video_external_id=ig_shortcode,
            title=extracted_data["B"]["title"],
            creator_name=extracted_data["B"]["creator_name"],
            follower_count=extracted_data["B"]["follower_count"],
            views=None if views_b == "N/A" else views_b,
            likes=extracted_data["B"]["likes"],
            comments=extracted_data["B"]["comments"],
            engagement_rate=None if er_b == "N/A" else er_b,
            duration_seconds=extracted_data["B"]["duration_seconds"],
            upload_date=extracted_data["B"]["upload_date"],
            hashtags_str=extracted_data["B"]["hashtags_str"],
            transcript=extracted_data["B"]["transcript"]
        )
        
        db.add(db_video_a)
        db.add(db_video_b)
        db.commit()
        
        # 5. Run Ingestion inside RAG Pipeline
        logger.info(f"Ingesting transcript chunks for comparison: {comparison_id}")
        rag_pipeline.ingest_transcripts(comparison_id, extracted_data["A"], extracted_data["B"])
        
        # 6. Build response payload
        response_videos = {
            "A": VideoDetail(
                platform="youtube",
                video_id=yt_id,
                title=extracted_data["A"]["title"],
                creator=extracted_data["A"]["creator_name"],
                follower_count=extracted_data["A"]["follower_count"],
                views=extracted_data["A"]["views"],
                likes=extracted_data["A"]["likes"],
                comments=extracted_data["A"]["comments"],
                engagement_rate=extracted_data["A"]["engagement_rate"],
                duration_seconds=extracted_data["A"]["duration_seconds"],
                upload_date=extracted_data["A"]["upload_date"],
                hashtags=extracted_data["A"]["hashtags_str"].split(",") if extracted_data["A"]["hashtags_str"] else [],
                transcript_snippet=extracted_data["A"]["transcript"][:300] + "..."
            ),
            "B": VideoDetail(
                platform="instagram",
                video_id=ig_shortcode,
                title=extracted_data["B"]["title"],
                creator=extracted_data["B"]["creator_name"],
                follower_count=extracted_data["B"]["follower_count"],
                views=extracted_data["B"]["views"],
                likes=extracted_data["B"]["likes"],
                comments=extracted_data["B"]["comments"],
                engagement_rate=extracted_data["B"]["engagement_rate"],
                duration_seconds=extracted_data["B"]["duration_seconds"],
                upload_date=extracted_data["B"]["upload_date"],
                hashtags=extracted_data["B"]["hashtags_str"].split(",") if extracted_data["B"]["hashtags_str"] else [],
                transcript_snippet=extracted_data["B"]["transcript"][:300] + "..."
            )
        }
        
        return AnalysisResponse(
            comparison_id=comparison_id,
            created_at=db_comparison.created_at,
            videos=response_videos
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error during video analytical comparison: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while parsing video data: {str(e)}"
        )
