import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Search, Download, Trash2, Heart, X,
  Maximize2, Filter, Grid3X3, LayoutGrid, Sparkles,
  RefreshCw, Copy, Check, Wand2, ZoomIn,
} from "lucide-react";
import { useRaksh } from "@/components/raksh/RakshContext";
import type { RakshGeneratedImage } from "@/components/raksh/RakshContext";
import { cn } from "@/lib/utils";

const DISASTER_TYPES = ["All", "Flood", "Earthquake", "Cyclone", "Wildfire", "Tsunami", "Volcano", "Emergency", "Other"];

const QUICK_TEMPLATES = [
  { label: "Flood Poster", prompt: "Generate a flood preparedness poster with safety tips and emergency contacts" },
  { label: "Earthquake Guide", prompt: "Create an earthquake safety infographic showing drop cover hold on steps" },
  { label: "Wildfire Banner", prompt: "Generate a wildfire awareness banner with evacuation information" },
  { label: "Cyclone Poster", prompt: "Create a cyclone preparedness poster with shelter checklist" },
  { label: "Emergency Kit", prompt: "Generate an emergency kit illustration with all essential survival items" },
  { label: "Evacuation Map", prompt: "Create an evacuation route diagram for a disaster emergency scenario" },
  { label: "Tsunami Guide", prompt: "Create a tsunami safety awareness poster with evacuation route markers" },
  { label: "Shelter Layout", prompt: "Generate a shelter layout diagram showing capacity, zones, and services" },
  { label: "First Aid Chart", prompt: "Create a first aid reference chart for disaster emergency situations" },
  { label: "Risk Infographic", prompt: "Design a disaster risk assessment infographic with regional risk levels" },
];

const GALLERY_STORAGE_KEY = "raksh_image_gallery";
const FAVORITES_KEY = "raksh_image_favorites";

interface StoredImage extends RakshGeneratedImage {
  id: string;
  createdAt: number;
  category: string;
}

function loadGallery(): StoredImage[] {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredImage[]) : [];
  } catch { return []; }
}

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function detectCategory(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/flood/.test(p)) return "Flood";
  if (/earthquake|seismic/.test(p)) return "Earthquake";
  if (/cyclone|hurricane|typhoon/.test(p)) return "Cyclone";
  if (/wildfire|fire/.test(p)) return "Wildfire";
  if (/tsunami/.test(p)) return "Tsunami";
  if (/volcano|eruption/.test(p)) return "Volcano";
  if (/emergency|kit|safety|first aid/.test(p)) return "Emergency";
  return "Other";
}

export default function ImageGalleryPage() {
  const { generateImage, isStreaming } = useRaksh();
  const [gallery, setGallery] = useState<StoredImage[]>(loadGallery);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [gridSize, setGridSize] = useState<"lg" | "md">("md");
  const [fullscreenImage, setFullscreenImage] = useState<StoredImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const saveGallery = (items: StoredImage[]) => {
    try { localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(items)); } catch {}
  };

  const saveFavorites = (favs: Set<string>) => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favs))); } catch {}
  };

  const handleGenerate = async (prompt: string) => {
    if (generating || isStreaming) return;
    setGenerating(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${base}/api/raksh/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await resp.json() as RakshGeneratedImage & { error?: string };
      if (data.error) throw new Error(data.error);
      const newImage: StoredImage = {
        ...data,
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        createdAt: Date.now(),
        category: detectCategory(prompt),
      };
      const updated = [newImage, ...gallery];
      setGallery(updated);
      saveGallery(updated);
      setCustomPrompt("");
    } catch (err) {
      console.error("Gallery generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = gallery.filter(img => img.id !== id);
    setGallery(updated);
    saveGallery(updated);
    if (fullscreenImage?.id === id) setFullscreenImage(null);
  };

  const handleToggleFavorite = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFavorites(next);
    saveFavorites(next);
  };

  const handleDownload = (img: StoredImage) => {
    const a = document.createElement("a");
    a.href = `data:${img.mimeType};base64,${img.imageData}`;
    const ext = img.mimeType.split("/")[1] ?? "jpg";
    a.download = `earth-guardian-${img.id}.${ext}`;
    a.click();
  };

  const handleDownloadAll = () => {
    filtered.forEach((img, i) => {
      setTimeout(() => handleDownload(img), i * 200);
    });
  };

  const handleCopyPrompt = (img: StoredImage) => {
    navigator.clipboard.writeText(img.prompt).then(() => {
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleRegenerate = (img: StoredImage) => {
    void handleGenerate(img.prompt);
  };

  const filtered = useMemo(() => {
    return gallery.filter(img => {
      if (showFavoritesOnly && !favorites.has(img.id)) return false;
      if (selectedCategory !== "All" && img.category !== selectedCategory) return false;
      if (searchQuery && !img.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [gallery, favorites, selectedCategory, searchQuery, showFavoritesOnly]);

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_10%,rgba(139,92,246,0.08)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_80%_85%,rgba(0,188,212,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
                  <ImageIcon className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Image Gallery</h1>
                  <p className="text-sm text-slate-400">AI-generated disaster awareness graphics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{gallery.length} images</span>
              {filtered.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download All ({filtered.length})
                </button>
              )}
              <button
                onClick={() => setGridSize(g => g === "lg" ? "md" : "lg")}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 transition-colors"
              >
                {gridSize === "lg" ? <Grid3X3 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Generate section */}
          <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
            <p className="mb-3 text-sm font-medium text-violet-300">Generate New Image</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && customPrompt.trim() && handleGenerate(customPrompt.trim())}
                placeholder="Describe the image you want to generate…"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
              />
              <button
                onClick={() => customPrompt.trim() && handleGenerate(customPrompt.trim())}
                disabled={generating || isStreaming || !customPrompt.trim()}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
              >
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </button>
            </div>

            {/* Quick templates */}
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => handleGenerate(t.prompt)}
                  disabled={generating || isStreaming}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/10 disabled:opacity-40 transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search images…"
                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-40"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DISASTER_TYPES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                    selectedCategory === cat
                      ? "bg-violet-600 text-white"
                      : "border border-white/10 bg-white/5 text-slate-400 hover:border-violet-500/30 hover:text-slate-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFavoritesOnly(v => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                showFavoritesOnly
                  ? "bg-red-500/20 border border-red-500/30 text-red-400"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:border-red-500/30"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
              Favorites {favorites.size > 0 && `(${favorites.size})`}
            </button>
          </div>
        </motion.div>

        {/* Generating indicator */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3"
            >
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-violet-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
              <p className="text-sm text-violet-300">Generating image with AI…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-24"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <ImageIcon className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-500">
              {gallery.length === 0 ? "No images yet. Generate your first one above!" : "No images match your filters."}
            </p>
          </motion.div>
        ) : (
          <div className={cn(
            "grid gap-4",
            gridSize === "lg" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          )}>
            <AnimatePresence mode="popLayout">
              {filtered.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3"
                >
                  {/* Image */}
                  <div
                    className="relative cursor-pointer overflow-hidden"
                    onClick={() => setFullscreenImage(img)}
                  >
                    <img
                      src={`data:${img.mimeType};base64,${img.imageData}`}
                      alt={img.prompt}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ aspectRatio: "4/3" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-2 text-xs text-white backdrop-blur-sm">
                        <ZoomIn className="h-3.5 w-3.5" />
                        View full
                      </div>
                    </div>
                    {/* Category badge */}
                    <div className="absolute top-2 left-2 rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                      {img.category}
                    </div>
                    {/* Provider badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-violet-500/30 bg-black/60 px-2 py-0.5 text-[10px] text-violet-300 backdrop-blur-sm">
                      <Sparkles className="h-2.5 w-2.5" />
                      {img.provider}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2" title={img.prompt}>
                      {img.prompt}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleDownload(img)}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Download className="h-2.5 w-2.5" />
                        Save
                      </button>
                      <button
                        onClick={() => handleRegenerate(img)}
                        disabled={generating || isStreaming}
                        className="flex items-center gap-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 transition-colors"
                      >
                        <RefreshCw className="h-2.5 w-2.5" />
                        Again
                      </button>
                      <button
                        onClick={() => handleCopyPrompt(img)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedId === img.id ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                        {copiedId === img.id ? "Copied" : "Prompt"}
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(img.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] transition-colors",
                          favorites.has(img.id)
                            ? "border-red-500/30 bg-red-500/10 text-red-400"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-red-400"
                        )}
                      >
                        <Heart className={cn("h-2.5 w-2.5", favorites.has(img.id) && "fill-current")} />
                      </button>
                      <button
                        onClick={() => handleDelete(img.id)}
                        className="ml-auto flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1 text-[10px] text-red-500 hover:bg-red-500/15 transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute -top-10 right-0 flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
                Close
              </button>
              <img
                src={`data:${fullscreenImage.mimeType};base64,${fullscreenImage.imageData}`}
                alt={fullscreenImage.prompt}
                className="w-full rounded-2xl object-contain max-h-[80vh]"
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-400 flex-1">{fullscreenImage.prompt}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(fullscreenImage)}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleRegenerate(fullscreenImage)}
                    disabled={generating}
                    className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-40 transition-colors"
                  >
                    <Wand2 className="h-4 w-4" />
                    Variation
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
