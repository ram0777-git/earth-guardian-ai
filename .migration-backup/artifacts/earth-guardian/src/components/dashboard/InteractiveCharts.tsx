import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { chartData } from "@/data/sampleData";
import { responseTimeData, disasterTypeBreakdown } from "@/data/dashboardData";
import { BarChart2, TrendingUp, Clock } from "lucide-react";

const TABS = [
  { id: "trends",   label: "12-Month Trends", icon: TrendingUp },
  { id: "types",    label: "Disaster Types",   icon: BarChart2  },
  { id: "response", label: "Response Times",   icon: Clock      },
];

const TT = {
  contentStyle: {
    backgroundColor: "rgba(6,18,31,0.96)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    color: "#e2e8f0",
    fontSize: 12,
    padding: "10px 14px",
  },
  labelStyle: { color: "#94a3b8", fontWeight: 600, marginBottom: 4 },
};

const AXIS = { fill: "rgba(255,255,255,0.45)", fontSize: 11 };
const GRID = { stroke: "rgba(255,255,255,0.05)", strokeDasharray: "4 4" };

function ChartSkeleton() {
  return (
    <div className="flex h-[260px] items-end gap-2 px-4 pb-4 animate-pulse">
      {[45,65,50,80,60,90,70,85,55,75,65,80].map((h, i) => (
        <div key={i} className="flex-1 rounded-t bg-white/8" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function InteractiveCharts({ loading }: { loading: boolean }) {
  const [activeTab, setActiveTab] = useState("trends");

  return (
    <div
      className="h-full rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      <div className="flex flex-col gap-3 border-b border-white/6 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-white">Analytics</h3>
          <p className="mt-0.5 text-xs text-slate-400">Global disaster intelligence</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/8 bg-white/4 p-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  active ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChartSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "trends" && (
                <>
                  <div className="mb-3 flex flex-wrap gap-4 text-xs">
                    {[{c:"#22d3ee",l:"Floods"},{c:"#818cf8",l:"Earthquakes"},{c:"#fb923c",l:"Wildfires"}].map(s => (
                      <div key={s.l} className="flex items-center gap-1.5 text-slate-400">
                        <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: s.c }} />
                        {s.l}
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                      <defs>
                        <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#fb923c" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...GRID} vertical={false} />
                      <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={28} />
                      <Tooltip {...TT} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
                      <Area type="monotone" dataKey="floods"      name="Floods"      stroke="#22d3ee" strokeWidth={2} fill="url(#gF)" dot={false} activeDot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="earthquakes" name="Earthquakes" stroke="#818cf8" strokeWidth={2} fill="url(#gQ)" dot={false} activeDot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="wildfires"   name="Wildfires"   stroke="#fb923c" strokeWidth={2} fill="url(#gW)" dot={false} activeDot={{ r: 4, fill: "#fb923c", strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}

              {activeTab === "types" && (
                <>
                  <p className="mb-3 text-xs text-slate-400">Active events by type — current month</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={disasterTypeBreakdown} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid {...GRID} horizontal vertical={false} />
                      <XAxis dataKey="type" tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={28} />
                      <Tooltip {...TT} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      <Bar dataKey="count" name="Events" radius={[5, 5, 0, 0]}>
                        {disasterTypeBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {activeTab === "response" && (
                <>
                  <p className="mb-3 text-xs text-slate-400">Avg AI response time (min) — improving each month</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={responseTimeData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                      <defs>
                        <linearGradient id="gRT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...GRID} vertical={false} />
                      <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={28} />
                      <Tooltip {...TT} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
                      <Line type="monotone" dataKey="avg" name="Minutes" stroke="#34d399" strokeWidth={2.5} dot={{ fill: "#34d399", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: "#34d399", strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
