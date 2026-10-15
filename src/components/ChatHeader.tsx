import { Tablet, Trash2 } from "lucide-react";

interface ChatHeaderProps {
  onClearConversation: () => void;
  hasMessages: boolean;
}

export default function ChatHeader({ onClearConversation, hasMessages }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-md shadow-blue-200">
            <Tablet className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              TabletCare <span className="text-teal-600">AI</span>
            </h1>
            <p className="text-xs text-slate-400 leading-tight">Your Smart Tablet Information Assistant</p>
          </div>
        </div>

        {hasMessages && (
          <button
            onClick={onClearConversation}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </header>
  );
}
