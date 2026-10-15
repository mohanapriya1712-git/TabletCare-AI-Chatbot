import { Send, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  onSend: (query: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSend, disabled }: SearchBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all p-1.5"
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a tablet name or ask a medicine question..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 max-h-[120px]"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
      >
        <Search className="w-4 h-4 sm:hidden" strokeWidth={2} />
        <span className="hidden sm:inline">Search</span>
        <Send className="w-4 h-4" strokeWidth={2} />
      </button>
    </form>
  );
}
