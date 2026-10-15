import { Sparkles } from "lucide-react";

interface SuggestionPanelProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function SuggestionPanel({ suggestions, onSuggestionClick }: SuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-4 h-4 text-teal-500" strokeWidth={2} />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Suggested Searches
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-sm px-3.5 py-2 rounded-full bg-white border border-blue-100 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
