"use client";

import { Globe2, Share2, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { navLinks } from "@/data/sampleData";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/Reveal";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/50 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <Reveal variant="slideUp" className="md:col-span-2">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan text-white"
              >
                <Globe2 className="h-5 w-5" />
              </motion.div>
              <span className="text-xl font-bold text-slate-900">
                Earth Guardian <span className="text-cyan-600">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Protecting communities worldwide with AI-powered disaster prediction,
              real-time alerts, and coordinated emergency response. Built for the
              Google GDG Hackathon.
            </p>
            <div className="mt-6 flex gap-3">
              {[Share2, Mail, ExternalLink].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -3, scale: 1.05 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl glass text-slate-600 transition-colors hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </Reveal>

          <Reveal variant="slideUp" delay={0.1}>
            <h4 className="font-semibold text-slate-900">Navigation</h4>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal variant="slideUp" delay={0.2}>
            <h4 className="font-semibold text-slate-900">Resources</h4>
            <StaggerContainer className="mt-4 space-y-2" stagger={0.05}>
              {["Documentation", "API Reference", "Privacy Policy", "Terms of Service"].map(
                (item) => (
                  <StaggerItem key={item} variant="fade">
                    <a
                      href="#"
                      className="block text-sm text-slate-600 transition-colors hover:text-primary"
                    >
                      {item}
                    </a>
                  </StaggerItem>
                )
              )}
            </StaggerContainer>
          </Reveal>
        </div>

        <Reveal variant="fade" delay={0.3}>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/50 pt-8 md:flex-row">
            <p className="text-sm text-slate-500">
              © 2026 Earth Guardian AI. Built with Next.js for Google GDG Hackathon.
            </p>
            <p className="text-sm text-slate-500">
              Powered by Google Cloud AI · Material Design
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
