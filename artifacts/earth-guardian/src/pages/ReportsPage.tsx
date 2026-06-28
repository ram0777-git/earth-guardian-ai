import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, RefreshCw, Globe, MapPin,
  Sparkles, Check, AlertTriangle, Clock, Shield,
  ChevronRight, FileBarChart,
} from "lucide-react";
import { RakshMarkdown } from "@/components/raksh/RakshMarkdown";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
  { id: "standard", label: "Daily Intelligence Report", desc: "Complete situational overview with all live data sources", icon: FileText },
  { id: "emergency", label: "Emergency Situation Report", desc: "Critical events and immediate response priorities", icon: AlertTriangle },
  { id: "preparedness", label: "Preparedness & Risk Report", desc: "Risk assessment, preparedness scores, and readiness gaps", icon: Shield },
];

const FOCUS_AREAS = [
  "Global Overview", "Earthquakes", "Floods", "Cyclones", "Wildfires",
  "Tsunamis", "Volcanoes", "Heatwaves", "Air Quality", "All Hazards",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("standard");
  const [focusArea, setFocusArea] = useState("Global Overview");
  const [location, setLocation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<{ content: string; generatedAt: string; meta: Record<string, unknown> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReport(null);
    setError(null);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${base}/api/raksh/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusArea: focusArea !== "Global Overview" ? focusArea : undefined,
          location: location || undefined,
          userContext: reportType === "emergency" ? "Focus on critical/high severity events only. Prioritize immediate response." :
                       reportType === "preparedness" ? "Focus on preparedness levels, risk scores, and readiness gaps." : undefined,
        }),
      });
      const data = await resp.json() as { content?: string; generatedAt?: string; meta?: Record<string, unknown>; error?: string };
      if (!resp.ok || data.error) throw new Error(data.error ?? "Report generation failed");
      setReport({
        content: data.content!,
        generatedAt: data.generatedAt!,
        meta: data.meta ?? {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earth-guardian-report-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!report) return;
    const blob = new Blob([report.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earth-guardian-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_25%_10%,rgba(26,115,232,0.08)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_75%_85%,rgba(0,188,212,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
              <FileBarChart className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Intelligence Reports</h1>
              <p className="text-sm text-slate-400">AI-generated disaster intelligence reports powered by live data</p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Config Panel */}
          <div className="lg:col-span-4 space-y-4">
            {/* Report type */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Report Type</p>
              <div className="space-y-2">
                {REPORT_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = reportType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-white/8 bg-white/3 hover:border-white/15"
                      )}
                    >
                      <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5",
                        isSelected ? "bg-blue-500/20" : "bg-white/5"
                      )}>
                        <Icon className={cn("h-4 w-4", isSelected ? "text-blue-400" : "text-slate-500")} />
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", isSelected ? "text-blue-300" : "text-slate-300")}>{type.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{type.desc}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-blue-400 flex-shrink-0 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Focus area */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Focus Area</p>
              <div className="flex flex-wrap gap-1.5">
                {FOCUS_AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => setFocusArea(area)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                      focusArea === area
                        ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                        : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200"
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Location filter */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Geographic Focus (optional)</p>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Region, country, or city…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Data sources status */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="mb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">Live Data Sources</p>
              <div className="space-y-1.5">
                {[
                  { name: "USGS Earthquakes", ok: true },
                  { name: "NASA EONET Events", ok: true },
                  { name: "NOAA Weather Alerts", ok: true },
                  { name: "GDACS Global Disasters", ok: true },
                  { name: "Raksh AI Analysis", ok: true },
                ].map(src => (
                  <div key={src.name} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{src.name}</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Report…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>

          {/* Report View */}
          <div className="lg:col-span-8">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {isGenerating && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-12 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileBarChart className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Generating Intelligence Report</p>
                  <p className="text-sm text-slate-400 mt-1">Fetching live data from USGS, NASA, NOAA, and GDACS…</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {["Fetching live earthquake data", "Loading NASA EONET events", "Pulling NOAA alerts", "Running AI analysis", "Composing report"].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.4 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.4 }}
                        className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"
                      />
                      <span className="text-xs text-slate-500">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!report && !isGenerating && !error && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-12 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <FileBarChart className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <p className="text-white font-semibold">Configure & Generate a Report</p>
                  <p className="text-sm text-slate-400 mt-1">Select report type and focus area, then generate a live intelligence report.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {["Powered by USGS · NASA · NOAA · GDACS", "Real-time live data", "AI-analyzed insights"].map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs text-slate-500 border border-white/8 rounded-lg px-2.5 py-1">
                      <Globe className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {report && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Report header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                        <Check className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Report Generated</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <p className="text-xs text-slate-400">{formatDate(report.generatedAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadMarkdown}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        .MD
                      </button>
                      <button
                        onClick={handleDownloadTxt}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-500/30 bg-slate-500/10 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-500/20 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        .TXT
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Print
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* View tabs */}
                  <div className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
                    {(["preview", "raw"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all",
                          activeTab === tab
                            ? "bg-white/10 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {tab === "preview" ? "Formatted Preview" : "Raw Markdown"}
                      </button>
                    ))}
                  </div>

                  {/* Report content */}
                  <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
                    {activeTab === "preview" ? (
                      <div className="p-6 prose-sm">
                        <RakshMarkdown content={report.content} />
                      </div>
                    ) : (
                      <pre className="p-6 text-xs text-slate-400 overflow-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[600px]">
                        {report.content}
                      </pre>
                    )}
                  </div>

                  {/* Generate next */}
                  <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                    <span className="text-sm text-slate-400">Generate another report with different parameters</span>
                    <button onClick={handleGenerate} className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                      Regenerate
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
