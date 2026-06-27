import { cn } from "@/lib/utils";
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { GlowingBadge } from "./GlowingBadge";
import { PremiumBackground } from "./PremiumBackground";
import { ArrowRight, Shield } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const AnimatedEarth = lazy(() =>
  import("./AnimatedEarth").then((m) => ({ default: m.AnimatedEarth }))
);

export function HeroSection() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const contentX = useSpring(useTransform(mouseX, [0, 1], [12, -12]), {
    stiffness: 80,
    damping: 25,
  });
  const contentY = useSpring(useTransform(mouseY, [0, 1], [8, -8]), {
    stiffness: 80,
    damping: 25,
  });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  return (
    <section className="relative min-h-screen overflow-hidden pt-28">
      <PremiumBackground />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 pb-24 md:px-8 lg:flex-row lg:gap-16">
        <motion.div
          style={{ x: contentX, y: contentY }}
          className="flex-1 text-center lg:text-left"
        >
          <div className="flex justify-center lg:justify-start">
            <GlowingBadge />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl"
          >
            See Disaster{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-primary-light to-cyan-400 bg-clip-text text-transparent">
              Before
            </span>{" "}
            Disaster Sees You.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg lg:mx-0"
          >
            Earth Guardian AI uses advanced artificial intelligence, live geospatial
            intelligence, weather forecasting, satellite imagery, and predictive analytics
            to help governments, emergency responders, and communities prepare before
            disasters happen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
          >
            <Button href="/dashboard" size="lg">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button href="/about" variant="outline" size="lg">
              Learn More
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 lg:justify-start"
          >
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Shield className="h-5 w-5 text-cyan-400" />
              <span>95% Prediction Accuracy</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="text-sm text-slate-400">
              Trusted by 847 communities worldwide
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex-1 w-full"
        >
          <Suspense fallback={
            <div className="flex h-[340px] items-center justify-center md:h-[440px]">
              <div className="h-48 w-48 animate-pulse rounded-full bg-primary/20 md:h-60 md:w-60" />
            </div>
          }>
            <AnimatedEarth />
          </Suspense>
        </motion.div>
      </div>

      {/* Fade to light sections */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f0f7ff] to-transparent" />
    </section>
  );
}
