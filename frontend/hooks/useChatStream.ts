import { useState, useCallback } from "react";
import { API_BASE_URL } from "../config";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Citation {
  source: string;
  timestamp: string;
  text: string;
}

export function useChatStream(backendUrl: string = API_BASE_URL) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetChat = useCallback(() => {
    setMessages([]);
    setCitations([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (comparisonId: string, text: string) => {
    if (!text.trim()) return;

    setError(null);
    setIsStreaming(true);

    // 1. Add user message
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);

    // 2. Set up assistant message placeholder
    const assistantPlaceholder: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch(`${backendUrl}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comparison_id: comparisonId,
          message: text,
          // Limit history to the last 6 messages
          chat_history: messages.slice(-6),
        }),
      });

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errJson = await response.json();
          errorDetail = errJson.detail || "";
        } catch (_) {}
        if (errorDetail.includes("GEMINI_API_KEY")) {
          throw new Error("GEMINI_API_KEY is not configured.");
        }
        throw new Error(`Failed to initiate chat stream: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is not readable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedReply = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value);
          // Split by standard SSE double newlines
          const lines = chunkStr.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const rawData = line.replace("data: ", "").trim();
              if (rawData) {
                try {
                  const parsed = JSON.parse(rawData);
                  
                  if (parsed.type === "token") {
                    accumulatedReply += parsed.content;
                    // Update assistant message
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        updated[updated.length - 1] = {
                          role: "assistant",
                          content: accumulatedReply,
                        };
                      }
                      return updated;
                    });
                  } else if (parsed.type === "citations") {
                    setCitations(parsed.citations || []);
                  } else if (parsed.type === "done") {
                    done = true;
                  }
                } catch (e) {
                  // Handle incomplete JSON chunks gracefully
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      logger_err(err);
      const errMsg = err.message || "";
      let friendlyError = "We couldn't process your chat request. Please try asking again shortly.";
      if (errMsg.includes("GEMINI_API_KEY") || errMsg.includes("Gemini API Key")) {
        friendlyError = "Google Gemini Chat is currently unavailable because the API Key is not configured in the backend .env file.";
      } else if (errMsg.includes("Failed to initiate chat stream") || errMsg.includes("Failed to fetch") || errMsg.includes("TypeError")) {
        friendlyError = "Connection to chat server interrupted. Please verify the CreatorLens AI backend is running.";
      }
      setError(friendlyError);
      // Remove placeholder on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }, [backendUrl, messages]);

  return {
    messages,
    citations,
    isStreaming,
    error,
    sendMessage,
    resetChat,
    setMessages
  };
}

function logger_err(err: any) {
  console.error("Chat SSE stream runtime error:", err);
}
