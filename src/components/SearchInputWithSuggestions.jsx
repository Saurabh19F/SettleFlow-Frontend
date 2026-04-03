import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchInputWithSuggestions({
  value,
  onChange,
  placeholder,
  suggestions = [],
  className = "w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm sm:min-w-56 sm:w-auto",
  maxItems = 6,
  minChars = 1
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const recommendations = useMemo(() => {
    const query = String(value || "").trim().toLowerCase();
    if (query.length < minChars) {
      return [];
    }
    const unique = Array.from(new Set((suggestions || []).map((item) => String(item || "").trim()).filter(Boolean)));
    if (query) {
      const startsWith = unique.filter((item) => item.toLowerCase().startsWith(query));
      const contains = unique.filter(
        (item) => !item.toLowerCase().startsWith(query) && item.toLowerCase().includes(query)
      );
      return [...startsWith, ...contains].slice(0, maxItems);
    }
    return unique.slice(0, maxItems);
  }, [suggestions, value, maxItems]);

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(event.target.value.trim().length >= minChars);
        }}
        onFocus={() => setOpen(String(value || "").trim().length >= minChars)}
        placeholder={placeholder}
        className={className}
      />
      {open && recommendations.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-56 overflow-auto rounded-xl border border-white/20 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:bg-slate-900/95">
          {recommendations.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 transition hover:bg-indigo-500/10 dark:text-slate-200"
            >
              <span className="truncate">{item}</span>
              <span className="ml-2 text-[10px] text-slate-400">Use</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
