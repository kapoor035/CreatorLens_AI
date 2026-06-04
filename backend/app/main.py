import logging
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api.endpoints import analyze, chat

# 1. Initialize Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# 2. Boot up relational database tables automatically on launch
try:
    logger.info("Initializing relational database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialization successful.")
except Exception as e:
    logger.error(f"Database table creation failed: {e}")

# 3. Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Simple web app comparing stats and transcripts of a YouTube video and an Instagram Reel.",
    version="1.0.0",
)

# 4. Set CORS Middleware rules
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Wire up routers
api_router = APIRouter()
api_router.include_router(analyze.router, prefix="/analyze", tags=["analysis"])
api_router.include_router(chat.router, prefix="/chat", tags=["chatbot"])

app.include_router(api_router, prefix=settings.API_V1_STR)

# 6. Basic Health Check Endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
