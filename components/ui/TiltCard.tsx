"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glowOnHover?: boolean;
  lift?: boolean;
}

export function TiltCard({
  children,
  className,
  glowOnHover = true,
  lift = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), {
    stiffness: 200,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), {
    stiffness: 200,
    damping: 25,
  });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={lift ? { y: -6, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "group relative rounded-2xl transition-shadow duration-500",
        glowOnHover &&
          "hover:shadow-[0_20px_60px_rgba(26,115,232,0.18)]",
        className
      )}
    >
      {glowOnHover && (
        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/0 via-cyan/0 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:from-primary/30 group-hover:via-cyan/40 group-hover:to-primary/30 group-hover:opacity-100 blur-sm" />
      )}
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}
