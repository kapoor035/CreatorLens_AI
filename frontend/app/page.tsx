"use client";

import React, { useState } from "react";
import { Sparkles, BarChart2, MessageCircle, RefreshCw, Film, ShieldAlert, Loader2 } from "lucide-react";
import { URLForm } from "../components/common/URLForm";
import { SideBySideCard, VideoData } from "../components/analytics/SideBySideCard";
import { ChatPanel } from "../components/chat/ChatPanel";
import { useChatStream } from "../hooks/useChatStream";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisData, setAnalysisData] = useState<{
    comparisonId: string;
    videoA: VideoData;
    videoB: VideoData;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set up SSE chat hook
  const {
    messages,
    citations,
    isStreaming,
    error: chatError,
    sendMessage,
    resetChat,
  } = useChatStream(BACKEND_URL);

  const handleURLSubmit = async (youtubeUrl: string, instagramUrl: string) => {
    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    setAnalysisData(null);
    resetChat();

    // Timers to update the loading text
    const timer1 = setTimeout(() => setLoadingStep(1), 5000);  // "Extracting Instagram data..." after 5s
    const timer2 = setTimeout(() => setLoadingStep(2), 15000); // "Generating RAG context..." after 15s
    const timer3 = setTimeout(() => setLoadingStep(3), 25000); // "Finishing analysis..." after 25s

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          instagram_url: instagramUrl,
        }),
      });

      if (!response.ok) {
        const errDetail = await response.json().catch(() => ({}));
        throw new Error(errDetail.detail || "Failed to analyze URLs. Ensure the backend is running.");
      }

      const res = await response.json();
      
      setAnalysisData({
        comparisonId: res.comparison_id,
        videoA: {
          platform: res.videos.A.platform,
          video_id: res.videos.A.video_id,
          title: res.videos.A.title,
          creator: res.videos.A.creator || "Unknown Creator",
          follower_count: res.videos.A.follower_count,
          views: res.videos.A.views ?? "N/A",
          likes: res.videos.A.likes,
          comments: res.videos.A.comments,
          engagement_rate: res.videos.A.engagement_rate ?? "N/A",
          duration_seconds: res.videos.A.duration_seconds,
          upload_date: res.videos.A.upload_date,
          hashtags: res.videos.A.hashtags,
          transcript_snippet: res.videos.A.transcript_snippet,
        },
        videoB: {
          platform: res.videos.B.platform,
          video_id: res.videos.B.video_id,
          title: res.videos.B.title,
          creator: res.videos.B.creator || "Unknown Creator",
          follower_count: res.videos.B.follower_count,
          views: res.videos.B.views ?? "N/A",
          likes: res.videos.B.likes,
          comments: res.videos.B.comments,
          engagement_rate: res.videos.B.engagement_rate ?? "N/A",
          duration_seconds: res.videos.B.duration_seconds,
          upload_date: res.videos.B.upload_date,
          hashtags: res.videos.B.hashtags,
          transcript_snippet: res.videos.B.transcript_snippet,
        },
      });
    } catch (err: any) {
      console.error("Technical Error Details:", err);
      const errMsg = err.message || "";
      if (errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError")) {
        setError("Network connection issue detected. Please verify the CreatorLens AI backend server is active and try again.");
      } else if (errMsg.includes("APIFY_TOKEN") || errMsg.includes("Apify client")) {
        setError("Scraper authentication error. The Apify token configuration is missing or invalid. Please check the environment variables.");
      } else if (errMsg.includes("execution failed") || errMsg.includes("timed out")) {
        setError("The scraper execution timed out or failed. Instagram may be rate-limiting requests. Please try again shortly.");
      } else if (errMsg.includes("YouTube URL") || errMsg.includes("Instagram Reel URL")) {
        setError("One of the video links you provided appears to be invalid or private. Please check the URLs and try again.");
      } else {
        setError("We encountered an unexpected error while comparing the videos. Please check your inputs and try again.");
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    setLoadingStep(0);
    setError(null);
    resetChat();
  };

  return (
    <main className="min-h-screen py-16 px-6 max-w-[960px] mx-auto space-y-12 animate-fade-in">
      
      {/* Header */}
      <header className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto pt-4">
        
        {/* Project Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Student Project • AI Content Analysis</span>
        </div>

        {/* Page Title */}
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
          CreatorLens AI
        </h1>
        
        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-zinc-400 font-light tracking-wide max-w-[650px] leading-relaxed">
          Compare YouTube videos and Instagram Reels using AI-powered transcript analysis, engagement metrics, and semantic search.
        </p>

      </header>

      {/* URL Input Form or Comparison Results */}
      {isLoading ? (
        <section className="flex flex-col items-center justify-center max-w-lg mx-auto py-16 space-y-6">
          <div className="relative p-5 bg-indigo-500/5 rounded-full border border-indigo-500/10">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200 tracking-wide animate-pulse">
              {loadingStep === 0 && "Extracting YouTube data..."}
              {loadingStep === 1 && "Extracting Instagram data..."}
              {loadingStep === 2 && "Generating RAG context..."}
              {loadingStep >= 3 && "Finishing comparison details..."}
            </h3>
            <p className="text-2xs text-zinc-500 font-light leading-relaxed">
              This process takes about 20-30 seconds to fetch, transcribe, and index live media transcripts semantically.
            </p>
          </div>
        </section>
      ) : !analysisData ? (
        <section className="space-y-12">
          
          <URLForm onSubmit={handleURLSubmit} isLoading={isLoading} />
          
          {error && (
            <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl max-w-lg mx-auto space-y-4">
              <div className="flex items-center space-x-3 text-red-400">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">Analysis Comparison Interrupted</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                {error}
              </p>
              <div className="text-3xs text-zinc-500 leading-relaxed pt-2 border-t border-zinc-800/40 flex items-center justify-between">
                <span>Troubleshooting tip: Check your connection or retry later.</span>
                <span className="font-mono text-zinc-600">CODE: EXT_ERR</span>
              </div>
            </div>
          )}

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-zinc-900/40">
            
            {/* Transcript Analysis */}
            <div className="premium-feature-card p-[28px] flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-red-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-zinc-100 tracking-wide">Transcript Analysis</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    Extracts spoken dialog from active media timelines and indexes time-coded dialogues into semantic paragraphs for rapid content reviews.
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Engine */}
            <div className="premium-feature-card p-[28px] flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-zinc-100 tracking-wide">Metrics Engine</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    Aggregates and normalizes performance indices such as views, likes, and comment replies to yield stable engagement rates.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Comparison Chat */}
            <div className="premium-feature-card p-[28px] flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-zinc-100 tracking-wide">AI Comparison Chat</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    Engages a fully grounded chatbot companion to query thematic concepts and retrieve context-tied timestamps.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </section>
      ) : (
        <section className="space-y-12">
          
          {/* Comparison ID Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
            <div>
              <span className="text-3xs text-zinc-500 font-bold uppercase tracking-widest">Comparison ID</span>
              <p className="text-xs font-mono text-indigo-400 font-semibold">{analysisData.comparisonId}</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-200 text-xs rounded-xl font-semibold tracking-wide transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Compare New URLs</span>
            </button>
          </div>

          {/* Side-by-side stats grid */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-zinc-100">Performance Comparison</h2>
            </div>
            <SideBySideCard videoA={analysisData.videoA} videoB={analysisData.videoB} />
          </div>

          {/* RAG Chat panel */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-zinc-100">Transcript AI Deep-Dive</h2>
            </div>
            <ChatPanel
              comparisonId={analysisData.comparisonId}
              messages={messages}
              citations={citations}
              isStreaming={isStreaming}
              error={chatError}
              onSendMessage={sendMessage}
            />
          </div>

        </section>
      )}

      {/* Footer */}
      <footer className="text-center space-y-1.5 pt-12 border-t border-zinc-800/40">
        <h4 className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">CreatorLens AI</h4>
        <p className="text-[10px] text-zinc-500 font-light">
          Built with FastAPI, Next.js, Gemini AI and ChromaDB
        </p>
      </footer>

    </main>
  );
}
