import { motion } from "framer-motion";
import { useGetWeather } from "@workspace/api-client-react";
import { Cloud, Droplets, Sun, Wind, MapPin, Thermometer } from "lucide-react";

const conditionIcon: Record<string, string> = {
  "Sunny": "☀️", "Clear": "🌙", "Partly Cloudy": "⛅", "Cloudy": "☁️",
  "Rain": "🌧️", "Overcast": "🌥️", "Stormy": "⛈️",
};

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/[0.03] p-5">
      <div className="h-4 w-36 rounded bg-white/10 mb-4" />
      <div className="h-16 w-32 rounded bg-white/8 mb-4" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/8" />)}
      </div>
      <div className="flex gap-2">
        {[1,2,3,4,5].map(i => <div key={i} className="flex-1 h-16 rounded-xl bg-white/8" />)}
      </div>
    </div>
  );
}

export function WeatherCard({ loading }: { loading: boolean }) {
  const { data: w, isLoading } = useGetWeather();

  if (loading || isLoading) return <Skeleton />;

  if (!w) return <Skeleton />;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/8 blur-3xl" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Current Weather</p>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              {w.location}
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">
            <Cloud className="h-5 w-5 text-blue-300" />
          </div>
        </div>

        {/* Temperature */}
        <div className="mt-5 flex items-end gap-3">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl font-bold text-white"
          >
            {w.temperature}°
          </motion.span>
          <div className="mb-1.5">
            <div className="text-base text-slate-400">F</div>
            <div className="text-xs text-slate-400">{w.condition}</div>
          </div>
          <span className="mb-1.5 ml-auto text-4xl">{conditionIcon[w.condition] ?? "🌤️"}</span>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { icon: Droplets,    label: "Humidity",  val: `${w.humidity}%`,      color: "#22d3ee" },
            { icon: Wind,        label: "Wind",      val: `${w.windSpeed} mph`,  color: "#818cf8" },
            { icon: Sun,         label: "UV Index",  val: String(w.uvIndex),     color: "#fb923c" },
          ].map(({ icon: Icon, label, val, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl border border-white/6 bg-white/4 p-2.5 text-center"
            >
              <Icon className="h-4 w-4" style={{ color }} />
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-xs font-semibold text-white">{val}</div>
            </div>
          ))}
        </div>

        {/* Forecast */}
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">5-Day Forecast</p>
          <div className="flex gap-1.5">
            {w.forecast.map((day, i) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-white/6 bg-white/4 py-2"
              >
                <span className="text-[10px] font-medium text-slate-400">{day.day}</span>
                <span className="text-base">{conditionIcon[day.condition] ?? "🌤️"}</span>
                <span className="text-xs font-bold text-white">{day.high}°</span>
                <span className="text-[10px] text-slate-500">{day.low}°</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
