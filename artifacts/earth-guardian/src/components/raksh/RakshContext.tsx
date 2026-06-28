import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";

export interface RakshMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  commands?: RakshCommand[];
}

export interface RakshCommand {
  type: "navigate";
  path: string;
}

export interface RakshConversation {
  id: string;
  title: string;
  messages: RakshMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SelectedDisaster {
  id: string;
  name: string;
  type: string;
  severity: string;
  description: string;
  lat: number;
  lng: number;
}

interface RakshContextValue {
  isOpen: boolean;
  isPage: boolean;
  conversations: RakshConversation[];
  activeConvId: string | null;
  activeConversation: RakshConversation | null;
  isStreaming: boolean;
  selectedDisaster: SelectedDisaster | null;
  selectedLocation: string | null;
  openChat: () => void;
  closeChat: () => void;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  setSelectedDisaster: (d: SelectedDisaster | null) => void;
  setSelectedLocation: (loc: string | null) => void;
  requestBrief: () => Promise<void>;
}

const RakshContext = createContext<RakshContextValue | null>(null);

const STORAGE_KEY = "raksh_conversations";

function loadConversations(): RakshConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RakshConversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: RakshConversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch { /* ignore */ }
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateTitle(content: string) {
  return content.slice(0, 50).trim() + (content.length > 50 ? "…" : "");
}

function createConversation(): RakshConversation {
  return { id: generateId(), title: "New Conversation", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
}

// Parse <raksh-command>{...}</raksh-command> tags from streamed content
function parseCommands(content: string): { clean: string; commands: RakshCommand[] } {
  const commands: RakshCommand[] = [];
  const clean = content.replace(/<raksh-command>(.*?)<\/raksh-command>/gs, (_, json) => {
    try {
      commands.push(JSON.parse(json) as RakshCommand);
    } catch { /* skip */ }
    return "";
  }).trim();
  return { clean, commands };
}

export function RakshProvider({ children }: { children: ReactNode }) {
  const [pathname, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<RakshConversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(() => loadConversations()[0]?.id ?? null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState<SelectedDisaster | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isPage = pathname === "/raksh";
  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null;

  const persist = useCallback((convs: RakshConversation[]) => {
    setConversations(convs);
    saveConversations(convs);
  }, []);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const newConversation = useCallback(() => {
    const conv = createConversation();
    persist([conv, ...conversations]);
    setActiveConvId(conv.id);
  }, [conversations, persist]);

  const selectConversation = useCallback((id: string) => setActiveConvId(id), []);

  const renameConversation = useCallback((id: string, title: string) => {
    persist(conversations.map((c) => (c.id === id ? { ...c, title } : c)));
  }, [conversations, persist]);

  const deleteConversation = useCallback((id: string) => {
    const next = conversations.filter((c) => c.id !== id);
    persist(next);
    if (activeConvId === id) setActiveConvId(next[0]?.id ?? null);
  }, [conversations, activeConvId, persist]);

  const clearConversation = useCallback((id: string) => {
    persist(conversations.map((c) => c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c));
  }, [conversations, persist]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const executeCommand = useCallback((cmd: RakshCommand) => {
    if (cmd.type === "navigate") {
      navigate(cmd.path);
    }
  }, [navigate]);

  const sendMessage = useCallback(async (content: string) => {
    let convId = activeConvId;
    let currentConvs = conversations;

    if (!convId) {
      const conv = createConversation();
      currentConvs = [conv, ...conversations];
      persist(currentConvs);
      convId = conv.id;
      setActiveConvId(convId);
    }

    const userMsg: RakshMessage = { id: generateId(), role: "user", content, timestamp: Date.now() };
    const conv = currentConvs.find((c) => c.id === convId)!;
    const isFirstMsg = conv.messages.length === 0;
    const title = isFirstMsg ? generateTitle(content) : conv.title;

    const updatedConvs = currentConvs.map((c) =>
      c.id === convId ? { ...c, title, messages: [...c.messages, userMsg], updatedAt: Date.now() } : c,
    );
    persist(updatedConvs);

    const assistantMsgId = generateId();
    const assistantMsg: RakshMessage = { id: assistantMsgId, role: "assistant", content: "", timestamp: Date.now() };
    persist(updatedConvs.map((c) => c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c));

    setIsStreaming(true);
    const abort = new AbortController();
    abortRef.current = abort;

    const historyMsgs = [...conv.messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    // Build rich context
    const appContext = {
      currentPage: pathname,
      ...(selectedLocation ? { selectedLocation } : {}),
      ...(selectedDisaster ? { selectedDisaster: `${selectedDisaster.name} (${selectedDisaster.type}, ${selectedDisaster.severity}) — ${selectedDisaster.description}` } : {}),
    };

    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${base}/api/raksh/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyMsgs, context: appContext }),
        signal: abort.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error((errData as { error?: string }).error ?? "Request failed");
      }

      const contentType = resp.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream")) {
        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;
            try {
              const parsed = JSON.parse(raw) as { content?: string; error?: string };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                accumulated += parsed.content;
                setConversations((prev) => {
                  const next = prev.map((c) =>
                    c.id === convId
                      ? { ...c, messages: c.messages.map((m) => m.id === assistantMsgId ? { ...m, content: accumulated } : m) }
                      : c,
                  );
                  saveConversations(next);
                  return next;
                });
              }
            } catch { /* skip invalid json */ }
          }
        }

        // Parse commands from final content
        const { clean, commands } = parseCommands(accumulated);
        setConversations((prev) => {
          const next = prev.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.map((m) => m.id === assistantMsgId ? { ...m, content: clean, commands } : m) }
              : c,
          );
          saveConversations(next);
          return next;
        });
        // Auto-execute single commands
        if (commands.length === 1) {
          setTimeout(() => executeCommand(commands[0]!), 800);
        }

      } else {
        const data = await resp.json() as { content?: string; error?: string };
        if (data.error) throw new Error(data.error);
        const { clean, commands } = parseCommands(data.content ?? "");
        setConversations((prev) => {
          const next = prev.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.map((m) => m.id === assistantMsgId ? { ...m, content: clean, commands } : m) }
              : c,
          );
          saveConversations(next);
          return next;
        });
        if (commands.length === 1) setTimeout(() => executeCommand(commands[0]!), 800);
      }

    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const errorContent = `❌ **Error:** ${(err as Error).message}`;
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convId
            ? { ...c, messages: c.messages.map((m) => m.id === assistantMsgId ? { ...m, content: errorContent } : m) }
            : c,
        );
        saveConversations(next);
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [activeConvId, conversations, persist, pathname, selectedDisaster, selectedLocation, executeCommand]);

  const requestBrief = useCallback(async () => {
    await sendMessage("Give me today's Daily Disaster Brief using all available live data.");
  }, [sendMessage]);

  return (
    <RakshContext.Provider value={{
      isOpen, isPage, conversations, activeConvId, activeConversation, isStreaming,
      selectedDisaster, selectedLocation,
      openChat, closeChat, newConversation, selectConversation,
      renameConversation, deleteConversation, clearConversation,
      sendMessage, stopStreaming,
      setSelectedDisaster, setSelectedLocation,
      requestBrief,
    }}>
      {children}
    </RakshContext.Provider>
  );
}

export function useRaksh() {
  const ctx = useContext(RakshContext);
  if (!ctx) throw new Error("useRaksh must be used within RakshProvider");
  return ctx;
}
