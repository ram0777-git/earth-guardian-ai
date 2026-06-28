import { lazy, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { GlowingBadge } from "./GlowingBadge";
import { PremiumBackground } from "./PremiumBackground";
import { ArrowRight, Shield, Globe2, Users, ChevronDown } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const AnimatedEarth = lazy(() =>
  import("./AnimatedEarth").then((m) => ({ default: m.AnimatedEarth }))
);

const TRUST_STATS = [
  { icon: Shield, label: "Prediction Accuracy", value: "95%", color: "#22d3ee" },
  { icon: Globe2, label: "Communities protected", value: "847", color: "#60a5fa" },
  { icon: Users, label: "Active volunteers", value: "12k+", color: "#818cf8" },
];

export function HeroSection() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const contentX = useSpring(useTransform(mouseX, [0, 1], [14, -14]), { stiffness: 60, damping: 22 });
  const contentY = useSpring(useTransform(mouseY, [0, 1], [9, -9]),   { stiffness: 60, damping: 22 });

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

        {/* ── Left: Copy ──────────────────────────────────── */}
        <motion.div
          style={{ x: contentX, y: contentY }}
          className="flex-1 text-center lg:text-left"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-start"
          >
            <GlowingBadge />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl"
          >
            See Disaster{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-300 via-primary-light to-cyan-400 bg-clip-text text-transparent">
                Before
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 h-[2px] w-full origin-left rounded-full"
                style={{ background: "linear-gradient(90deg, #22d3ee, #60a5fa, #22d3ee)" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>{" "}
            Disaster Sees You.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg lg:mx-0"
          >
            Earth Guardian AI uses advanced artificial intelligence, live geospatial
            intelligence, weather forecasting, satellite imagery, and predictive analytics
            to help governments, emergency responders, and communities prepare before
            disasters happen.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
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

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.68 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
          >
            {TRUST_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.72 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur-sm cursor-default transition-shadow duration-300 hover:border-white/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: stat.color }} />
                  <span className="font-semibold text-white">{stat.value}</span>
                  <span className="text-slate-400">{stat.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* ── Right: Globe ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.90, y: 24 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          transition={{ duration: 1.1, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex-1 w-full"
        >
          <Suspense fallback={
            <div className="flex h-[380px] items-center justify-center md:h-[500px] lg:h-[560px]">
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-52 w-52 rounded-full bg-gradient-to-br from-primary/25 to-cyan/15 blur-2xl md:h-64 md:w-64"
              />
            </div>
          }>
            <AnimatedEarth />
          </Suspense>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1 text-white/30"
        >
          <span className="text-[10px] tracking-[0.18em] uppercase font-medium">Explore</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.div>

      {/* Fade to light sections */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f0f7ff] to-transparent" />
    </section>
  );
}
