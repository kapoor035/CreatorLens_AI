import React from "react";
import { Play, Flame, Heart, MessageSquare, Clock, UserCheck, Tag, FileText } from "lucide-react";

export interface VideoData {
  platform: string;
  video_id: string;
  title: string;
  creator: string;
  follower_count: number;
  views: number | string;
  likes: number;
  comments: number;
  engagement_rate: number | string;
  duration_seconds: number;
  upload_date: string;
  hashtags: string[];
  transcript_snippet: string;
}

interface SideBySideCardProps {
  videoA: VideoData;
  videoB: VideoData;
}

export const SideBySideCard: React.FC<SideBySideCardProps> = ({ videoA, videoB }) => {
  // Helper to format numbers (like 1.2M or 45K)
  const formatNum = (num: number | string) => {
    if (num === "N/A" || num === undefined || num === null || num === "") return "N/A";
    const n = Number(num);
    if (isNaN(n)) return "N/A";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const getERColor = (rate: number | string) => {
    if (rate === "N/A" || rate === undefined || rate === null || rate === "") return "text-slate-400";
    const r = Number(rate);
    if (isNaN(r)) return "text-slate-400";
    if (r >= 8) return "text-emerald-400";
    if (r >= 5) return "text-indigo-400";
    return "text-amber-400";
  };

  const formatER = (rate: number | string) => {
    if (rate === "N/A" || rate === undefined || rate === null || rate === "") return "N/A";
    const r = Number(rate);
    if (isNaN(r)) return "N/A";
    return `${r}%`;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Video A Card (YouTube) */}
        <div className="glass-panel rounded-2xl overflow-hidden relative border-t-2 border-red-500/40">
          <div className="absolute top-4 right-4 bg-red-500/10 text-brand-youtube text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            YouTube Video
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Video A Analysis</h4>
              <h2 className="text-xl font-bold text-slate-100 mt-1 line-clamp-2">{videoA.title}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-300">@{videoA.creator || "Unknown Creator"}</span>
              </div>
            </div>

            {/* Engagement Rate display */}
            <div className="bg-white/3 p-4 rounded-xl flex items-center justify-between border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Flame className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Engagement Rate</p>
                  <p className="text-xs text-slate-500">(likes + comments) / views * 100</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold tracking-tight ${getERColor(videoA.engagement_rate)}`}>
                  {formatER(videoA.engagement_rate)}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <Play className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Views</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoA.views)}</p>
                </div>
              </div>

              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <Heart className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Likes</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoA.likes)}</p>
                </div>
              </div>

              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Comments</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoA.comments)}</p>
                </div>
              </div>

              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Followers</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoA.follower_count)}</p>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/5">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Duration: {videoA.duration_seconds}s</span>
              </div>
              <span>Uploaded: {videoA.upload_date}</span>
            </div>

            {/* Hashtags list */}
            {videoA.hashtags && videoA.hashtags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400 flex items-center space-x-1"><Tag className="w-3.5 h-3.5" /><span>Tags</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {videoA.hashtags.map((h, i) => (
                    <span key={i} className="text-3xs bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-slate-300">
                      #{h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript preview */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 flex items-center space-x-1"><FileText className="w-3.5 h-3.5" /><span>Transcript Preview</span></p>
              <div className="bg-[#030305] text-xs font-mono p-3 rounded-lg border border-white/5 text-slate-400 h-28 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {videoA.transcript_snippet}
              </div>
            </div>

          </div>
        </div>

        {/* Video B Card (Instagram) */}
        <div className="glass-panel rounded-2xl overflow-hidden relative border-t-2 border-pink-500/40">
          <div className="absolute top-4 right-4 bg-pink-500/10 text-brand-instagram text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Instagram Reel
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Video B Analysis</h4>
              <h2 className="text-xl font-bold text-slate-100 mt-1 line-clamp-2">{videoB.title}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-300">@{videoB.creator || "Unknown Creator"}</span>
              </div>
            </div>

            {/* Engagement Rate display */}
            <div className="bg-white/3 p-4 rounded-xl flex items-center justify-between border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <Flame className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Engagement Rate</p>
                  <p className="text-xs text-slate-500">(likes + comments) / views * 100</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold tracking-tight ${getERColor(videoB.engagement_rate)}`}>
                  {formatER(videoB.engagement_rate)}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <Play className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Views</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoB.views)}</p>
                </div>
              </div>

              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <Heart className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Likes</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoB.likes)}</p>
                </div>
              </div>

              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Comments</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoB.comments)}</p>
                </div>
              </div>

              <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-2xs text-slate-500 uppercase tracking-wider">Followers</p>
                  <p className="text-sm font-semibold text-slate-200">{formatNum(videoB.follower_count)}</p>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/5">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Duration: {videoB.duration_seconds}s</span>
              </div>
              <span>Uploaded: {videoB.upload_date}</span>
            </div>

            {/* Hashtags list */}
            {videoB.hashtags && videoB.hashtags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400 flex items-center space-x-1"><Tag className="w-3.5 h-3.5" /><span>Tags</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {videoB.hashtags.map((h, i) => (
                    <span key={i} className="text-3xs bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-slate-300">
                      #{h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript preview */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 flex items-center space-x-1"><FileText className="w-3.5 h-3.5" /><span>Transcript Preview</span></p>
              <div className="bg-[#030305] text-xs font-mono p-3 rounded-lg border border-white/5 text-slate-400 h-28 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {videoB.transcript_snippet}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
