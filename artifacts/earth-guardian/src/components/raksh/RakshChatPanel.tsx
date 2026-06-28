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
} from "lucide-react";
import type { RakshCommand } from "./RakshContext";
import { useRaksh } from "./RakshContext";
import { RakshMarkdown } from "./RakshMarkdown";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "📡 What disasters are active right now?",
  "🌤️ What's the current weather and risk level?",
  "⚠️ Show me all active alerts",
  "🔮 What's the AI prediction for next 48 hours?",
  "🛡️ Am I safe? Give me a full safety check",
  "📋 Generate a family emergency preparedness plan",
  "💥 What if a magnitude 7.5 quake hits Mumbai?",
  "🚑 Create an evacuation plan for my office",
];

const COMMAND_ICONS: Record<string, React.ReactNode> = {
  "/dashboard":       <LayoutDashboard className="h-3 w-3" />,
  "/live-map":        <MapPin className="h-3 w-3" />,
  "/risk-analysis":   <BarChart2 className="h-3 w-3" />,
  "/emergency-planner": <ShieldAlert className="h-3 w-3" />,
};

const COMMAND_LABELS: Record<string, string> = {
  "/dashboard":       "Open Dashboard",
  "/live-map":        "Open Live Map",
  "/risk-analysis":   "Open Risk Analysis",
  "/emergency-planner": "Open Emergency Planner",
};

function CommandButtons({ commands }: { commands: RakshCommand[] }) {
  if (!commands.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {commands.map((cmd, i) => (
        <a
          key={i}
          href={cmd.path}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 transition-all"
          style={{
            background: "rgba(0,188,212,0.12)",
            border: "1px solid rgba(0,188,212,0.25)",
          }}
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
    stopStreaming,
    newConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    clearConversation,
    activeConvId,
    requestBrief,
  } = useRaksh();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    inputRef.current?.focus();
    await sendMessage(trimmed);
  }, [input, isStreaming, sendMessage]);

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

  const handleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionImpl = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const rec = new SpeechRecognitionImpl();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    rec.onend = () => setIsRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  };

  const isEmergency = EMERGENCY_KEYWORDS.test(input);

  const lastMsg = messages[messages.length - 1];
  const canRegenerate = !isStreaming && lastMsg?.role === "assistant" && messages.length >= 2;

  return (
    <div className={cn("flex", compact ? "flex-col h-full" : "flex-row h-full")}>
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
                <div className="flex-1 overflow-y-auto space-y-1">
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "group flex items-center gap-1.5 rounded-xl px-3 py-2 cursor-pointer transition-colors",
                        c.id === activeConvId
                          ? "bg-white/12 text-white"
                          : "text-slate-400 hover:bg-white/6 hover:text-white",
                      )}
                      onClick={() => selectConversation(c.id)}
                    >
                      {editingId === c.id ? (
                        <input
                          className="flex-1 bg-transparent text-xs text-white outline-none"
                          value={editTitle}
                          autoFocus
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => {
                            renameConversation(c.id, editTitle);
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameConversation(c.id, editTitle);
                              setEditingId(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 text-xs truncate">{c.title}</span>
                      )}
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(c.id);
                            setEditTitle(c.title);
                          }}
                          className="rounded p-0.5 hover:text-cyan-400"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c.id);
                          }}
                          className="rounded p-0.5 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                <ChevronLeft
                  className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")}
                />
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
                <span className="text-[10px] text-slate-400">Disaster Intelligence Copilot</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
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
                <p className="text-xs text-slate-400 max-w-[260px]">
                  Your disaster intelligence & emergency response copilot
                </p>
              </div>
              <div className={cn("grid gap-2 w-full", compact ? "grid-cols-1" : "grid-cols-2")}>
                {(compact ? SUGGESTED_PROMPTS.slice(0, 4) : SUGGESTED_PROMPTS).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="text-left rounded-xl px-3 py-2.5 text-xs text-slate-300 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
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
                {msg.role === "user" ? (
                  <div
                    className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-white"
                    style={{ background: "linear-gradient(135deg,#1a73e8,#2563eb)" }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className="rounded-2xl rounded-tl-sm px-3.5 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {msg.content === "" && isStreaming && idx === messages.length - 1 ? (
                      <TypingIndicator />
                    ) : (
                      <RakshMarkdown content={msg.content} />
                    )}
                  </div>
                )}

                {msg.role === "assistant" && msg.content && (
                  <>
                    {/* Command navigation buttons */}
                    {msg.commands && msg.commands.length > 1 && (
                      <CommandButtons commands={msg.commands} />
                    )}
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="rounded-md px-2 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-white/8 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedId === msg.id ? "Copied" : "Copy"}
                      </button>
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

        {/* Input */}
        <div
          className="flex-shrink-0 p-3 border-t border-white/8"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
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
          <div
            className="flex items-end gap-2 rounded-2xl p-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Raksh AI anything about disasters..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder-slate-500 outline-none py-1.5 px-1 max-h-28 leading-relaxed"
              style={{ scrollbarWidth: "none" }}
            />
            <div className="flex items-center gap-1.5 pb-1">
              <button
                type="button"
                onClick={handleVoice}
                className={cn(
                  "rounded-xl p-2 transition-colors",
                  isRecording
                    ? "text-red-400 bg-red-400/10"
                    : "text-slate-400 hover:text-white hover:bg-white/8",
                )}
                title="Voice input"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="rounded-xl p-2 text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Stop"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="rounded-xl p-2 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: input.trim()
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
            Raksh AI · Earth Guardian · Press <kbd className="text-slate-500">Enter</kbd> to send
          </p>
        </div>
      </div>
    </div>
  );
}
