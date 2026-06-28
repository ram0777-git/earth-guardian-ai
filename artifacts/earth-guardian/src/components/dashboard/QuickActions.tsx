import { motion } from "framer-motion";
import { Map, Bell, FileText, Zap, ImageIcon, BarChart2, ArrowRight, FileBarChart } from "lucide-react";
import { Link } from "wouter";

const actions = [
  {
    icon: Map,          label: "Live Map",         description: "Global event map",      href: "/live-map",        color: "#22d3ee",  bg: "rgba(34,211,238,0.10)",  border: "rgba(34,211,238,0.20)"  },
  {
    icon: Zap,          label: "Simulate",         description: "What-if scenarios",     href: "/simulation",      color: "#ef4444",  bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.20)"   },
  {
    icon: FileBarChart, label: "Reports",          description: "Intelligence reports",  href: "/reports",         color: "#60a5fa",  bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.20)"  },
  {
    icon: BarChart2,    label: "Risk Analysis",    description: "AI risk assessment",    href: "/risk-analysis",   color: "#818cf8",  bg: "rgba(129,140,248,0.10)", border: "rgba(129,140,248,0.20)" },
  {
    icon: ImageIcon,    label: "Image Gallery",    description: "AI-generated graphics", href: "/image-gallery",   color: "#a78bfa",  bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.20)" },
  {
    icon: FileText,     label: "Emergency Plan",   description: "Preparedness checklist",href: "/emergency-planner",color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.20)"  },
];

export function QuickActions() {
  return (
    <div
      className="h-full rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-white">Quick Actions</h3>
        <p className="mt-0.5 text-xs text-slate-400">Access key features instantly</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <Link href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex cursor-pointer flex-col gap-2 rounded-xl p-3 transition-all duration-200"
                  style={{
                    backgroundColor: action.bg,
                    border: `1px solid ${action.border}`,
                  }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: action.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">{action.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{action.description}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Raksh AI button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4"
      >
        <Link href="/raksh">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-cyan-400/25 bg-cyan-400/8 px-4 py-3 transition-all hover:bg-cyan-400/14 hover:border-cyan-400/40"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-400/20">
                <Bell className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-cyan-400">Open Raksh AI</p>
                <p className="text-[10px] text-slate-500">Full AI copilot experience</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-cyan-400" />
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
