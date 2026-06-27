

import { motion, AnimatePresence } from "framer-motion";
import { Globe2 } from "lucide-react";
import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#06121F]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,115,232,0.15)_0%,transparent_70%)]" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-8 rounded-full border border-dashed border-cyan/30"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 rounded-full border border-primary/20"
            />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary-light to-cyan shadow-[0_0_60px_rgba(0,188,212,0.4)]">
              <Globe2 className="h-12 w-12 text-white" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 text-2xl font-bold tracking-tight text-white md:text-3xl"
          >
            Earth Guardian <span className="text-cyan-400">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-3 text-sm text-slate-400"
          >
            Loading intelligence
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ...
            </motion.span>
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 h-0.5 w-48 origin-left rounded-full bg-gradient-to-r from-primary via-cyan to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
