import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, MapPin, Loader2 } from "lucide-react";

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

interface SearchBarProps {
  onSelect: (result: NominatimResult) => void;
  onClear: () => void;
}

const RECENT_KEY = "eg_recent_searches";
const MAX_RECENT = 6;

function getRecent(): NominatimResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(item: NominatimResult) {
  const existing = getRecent().filter(r => r.place_id !== item.place_id);
  const next = [item, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function getShortName(r: NominatimResult): string {
  const a = r.address;
  if (a?.city) return `${a.city}${a.country ? `, ${a.country}` : ""}`;
  if (a?.town) return `${a.town}${a.country ? `, ${a.country}` : ""}`;
  if (a?.village) return `${a.village}${a.country ? `, ${a.country}` : ""}`;
  if (a?.state) return `${a.state}${a.country ? `, ${a.country}` : ""}`;
  if (a?.country) return a.country;
  return r.display_name.split(",").slice(0, 2).join(",").trim();
}

export function SearchBar({ onSelect, onClear }: SearchBarProps) {
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [cursor, setCursor]           = useState(-1);
  const [recent, setRecent]           = useState<NominatimResult[]>(getRecent);
  const [selected, setSelected]       = useState<NominatimResult | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLUListElement>(null);

  /* Debounced Nominatim fetch */
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1&accept-language=en`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setCursor(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(() => search(query), 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  const handleSelect = (r: NominatimResult) => {
    setSelected(r);
    setQuery(getShortName(r));
    setSuggestions([]);
    setOpen(false);
    saveRecent(r);
    setRecent(getRecent());
    onSelect(r);
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    setSuggestions([]);
    setOpen(false);
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = query ? suggestions : recent;
    if (!open || list.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, -1)); }
    else if (e.key === "Enter" && cursor >= 0) { e.preventDefault(); handleSelect(list[cursor]); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  /* Scroll active item into view */
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const el = listRef.current.children[cursor] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [cursor]);

  const showDropdown = open && (loading || suggestions.length > 0 || (query.length === 0 && recent.length > 0));
  const listItems = query ? suggestions : recent;

  return (
    <div className="relative" style={{ width: "clamp(240px, 38vw, 440px)" }}>
      {/* Input */}
      <div
        className={`flex items-center gap-2 rounded-xl border bg-[#06121F]/95 px-3 py-2.5 shadow-2xl backdrop-blur-xl transition-all duration-200 ${
          open ? "border-cyan-400/40 ring-1 ring-cyan-400/20" : "border-white/12"
        }`}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-cyan-400" />
          : <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        }
        <input
          ref={inputRef}
          type="text"
          placeholder="Search any city, country, or landmark…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setCursor(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
        />
        {(query || selected) && (
          <button type="button" onClick={handleClear} className="flex-shrink-0 text-slate-500 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-[600] mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#06121F]/98 shadow-2xl backdrop-blur-xl"
            style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.7)" }}
          >
            {query.length === 0 && recent.length > 0 && (
              <div className="px-3 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Recent Searches
              </div>
            )}
            {loading && suggestions.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching…
              </div>
            )}
            <ul ref={listRef} className="max-h-64 overflow-y-auto divide-y divide-white/4">
              {listItems.map((r, i) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(r)}
                    className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                      cursor === i ? "bg-cyan-400/10 text-white" : "text-slate-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    {query
                      ? <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-cyan-400" />
                      : <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-500" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white leading-snug">{getShortName(r)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{r.display_name}</p>
                    </div>
                    {query && r.importance > 0.6 && (
                      <span className="flex-shrink-0 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400">Top</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {query && !loading && suggestions.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">No results found for "{query}"</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
