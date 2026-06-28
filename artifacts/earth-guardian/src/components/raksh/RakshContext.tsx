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
}

export interface RakshConversation {
  id: string;
  title: string;
  messages: RakshMessage[];
  createdAt: number;
  updatedAt: number;
}

interface RakshContextValue {
  isOpen: boolean;
  isPage: boolean;
  conversations: RakshConversation[];
  activeConvId: string | null;
  activeConversation: RakshConversation | null;
  isStreaming: boolean;
  openChat: () => void;
  closeChat: () => void;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
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
  } catch {
    /* ignore */
  }
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateTitle(content: string) {
  return content.slice(0, 50).trim() + (content.length > 50 ? "…" : "");
}

function createConversation(): RakshConversation {
  return {
    id: generateId(),
    title: "New Conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function RakshProvider({ children }: { children: ReactNode }) {
  const [pathname] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<RakshConversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    () => loadConversations()[0]?.id ?? null,
  );
  const [isStreaming, setIsStreaming] = useState(false);
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

  const selectConversation = useCallback((id: string) => {
    setActiveConvId(id);
  }, []);

  const renameConversation = useCallback(
    (id: string, title: string) => {
      persist(conversations.map((c) => (c.id === id ? { ...c, title } : c)));
    },
    [conversations, persist],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      persist(next);
      if (activeConvId === id) {
        setActiveConvId(next[0]?.id ?? null);
      }
    },
    [conversations, activeConvId, persist],
  );

  const clearConversation = useCallback(
    (id: string) => {
      persist(
        conversations.map((c) =>
          c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c,
        ),
      );
    },
    [conversations, persist],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      let convId = activeConvId;
      let currentConvs = conversations;

      if (!convId) {
        const conv = createConversation();
        currentConvs = [conv, ...conversations];
        persist(currentConvs);
        convId = conv.id;
        setActiveConvId(convId);
      }

      const userMsg: RakshMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const conv = currentConvs.find((c) => c.id === convId)!;
      const isFirstMsg = conv.messages.length === 0;
      const title = isFirstMsg ? generateTitle(content) : conv.title;

      const updatedConvs = currentConvs.map((c) =>
        c.id === convId
          ? { ...c, title, messages: [...c.messages, userMsg], updatedAt: Date.now() }
          : c,
      );
      persist(updatedConvs);

      const assistantMsgId = generateId();
      const assistantMsg: RakshMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      const withAssistant = updatedConvs.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, assistantMsg] }
          : c,
      );
      persist(withAssistant);

      setIsStreaming(true);
      const abort = new AbortController();
      abortRef.current = abort;

      const historyMsgs = [...conv.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const context = {
        currentPage: pathname,
      };

      try {
        const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
        const resp = await fetch(`${base}/api/raksh/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyMsgs, context }),
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
              if (line.startsWith("data: ")) {
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
                          ? {
                              ...c,
                              messages: c.messages.map((m) =>
                                m.id === assistantMsgId
                                  ? { ...m, content: accumulated }
                                  : m,
                              ),
                            }
                          : c,
                      );
                      saveConversations(next);
                      return next;
                    });
                  }
                } catch {
                  /* skip invalid json */
                }
              }
            }
          }
        } else {
          const data = await resp.json() as { content?: string; error?: string };
          if (data.error) throw new Error(data.error);
          const finalContent = data.content ?? "";
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: finalContent }
                        : m,
                    ),
                  }
                : c,
            );
            saveConversations(next);
            return next;
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errorContent = `❌ **Error:** ${(err as Error).message}`;
        setConversations((prev) => {
          const next = prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: errorContent } : m,
                  ),
                }
              : c,
          );
          saveConversations(next);
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [activeConvId, conversations, persist, pathname],
  );

  return (
    <RakshContext.Provider
      value={{
        isOpen,
        isPage,
        conversations,
        activeConvId,
        activeConversation,
        isStreaming,
        openChat,
        closeChat,
        newConversation,
        selectConversation,
        renameConversation,
        deleteConversation,
        clearConversation,
        sendMessage,
        stopStreaming,
      }}
    >
      {children}
    </RakshContext.Provider>
  );
}

export function useRaksh() {
  const ctx = useContext(RakshContext);
  if (!ctx) throw new Error("useRaksh must be used within RakshProvider");
  return ctx;
}
