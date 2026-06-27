

import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealVariant = "fade" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale" | "blur";

const variantMap: Record<RevealVariant, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 48 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -48 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 48 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -48 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.88 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(12px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function Reveal({
  children,
  variant = "slideUp",
  delay = 0,
  duration = 0.75,
  className,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      variants={variantMap[variant]}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
  delay = 0,
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  variant = "slideUp",
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
}) {
  return (
    <motion.div
      variants={variantMap[variant]}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
