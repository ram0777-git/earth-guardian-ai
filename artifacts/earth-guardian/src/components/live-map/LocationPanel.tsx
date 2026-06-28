import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  X, Brain, MapPin, AlertTriangle, Shield, Clock,
  Zap, Droplets, Flame, Wind, Waves, Mountain,
  Hospital, Phone, ChevronRight,
} from "lucide-react";
import { analyzeLocation } from "@/data/riskData";
import { DISASTER_TYPE_CONFIG, type DisasterEvent } from "@/data/mapData";
import type { NominatimResult } from "./SearchBar";

/* ── haversine distance in km ── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  moderate: "#f59e0b",
  low:      "#34d399",
};

const LEVEL_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "CRITICAL" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "HIGH" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "MODERATE" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "LOW" },
};

const EMERGENCY_SERVICES = [
  { name: "Emergency Services", number: "911", emoji: "🚨", desc: "Police, Fire, Ambulance" },
  { name: "FEMA Helpline",      number: "1-800-621-3362", emoji: "🏛️", desc: "Federal disaster assistance" },
  { name: "Red Cross",          number: "1-800-RED-CROSS", emoji: "🏥", desc: "Emergency shelter & relief" },
  { name: "Crisis Hotline",     number: "988", emoji: "💬", desc: "Mental health crisis support" },
];

interface Props {
  location: NominatimResult;
  events: DisasterEvent[];
  onClose: () => void;
  onSelectEvent: (e: DisasterEvent) => void;
}

export function LocationPanel({ location, events, onClose, onSelectEvent }: Props) {
  const lat = parseFloat(location.lat);
  const lng = parseFloat(location.lon);
  const shortName = location.display_name.split(",").slice(0, 2).join(",").trim();

  const risk = useMemo(() => analyzeLocation(shortName), [shortName]);

  /* Nearby events sorted by distance, max 500 km */
  const nearby = useMemo(() => {
    return events
      .map(e => ({ ...e, distKm: haversine(lat, lng, e.lat, e.lng) }))
      .filter(e => e.distKm <= 800)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 8);
  }, [events, lat, lng]);

  const levelCfg = LEVEL_CONFIG[risk.level] ?? LEVEL_CONFIG.low;

  return (
    <motion.aside
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 32 }}
      className="relative z-20 flex w-80 flex-shrink-0 flex-col border-l border-white/6 bg-[#06121F]/98 backdrop-blur-xl overflow-hidden"
      style={{ boxShadow: "-4px 0 32px rgba(0,0,0,0.5)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/6 p-4 flex-shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
            <MapPin className="h-3 w-3 text-cyan-400" />
            Location Intelligence
          </div>
          <h3 className="text-sm font-bold text-white leading-snug truncate">{shortName}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{location.display_name}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Risk Score */}
        <div
          className="rounded-xl p-4"
          style={{ background: levelCfg.bg, border: `1px solid ${levelCfg.color}30` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4" style={{ color: levelCfg.color }} />
            <span className="text-xs font-bold text-white">AI Risk Assessment</span>
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider"
              style={{ color: levelCfg.color, background: `${levelCfg.color}18` }}
            >
              {levelCfg.label}
            </span>
          </div>

          {/* Score ring + categories */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                <motion.circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke={levelCfg.color} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 26}
                  initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - risk.overall / 100) }}
                  style={{ transformOrigin: "32px 32px", rotate: "-90deg" }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white leading-none">{risk.overall}</span>
                <span className="text-[8px] text-slate-500">/100</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {(Object.entries(risk.risks) as [string, number][]).slice(0, 4).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-16 capitalize truncate">{key}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: val > 70 ? "#ef4444" : val > 50 ? "#f97316" : val > 30 ? "#f59e0b" : "#34d399" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">{risk.explanation}</p>

          {/* Confidence */}
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
            <div className="h-1 flex-1 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-400/50" style={{ width: `${risk.confidence}%` }} />
            </div>
            AI Confidence: {risk.confidence}%
          </div>
        </div>

        {/* Coordinates */}
        <div className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 flex items-center gap-3">
          <MapPin className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500">Coordinates</p>
            <p className="font-mono text-xs text-slate-300">{lat.toFixed(4)}°, {lng.toFixed(4)}°</p>
          </div>
        </div>

        {/* Top AI Recommendations */}
        {risk.recommendations.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> AI Recommendations
            </p>
            <div className="space-y-1.5">
              {risk.recommendations.slice(0, 3).map((rec, i) => {
                const rc = rec.priority === "critical" ? "#ef4444" : rec.priority === "high" ? "#f97316" : "#f59e0b";
                return (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-white/6 bg-white/[0.03] p-2.5">
                    <span className="text-sm flex-shrink-0 mt-0.5">{rec.icon}</span>
                    <p className="text-[11px] text-slate-300 leading-snug flex-1">{rec.text}</p>
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: rc }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nearby disaster events */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            Nearby Active Events
            <span className="ml-auto text-white font-bold">{nearby.length}</span>
          </p>
          {nearby.length === 0 ? (
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-center">
              <p className="text-xs text-emerald-400 font-semibold">✓ No active events nearby</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Within 800 km radius</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {nearby.map(e => {
                const cfg = DISASTER_TYPE_CONFIG[e.type];
                const sc = SEV_COLOR[e.severity];
                const distStr = e.distKm < 100 ? `${Math.round(e.distKm)} km` : `${Math.round(e.distKm / 10) * 10} km`;
                return (
                  <motion.button
                    key={e.id}
                    whileHover={{ x: 3 }}
                    onClick={() => onSelectEvent(e)}
                    className="flex w-full items-start gap-2.5 rounded-xl border border-white/6 bg-white/[0.03] p-2.5 text-left text-xs hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="text-sm flex-shrink-0">{cfg?.emoji ?? "⚠️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold text-white truncate flex-1">{e.location.split(",")[0]}</p>
                        <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc }} />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="capitalize">{e.severity}</span>
                        <span>·</span>
                        <span className="text-cyan-400 font-semibold">{distStr} away</span>
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-600 flex-shrink-0 mt-0.5" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Emergency services */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> Emergency Contacts
          </p>
          <div className="space-y-1.5">
            {EMERGENCY_SERVICES.map(s => (
              <div key={s.name} className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2">
                <span className="text-base flex-shrink-0">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-500">{s.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 flex-shrink-0">{s.number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <Clock className="h-3 w-3" />
          Analysis updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </motion.aside>
  );
}
