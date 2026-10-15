import { User, Tablet, AlertCircle } from "lucide-react";
import type { ChatMessage } from "@/types";
import MedicineCard from "./MedicineCard";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end animate-fade-in">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-blue-600" strokeWidth={2} />
        </div>
      </div>
    );
  }

  // Assistant message
  const isError = message.isError;
  const isRejection =
    message.classification === "OUT_OF_DOMAIN_QUERY" && !message.isLoading;

  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shrink-0">
        <Tablet className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      <div className="max-w-[80%] sm:max-w-[75%]">
        <div
          className={`rounded-2xl rounded-tl-md px-4 py-3 shadow-sm ${
            isError
              ? "bg-red-50 border border-red-100"
              : isRejection
              ? "bg-slate-50 border border-slate-200"
              : "bg-white border border-slate-100"
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce-dot" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce-dot" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce-dot" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm text-slate-400">Looking up medicine information...</span>
            </div>
          ) : (
            <>
              {isError && (
                <div className="flex items-start gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600 font-medium">Something went wrong</p>
                </div>
              )}
              <p
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  isError ? "text-red-600" : isRejection ? "text-slate-500" : "text-slate-700"
                }`}
              >
                {message.content}
              </p>
            </>
          )}
        </div>

        {/* Medicine info card */}
        {message.medicine && !message.isLoading && (
          <MedicineCard medicine={message.medicine} />
        )}
      </div>
    </div>
  );
}
