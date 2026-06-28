import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { useRaksh } from "./RakshContext";
import { useLocation } from "wouter";
import { RakshChatPanel } from "./RakshChatPanel";

export function RakshAIButton() {
  const { isOpen, openChat, closeChat } = useRaksh();
  const [pathname] = useLocation();

  if (pathname === "/raksh") return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => (isOpen ? closeChat() : openChat())}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 3.5, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[200] flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #1a73e8 0%, #00bcd4 100%)",
          boxShadow: "0 8px 32px rgba(26,115,232,0.45), 0 2px 8px rgba(0,0,0,0.3)",
        }}
        aria-label="Open Raksh AI"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-6 w-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Bot className="h-6 w-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.span
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-[199] w-[380px] max-h-[600px] flex flex-col"
            style={{
              background: "rgba(10,18,35,0.97)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(26,115,232,0.2)",
              backdropFilter: "blur(24px)",
            }}
          >
            <RakshChatPanel compact />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
