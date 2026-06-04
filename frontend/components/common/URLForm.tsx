import React, { useState } from "react";
import { Youtube, Instagram, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface URLFormProps {
  onSubmit: (youtubeUrl: string, instagramUrl: string) => void;
  isLoading: boolean;
}

export const URLForm: React.FC<URLFormProps> = ({ onSubmit, isLoading }) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!youtubeUrl.trim() || !instagramUrl.trim()) {
      setError("Please fill out both video URLs to begin comparison.");
      return;
    }

    if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
      setError("Please enter a valid YouTube URL (containing youtube.com or youtu.be).");
      return;
    }

    if (!instagramUrl.includes("instagram.com")) {
      setError("Please enter a valid Instagram URL (containing instagram.com).");
      return;
    }

    onSubmit(youtubeUrl.trim(), instagramUrl.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[960px] mx-auto space-y-6 animate-fade-in">
      
      {/* Form Container */}
      <div className="premium-container-card p-8 sm:p-10 space-y-6">
        
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Video A YouTube Input */}
          <div className="premium-inner-card p-5 min-h-[160px] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <label htmlFor="youtube-input" className="flex items-center space-x-2.5">
                <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-zinc-200 tracking-wide block">Video A</span>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-medium">YouTube Source</span>
                </div>
              </label>
              
              <input
                id="youtube-input"
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isLoading}
                className="w-full premium-input h-12 px-4 text-sm tracking-wide"
              />
            </div>
            
            <p className="text-[10px] text-zinc-500 font-light leading-relaxed pl-0.5">
              Supports standard YouTube videos or live mobile YouTube Shorts links.
            </p>
          </div>

          {/* Video B Instagram Input */}
          <div className="premium-inner-card p-5 min-h-[160px] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <label htmlFor="instagram-input" className="flex items-center space-x-2.5">
                <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-zinc-200 tracking-wide block">Video B</span>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-medium">Instagram Source</span>
                </div>
              </label>
              
              <input
                id="instagram-input"
                type="text"
                placeholder="https://www.instagram.com/reel/..."
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                disabled={isLoading}
                className="w-full premium-input h-12 px-4 text-sm tracking-wide"
              />
            </div>
            
            <p className="text-[10px] text-zinc-500 font-light leading-relaxed pl-0.5">
              Supports public Instagram Reels or standard video posts for metrics.
            </p>
          </div>

        </div>

        {error && (
          <div className="p-3.5 bg-red-500/5 border border-red-500/10 text-red-400 text-xs rounded-lg text-center font-medium max-w-xl mx-auto">
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button & Badges */}
        <div className="space-y-5 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 premium-cta-button text-sm font-semibold tracking-wide flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-800" />
                <span className="text-zinc-800">Processing Comparison...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 shrink-0 text-zinc-800" />
                <span className="text-zinc-800">Compare & Generate RAG Context</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-800 opacity-80" />
              </>
            )}
          </button>

          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pt-1">
            <span className="flex items-center space-x-1">
              <span className="text-indigo-400 font-semibold">✓</span>
              <span>AI Transcript Analysis</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-indigo-400 font-semibold">✓</span>
              <span>Semantic Search</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-indigo-400 font-semibold">✓</span>
              <span>YouTube Analytics</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-indigo-400 font-semibold">✓</span>
              <span>Instagram Analytics</span>
            </span>
          </div>

        </div>

      </div>

    </form>
  );
};
