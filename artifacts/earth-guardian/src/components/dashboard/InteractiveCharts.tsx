

import { GlassCard } from "@/components/ui/GlassCard";
import { chartData } from "@/data/sampleData";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function InteractiveCharts() {
  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-slate-900">
        Disaster Incidents — 12 Month Trend
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Monthly incident counts by disaster type across monitored regions
      </p>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEarthquakes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFloods" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00bcd4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWildfires" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 115, 232, 0.1)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                background: "rgba(255, 255, 255, 0.9)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.8)",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="earthquakes"
              stroke="#1a73e8"
              fill="url(#colorEarthquakes)"
              strokeWidth={2}
              name="Earthquakes"
            />
            <Area
              type="monotone"
              dataKey="floods"
              stroke="#00bcd4"
              fill="url(#colorFloods)"
              strokeWidth={2}
              name="Floods"
            />
            <Area
              type="monotone"
              dataKey="wildfires"
              stroke="#f97316"
              fill="url(#colorWildfires)"
              strokeWidth={2}
              name="Wildfires"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
