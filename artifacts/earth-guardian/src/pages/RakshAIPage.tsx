import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Shield,
  Zap,
  Globe2,
  FileText,
  History,
  FlaskConical,
  Newspaper,
  Star,
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
} from "lucide-react";
import { useRaksh } from "@/components/raksh/RakshContext";
import { RakshChatPanel } from "@/components/raksh/RakshChatPanel";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Shield, label: "Emergency Mode", desc: "Immediate safety guidance", color: "#ef4444" },
  { icon: History, label: "Disaster Replay", desc: "Historical event timelines", color: "#f97316" },
  { icon: FlaskConical, label: "Scenario Simulator", desc: "What-if analysis", color: "#8b5cf6" },
  { icon: Newspaper, label: "Daily Brief", desc: "Current disaster summary", color: "#06b6d4" },
  { icon: Star, label: "Preparedness Coach", desc: "Score explanation & tips", color: "#10b981" },
  { icon: Globe2, label: "Map Copilot", desc: "Location-aware guidance", color: "#1a73e8" },
  { icon: FileText, label: "Document Analysis", desc: "Upload & extract insights", color: "#f59e0b" },
  { icon: Zap, label: "Smart Actions", desc: "Navigate & control the app", color: "#a855f7" },
];

export default function RakshAIPage() {
  const {
    conversations,
    activeConvId,
    selectConversation,
    newConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
  } = useRaksh();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col pt-20"
      style={{ background: "linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #060e1f 100%)" }}
    >
      {/* Hero */}
      <div className="text-center py-10 px-4 relative overflow-hidden flex-shrink-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(26,115,232,0.6), transparent)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #1a73e8 0%, #00bcd4 100%)",
                boxShadow: "0 0 40px rgba(26,115,232,0.5)",
              }}
            >
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">Raksh AI</h1>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: "linear-gradient(90deg,#1a73e8,#00bcd4)" }}
                >
                  BETA
                </span>
              </div>
              <p className="text-sm text-cyan-400 font-medium">
                Disaster Intelligence & Emergency Response Copilot
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
            {FEATURES.map(({ icon: Icon, label, desc, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                <span className="text-white font-medium">{label}</span>
                <span className="text-slate-500 hidden sm:inline">· {desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-0 max-w-7xl mx-auto w-full px-4 pb-8 min-h-0">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-64 flex-shrink-0 mr-4 flex flex-col gap-3"
        >
          <button
            type="button"
            onClick={newConversation}
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg,#1a73e8,#00bcd4)",
              boxShadow: "0 4px 16px rgba(26,115,232,0.4)",
            }}
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>

          <div
            className="flex-1 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="px-4 py-3 border-b border-white/6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Conversations
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <MessageSquare className="h-8 w-8 text-slate-600" />
                  <p className="text-xs text-slate-500 text-center">
                    No conversations yet. Start one above!
                  </p>
                </div>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all",
                    c.id === activeConvId
                      ? "text-white"
                      : "text-slate-400 hover:text-white",
                  )}
                  style={
                    c.id === activeConvId
                      ? {
                          background: "rgba(26,115,232,0.2)",
                          border: "1px solid rgba(26,115,232,0.3)",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid transparent",
                        }
                  }
                  onClick={() => selectConversation(c.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  {editingId === c.id ? (
                    <input
                      className="flex-1 bg-transparent text-xs text-white outline-none min-w-0"
                      value={editTitle}
                      autoFocus
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => {
                        if (editTitle.trim()) renameConversation(c.id, editTitle.trim());
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editTitle.trim()) renameConversation(c.id, editTitle.trim());
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 text-xs truncate min-w-0">{c.title}</span>
                  )}
                  <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      title="Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(c.id);
                        setEditTitle(c.title);
                      }}
                      className="rounded p-0.5 hover:text-cyan-400 transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(c.id);
                      }}
                      className="rounded p-0.5 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div
            className="rounded-2xl p-3 space-y-1"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">
              Quick Prompts
            </p>
            {[
              { label: "Daily Disaster Brief", prompt: "Give me today's disaster brief" },
              { label: "Emergency Kit", prompt: "Create a comprehensive emergency kit list" },
              { label: "Evacuation Plan", prompt: "Generate a family evacuation plan" },
              { label: "Scenario Simulator", prompt: "What if a magnitude 7 earthquake hits Delhi?" },
            ].map(({ label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="w-full text-left text-xs text-slate-400 hover:text-white px-2 py-2 rounded-lg hover:bg-white/6 transition-colors flex items-center gap-2"
              >
                <Zap className="h-3 w-3 text-cyan-500 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </motion.aside>

        {/* Chat */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 rounded-2xl overflow-hidden min-h-[600px] flex flex-col"
          style={{
            background: "rgba(10,18,35,0.97)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(26,115,232,0.15)",
          }}
        >
          <RakshChatPanel showSidebar={false} />
        </motion.div>
      </div>
    </div>
  );
}
