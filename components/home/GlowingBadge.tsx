"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function GlowingBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative inline-flex"
    >
      {/* Animated glowing border */}
      <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-primary via-cyan to-primary-light opacity-80 blur-sm animate-gradient-border" />
      <div className="absolute -inset-[1px] rounded-full overflow-hidden">
        <div className="absolute inset-0 animate-gradient-border bg-[conic-gradient(from_0deg,#1a73e8,#00bcd4,#4285f4,#00bcd4,#1a73e8)] opacity-90" />
      </div>

      <div className="relative flex flex-col items-center gap-1 rounded-full bg-[#06121F]/90 px-5 py-2.5 backdrop-blur-xl sm:flex-row sm:gap-2 sm:px-6">
        <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
        <span className="text-center text-xs font-medium text-white/90 sm:text-sm">
          AI Powered Global Disaster Intelligence Platform
        </span>
        <span className="hidden h-4 w-px bg-white/20 sm:block" />
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="hidden text-xs font-semibold tracking-widest text-cyan-400 sm:block"
        >
          Predict • Prepare • Protect
        </motion.span>
      </div>
    </motion.div>
  );
}
