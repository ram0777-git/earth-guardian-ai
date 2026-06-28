import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ScaleControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Layers, Filter, MapPin,
  Zap, Droplets, Flame, Wind, Waves, Mountain, AlertTriangle,
  Globe, Clock, Users, Gauge,
  X, SlidersHorizontal, CheckSquare, Square,
  Crosshair, Maximize2, Minimize2, Home,
} from "lucide-react";
import { useGetDisasters } from "@workspace/api-client-react";
import { DISASTER_TYPE_CONFIG, type DisasterEvent } from "@/data/mapData";
import { SearchBar, type NominatimResult } from "./SearchBar";
import { LocationPanel } from "./LocationPanel";

/* ── Tile layers ─────────────────────────────────────────── */

const TILE_LAYERS: Record<string, { url: string; attr: string; label: string; emoji: string }> = {
  dark: {
    url:   "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr:  '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "Dark",
    emoji: "🌑",
  },
  light: {
    url:   "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attr:  '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "Light",
    emoji: "☀️",
  },
  osm: {
    url:   "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr:  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    label: "Streets",
    emoji: "🗺️",
  },
  satellite: {
    url:   "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr:  "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    label: "Satellite",
    emoji: "🛰️",
  },
  terrain: {
    url:   "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr:  '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    label: "Terrain",
    emoji: "🏔️",
  },
};

/* ── Severity colors ─────────────────────────────────────── */

const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  moderate: "#f59e0b",
  low:      "#34d399",
};

const TYPE_COLOR: Record<string, string> = {
  earthquake: "#818cf8",
  flood:      "#22d3ee",
  wildfire:   "#fb923c",
  hurricane:  "#60a5fa",
  tsunami:    "#a78bfa",
  volcano:    "#f87171",
  landslide:  "#facc15",
};

/* ── Helpers ─────────────────────────────────────────────── */

function magToSeverity(mag: number): DisasterEvent["severity"] {
  if (mag >= 6.5) return "critical";
  if (mag >= 5.0) return "high";
  if (mag >= 3.5) return "moderate";
  return "low";
}

function createMarkerIcon(event: DisasterEvent): L.DivIcon {
  const tc   = TYPE_COLOR[event.type] ?? "#60a5fa";
  const size = event.severity === "critical" ? 20 : event.severity === "high" ? 16 : event.severity === "moderate" ? 13 : 11;
  const ring = Math.round(size * 1.8);
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="position:absolute;width:${ring}px;height:${ring}px;top:${-(ring - size) / 2}px;left:${-(ring - size) / 2}px;border-radius:50%;background:${tc};animation:mPulse 2s ease-out infinite;opacity:0.3;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:${tc};border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 0 ${size}px ${tc}90,0 2px 6px rgba(0,0,0,0.6);"></div>
    </div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createSearchMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:32px;height:32px;">
      <div style="position:absolute;width:56px;height:56px;top:-12px;left:-12px;border-radius:50%;background:#22d3ee;animation:mPulse 1.5s ease-out infinite;opacity:0.35;"></div>
      <div style="position:absolute;width:72px;height:72px;top:-20px;left:-20px;border-radius:50%;background:#22d3ee;animation:mPulse 1.5s ease-out 0.5s infinite;opacity:0.15;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#22d3ee;border:3px solid #fff;box-shadow:0 0 20px #22d3ee,0 4px 12px rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06121F" stroke-width="3" stroke-linecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
      </div>
    </div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
  });
}

/* ── Clustering ──────────────────────────────────────────── */

type ClusterItem =
  | DisasterEvent
  | { isCluster: true; count: number; lat: number; lng: number; id: string; maxSeverity: string };

function clusterEvents(events: DisasterEvent[], zoom: number): ClusterItem[] {
  if (zoom >= 5) return events;
  const gridSize = zoom <= 2 ? 15 : zoom <= 3 ? 8 : 4;
  const cells = new Map<string, DisasterEvent[]>();
  events.forEach(e => {
    const key = `${Math.round(e.lat / gridSize)},${Math.round(e.lng / gridSize)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(e);
  });
  const sevOrder = ["critical", "high", "moderate", "low"];
  return Array.from(cells.entries()).map(([key, group]) => {
    if (group.length === 1) return group[0];
    const lat = group.reduce((s, e) => s + e.lat, 0) / group.length;
    const lng = group.reduce((s, e) => s + e.lng, 0) / group.length;
    const maxSeverity = sevOrder.find(s => group.some(e => e.severity === s)) ?? "low";
    return { isCluster: true as const, count: group.length, lat, lng, id: `cluster-${key}`, maxSeverity };
  });
}

function createClusterIcon(count: number, maxSeverity: string): L.DivIcon {
  const color = SEV_COLOR[maxSeverity] ?? "#60a5fa";
  const size  = count > 50 ? 44 : count > 20 ? 36 : count > 5 ? 30 : 24;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}1A;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:${size > 34 ? 13 : 11}px;font-weight:800;color:${color};box-shadow:0 0 ${Math.round(size / 2)}px ${color}60,0 2px 8px rgba(0,0,0,0.6);">${count}</div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ── Map sub-components ──────────────────────────────────── */

function MapController({ target, zoom }: { target: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, zoom ?? 10, { duration: 1.8, easeLinearity: 0.2 });
  }, [target, zoom, map]);
  return null;
}

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoom: () => onZoom(map.getZoom()), zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => { onZoom(map.getZoom()); }, [map, onZoom]);
  return null;
}

function PositionSaver() {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      sessionStorage.setItem("eg_map_pos", JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }));
    },
  });
  return null;
}

function HeatmapLayer({ events }: { events: DisasterEvent[] }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = L.DomUtil.create("canvas", "") as HTMLCanvasElement;
    canvas.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;z-index:300;";
    const pane = map.getPanes().overlayPane as HTMLElement;
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    function draw() {
      const size = map.getSize();
      canvas.width  = size.x;
      canvas.height = size.y;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      events.forEach(ev => {
        const pt = map.latLngToContainerPoint([ev.lat, ev.lng]);
        const r  = 55;
        const alpha = ev.severity === "critical" ? 0.55 : ev.severity === "high" ? 0.38 : ev.severity === "moderate" ? 0.25 : 0.15;
        const col   = ev.severity === "critical" ? "239,68,68" : ev.severity === "high" ? "249,115,22" : ev.severity === "moderate" ? "245,158,11" : "52,211,153";
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
        g.addColorStop(0, `rgba(${col},${alpha})`);
        g.addColorStop(0.5, `rgba(${col},${alpha * 0.4})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    draw();
    map.on("move zoom resize", draw);
    return () => {
      map.off("move zoom resize", draw);
      if (canvasRef.current && pane.contains(canvasRef.current)) pane.removeChild(canvasRef.current);
    };
  }, [map, events]);

  return null;
}

/* ── Skeleton ────────────────────────────────────────────── */

function MapSkeleton() {
  return (
    <div className="flex h-full animate-pulse">
      <div className="w-64 flex-shrink-0 border-r border-white/6 bg-white/[0.02] p-4 space-y-3">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-8 rounded-xl bg-white/8" />)}
        </div>
      </div>
      <div className="flex-1 relative bg-[#0a1628]">
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
          <Globe className="h-12 w-12 text-white/10 animate-pulse" />
          <p className="text-sm text-white/20">Loading map data…</p>
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-10 w-72 rounded-xl bg-white/8" />
      </div>
    </div>
  );
}

/* ── USGS URL ────────────────────────────────────────────── */

const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson";

/* ── Default map position ────────────────────────────────── */

function getSavedPos() {
  try {
    const raw = sessionStorage.getItem("eg_map_pos");
    if (raw) {
      const { lat, lng, zoom } = JSON.parse(raw);
      return { center: [lat, lng] as [number, number], zoom: zoom as number };
    }
  } catch { /* ignore */ }
  return { center: [20, 10] as [number, number], zoom: 2 };
}

/* ══════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════ */

export function LiveDisasterMap() {
  const saved = getSavedPos();

  const [earthquakes, setEarthquakes]     = useState<DisasterEvent[]>([]);
  const [usgsLoading, setUsgsLoading]     = useState(true);
  const [pageLoading, setPageLoading]     = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [usgsCount, setUsgsCount]         = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [activeTypes, setActiveTypes]     = useState<Set<string>>(new Set(Object.keys(DISASTER_TYPE_CONFIG)));
  const [severity, setSeverity]           = useState("all");
  const [filterOpen, setFilterOpen]       = useState(true);
  const [lastUpdated, setLastUpdated]     = useState<Date>(new Date());
  const [activeLayer, setActiveLayer]     = useState("dark");
  const [showHeatmap, setShowHeatmap]     = useState(false);
  const [mapZoom, setMapZoom]             = useState(saved.zoom);
  const [nextRefresh, setNextRefresh]     = useState(30);
  const [flyTarget, setFlyTarget]         = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom]             = useState<number | undefined>(undefined);
  const [searchLocation, setSearchLocation] = useState<NominatimResult | null>(null);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [geoTarget, setGeoTarget]         = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading]       = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const containerRef                       = useRef<HTMLDivElement>(null);

  /* ── CSS injection ── */
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "map-premium-styles";
    style.textContent = `
      @keyframes mPulse { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(2.8);opacity:0} }
      .leaflet-container{background:#0a1628!important;outline:none!important}
      .leaflet-control-attribution{background:rgba(6,18,31,0.85)!important;color:rgba(255,255,255,0.3)!important;font-size:9px!important;border:none!important;border-radius:8px!important;padding:2px 8px!important}
      .leaflet-control-attribution a{color:rgba(255,255,255,0.35)!important}
      .leaflet-control-zoom{border:1px solid rgba(255,255,255,0.1)!important;border-radius:12px!important;overflow:hidden!important;box-shadow:0 4px 16px rgba(0,0,0,0.4)!important}
      .leaflet-control-zoom a{background:rgba(6,18,31,0.92)!important;color:rgba(255,255,255,0.75)!important;border-color:rgba(255,255,255,0.08)!important;font-size:16px!important;line-height:26px!important;width:26px!important;height:26px!important}
      .leaflet-control-zoom a:hover{background:rgba(255,255,255,0.1)!important;color:#fff!important}
      .leaflet-popup-content-wrapper{background:rgba(6,18,31,0.97)!important;border:1px solid rgba(255,255,255,0.12)!important;border-radius:14px!important;color:#fff!important;box-shadow:0 12px 40px rgba(0,0,0,0.6)!important;backdrop-filter:blur(20px)}
      .leaflet-popup-tip-container{display:none!important}
      .leaflet-popup-close-button{color:rgba(255,255,255,0.5)!important;font-size:18px!important;padding:6px 8px!important}
      .leaflet-popup-close-button:hover{color:#fff!important;background:transparent!important}
      .leaflet-control-scale-line{background:rgba(6,18,31,0.85)!important;border:1px solid rgba(255,255,255,0.15)!important;border-top:none!important;color:rgba(255,255,255,0.6)!important;font-size:9px!important;padding:1px 5px!important}
      .leaflet-tile{transition:opacity 0.3s ease!important}
    `;
    if (!document.getElementById("map-premium-styles")) document.head.appendChild(style);
    return () => { document.getElementById("map-premium-styles")?.remove(); };
  }, []);

  /* ── Fetch USGS ── */
  const fetchUSGS = useCallback(async () => {
    try {
      const res  = await fetch(USGS_URL);
      const json = await res.json();
      const quakes: DisasterEvent[] = json.features.slice(0, 150).map((f: any) => ({
        id:          f.id,
        type:        "earthquake" as const,
        title:       f.properties.title,
        location:    f.properties.place ?? "Unknown location",
        country:     "USGS Feed",
        lat:         f.geometry.coordinates[1],
        lng:         f.geometry.coordinates[0],
        severity:    magToSeverity(f.properties.mag ?? 0),
        magnitude:   +(f.properties.mag ?? 0).toFixed(1),
        depth:       +(f.geometry.coordinates[2] ?? 0).toFixed(1),
        time:        new Date(f.properties.time).toLocaleString(),
        status:      "Monitoring",
        source:      "usgs" as const,
        description: f.properties.title,
      }));
      setEarthquakes(quakes);
      setUsgsCount(quakes.length);
      setLastUpdated(new Date());
    } catch { /* silent */ }
    finally { setUsgsLoading(false); }
  }, []);

  useEffect(() => {
    fetchUSGS();
    const t = setTimeout(() => setPageLoading(false), 1100);
    return () => clearTimeout(t);
  }, [fetchUSGS]);

  /* Auto-refresh every 30 s */
  useEffect(() => {
    const iv = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) { fetchUSGS(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [fetchUSGS]);

  const handleRefresh = () => {
    setRefreshing(true);
    setNextRefresh(30);
    fetchUSGS().then(() => setRefreshing(false));
  };

  /* Fullscreen */
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(false));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* Geolocation */
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setGeoTarget([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
        setFlyZoom(12);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  /* Search selection */
  const handleSearchSelect = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setFlyTarget([lat, lng]);
    /* Importance-based zoom: 0.9+ = country, 0.7+ = city, else town */
    const zoom = result.zoomHint ?? (result.importance >= 0.85 ? 5 : result.importance >= 0.6 ? 10 : 13);
    setFlyZoom(zoom);
    setSearchLocation(result);
    setShowLocationPanel(true);
    setSelectedEvent(null);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchLocation(null);
    setShowLocationPanel(false);
    setFlyTarget(null);
  }, []);

  /* Data */
  const { data: apiDisasters = [] } = useGetDisasters();

  const allEvents = useMemo(
    () => [
      ...earthquakes,
      ...apiDisasters.map((d: any): DisasterEvent => ({
        id:          d.id,
        type:        d.type as DisasterEvent["type"],
        title:       d.name,
        location:    `${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}`,
        country:     "Global",
        lat:         d.lat,
        lng:         d.lng,
        severity:    d.severity,
        magnitude:   undefined,
        depth:       undefined,
        time:        d.timestamp ? new Date(d.timestamp).toLocaleString() : "N/A",
        status:      "Active",
        source:      "sample" as const,
        description: d.description,
      })),
    ],
    [earthquakes, apiDisasters]
  );

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      if (!activeTypes.has(e.type)) return false;
      if (severity !== "all" && e.severity !== severity) return false;
      return true;
    });
  }, [allEvents, activeTypes, severity]);

  const countBySeverity = useMemo(() => {
    const c: Record<string, number> = { critical: 0, high: 0, moderate: 0, low: 0 };
    filteredEvents.forEach(e => { c[e.severity] = (c[e.severity] ?? 0) + 1; });
    return c;
  }, [filteredEvents]);

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) { if (next.size > 1) next.delete(type); }
      else next.add(type);
      return next;
    });
  };

  const tileLayer = TILE_LAYERS[activeLayer] ?? TILE_LAYERS.dark;

  /* ── Loading screen ── */
  if (pageLoading) {
    return (
      <div className="h-[calc(100vh-4rem)]" style={{ marginTop: "4rem" }}>
        <MapSkeleton />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex overflow-hidden bg-[#06121F]"
      style={{ height: "calc(100vh - 4rem)", marginTop: "4rem" }}
    >
      {/* ── Left Filter Panel ─────────────────────────────── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.aside
            key="filter-panel"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0,    opacity: 1 }}
            exit={{   x: -280, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="relative z-20 flex w-64 flex-shrink-0 flex-col border-r border-white/6 bg-[#06121F]/95 backdrop-blur-xl overflow-hidden"
            style={{ boxShadow: "4px 0 32px rgba(0,0,0,0.4)" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-white/6 p-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Filters</span>
              </div>
              <button onClick={() => setFilterOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:text-white hover:bg-white/8 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Disaster types */}
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Disaster Types</p>
                <div className="space-y-1">
                  {Object.entries(DISASTER_TYPE_CONFIG).map(([type, cfg]) => {
                    const on    = activeTypes.has(type);
                    const count = filteredEvents.filter(e => e.type === type).length;
                    return (
                      <motion.button key={type} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => toggleType(type)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-all duration-150 ${
                          on ? "bg-white/[0.06] border border-white/10" : "opacity-40 hover:opacity-60 border border-transparent"
                        }`}
                      >
                        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: on ? cfg.color : "#4b5563" }} />
                        <span className="flex-1 text-white">{cfg.emoji} {cfg.label}</span>
                        {count > 0 && (
                          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                            {count}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Severity Level</p>
                <div className="space-y-1">
                  {["all", "critical", "high", "moderate", "low"].map(s => (
                    <button key={s} onClick={() => setSeverity(s)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all duration-150 ${
                        severity === s ? "bg-white/[0.08] border border-white/12 text-white" : "text-slate-400 border border-transparent hover:bg-white/4"
                      }`}
                    >
                      {s !== "all" && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SEV_COLOR[s] }} />}
                      <span className="capitalize">{s === "all" ? "All Severities" : s}</span>
                      {s !== "all" && (
                        <span className="ml-auto text-slate-500 text-[10px]">{countBySeverity[s as keyof typeof countBySeverity]}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Base map */}
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Base Map</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TILE_LAYERS).map(([id, cfg]) => (
                    <button key={id} onClick={() => setActiveLayer(id)}
                      className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs transition-all border ${
                        activeLayer === id
                          ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                          : "border-white/8 text-slate-400 hover:bg-white/4"
                      }`}
                    >
                      <span className="text-base">{cfg.emoji}</span>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlays */}
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Overlays</p>
                <button onClick={() => setShowHeatmap(v => !v)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs transition-all border ${
                    showHeatmap ? "border-orange-400/40 bg-orange-400/10 text-white" : "border-white/8 text-slate-400 hover:bg-white/4"
                  }`}
                >
                  <span className="text-base">🔥</span>
                  <span className="flex-1 text-left">Heat Map</span>
                  <span className={`h-4 w-7 rounded-full transition-colors relative ${showHeatmap ? "bg-orange-400" : "bg-white/10"}`}>
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${showHeatmap ? "left-3.5" : "left-0.5"}`} />
                  </span>
                </button>
                <p className="mt-1.5 text-[10px] text-slate-600">Clusters auto-group at low zoom.</p>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setActiveTypes(new Set(Object.keys(DISASTER_TYPE_CONFIG))); setSeverity("all"); }}
                className="w-full rounded-xl border border-white/8 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/6 transition-all"
              >
                Reset Filters
              </button>
            </div>

            {/* Stats footer */}
            <div className="border-t border-white/6 p-4 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Showing events</span>
                <span className="font-bold text-white">{filteredEvents.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">USGS earthquakes</span>
                <span className="font-semibold text-indigo-400">{usgsCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Clock className="h-3 w-3" />
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <RefreshCw className="h-3 w-3" />
                Auto-refresh in {nextRefresh}s
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Map Area ──────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Toggle filter panel */}
        <button onClick={() => setFilterOpen(v => !v)}
          className="absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#06121F]/90 px-3 py-2 text-xs font-medium text-white backdrop-blur-xl transition-colors hover:bg-white/10"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
        >
          <Filter className="h-3.5 w-3.5 text-cyan-400" />
          {filterOpen ? "Hide" : "Filters"}
        </button>

        {/* Search bar — centred */}
        <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2">
          <SearchBar onSelect={handleSearchSelect} onClear={handleSearchClear} />
        </div>

        {/* Top-right controls */}
        <div className="absolute right-3 top-3 z-[500] flex gap-2">
          {/* Geolocation */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleGeolocate} title="My location"
            className={`flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#06121F]/90 px-3 py-2 text-xs text-white backdrop-blur-xl transition-colors hover:bg-white/10 ${geoLoading ? "text-cyan-400" : ""}`}
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          >
            <Crosshair className={`h-3.5 w-3.5 ${geoLoading ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
          </motion.button>

          {/* Reset view */}
          <motion.button whileTap={{ scale: 0.9 }} title="Reset view"
            onClick={() => { setFlyTarget([20, 10]); setFlyZoom(2); }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#06121F]/90 px-3 py-2 text-xs text-white backdrop-blur-xl transition-colors hover:bg-white/10"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          >
            <Home className="h-3.5 w-3.5 text-slate-400" />
          </motion.button>

          {/* Fullscreen */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleFullscreen} title="Fullscreen"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#06121F]/90 px-3 py-2 text-xs text-white backdrop-blur-xl transition-colors hover:bg-white/10"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          >
            {isFullscreen
              ? <Minimize2 className="h-3.5 w-3.5 text-cyan-400" />
              : <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
            }
          </motion.button>

          {/* Refresh */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#06121F]/90 px-3 py-2 text-xs text-white backdrop-blur-xl transition-colors hover:bg-white/10"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>

        {/* Leaflet Map */}
        <MapContainer
          center={saved.center}
          zoom={saved.zoom}
          minZoom={2}
          maxZoom={19}
          zoomControl
          className="h-full w-full"
          style={{ background: "#0a1628" }}
          scrollWheelZoom
          inertia
          inertiaDeceleration={3000}
        >
          <TileLayer
            key={activeLayer}
            url={tileLayer.url}
            attribution={tileLayer.attr}
            maxZoom={19}
          />
          <ScaleControl position="bottomleft" />
          <MapController target={flyTarget} zoom={flyZoom} />
          <ZoomTracker onZoom={setMapZoom} />
          <PositionSaver />

          {showHeatmap && <HeatmapLayer events={filteredEvents} />}

          {/* Search location marker */}
          {searchLocation && (
            <Marker
              position={[parseFloat(searchLocation.lat), parseFloat(searchLocation.lon)]}
              icon={createSearchMarkerIcon()}
            />
          )}

          {/* User geolocation marker */}
          {geoTarget && (
            <Marker
              position={geoTarget}
              icon={L.divIcon({
                className: "",
                html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 12px #3b82f6,0 2px 8px rgba(0,0,0,0.6);position:relative;">
                  <div style="position:absolute;width:28px;height:28px;top:-9px;left:-9px;border-radius:50%;background:#3b82f6;animation:mPulse 2s ease-out infinite;opacity:0.4;"></div>
                </div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
          )}

          {/* Disaster markers (with clustering) */}
          {clusterEvents(filteredEvents, mapZoom).map(item => {
            if ("isCluster" in item) {
              return (
                <Marker
                  key={item.id}
                  position={[item.lat, item.lng]}
                  icon={createClusterIcon(item.count, item.maxSeverity)}
                />
              );
            }
            return (
              <Marker
                key={item.id}
                position={[item.lat, item.lng]}
                icon={createMarkerIcon(item)}
                eventHandlers={{ click: () => { setSelectedEvent(item); setShowLocationPanel(false); } }}
              />
            );
          })}
        </MapContainer>

        {/* Bottom live stats bar */}
        <div
          className="absolute bottom-8 left-3 z-[500] flex items-center gap-3 rounded-xl border border-white/8 bg-[#06121F]/90 px-4 py-2 text-xs backdrop-blur-xl"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-emerald-400 font-medium">Live</span>
          </div>
          <span className="text-white/30">|</span>
          {[
            { label: "Total",    value: filteredEvents.length, color: "#94a3b8" },
            { label: "Critical", value: countBySeverity.critical, color: "#ef4444" },
            { label: "High",     value: countBySeverity.high, color: "#f97316" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-slate-500 hidden sm:inline">{s.label}</span>
            </div>
          ))}
          {searchLocation && (
            <>
              <span className="text-white/30">|</span>
              <span className="text-cyan-400 text-[10px] truncate max-w-[120px]">
                📍 {searchLocation.display_name.split(",")[0]}
              </span>
            </>
          )}
        </div>

        {/* Risk legend */}
        <div
          className="absolute bottom-8 right-3 z-[500] rounded-xl border border-white/8 bg-[#06121F]/90 px-3 py-2.5 backdrop-blur-xl"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
        >
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Risk Level</p>
          {[
            { label: "Critical", color: "#ef4444", size: 10 },
            { label: "High",     color: "#f97316", size: 8  },
            { label: "Moderate", color: "#f59e0b", size: 7  },
            { label: "Low",      color: "#34d399", size: 6  },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 py-0.5">
              <div className="flex-shrink-0 rounded-full border-2 border-white/80" style={{ width: s.size, height: s.size, backgroundColor: s.color }} />
              <span className="text-[10px] text-slate-400">{s.label}</span>
            </div>
          ))}
          <div className="mt-1.5 border-t border-white/6 pt-1.5">
            <p className="text-[9px] text-slate-600">Marker size = severity</p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {showLocationPanel && searchLocation ? (
          <LocationPanel
            key="location-panel"
            location={searchLocation}
            events={allEvents}
            onClose={() => { setShowLocationPanel(false); setSelectedEvent(null); }}
            onSelectEvent={e => { setSelectedEvent(e); setShowLocationPanel(false); }}
          />
        ) : selectedEvent ? (
          <motion.aside
            key="info-panel"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{   x: 360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="relative z-20 flex w-80 flex-shrink-0 flex-col border-l border-white/6 bg-[#06121F]/97 backdrop-blur-xl overflow-hidden"
            style={{ boxShadow: "-4px 0 32px rgba(0,0,0,0.4)" }}
          >
            <InfoPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} allEvents={filteredEvents} onSelect={setSelectedEvent} />
          </motion.aside>
        ) : (
          <motion.aside
            key="events-list"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{   x: 360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="relative z-20 hidden lg:flex w-72 flex-shrink-0 flex-col border-l border-white/6 bg-[#06121F]/97 backdrop-blur-xl overflow-hidden"
            style={{ boxShadow: "-4px 0 32px rgba(0,0,0,0.4)" }}
          >
            <EventsList events={filteredEvents} onSelect={e => { setSelectedEvent(e); setShowLocationPanel(false); }} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Info Panel ──────────────────────────────────────────── */

function InfoPanel({
  event, onClose, allEvents, onSelect,
}: {
  event: DisasterEvent;
  onClose: () => void;
  allEvents: DisasterEvent[];
  onSelect: (e: DisasterEvent) => void;
}) {
  const tc  = TYPE_COLOR[event.type]  ?? "#60a5fa";
  const sc  = SEV_COLOR[event.severity];
  const cfg = DISASTER_TYPE_CONFIG[event.type];

  const related = allEvents.filter(e => e.id !== event.id && e.type === event.type).slice(0, 3);

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/6 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${tc}15`, border: `1px solid ${tc}30` }}>
            {cfg?.emoji ?? "⚠️"}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{cfg?.label ?? event.type}</p>
            <div className="mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider inline-block"
              style={{ color: sc, backgroundColor: `${sc}18` }}>
              {event.severity}
            </div>
          </div>
        </div>
        <button onClick={onClose}
          className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/8 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-bold leading-snug text-white">{event.title}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3 w-3" style={{ color: tc }} />
          {event.location}{event.country !== "USGS Feed" && `, ${event.country}`}
        </div>

        <div className="my-3 h-px w-full" style={{ background: `linear-gradient(90deg,${tc}60,transparent)` }} />

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Clock,    label: "Reported",  value: event.time },
            { icon: Gauge,    label: "Status",    value: event.status },
            event.magnitude !== undefined
              ? { icon: Zap,    label: "Magnitude", value: `M ${event.magnitude}` }
              : event.affected ? { icon: Users,  label: "Affected",  value: event.affected } : null,
            event.depth !== undefined
              ? { icon: Mountain, label: "Depth",   value: `${event.depth} km` }
              : (event.affected && event.magnitude !== undefined) ? { icon: Users, label: "Affected", value: event.affected } : null,
          ].filter(Boolean).map((stat, i) => {
            if (!stat) return null;
            const Icon = stat.icon;
            return (
              <div key={i} className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Icon className="h-3 w-3" />{stat.label}
                </div>
                <p className="text-xs font-semibold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-white/6 bg-white/[0.02] p-3">
          <p className="text-[10px] text-slate-500 mb-1">Coordinates</p>
          <p className="font-mono text-xs text-slate-300">{event.lat.toFixed(4)}°, {event.lng.toFixed(4)}°</p>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-slate-500">Risk Intensity</span>
            <span className="font-bold" style={{ color: sc }}>
              {{ critical: "Extreme", high: "High", moderate: "Moderate", low: "Low" }[event.severity]}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: sc }}
              initial={{ width: 0 }}
              animate={{ width: { critical: "100%", high: "75%", moderate: "50%", low: "25%" }[event.severity] }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
            />
          </div>
        </div>

        {event.description && (
          <div className="mt-3 rounded-xl border border-white/6 bg-white/[0.03] p-3">
            <p className="text-[10px] text-slate-500 mb-1.5">Details</p>
            <p className="text-xs leading-relaxed text-slate-300">{event.description}</p>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <div className={`rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
            event.source === "usgs" ? "bg-indigo-400/10 text-indigo-400 border border-indigo-400/20" : "bg-slate-700/50 text-slate-400 border border-white/8"
          }`}>
            {event.source === "usgs" ? "🌐 USGS Live Feed" : "📊 Sample Data"}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Related {cfg?.label}
            </p>
            <div className="space-y-1.5">
              {related.map(e => (
                <motion.button key={e.id} whileHover={{ x: 3 }} onClick={() => onSelect(e)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.03] p-2.5 text-left text-xs hover:bg-white/[0.06] transition-colors"
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: SEV_COLOR[e.severity] }} />
                  <span className="flex-1 truncate text-slate-300">{e.location}</span>
                  <span className="text-slate-500 text-[10px]">{e.severity}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Events List ─────────────────────────────────────────── */

function EventsList({ events, onSelect }: { events: DisasterEvent[]; onSelect: (e: DisasterEvent) => void }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-white/6 p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Active Events</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{events.length} events worldwide</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-400/10 px-2 py-1 text-[10px] font-bold text-red-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          Live
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/4">
        {events.slice(0, 40).map((event, i) => {
          const tc  = TYPE_COLOR[event.type] ?? "#60a5fa";
          const sc  = SEV_COLOR[event.severity];
          const cfg = DISASTER_TYPE_CONFIG[event.type];
          return (
            <motion.button key={event.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.015 }}
              onClick={() => onSelect(event)}
              className="group flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-white/[0.04]"
            >
              <div className="mt-0.5 flex-shrink-0 text-base leading-none">{cfg?.emoji ?? "⚠️"}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-xs font-semibold text-white leading-snug truncate">
                    {event.magnitude ? `M${event.magnitude} ` : ""}{event.location.split(",")[0]}
                  </p>
                  <div className="h-1.5 w-1.5 flex-shrink-0 mt-1.5 rounded-full" style={{ backgroundColor: sc }} />
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{event.time}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
