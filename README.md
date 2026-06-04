# CreatorLens AI

A web application that compares a YouTube video and an Instagram Reel using transcript analysis and AI-generated insights. It lets you inspect metrics side-by-side and chat with a local RAG assistant to deep-dive into the content and structure of both videos.

## Features
- **Side-by-Side Stats**: Compares views, likes, comments, subscriber/follower counts, duration, and calculated engagement rates.
- **Scraper Pipelines**: Automatically scrapes YouTube video details and transcripts locally, and runs an Apify Instagram scraper to fetch Reel metadata.
- **Local Transcript Search**: Chunks video transcripts and stores them locally in Chroma DB using lightweight BGE embeddings.
- **Interactive Chat**: A chat companion powered by Google Gemini that lets you query the transcripts in real-time, complete with timestamped sources cited directly.
- **Clean Fallbacks**: Handles missing or unavailable metrics gracefully by displaying `"N/A"` or `"Unknown Creator"` instead of crashing.

## Tech Stack
- **Backend**: FastAPI, SQLite (via SQLAlchemy ORM), Chroma DB, Hugging Face Sentence Transformers (`BAAI/bge-small-en-v1.5`), and Google Gemini (via LangChain).
- **Frontend**: Next.js 15, Tailwind CSS, Vanilla CSS, and Lucide React icons.

## Project Structure
```text
CreatorLens AI/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints for scraping and streaming chat
│   │   ├── core/         # Settings configuration
│   │   ├── db/           # SQLite schema and session configuration
│   │   └── services/     # Scraping helpers and RAG logic
│   ├── requirements.txt  # Python package dependencies
│   └── .env.example      # Example environment variables
├── frontend/
│   ├── app/              # Next.js page layouts
│   ├── components/       # UI cards, form inputs, and chat panels
│   └── hooks/            # Client SSE stream reader hook
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.9 - 3.11
- Node.js 18+ and npm

### 1. Set up the Backend
```bash
# Move to the backend folder
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install the Python dependencies
pip install -r requirements.txt

# Create the environment file
cp .env.example .env

# Open .env and add your API keys:
# APIFY_TOKEN=your_apify_api_token
# GEMINI_API_KEY=your_gemini_api_key

# Run the FastAPI server
uvicorn app.main:app --reload
```
The backend API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Set up the Frontend
```bash
# Open a new terminal and move to the frontend folder
cd frontend

# Install Node modules
npm install

# Start the Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to run the app.

## Environment Variables
Create a `.env` file inside the `backend/` directory with the following variables:
```env
ENVIRONMENT=development

# Third-Party Keys
APIFY_TOKEN=apify_api_your_token_here
GEMINI_API_KEY=AIzaSy_your_gemini_key_here

# Configurations
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=sqlite:///./creatorlens.db
CHROMADB_DIR=./chroma_db
```

## How It Works
1. **Data Ingestion**: When you submit a YouTube link and an Instagram Reel link, the backend runs `yt-dlp` for YouTube metadata and sends a request to Apify's Instagram Scraper actor for the Reel details.
2. **Database & Indexing**: The analytics are saved to a local SQLite database. The spoken transcripts are chunked into paragraphs and embedded locally on CPU using Hugging Face Sentence Transformers, then stored in Chroma DB under a unique comparison ID.
3. **Chatdeep-dive**: When you ask the chatbot a question (e.g., comparing video hooks), the app retrieves the most similar transcript chunks from Chroma DB and passes them alongside the video stats to Google Gemini 2.5 Flash. The chat reply streams in real-time using Server-Sent Events (SSE), showing exact timestamps from the source transcripts.

## Screenshots

### Comparison Metrics Grid
*Compare views, followers, duration, and engagement rates side-by-side. If a metric is restricted or private, the system automatically falls back to `"N/A"`.*

### Grounded RAG Chat Companion
*Ask specific questions about the transcripts. The assistant streams back replies with exact citations and timestamps.*

## Challenges Faced
- **Instagram Scraper Normalization**: Instagram Reel data structures returned by scrapers change frequently. The creator username or duration field might be nested differently depending on post visibility. I solved this by writing a recursive Python helper that checks sequential fallback paths (`ownerUsername`, `username`, `owner.username`, etc.) to find the correct data.
- **Slow Embedding Times on CPU**: Running transformer models locally can be slow. I selected the lightweight `BAAI/bge-small-en-v1.5` embeddings model which works offline on a standard CPU with minimal overhead.
- **Handling Restricted Profiles**: Private or restricted media handles cause scrapers to return blank stats. To prevent division-by-zero or UI crashes, I mapped views and engagement calculations to safe defaults (`"N/A"` or `0`) and created glassmorphic error cards for easier debugging.

## Possible Improvements
- **Redis Caching**: Cache scraped metadata for 24 hours to reduce API call costs and avoid Instagram rate-limiting.
- **Pytest Mocking**: Write tests with `pytest-mock` to test the API routes offline without triggering active Scraper requests.
- **Multi-Video Compare**: Expand the dashboard to allow comparing up to three videos simultaneously.
