"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

const particles = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: `${(i * 17 + 7) % 100}%`,
  y: `${(i * 23 + 11) % 100}%`,
  size: 2 + (i % 3),
  duration: 8 + (i % 6),
  delay: (i % 8) * 0.5,
}));

export function PremiumBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const blob1X = useTransform(mouseX, [0, 1], [-30, 30]);
  const blob1Y = useTransform(mouseY, [0, 1], [-20, 20]);
  const blob2X = useTransform(mouseX, [0, 1], [20, -20]);
  const blob2Y = useTransform(mouseY, [0, 1], [15, -15]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base deep navy */}
      <div className="absolute inset-0 bg-[#06121F]" />

      {/* Animated mesh gradients */}
      <motion.div
        className="absolute inset-0 opacity-80"
        animate={{
          background: [
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(26,115,232,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 30%, rgba(0,188,212,0.25) 0%, transparent 55%), radial-gradient(ellipse 70% 40% at 50% 90%, rgba(66,133,244,0.2) 0%, transparent 50%)",
            "radial-gradient(ellipse 70% 55% at 30% 30%, rgba(0,188,212,0.3) 0%, transparent 58%), radial-gradient(ellipse 65% 45% at 70% 25%, rgba(26,115,232,0.28) 0%, transparent 52%), radial-gradient(ellipse 60% 45% at 45% 85%, rgba(66,133,244,0.22) 0%, transparent 48%)",
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(26,115,232,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 30%, rgba(0,188,212,0.25) 0%, transparent 55%), radial-gradient(ellipse 70% 40% at 50% 90%, rgba(66,133,244,0.2) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Aurora glow */}
      <motion.div
        className="absolute -top-1/4 left-0 right-0 h-[60%] opacity-40"
        animate={{ opacity: [0.25, 0.45, 0.25], x: ["-5%", "5%", "-5%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(180deg, rgba(0,188,212,0.15) 0%, rgba(26,115,232,0.08) 40%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />

      {/* Light blobs with parallax */}
      <motion.div
        style={{ x: blob1X, y: blob1Y }}
        className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ x: blob2X, y: blob2Y }}
        className="absolute -right-32 top-40 h-[450px] w-[450px] rounded-full bg-cyan/15 blur-[100px]"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary-light/10 blur-[80px]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,188,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,188,212,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      <motion.div
        className="absolute inset-0 opacity-[0.04]"
        animate={{ backgroundPosition: ["0px 0px", "60px 60px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(rgba(26,115,232,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(26,115,232,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay bg-noise" />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan/60"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
