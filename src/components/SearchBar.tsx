import { Send, Search, Pill } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import type { MedicinePrediction } from "@/types";

interface SearchBarProps {
  onSend: (query: string) => void;
  disabled?: boolean;
  predictions: MedicinePrediction[];
}

export default function SearchBar({ onSend, disabled, predictions }: SearchBarProps) {
  const [input, setInput] = useState("");
  const [showPredictions, setShowPredictions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Filter predictions based on current input
  const filteredPredictions = useMemo(() => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return predictions
      .filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.active_ingredient.toLowerCase().includes(trimmed)
      )
      .slice(0, 6);
  }, [input, predictions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPredictions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    setShowPredictions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showPredictions && filteredPredictions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredPredictions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredPredictions.length - 1
        );
        return;
      }
      if (e.key === "Tab" && activeIndex >= 0) {
        e.preventDefault();
        selectPrediction(filteredPredictions[activeIndex]);
        return;
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        selectPrediction(filteredPredictions[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowPredictions(false);
        setActiveIndex(-1);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const selectPrediction = (pred: MedicinePrediction) => {
    setInput("");
    setShowPredictions(false);
    setActiveIndex(-1);
    onSend(pred.name);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setShowPredictions(true);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Autocomplete dropdown */}
      {showPredictions && filteredPredictions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-20 max-h-64 overflow-y-auto scrollbar-thin">
          {filteredPredictions.map((pred, i) => (
            <button
              key={`${pred.name}-${i}`}
              type="button"
              onClick={() => selectPrediction(pred)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                activeIndex === i
                  ? "bg-teal-50 border-l-2 border-teal-500"
                  : "border-l-2 border-transparent hover:bg-slate-50"
              }`}
            >
              <Pill
                className={`w-4 h-4 shrink-0 ${
                  activeIndex === i ? "text-teal-600" : "text-slate-400"
                }`}
                strokeWidth={2}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {pred.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {pred.active_ingredient}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all p-1.5"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim().length >= 2 && setShowPredictions(true)}
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
    </div>
  );
}
