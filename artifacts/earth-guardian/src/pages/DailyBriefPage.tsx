import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, RefreshCw, Download, Satellite, Globe2, CloudLightning,
  Zap, AlertTriangle, Clock, CheckCircle, Database, Waves,
} from "lucide-react";
import { RakshMarkdown } from "@/components/raksh/RakshMarkdown";
import { useLiveStats, useAIInsights } from "@/hooks/useLiveIntelligence";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };

interface BriefMeta {
  fetchedAt: string;
  sources: { earthquakes: { ok: boolean; count: number }; events: { ok: boolean; count: number }; alerts: { ok: boolean; count: number } };
}

const SOURCE_ITEMS = [
  { key: "earthquakes", icon: Zap,           label: "USGS Seismic",  color: "#818cf8" },
  { key: "events",      icon: Satellite,      label: "NASA EONET",    color: "#22d3ee" },
  { key: "alerts",      icon: CloudLightning, label: "NOAA Alerts",   color: "#f59e0b" },
];

function SourceBadge({ label, ok, count, icon: Icon, color }: { label: string; ok: boolean; count: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
        <Icon className="h-3 w-3" style={{ color }} />
      </div>
      <span className="text-xs text-slate-300">{label}</span>
      <span className="ml-auto flex items-center gap-1">
        {ok
          ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" /><span className="text-[10px] text-emerald-400">{count} events</span></>
          : <><span className="h-1.5 w-1.5 rounded-full bg-red-400" /><span className="text-[10px] text-red-400">offline</span></>
        }
      </span>
    </div>
  );
}

export default function DailyBriefPage() {
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [briefMeta, setBriefMeta]       = useState<BriefMeta | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const { data: stats }   = useLiveStats();
  const { data: insights } = useAIInsights();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const generateBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE}/api/raksh/brief`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json() as { content: string; meta: BriefMeta };
      setBriefContent(data.content);
      setBriefMeta(data.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate brief");
    } finally {
      setLoading(false);
    }
  };

  const downloadBrief = () => {
    if (!briefContent) return;
    const blob = new Blob([briefContent], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `earth-guardian-brief-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(26,115,232,0.10)_0%,transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(0,188,212,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,188,212,0.5) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 0%,black 30%,transparent 80%)",
        }} />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 md:px-8">
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* Header */}
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-cyan/20 border border-white/10">
                    <FileText className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">AI Daily Brief</h1>
                </div>
                <p className="text-sm text-slate-400">Executive intelligence summary · {today}</p>
              </div>
              <div className="flex gap-2">
                {briefContent && (
                  <button onClick={downloadBrief}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                )}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={generateBrief}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-primary/20 to-cyan/15 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all hover:from-primary/30 hover:to-cyan/25 disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {briefContent ? "Regenerate" : "Generate Brief"}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Stats snapshot */}
          <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Active Events",  value: stats?.stats.totalActiveEvents ?? "—", icon: AlertTriangle, color: "#ef4444" },
              { label: "Countries Affected",   value: stats?.stats.countriesAffected ?? "—",  icon: Globe2,       color: "#60a5fa" },
              { label: "Red Alerts",           value: stats?.stats.redAlerts ?? "—",          icon: Waves,        color: "#f43f5e" },
              { label: "Global Risk Level",    value: insights?.riskLevel?.toUpperCase() ?? "—", icon: Database,  color: "#f59e0b" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 backdrop-blur-xl"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                    <Icon className="h-3 w-3" style={{ color }} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </motion.div>

          {/* Source status */}
          {briefMeta && (
            <motion.div variants={fadeUp} className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Data Sources Used</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {SOURCE_ITEMS.map(s => (
                  <SourceBadge
                    key={s.key}
                    label={s.label}
                    icon={s.icon}
                    color={s.color}
                    ok={(briefMeta.sources as any)[s.key]?.ok ?? false}
                    count={(briefMeta.sources as any)[s.key]?.count ?? 0}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2">
                <Clock className="inline h-3 w-3 mr-1" />
                Data fetched at {new Date(briefMeta.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </motion.div>
          )}

          {/* Brief content */}
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-10 text-center"
                  style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25)" }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-cyan-400/60" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Generating AI Daily Brief…</p>
                      <p className="text-sm text-slate-400 mt-1">Aggregating live data from NASA, USGS, NOAA &amp; GDACS</p>
                    </div>
                    <div className="flex gap-2">
                      {["Fetching live data", "Analyzing patterns", "Generating report"].map((step, i) => (
                        <motion.span
                          key={step}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0.5] }}
                          transition={{ delay: i * 0.8, duration: 1.5, repeat: Infinity }}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400"
                        >
                          {step}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
                >
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                  <p className="font-semibold text-red-300">{error}</p>
                  <button onClick={generateBrief} className="mt-4 text-sm text-slate-400 underline hover:text-white">Retry</button>
                </motion.div>
              ) : briefContent ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
                  style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
                >
                  <div className="border-b border-white/6 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">AI Brief Ready</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Powered by Raksh AI · {today}</span>
                  </div>
                  <div className="p-6">
                    <RakshMarkdown content={briefContent} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-cyan/10 border border-white/10">
                      <FileText className="h-8 w-8 text-cyan-400/60" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-300">Ready to Generate</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm">
                        Generate a comprehensive executive summary using live data from NASA EONET, USGS, NOAA, GDACS and AI analysis.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["Top 10 Disasters", "Global Risk Score", "Emerging Threats", "Recommended Actions"].map(tag => (
                        <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={generateBrief}
                      className="mt-2 flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-primary/20 to-cyan/15 px-6 py-3 text-sm font-semibold text-cyan-300 transition-all hover:from-primary/30 hover:to-cyan/25"
                    >
                      <FileText className="h-4 w-4" />
                      Generate Today's Brief
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
