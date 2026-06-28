

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CursorGlow() {
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 150, damping: 20 });
  const springY = useSpring(cursorY, { stiffness: 150, damping: 20 });

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const leave = () => setVisible(false);
    const enter = () => setVisible(true);

    window.addEventListener("mousemove", move);
    document.body.addEventListener("mouseleave", leave);
    document.body.addEventListener("mouseenter", enter);

    return () => {
      window.removeEventListener("mousemove", move);
      document.body.removeEventListener("mouseleave", leave);
      document.body.removeEventListener("mouseenter", enter);
    };
  }, [cursorX, cursorY, visible]);

  if (isTouch) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-[9999] mix-blend-screen"
        style={{
          left: springX,
          top: springY,
          x: "-50%",
          y: "-50%",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,188,212,0.18)_0%,rgba(26,115,232,0.08)_40%,transparent_70%)] blur-2xl" />
      </motion.div>
      <motion.div
        className="pointer-events-none fixed z-[9999]"
        style={{
          left: springX,
          top: springY,
          x: "-50%",
          y: "-50%",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="h-3 w-3 rounded-full border border-cyan/40 bg-cyan/20 shadow-[0_0_20px_rgba(0,188,212,0.5)]" />
      </motion.div>
    </>
  );
}
