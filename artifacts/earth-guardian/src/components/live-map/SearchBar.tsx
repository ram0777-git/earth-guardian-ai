import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, MapPin, Loader2 } from "lucide-react";

/* ── Unified search result type ───────────────────────────── */

export interface NominatimResult {
  place_id:     number;
  display_name: string;
  lat:          string;
  lon:          string;
  type:         string;
  importance:   number;
  zoomHint?:    number;
  address?: {
    country?: string;
    state?:   string;
    city?:    string;
    town?:    string;
    village?: string;
  };
}

/* ── Photon OSM value → zoom mapping ──────────────────────── */

const OSM_ZOOM: Record<string, number> = {
  country:      4,
  state:        7,
  county:       9,
  district:     9,
  city:         11,
  town:         13,
  borough:      12,
  suburb:       14,
  village:      14,
  hamlet:       15,
  locality:     15,
  neighborhood: 14,
  quarter:      14,
  street:       16,
  house:        17,
  postcode:     13,
  peak:         13,
  water:        11,
  lake:         11,
  river:        11,
  mountain:     12,
  school:       16,
  hospital:     16,
  place:        13,
};

/* ── Importance proxy from Photon osm_value ────────────────── */

const OSM_IMPORTANCE: Record<string, number> = {
  country:   1.0,
  state:     0.9,
  county:    0.82,
  district:  0.80,
  city:      0.75,
  town:      0.65,
  borough:   0.70,
  suburb:    0.60,
  village:   0.55,
  hamlet:    0.50,
  locality:  0.48,
  street:    0.40,
  house:     0.35,
  postcode:  0.45,
  default:   0.50,
};

/* ── Photon response → NominatimResult ────────────────────── */

interface PhotonFeature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    osm_id?:       number;
    osm_type?:     string;
    osm_value?:    string;
    name?:         string;
    country?:      string;
    state?:        string;
    county?:       string;
    city?:         string;
    postcode?:     string;
    street?:       string;
    district?:     string;
    extent?:       [number, number, number, number];
  };
}

function buildDisplayName(p: PhotonFeature["properties"]): string {
  const parts: string[] = [];
  if (p.name)     parts.push(p.name);
  if (p.street && p.street !== p.name) parts.push(p.street);
  if (p.city   && p.city   !== p.name) parts.push(p.city);
  if (p.county && p.county !== p.city) parts.push(p.county);
  if (p.state  && p.state  !== p.city) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.filter(Boolean).join(", ");
}

let _photonSeq = 0;
function photonToResult(f: PhotonFeature, idx: number): NominatimResult {
  const [lng, lat] = f.geometry.coordinates;
  const p = f.properties;
  const osmVal  = (p.osm_value ?? "place").toLowerCase();
  const zoom    = OSM_ZOOM[osmVal]       ?? OSM_ZOOM["place"];
  const imp     = OSM_IMPORTANCE[osmVal] ?? OSM_IMPORTANCE["default"];
  const display = buildDisplayName(p);
  return {
    place_id:     p.osm_id ?? ++_photonSeq * -1,
    display_name: display || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat:          lat.toString(),
    lon:          lng.toString(),
    type:         osmVal,
    importance:   imp,
    zoomHint:     zoom,
    address: {
      country: p.country,
      state:   p.state,
      city:    p.city,
    },
  };
}

/* ── Lat/Lon direct input ─────────────────────────────────── */

function parseLatLon(q: string): NominatimResult | null {
  const m = q.trim().match(/^(-?\d+\.?\d*)[°,\s]+(-?\d+\.?\d*)°?$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lon = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return {
    place_id:     -(lat * 1e6 + lon),
    display_name: `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`,
    lat:          lat.toString(),
    lon:          lon.toString(),
    type:         "coordinate",
    importance:   0.5,
    zoomHint:     13,
  };
}

/* ── Result cache ─────────────────────────────────────────── */

const CACHE_MAX = 60;
const cache = new Map<string, NominatimResult[]>();

function cacheGet(key: string): NominatimResult[] | undefined { return cache.get(key); }
function cacheSet(key: string, val: NominatimResult[]) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, val);
}

/* ── Photon fetch with abort & cache ─────────────────────── */

const PHOTON = "https://photon.komoot.io/api/";

async function fetchPhoton(q: string, signal: AbortSignal): Promise<NominatimResult[]> {
  const cKey = q.toLowerCase().trim();
  const hit  = cacheGet(cKey);
  if (hit) return hit;

  const url = `${PHOTON}?q=${encodeURIComponent(q)}&limit=10&lang=en`;
  const res = await fetch(url, { signal });
  const json = await res.json();
  const results: NominatimResult[] = (json.features ?? []).map(photonToResult);
  cacheSet(cKey, results);
  return results;
}

/* ── LocalStorage for recent searches ────────────────────── */

const RECENT_KEY = "eg_recent_searches_v2";
const MAX_RECENT = 7;

function getRecent(): NominatimResult[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); }
  catch { return []; }
}

function saveRecent(item: NominatimResult) {
  const filtered = getRecent().filter(r => r.place_id !== item.place_id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...filtered].slice(0, MAX_RECENT)));
}

/* ── Short display name ────────────────────────────────────── */

function getShortName(r: NominatimResult): string {
  const a = r.address;
  const parts = r.display_name.split(",").map(s => s.trim());
  if (parts.length <= 2) return r.display_name;
  if (a?.city)    return `${a.city}${a.country ? `, ${a.country}` : ""}`;
  if (a?.town)    return `${a.town}${a.country ? `, ${a.country}` : ""}`;
  if (a?.village) return `${a.village}${a.country ? `, ${a.country}` : ""}`;
  if (a?.state)   return `${a.state}${a.country ? `, ${a.country}` : ""}`;
  if (a?.country) return a.country;
  return parts.slice(0, 2).join(", ");
}

/* ── Type label ────────────────────────────────────────────── */

const TYPE_LABEL: Record<string, string> = {
  country: "Country", state: "State", county: "County", district: "District",
  city: "City", town: "Town", borough: "Borough", suburb: "Suburb",
  village: "Village", hamlet: "Hamlet", locality: "Locality",
  street: "Street", house: "Address", postcode: "Postcode",
  peak: "Mountain", water: "Water", lake: "Lake", river: "River",
  school: "School", hospital: "Hospital", coordinate: "Coordinates",
};

/* ══════════════════════════════════════════════════════════
   SearchBar Component
══════════════════════════════════════════════════════════ */

interface SearchBarProps {
  onSelect: (result: NominatimResult) => void;
  onClear:  () => void;
}

export function SearchBar({ onSelect, onClear }: SearchBarProps) {
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [open, setOpen]               = useState(false);
  const [cursor, setCursor]           = useState(-1);
  const [recent, setRecent]           = useState<NominatimResult[]>(getRecent);
  const [selected, setSelected]       = useState<NominatimResult | null>(null);

  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLUListElement>(null);

  /* ── Debounced search ── */
  const doSearch = useCallback(async (q: string) => {
    /* Cancel previous in-flight request */
    abortRef.current?.abort();

    /* Lat/lon shortcut */
    const coord = parseLatLon(q);
    if (coord) {
      setSuggestions([coord]);
      setLoading(false);
      setError("");
      return;
    }

    if (q.trim().length < 2) { setSuggestions([]); setLoading(false); return; }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError("");
    try {
      const results = await fetchPhoton(q, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setSuggestions(results);
        setCursor(-1);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError("Search unavailable");
        setSuggestions([]);
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      abortRef.current?.abort();
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => doSearch(query), 320);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doSearch]);

  const handleSelect = useCallback((r: NominatimResult) => {
    setSelected(r);
    setQuery(getShortName(r));
    setSuggestions([]);
    setOpen(false);
    saveRecent(r);
    setRecent(getRecent());
    onSelect(r);
  }, [onSelect]);

  const handleClear = () => {
    abortRef.current?.abort();
    setQuery("");
    setSelected(null);
    setSuggestions([]);
    setOpen(false);
    setError("");
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = query ? suggestions : recent;
    if (!open || list.length === 0) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setCursor(c => Math.min(c + 1, list.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, -1)); }
    else if (e.key === "Enter" && cursor >= 0) { e.preventDefault(); handleSelect(list[cursor]); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      (listRef.current.children[cursor] as HTMLElement)?.scrollIntoView({ block: "nearest" });
    }
  }, [cursor]);

  const listItems     = query ? suggestions : recent;
  const showDropdown  = open && (loading || error.length > 0 || listItems.length > 0);

  return (
    <div className="relative" style={{ width: "clamp(240px, 40vw, 480px)" }}>
      {/* ── Input ── */}
      <div
        className={`flex items-center gap-2 rounded-xl border bg-[#06121F]/95 px-3 py-2.5 backdrop-blur-xl transition-all duration-200 ${
          open ? "border-cyan-400/45 ring-1 ring-cyan-400/20" : "border-white/12"
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
          placeholder="Search city, village, country, landmark or lat,lon…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setCursor(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none min-w-0"
        />
        {(query || selected) && (
          <button type="button" onClick={handleClear} className="flex-shrink-0 text-slate-500 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full z-[600] mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#06121F]/98 backdrop-blur-xl"
            style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.72)" }}
          >
            {/* Section header */}
            {query.length === 0 && recent.length > 0 && (
              <div className="px-3 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Recent Searches
              </div>
            )}
            {query.length > 0 && suggestions.length > 0 && (
              <div className="px-3 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-cyan-400" />
                <span className="text-slate-500">Results</span>
                <span className="ml-auto text-slate-600">Powered by Photon / OSM</span>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && suggestions.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching…
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-3 py-2.5 text-xs text-red-400">{error}</div>
            )}

            {/* List */}
            <ul ref={listRef} className="max-h-72 overflow-y-auto divide-y divide-white/4">
              {listItems.map((r, i) => {
                const typeLabel = TYPE_LABEL[r.type] ?? r.type;
                const shortName = getShortName(r);
                const subtitle  = r.display_name !== shortName ? r.display_name : "";
                const isTop     = r.importance >= 0.75;
                return (
                  <li key={`${r.place_id}-${i}`}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelect(r)}
                      className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                        cursor === i ? "bg-cyan-400/10 text-white" : "text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      {query
                        ? <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-cyan-400" />
                        : <Clock  className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-500" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white leading-snug truncate">{shortName}</p>
                        {subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {typeLabel && (
                          <span className="rounded-full bg-white/8 border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-400">
                            {typeLabel}
                          </span>
                        )}
                        {isTop && (
                          <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400">
                            Top
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* No results */}
            {query && !loading && !error && suggestions.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                No results for <span className="text-white">"{query}"</span>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-white/6 px-3 py-1.5 text-[9px] text-slate-600">
              Photon · Komoot · © OpenStreetMap contributors
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
