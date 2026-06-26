"use client";

import { navLinks } from "@/data/sampleData";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { Globe2, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0.75)", "rgba(255,255,255,0.92)"]);
  const navShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 8px 32px rgba(26,115,232,0.08)", "0 12px 40px rgba(26,115,232,0.15)"]
  );

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 2.5, ease: [0.22, 1, 0.36, 1] }}
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

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
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
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                href="/dashboard"
                size="md"
                className="mt-2 w-full"
                magnetic={false}
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </motion.nav>
    </motion.header>
  );
}
