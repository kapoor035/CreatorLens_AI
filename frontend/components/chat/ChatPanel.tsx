import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, ShieldAlert, ArrowRight, BookOpen, Clock } from "lucide-react";
import { Message, Citation } from "../../hooks/useChatStream";

interface ChatPanelProps {
  comparisonId: string;
  messages: Message[];
  citations: Citation[];
  isStreaming: boolean;
  error: string | null;
  onSendMessage: (comparisonId: string, text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  comparisonId,
  messages,
  citations,
  isStreaming,
  error,
  onSendMessage,
}) => {
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Suggestion questions
  const suggestions = [
    "Why did Video B get more engagement than Video A?",
    "What's the engagement rate of each?",
    "Compare the hooks in the first 5 seconds.",
    "Who is the creator of Video B?",
    "Suggest improvements for Video B."
  ];

  // Scroll message container to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(comparisonId, input.trim());
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isStreaming) return;
    onSendMessage(comparisonId, suggestion);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Chat Window */}
      <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col h-[600px] overflow-hidden border border-white/5 relative">
        <div className="bg-white/3 px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-200">Chatbot Assistant</h3>
              <p className="text-3xs text-slate-500">Uses transcript search matches for answers</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-3xs text-slate-400 font-medium tracking-wide uppercase">Local search active</span>
          </div>
        </div>

        {/* Message Container */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6">
              <div className="p-4 bg-indigo-500/5 rounded-full border border-indigo-500/10 animate-bounce">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Ask about the videos</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ask a question or select one of the prompts below to compare the two videos.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="w-full space-y-2.5 pt-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    className="w-full text-left p-3 bg-white/3 hover:bg-white/6 hover:translate-x-1 border border-white/4 hover:border-indigo-500/30 text-slate-300 text-xs rounded-xl font-medium tracking-wide flex items-center justify-between transition-all duration-200"
                  >
                    <span>{s}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40 text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4.5 py-3 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md rounded-tr-none font-medium"
                        : "bg-white/4 border border-white/5 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                    }`}
                  >
                    {m.content ? (
                      m.content
                    ) : (
                      <span className="flex items-center space-x-1.5 text-slate-400 font-light">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping [animation-delay:0.4s]" />
                        <span className="ml-1 text-3xs italic">Preparing AI response...</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-2xs rounded-xl flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Field */}
        <form onSubmit={handleSubmit} className="p-4 bg-black/40 border-t border-white/5 flex items-center space-x-3">
          <input
            type="text"
            placeholder={isStreaming ? "Generating answer stream..." : "Ask how the hooks compare or how to fix Video B..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming || !comparisonId}
            className="flex-1 glass-input py-3 px-4 text-xs font-light focus:ring-indigo-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim() || !comparisonId}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Citations Panel */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col h-[600px] overflow-hidden">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-200">Grounded Citations</h3>
        </div>
        <p className="text-3xs text-slate-500 mb-4 leading-normal">
          When the chatbot answers, exact semantic transcript segments mapped in the vector database will slide in below as citations.
        </p>
        
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {citations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto text-slate-600 border border-dashed border-white/5 rounded-xl p-4">
              <span className="text-3xl mb-2">📜</span>
              <p className="text-3xs">Citations will populate dynamically when you ask transcript-based queries.</p>
            </div>
          ) : (
            citations.map((c, idx) => (
              <div key={idx} className="bg-white/2 border border-white/5 hover:border-white/10 rounded-xl p-3.5 space-y-2 transition-colors">
                <div className="flex items-center justify-between text-3xs font-semibold">
                  <span className={`px-2 py-0.5 rounded ${
                    c.source.includes("Video A") ? "bg-red-500/10 text-red-400" : "bg-pink-500/10 text-pink-400"
                  }`}>
                    {c.source}
                  </span>
                  <span className="text-slate-400 flex items-center space-x-1"><Clock className="w-3 h-3 text-indigo-400" /><span>{c.timestamp}</span></span>
                </div>
                <p className="text-3xs text-slate-300 italic leading-relaxed">
                  "{c.text}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
