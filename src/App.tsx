import { useState, useRef, useEffect, useCallback } from "react";
import { ShieldCheck } from "lucide-react";
import type { ChatMessage, ChatResponse } from "@/types";
import { sendQuery } from "@/lib/api";
import ChatHeader from "@/components/ChatHeader";
import SearchBar from "@/components/SearchBar";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import SuggestionPanel from "@/components/SuggestionPanel";

const INITIAL_SUGGESTIONS = [
  "What are the uses of Paracetamol?",
  "What are the side effects of Cetirizine?",
  "Tell me about Ibuprofen",
  "What is Aspirin used for?",
  "What are the precautions for Amoxicillin?",
  "Tell me about Omeprazole",
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Hello! I'm TabletCare AI, your smart tablet information assistant. I can provide verified information about tablet names, active ingredients, common uses, side effects, precautions, and important warnings.\n\nAsk me about a medicine or pick from the suggested searches below.",
    timestamp: Date.now(),
  };
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const loadingMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setIsLoading(true);

      try {
        const response: ChatResponse = await sendQuery(trimmed);

        const assistantMessage: ChatMessage = {
          id: loadingMessage.id,
          role: "assistant",
          content: response.message,
          timestamp: Date.now(),
          medicine: response.medicine,
          classification: response.classification,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === loadingMessage.id ? assistantMessage : m))
        );
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: loadingMessage.id,
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please check your connection and try again.",
          timestamp: Date.now(),
          isError: true,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === loadingMessage.id ? errorMessage : m))
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const handleClearConversation = useCallback(() => {
    setMessages([createWelcomeMessage()]);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30 flex flex-col">
      <ChatHeader
        onClearConversation={handleClearConversation}
        hasMessages={messages.length > 1}
      />

      {/* Chat messages area */}
      <main className="flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto scrollbar-thin"
        >
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}

            {/* Show suggestions after welcome message when no user messages yet */}
            {messages.length === 1 && !isLoading && (
              <div className="ml-11">
                <SuggestionPanel
                  suggestions={suggestions}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      </main>

      {/* Search bar area */}
      <div className="border-t border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3.5">
          <SearchBar onSend={handleSend} disabled={isLoading} />
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" strokeWidth={2} />
            <p className="text-xs text-slate-400">
              TabletCare AI provides verified information only — always consult a healthcare professional for personal medical advice.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
