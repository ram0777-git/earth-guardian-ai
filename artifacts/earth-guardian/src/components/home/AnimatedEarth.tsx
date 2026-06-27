

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";
import { useRef } from "react";
import { LiveAIAnalysisPanel } from "./LiveAIAnalysisPanel";

const locationMarkers = [
  { x: 72, y: 38, label: "Tokyo" },
  { x: 28, y: 42, label: "CA" },
  { x: 85, y: 55, label: "PH" },
  { x: 62, y: 48, label: "IN" },
];

export function AnimatedEarth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), {
    stiffness: 100,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-12, 12]), {
    stiffness: 100,
    damping: 20,
  });
  const parallaxX = useSpring(useTransform(mouseX, [0, 1], [-15, 15]), {
    stiffness: 80,
    damping: 20,
  });
  const parallaxY = useSpring(useTransform(mouseY, [0, 1], [-10, 10]), {
    stiffness: 80,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto flex h-[340px] w-full max-w-[420px] items-center justify-center md:h-[440px] md:max-w-[480px]"
      style={{ perspective: "1000px" }}
    >
      <LiveAIAnalysisPanel />

      {/* Radar pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`radar-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/20"
          initial={{ width: 120, height: 120, opacity: 0.6 }}
          animate={{ width: 360, height: 360, opacity: 0 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1.3,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Orbital rings */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan/15" />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
      </motion.div>

      {/* Ambient glow */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-primary/40 to-cyan/30 blur-[80px] md:h-96 md:w-96"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Earth group with parallax */}
      <motion.div
        style={{ rotateX, rotateY, x: parallaxX, y: parallaxY }}
        className="relative"
      >
        {/* Signal rings */}
        {[0, 1].map((i) => (
          <motion.div
            key={`signal-${i}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan/30"
            animate={{
              width: [160, 220, 160],
              height: [160, 220, 160],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 1.5 }}
          />
        ))}

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* Atmosphere glow */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-cyan/30 via-primary/20 to-transparent blur-xl" />
          <div className="absolute -inset-2 rounded-full border border-cyan/20 shadow-[0_0_40px_rgba(0,188,212,0.3)]" />

          {/* Earth sphere — infinite rotation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="relative h-48 w-48 overflow-hidden rounded-full shadow-[0_0_60px_rgba(26,115,232,0.4)] md:h-60 md:w-60"
            style={{
              background:
                "linear-gradient(135deg, #0d47a1 0%, #1a73e8 20%, #4285f4 40%, #00bcd4 60%, #1a73e8 80%, #0d47a1 100%)",
              backgroundSize: "200% 100%",
            }}
          >
            {/* Continents */}
            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 h-full w-full opacity-50"
              aria-hidden="true"
            >
              <ellipse cx="80" cy="70" rx="35" ry="25" fill="#ffffff" opacity="0.55" />
              <ellipse cx="130" cy="90" rx="28" ry="35" fill="#ffffff" opacity="0.45" />
              <ellipse cx="60" cy="130" rx="30" ry="20" fill="#ffffff" opacity="0.35" />
              <ellipse cx="150" cy="140" rx="20" ry="15" fill="#ffffff" opacity="0.45" />
              <ellipse cx="100" cy="50" rx="15" ry="10" fill="#ffffff" opacity="0.3" />
            </svg>

            {/* Moving clouds */}
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{ x: ["-10%", "10%", "-10%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute left-[20%] top-[30%] h-4 w-12 rounded-full bg-white/40 blur-sm" />
              <div className="absolute left-[50%] top-[55%] h-3 w-10 rounded-full bg-white/30 blur-sm" />
              <div className="absolute left-[70%] top-[25%] h-3 w-8 rounded-full bg-white/35 blur-sm" />
            </motion.div>

            {/* Light reflection */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"
              animate={{ opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </motion.div>

          {/* Orbiting satellites */}
          {[0, 120, 240].map((deg, i) => (
            <motion.div
              key={deg}
              className="absolute left-1/2 top-1/2"
              style={{ width: 0, height: 0 }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 14 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: (deg / 360) * 14,
              }}
            >
              <div
                className="absolute"
                style={{ transform: `translateX(${110 + i * 15}px) translateY(-4px)` }}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-cyan shadow-[0_0_12px_rgba(0,188,212,0.8)]" />
                <div className="absolute -inset-1 rounded-full bg-cyan/30 blur-sm" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Floating location markers */}
        {locationMarkers.map((marker, i) => (
          <motion.div
            key={marker.label}
            className="absolute"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          >
            <MapPin className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,188,212,0.8)]" />
          </motion.div>
        ))}
      </motion.div>

      {/* Status chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute right-0 top-6 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-cyan-300 backdrop-blur-xl"
      >
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Live Monitoring
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 backdrop-blur-xl"
      >
        847 Regions Active
      </motion.div>
    </div>
  );
}
