
import { navLinks } from "@/data/sampleData";
import { AnimatedButton as Button } from "@/components/ui/AnimatedButton";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Globe2, Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";

const PRIMARY_LINKS = navLinks.slice(0, 6);
const MORE_LINKS = navLinks.slice(6);

export function Navbar() {
  const [pathname] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0.75)", "rgba(255,255,255,0.92)"]);
  const navShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 8px 32px rgba(26,115,232,0.08)", "0 12px 40px rgba(26,115,232,0.15)"]
  );

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isMoreActive = MORE_LINKS.some(link => link.href === pathname);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 2.5, ease: [0.22, 1, 0.36, 1] as const }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <motion.nav
        style={{ backgroundColor: navBg, boxShadow: navShadow }}
        className="glass-strong mx-4 mt-4 rounded-2xl px-4 py-3 backdrop-blur-2xl md:mx-8 md:px-6"
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan text-white shadow-lg shadow-primary/25"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Globe2 className="h-5 w-5" />
              </motion.div>
            </motion.div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-slate-900">Earth Guardian</span>
              <span className="ml-1 text-lg font-light text-cyan-600">AI</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-0.5 xl:flex">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  pathname === link.href
                    ? "text-primary"
                    : "text-slate-600 hover:text-primary"
                )}
              >
                {pathname === link.href && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}

            {/* More dropdown */}
            {MORE_LINKS.length > 0 && (
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen(v => !v)}
                  className={cn(
                    "flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                    isMoreActive ? "text-primary" : "text-slate-600 hover:text-primary"
                  )}
                >
                  {isMoreActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">More</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 relative z-10 transition-transform", moreOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-200/60 bg-white/95 shadow-xl backdrop-blur-xl p-1.5"
                    >
                      {MORE_LINKS.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                            pathname === link.href
                              ? "bg-primary/10 text-primary"
                              : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Tablet nav — fewer links */}
          <div className="hidden items-center gap-0.5 lg:flex xl:hidden">
            {navLinks.slice(0, 4).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  pathname === link.href ? "text-primary" : "text-slate-600 hover:text-primary"
                )}
              >
                {pathname === link.href && (
                  <motion.span layoutId="nav-active-tablet" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen(v => !v)}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                More
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-200/60 bg-white/95 shadow-xl backdrop-blur-xl p-1.5"
                  >
                    {navLinks.slice(4).map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          pathname === link.href ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:block">
            <Button href="/dashboard" size="sm" variant="primary" magnetic>
              Get Started
            </Button>
          </div>

          <button
            type="button"
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t border-slate-200/50 pt-4 lg:hidden"
          >
            <div className="grid grid-cols-2 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Button
              href="/dashboard"
              size="md"
              className="mt-3 w-full"
              magnetic={false}
            >
              Get Started
            </Button>
          </motion.div>
        )}
      </motion.nav>
    </motion.header>
  );
}
