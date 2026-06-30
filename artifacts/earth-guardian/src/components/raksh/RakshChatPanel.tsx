import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Square,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Mic,
  MicOff,
  Plus,
  ChevronLeft,
  Edit3,
  Zap,
  Newspaper,
  ArrowRight,
  MapPin,
  BarChart2,
  ShieldAlert,
  LayoutDashboard,
  Paperclip,
  Volume2,
  VolumeX,
  Download,
  Search,
  X,
  FileText,
  ImageIcon,
  Upload,
  FileBarChart,
  Headphones,
  Maximize2,
  Minimize2,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { RakshCommand, RakshGeneratedImage } from "./RakshContext";
import { useRaksh } from "./RakshContext";
import { RakshMarkdown } from "./RakshMarkdown";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { useProviderStatus } from "@/hooks/useLiveIntelligence";
import { ReportExportPanel } from "./ReportExportPanel";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "📡 What disasters are active right now?",
  "🌤️ What's the current weather and risk level?",
  "🎨 Generate a flood preparedness poster",
  "🖼️ Create an earthquake safety infographic",
  "⚠️ Show me all active alerts",
  "🔮 What's the AI prediction for next 48 hours?",
  "🎨 Generate a wildfire awareness banner",
  "💥 What if a magnitude 7.5 quake hits Mumbai?",
];

const IMAGE_TEMPLATE_PROMPTS = [
  { label: "Flood Poster", prompt: "Generate a flood preparedness poster with safety tips and emergency contacts" },
  { label: "Earthquake Infographic", prompt: "Create an earthquake safety infographic showing drop cover hold on steps" },
  { label: "Wildfire Banner", prompt: "Generate a wildfire awareness banner with evacuation and alert information" },
  { label: "Cyclone Poster", prompt: "Create a cyclone preparedness poster with shelter and supply checklist" },
  { label: "Emergency Kit", prompt: "Generate an emergency kit illustration showing all essential survival items" },
  { label: "Evacuation Map", prompt: "Create an evacuation route diagram for a disaster emergency scenario" },
  { label: "Shelter Layout", prompt: "Generate a shelter layout diagram showing capacity, zones, and services" },
  { label: "Tsunami Guide", prompt: "Create a tsunami safety awareness poster with evacuation route markers" },
];

const COMMAND_ICONS: Record<string, React.ReactNode> = {
  "/dashboard":         <LayoutDashboard className="h-3 w-3" />,
  "/live-map":          <MapPin className="h-3 w-3" />,
  "/risk-analysis":     <BarChart2 className="h-3 w-3" />,
  "/emergency-planner": <ShieldAlert className="h-3 w-3" />,
};

const COMMAND_LABELS: Record<string, string> = {
  "/dashboard":         "Open Dashboard",
  "/live-map":          "Open Live Map",
  "/risk-analysis":     "Open Risk Analysis",
  "/emergency-planner": "Open Emergency Planner",
};

const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,image/webp,image/gif,text/plain,text/csv,application/json,.md,.csv,.txt,.json,.geojson";

function CommandButtons({ commands }: { commands: RakshCommand[] }) {
  if (!commands.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {commands.map((cmd, i) => (
        <a
          key={i}
          href={cmd.path}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 transition-all"
          style={{ background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,188,212,0.25)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,188,212,0.22)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,188,212,0.12)"; }}
        >
          {COMMAND_ICONS[cmd.path] ?? <ArrowRight className="h-3 w-3" />}
          {COMMAND_LABELS[cmd.path] ?? cmd.path}
        </a>
      ))}
    </div>
  );
}

const EMERGENCY_KEYWORDS = /\b(help|sos|emergency|fire|flood|earthquake|cyclone|accident|collapse)\b/i;

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function VoiceWaveform() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 rounded-full bg-red-400"
          animate={{ height: ["4px", `${8 + Math.sin(i) * 6}px`, "4px"] }}
          transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

interface GeneratedImageBubbleProps {
  image: RakshGeneratedImage;
  onRegenerate: () => void;
  onVariation: () => void;
  onFullscreen: (image: RakshGeneratedImage) => void;
  isStreaming: boolean;
}

function GeneratedImageBubble({ image, onRegenerate, onVariation, onFullscreen, isStreaming }: GeneratedImageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const dataUri = `data:${image.mimeType};base64,${image.imageData}`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = dataUri;
    const ext = image.mimeType.split("/")[1] ?? "jpg";
    a.download = `raksh-${image.seed}.${ext}`;
    a.click();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-2 max-w-[90%]">
      {/* Image */}
      <div
        className="relative group rounded-2xl overflow-hidden cursor-pointer"
        style={{ border: "1px solid rgba(139,92,246,0.3)" }}
        onClick={() => onFullscreen(image)}
      >
        <img
          src={dataUri}
          alt={image.prompt}
          className="w-full object-contain max-h-80 block"
          style={{ background: "rgba(0,0,0,0.3)" }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white font-medium" style={{ background: "rgba(0,0,0,0.7)" }}>
            <Maximize2 className="h-4 w-4" />
            Full screen
          </div>
        </div>
        {/* Provider badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] text-violet-200 font-medium" style={{ background: "rgba(0,0,0,0.7)" }}>
          <Sparkles className="h-2.5 w-2.5" />
          {image.provider}
        </div>
      </div>

      {/* Prompt label */}
      <p className="text-[11px] text-slate-400 px-1 truncate" title={image.prompt}>
        🎨 {image.prompt}
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:text-white"
          style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}
        >
          <Download className="h-3 w-3" />
          Download
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isStreaming}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 transition-colors hover:text-white disabled:opacity-40"
          style={{ background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,188,212,0.25)" }}
        >
          <RefreshCw className="h-3 w-3" />
          Regenerate
        </button>
        <button
          type="button"
          onClick={onVariation}
          disabled={isStreaming}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-violet-300 transition-colors hover:text-white disabled:opacity-40"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          <Wand2 className="h-3 w-3" />
          Variation
        </button>
        <button
          type="button"
          onClick={handleCopyPrompt}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy prompt"}
        </button>
        <button
          type="button"
          onClick={() => onFullscreen(image)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <Maximize2 className="h-3 w-3" />
          Full screen
        </button>
      </div>
    </div>
  );
}

interface AttachmentState {
  type: "image" | "document";
  name: string;
  previewUrl?: string;
  base64?: string;
  textContent?: string;
  mimeType: string;
}

interface Props {
  compact?: boolean;
  showSidebar?: boolean;
}

export function RakshChatPanel({ compact = false, showSidebar = false }: Props) {
  const {
    activeConversation,
    conversations,
    isStreaming,
    sendMessage,
    sendMessageWithAttachment,
    generateImage,
    stopStreaming,
    newConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    clearConversation,
    activeConvId,
    requestBrief,
  } = useRaksh();

  const { speak, stop: stopSpeaking, speakingId, isSupported: ttsSupported } = useVoiceOutput();
  const { data: providerStatus } = useProviderStatus();
  const activeProvider =
    providerStatus?.currentProvider && providerStatus.currentProvider !== "none"
      ? providerStatus.currentProvider
      : providerStatus?.gemini ? "gemini"
      : providerStatus?.openrouter ? "openrouter"
      : providerStatus?.groq ? "groq"
      : null;

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [voiceCopilotMode, setVoiceCopilotMode] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<{ content: string; generatedAt: string } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<RakshGeneratedImage | null>(null);
  const handsFreeRef = useRef(false);
  const voiceCopilotRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  // Keep refs in sync for use in callbacks without stale closure issues
  useEffect(() => { handsFreeRef.current = handsFreeMode; }, [handsFreeMode]);
  useEffect(() => { voiceCopilotRef.current = voiceCopilotMode; }, [voiceCopilotMode]);

  // Voice Copilot: auto-speak last assistant message + restart mic when done
  // Hands-free: auto-restart mic after Raksh finishes responding
  useEffect(() => {
    if (isStreaming) return undefined;

    // Voice Copilot auto-speak
    if (voiceCopilotRef.current && ttsSupported) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && lastMsg.content && lastMsg.content !== "🎨 Generating your image with Raksh AI…") {
        speak(lastMsg.id, lastMsg.content);
      }
    }

    // Auto-restart mic (voice copilot or hands-free)
    const shouldRestart = voiceCopilotRef.current || handsFreeRef.current;
    if (shouldRestart && !isRecording) {
      const delay = voiceCopilotRef.current ? 1400 : 800;
      const timer = setTimeout(() => {
        if (voiceCopilotRef.current || handsFreeRef.current) startVoiceRecording();
      }, delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachment) || isStreaming) return;

    if (attachment) {
      const fileData = attachment.base64 ?? attachment.textContent ?? "";
      await sendMessageWithAttachment(
        trimmed,
        fileData,
        attachment.mimeType,
        attachment.name,
        attachment.type,
        attachment.previewUrl,
      );
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      setAttachment(null);
    } else {
      await sendMessage(trimmed);
    }

    setInput("");
    inputRef.current?.focus();
  }, [input, attachment, isStreaming, sendMessage, sendMessageWithAttachment]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleRegenerate = async () => {
    if (!activeConversation || isStreaming) return;
    const msgs = activeConversation.messages;
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    clearConversation(activeConversation.id);
    setTimeout(() => sendMessage(lastUser.content), 100);
  };

  const processFile = useCallback((file: File) => {
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const previewUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        setAttachment({ type: "image", name: file.name, previewUrl, base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({ type: "document", name: file.name, textContent: reader.result as string, mimeType: file.type });
      };
      reader.readAsText(file);
    }
  }, []);

  const startVoiceRecording = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionImpl = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return;
    const rec = new SpeechRecognitionImpl();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    let finalTranscript = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const result of Array.from(e.results) as any[]) {
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };
    rec.onend = () => {
      setIsRecording(false);
      // Voice Copilot: auto-send when recognition ends with a final transcript
      if (voiceCopilotRef.current && finalTranscript.trim()) {
        const text = finalTranscript.trim();
        setInput("");
        sendMessage(text);
      }
    };
    rec.onerror = () => setIsRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }, [sendMessage]);

  const handleVoice = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    startVoiceRecording();
  }, [isRecording, startVoiceRecording]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if leaving the component entirely
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleGenerateReport = useCallback(async () => {
    if (isGeneratingReport || isStreaming) return;
    setIsGeneratingReport(true);
    try {
      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${BASE}/api/raksh/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Report generation failed" }));
        throw new Error((err as { error: string }).error);
      }
      const data = await res.json() as { content: string; generatedAt: string };
      // Show report export panel instead of auto-downloading
      setReportData({ content: data.content, generatedAt: data.generatedAt });
    } catch (err) {
      console.error("[Raksh] Report generation failed:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [isGeneratingReport, isStreaming]);

  const handleExportChat = () => {
    if (!activeConversation || messages.length === 0) return;
    const lines = [
      `# ${activeConversation.title}`,
      `*Exported from Raksh AI — Earth Guardian AI*`,
      `*Date: ${new Date().toLocaleString()}*`,
      "",
      ...messages.map((m) => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const who = m.role === "user" ? "**You**" : "**Raksh AI**";
        return `${who} *(${time})*:\n\n${m.content}`;
      }),
    ];
    const blob = new Blob([lines.join("\n\n---\n\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeConversation.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isEmergency = EMERGENCY_KEYWORDS.test(input);
  const lastMsg = messages[messages.length - 1];
  const canRegenerate = !isStreaming && lastMsg?.role === "assistant" && messages.length >= 2;

  return (
    <div
      className={cn("flex relative", compact ? "flex-col h-full" : "flex-row h-full")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Drag-and-drop overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-xl pointer-events-none"
            style={{
              background: "rgba(0,188,212,0.12)",
              border: "2px dashed rgba(0,188,212,0.6)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Upload className="h-10 w-10 text-cyan-400" />
            <p className="text-sm font-semibold text-cyan-300">Drop to analyze with Raksh AI</p>
            <p className="text-xs text-slate-400">Images, documents, CSVs, JSON accepted</p>
          </motion.div>
        )}
      </AnimatePresence>

      {showSidebar && (
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden border-r border-white/8 flex-shrink-0"
            >
              <div className="w-60 h-full flex flex-col p-3 gap-2">
                <button
                  type="button"
                  onClick={newConversation}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white bg-primary/20 hover:bg-primary/30 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New conversation
                </button>

                {/* Search */}
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                        <Search className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <input
                          autoFocus
                          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                          placeholder="Search conversations…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery("")}>
                            <X className="h-3 w-3 text-slate-500 hover:text-white" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {filteredConversations.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "group flex items-center gap-1.5 rounded-xl px-3 py-2 cursor-pointer transition-colors",
                        c.id === activeConvId ? "bg-white/12 text-white" : "text-slate-400 hover:bg-white/6 hover:text-white",
                      )}
                      onClick={() => selectConversation(c.id)}
                    >
                      {editingId === c.id ? (
                        <input
                          className="flex-1 bg-transparent text-xs text-white outline-none"
                          value={editTitle}
                          autoFocus
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => { renameConversation(c.id, editTitle); setEditingId(null); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { renameConversation(c.id, editTitle); setEditingId(null); }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 text-xs truncate">{c.title}</span>
                      )}
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditTitle(c.title); }}
                          className="rounded p-0.5 hover:text-cyan-400"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                          className="rounded p-0.5 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredConversations.length === 0 && searchQuery && (
                    <p className="text-xs text-slate-500 text-center py-4">No results for "{searchQuery}"</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-2.5">
            {showSidebar && (
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
              </button>
            )}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #1a73e8, #00bcd4)" }}
            >
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">Raksh AI</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(90deg,#1a73e8,#00bcd4)" }}
                >
                  BETA
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] text-slate-400">Multimodal · Voice · Vision</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {showSidebar && (
              <button
                type="button"
                onClick={() => { setShowSearch(!showSearch); setSidebarOpen(true); }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
                title="Search conversations"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
            {/* Active provider badge */}
            {activeProvider && (
              <div
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                title={`Active AI: ${activeProvider}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-slate-400 capitalize">{activeProvider}</span>
              </div>
            )}

            {/* Voice Copilot toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !voiceCopilotMode;
                setVoiceCopilotMode(next);
                if (next) setHandsFreeMode(false);
                if (next && !isRecording) startVoiceRecording();
                if (!next) { recognitionRef.current?.stop(); stopSpeaking(); }
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                voiceCopilotMode
                  ? "text-cyan-300 bg-cyan-500/15 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/8",
              )}
              title={voiceCopilotMode ? "Voice Copilot ON — speak to send, AI speaks back" : "Enable Voice Copilot (speak → AI → speak)"}
            >
              {voiceCopilotMode ? <Volume2 className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              {!compact && <span>Copilot</span>}
            </button>

            {/* Hands-free mode toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !handsFreeMode;
                setHandsFreeMode(next);
                if (next) setVoiceCopilotMode(false);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                handsFreeMode
                  ? "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/8",
              )}
              title={handsFreeMode ? "Hands-free ON — mic restarts automatically" : "Enable hands-free voice mode"}
            >
              <Headphones className="h-3.5 w-3.5" />
              {!compact && <span>Hands-free</span>}
            </button>

            {/* Generate Report */}
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport || isStreaming}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-violet-300 hover:text-white transition-colors disabled:opacity-40"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
              title="Generate comprehensive disaster intelligence report"
            >
              {isGeneratingReport ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <FileBarChart className="h-3 w-3" />
              )}
              {!compact && <span>{isGeneratingReport ? "Generating…" : "Report"}</span>}
            </button>

            <button
              type="button"
              onClick={requestBrief}
              disabled={isStreaming}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-cyan-300 hover:text-white transition-colors disabled:opacity-40"
              style={{ background: "rgba(0,188,212,0.10)", border: "1px solid rgba(0,188,212,0.2)" }}
              title="Get today's Daily Disaster Brief"
            >
              <Newspaper className="h-3 w-3" />
              {!compact && <span>Brief</span>}
            </button>
            {!compact && (
              <button
                type="button"
                onClick={newConversation}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
                title="New conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            {activeConversation && messages.length > 0 && (
              <button
                type="button"
                onClick={handleExportChat}
                className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/8 transition-colors"
                title="Export chat as Markdown"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {activeConversation && messages.length > 0 && (
              <button
                type="button"
                onClick={() => clearConversation(activeConversation.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/8 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #1a73e8 0%, #00bcd4 100%)" }}
              >
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-white">Raksh AI</h3>
                <p className="text-xs text-slate-400 max-w-[280px]">
                  Disaster intelligence & emergency copilot. Ask anything, upload images, or use voice.
                </p>
              </div>
              <div className={cn("grid gap-2 w-full", compact ? "grid-cols-1" : "grid-cols-2")}>
                {(compact ? SUGGESTED_PROMPTS.slice(0, 4) : SUGGESTED_PROMPTS).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="text-left rounded-xl px-3 py-2.5 text-xs text-slate-300 transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(26,115,232,0.15)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,115,232,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    <Zap className="h-3 w-3 text-cyan-400 mb-1" />
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Image generation templates */}
              {!compact && (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3 w-3 text-violet-400" />
                    <span className="text-[11px] text-slate-500 font-medium">AI Image Templates</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {IMAGE_TEMPLATE_PROMPTS.slice(0, 8).map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => sendMessage(t.prompt)}
                        className="rounded-xl px-2 py-2 text-[10px] text-violet-300 text-center transition-all hover:text-white"
                        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.18)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.08)";
                        }}
                      >
                        🎨 {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div
                  className="flex-shrink-0 h-7 w-7 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ background: "linear-gradient(135deg,#1a73e8,#00bcd4)" }}
                >
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}

              <div className={cn("max-w-[85%] group", msg.role === "user" ? "items-end" : "items-start", "flex flex-col")}>
                {/* User message */}
                {msg.role === "user" ? (
                  <div className="flex flex-col gap-1.5 items-end">
                    {/* Image attachment preview */}
                    {msg.attachment?.type === "image" && msg.attachment.url && (
                      <div className="rounded-xl overflow-hidden border border-white/10 max-w-[200px]">
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.name}
                          className="w-full object-cover max-h-40"
                        />
                        <div className="px-2 py-1 text-[10px] text-slate-400 truncate" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <ImageIcon className="h-2.5 w-2.5 inline mr-1" />
                          {msg.attachment.name}
                        </div>
                      </div>
                    )}
                    {/* Document attachment badge */}
                    {msg.attachment?.type === "document" && (
                      <div
                        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] text-cyan-300"
                        style={{ background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,188,212,0.25)" }}
                      >
                        <FileText className="h-3 w-3" />
                        {msg.attachment.name}
                      </div>
                    )}
                    {msg.content && (
                      <div
                        className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-white"
                        style={{ background: "linear-gradient(135deg,#1a73e8,#2563eb)" }}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Assistant message */
                  msg.generatedImage ? (
                    /* Generated image bubble */
                    <GeneratedImageBubble
                      image={msg.generatedImage}
                      isStreaming={isStreaming}
                      onFullscreen={setFullscreenImage}
                      onRegenerate={() => generateImage(msg.generatedImage!.prompt)}
                      onVariation={() => generateImage(msg.generatedImage!.prompt, Math.floor(Math.random() * 999_999))}
                    />
                  ) : (
                    <div
                      className="rounded-2xl rounded-tl-sm px-3.5 py-2.5"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {msg.content === "" && isStreaming && idx === messages.length - 1 ? (
                        <TypingIndicator />
                      ) : msg.content === "🎨 Generating your image with Raksh AI…" && isStreaming ? (
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
                          <span className="text-sm text-slate-300">Generating your image…</span>
                          <TypingIndicator />
                        </div>
                      ) : (
                        <RakshMarkdown content={msg.content} />
                      )}
                    </div>
                  )
                )}

                {/* Assistant action buttons */}
                {msg.role === "assistant" && msg.content && (
                  <>
                    {msg.commands && msg.commands.length > 1 && (
                      <CommandButtons commands={msg.commands} />
                    )}
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="rounded-md px-2 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-white/8 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedId === msg.id ? "Copied" : "Copy"}
                      </button>

                      {ttsSupported && (
                        <button
                          type="button"
                          onClick={() => {
                            if (speakingId === msg.id) {
                              stopSpeaking();
                            } else {
                              speak(msg.id, msg.content);
                            }
                          }}
                          className={cn(
                            "rounded-md px-2 py-1 text-[10px] flex items-center gap-1 transition-colors",
                            speakingId === msg.id
                              ? "text-cyan-400 bg-cyan-400/10"
                              : "text-slate-400 hover:text-white hover:bg-white/8",
                          )}
                          title={speakingId === msg.id ? "Stop speaking" : "Read aloud"}
                        >
                          {speakingId === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          {speakingId === msg.id ? "Stop" : "Speak"}
                        </button>
                      )}

                      {idx === messages.length - 1 && canRegenerate && (
                        <button
                          type="button"
                          onClick={handleRegenerate}
                          className="rounded-md px-2 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-white/8 flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Regenerate
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 p-3 border-t border-white/8"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {/* Emergency banner */}
          {isEmergency && input.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 rounded-xl px-3 py-2 text-xs text-red-200 flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              🚨 <span className="font-semibold">Emergency Mode</span> — Raksh AI will provide immediate safety guidance
            </motion.div>
          )}

          {/* Attachment preview bar */}
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 overflow-hidden"
              >
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)" }}
                >
                  {attachment.type === "image" && attachment.previewUrl ? (
                    <img src={attachment.previewUrl} alt="preview" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-cyan-300 truncate">{attachment.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{attachment.type} ready for analysis</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
                      setAttachment(null);
                    }}
                    className="rounded-md p-1 text-slate-400 hover:text-white hover:bg-white/8 flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Copilot active banner */}
          <AnimatePresence>
            {voiceCopilotMode && !isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.22)" }}
              >
                <Volume2 className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                <span className="text-xs text-cyan-300">Voice Copilot active — speak your question, Raksh will respond aloud</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 rounded-xl px-3 py-2 flex items-center gap-2"
                style={{
                  background: voiceCopilotMode ? "rgba(0,188,212,0.10)" : "rgba(239,68,68,0.10)",
                  border: `1px solid ${voiceCopilotMode ? "rgba(0,188,212,0.30)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                <div className={`h-2 w-2 rounded-full animate-pulse flex-shrink-0 ${voiceCopilotMode ? "bg-cyan-400" : "bg-red-400"}`} />
                <VoiceWaveform />
                <span className={`text-xs ml-1 ${voiceCopilotMode ? "text-cyan-300" : "text-red-300"}`}>
                  {voiceCopilotMode ? "Listening… will auto-send" : "Listening… speak now"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main input row */}
          <div
            className="flex items-end gap-2 rounded-2xl p-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {/* Attach file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="rounded-xl p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/8 transition-colors disabled:opacity-30 flex-shrink-0"
              title="Upload image or document"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachment ? `Add a message about ${attachment.name}…` : "Ask Raksh AI anything about disasters…"}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder-slate-500 outline-none py-1.5 px-1 max-h-28 leading-relaxed"
              style={{ scrollbarWidth: "none" }}
            />

            <div className="flex items-center gap-1.5 pb-1 flex-shrink-0">
              {/* Voice input */}
              <button
                type="button"
                onClick={handleVoice}
                className={cn(
                  "rounded-xl p-2 transition-colors",
                  isRecording ? "text-red-400 bg-red-400/10" : "text-slate-400 hover:text-white hover:bg-white/8",
                )}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* Send / Stop */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="rounded-xl p-2 text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Stop generation"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() && !attachment}
                  className="rounded-xl p-2 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: (input.trim() || attachment)
                      ? "linear-gradient(135deg,#1a73e8,#00bcd4)"
                      : "rgba(255,255,255,0.08)",
                  }}
                  title="Send (Enter)"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-1.5">
            Raksh AI · Voice · Vision · Images · Documents · Press <kbd className="text-slate-500">Enter</kbd> to send
          </p>
        </div>
      </div>

      {/* Fullscreen image modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col"
            style={{ background: "rgba(0,0,0,0.95)" }}
            onClick={() => setFullscreenImage(null)}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-white">Generated by Raksh AI</span>
                <span className="text-[11px] text-slate-500">· {fullscreenImage.provider} · {fullscreenImage.width}×{fullscreenImage.height}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = `data:${fullscreenImage.mimeType};base64,${fullscreenImage.imageData}`;
                    const ext = fullscreenImage.mimeType.split("/")[1] ?? "jpg";
                    a.download = `raksh-${fullscreenImage.seed}.${ext}`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-white transition-colors"
                  style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenImage(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div
              className="flex-1 flex items-center justify-center p-6 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={`data:${fullscreenImage.mimeType};base64,${fullscreenImage.imageData}`}
                alt={fullscreenImage.prompt}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                style={{ border: "1px solid rgba(139,92,246,0.3)" }}
              />
            </div>

            {/* Prompt footer */}
            <div
              className="px-4 py-2 flex-shrink-0 text-center"
              style={{ background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs text-slate-400 truncate">🎨 {fullscreenImage.prompt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Export Panel modal */}
      <AnimatePresence>
        {reportData && (
          <ReportExportPanel
            content={reportData.content}
            generatedAt={reportData.generatedAt}
            onClose={() => setReportData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
