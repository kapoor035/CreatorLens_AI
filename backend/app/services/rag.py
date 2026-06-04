import logging
import json
import re
from typing import Dict, Any, List, AsyncGenerator
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter
# pyrefly: ignore [missing-import]
from langchain_chroma import Chroma
# pyrefly: ignore [missing-import]
from langchain_huggingface import HuggingFaceEmbeddings
# pyrefly: ignore [missing-import]
from langchain_google_genai import ChatGoogleGenerativeAI
# pyrefly: ignore [missing-import]
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

class RAGPipeline:
    def __init__(self):
        # Embeddings generation and database initialization run 100% locally and offline.
        # No GEMINI_API_KEY is required here.
        logger.info("Initializing local open-source BGE embeddings (BAAI/bge-small-en-v1.5).")
        
        model_name = "BAAI/bge-small-en-v1.5"
        model_kwargs = {"device": "cpu"}
        encode_kwargs = {"normalize_embeddings": True}
        
        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs
        )
        
        # We rename collection_name to avoid dimension clashes (384 dimensions for BGE vs 1536 for OpenAI)
        self.vector_store = Chroma(
            persist_directory=settings.CHROMADB_DIR,
            embedding_function=self.embeddings,
            collection_name="creatorlens_bge_transcripts"
        )

    def ingest_transcripts(self, comparison_id: str, video_a: Dict[str, Any], video_b: Dict[str, Any]) -> None:
        """Chunks, structures, and embeds the transcripts for both videos under a single comparison ID."""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=50,
            separators=["\n", " ", ""]
        )

        documents = []
        
        for video_id, video in [("A", video_a), ("B", video_b)]:
            transcript_text = video.get("transcript", "")
            if not transcript_text:
                continue

            # Split transcript by lines
            lines = transcript_text.split("\n")
            current_chunk = []
            current_char_count = 0
            
            for line in lines:
                if not line.strip():
                    continue
                current_chunk.append(line)
                current_char_count += len(line)
                
                if current_char_count >= 300:
                    chunk_content = "\n".join(current_chunk)
                    # Extract timestamp from first line of chunk
                    time_match = re.search(r'\[(\d{2}):(\d{2})\]', current_chunk[0])
                    timestamp_str = "00:00"
                    if time_match:
                        timestamp_str = f"{time_match.group(1)}:{time_match.group(2)}"
                    
                    documents.append({
                        "page_content": chunk_content,
                        "metadata": {
                            "comparison_id": comparison_id,
                            "video_id": video_id,
                            "platform": video.get("platform"),
                            "timestamp": timestamp_str,
                            "creator": video.get("creator_name")
                        }
                    })
                    current_chunk = []
                    current_char_count = 0
            
            # Flush remainder
            if current_chunk:
                chunk_content = "\n".join(current_chunk)
                time_match = re.search(r'\[(\d{2}):(\d{2})\]', current_chunk[0])
                timestamp_str = "00:00"
                if time_match:
                    timestamp_str = f"{time_match.group(1)}:{time_match.group(2)}"
                documents.append({
                    "page_content": chunk_content,
                    "metadata": {
                        "comparison_id": comparison_id,
                        "video_id": video_id,
                        "platform": video.get("platform"),
                        "timestamp": timestamp_str,
                        "creator": video.get("creator_name")
                    }
                })

        # Save directly to ChromaDB
        from langchain_core.documents import Document
        lc_docs = [
            Document(page_content=d["page_content"], metadata=d["metadata"])
            for d in documents
        ]
        self.vector_store.add_documents(lc_docs)
        logger.info(f"Ingested {len(lc_docs)} chunks into ChromaDB for comparison {comparison_id}")

    def query_similarity(self, comparison_id: str, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Queries the vector store for relevant transcript chunks matching the user query."""
        results = self.vector_store.similarity_search(
            query,
            k=k,
            filter={"comparison_id": comparison_id}
        )
        return [
            {
                "page_content": doc.page_content,
                "metadata": doc.metadata
            }
            for doc in results
        ]

    async def stream_chat(
        self,
        comparison_id: str,
        user_query: str,
        chat_history: List[Dict[str, str]],
        video_a: Dict[str, Any],
        video_b: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Generates structured prompts and streams responses from Google Gemini Chat LLM."""
        # Check if GEMINI_API_KEY is configured before starting a chat session
        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not configured in backend/.env. "
                "Google Gemini chat streaming operations require a valid Gemini API Key."
            )
            
        # 1. Retrieve Context Chunks
        retrieved_docs = self.query_similarity(comparison_id, user_query, k=4)
        
        # 2. Structure context chunks as raw strings
        context_str = ""
        citations = []
        for idx, doc in enumerate(retrieved_docs):
            v_id = doc["metadata"]["video_id"]
            plat = doc["metadata"]["platform"]
            ts = doc["metadata"]["timestamp"]
            creator = doc["metadata"]["creator"]
            context_str += f"\n--- [Segment {idx+1}] Source: Video {v_id} ({plat.capitalize()}) | Creator: {creator} | Timestamp: {ts} ---\n{doc['page_content']}\n"
            
            # Format citation sources
            citations.append({
                "source": f"Video {v_id} ({plat.capitalize()})",
                "timestamp": ts,
                "text": doc["page_content"][:120] + "..."
            })

        er_a = f"{video_a['engagement_rate']}%" if video_a['engagement_rate'] != "N/A" else "N/A"
        er_b = f"{video_b['engagement_rate']}%" if video_b['engagement_rate'] != "N/A" else "N/A"

        # 3. Create the prompt with stats and transcript chunks
        system_prompt = (
            "You are a helpful assistant for CreatorLens, a student web project comparing two videos. You help compare two social media videos by analyzing their stats and transcript segments.\n"
            "Here is their structural data:\n\n"
            "--- VIDEO A (YouTube) ---\n"
            f"- Creator: {video_a['creator_name']} ({video_a['follower_count']} subscribers)\n"
            f"- Views: {video_a['views']} | Likes: {video_a['likes']} | Comments: {video_a['comments']}\n"
            f"- Engagement Rate: {er_a}\n"
            f"- Duration: {video_a['duration_seconds']} seconds\n"
            f"- Hashtags: {video_a['hashtags_str']}\n\n"
            "--- VIDEO B (Instagram Reel) ---\n"
            f"- Creator: {video_b['creator_name']} ({video_b['follower_count']} followers)\n"
            f"- Views: {video_b['views']} | Likes: {video_b['likes']} | Comments: {video_b['comments']}\n"
            f"- Engagement Rate: {er_b}\n"
            f"- Duration: {video_b['duration_seconds']} seconds\n"
            f"- Hashtags: {video_b['hashtags_str']}\n"
            "----------------------------\n\n"
            "Relevant Transcript Segments:\n"
            f"{context_str}\n"
            "Instructions:\n"
            "1. Always base statistical comparisons on the raw numbers provided above, NOT on the transcript context.\n"
            "2. For thematic, hooks, structure, or content comparisons, draw directly from the retrieved transcripts.\n"
            "3. Be direct, actionable, and construct a narrative around why one video outperformed the other.\n"
            "4. If referring to transcripts, cite the specific video ('Video A' or 'Video B') and approximate timestamp [e.g., Video A at 0:15].\n"
            "5. Maintain a direct, objective, and helpful tone."
        )

        # 4. Stream the response from Gemini
        messages = [SystemMessage(content=system_prompt)]
        for msg in chat_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Append current human query
        messages.append(HumanMessage(content=user_query))
        
        llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
            streaming=True
        )
        
        # Yield tokens as they stream from Google Gemini
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
        
        # Send the citations at the end
        yield f"data: {json.dumps({'type': 'citations', 'citations': citations})}\n\n"
        yield "data: {\"type\": \"done\"}\n\n"

rag_pipeline = RAGPipeline()
