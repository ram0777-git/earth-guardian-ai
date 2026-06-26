import { GlassCard } from "@/components/ui/GlassCard";
import { weatherData } from "@/data/sampleData";
import { Cloud, Droplets, Sun, Wind } from "lucide-react";

export function WeatherCard() {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Current Weather</p>
          <h3 className="text-lg font-semibold text-slate-900">{weatherData.location}</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-cyan/10">
          <Cloud className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-5xl font-bold text-slate-900">{weatherData.temperature}°</span>
        <span className="mb-2 text-lg text-slate-500">F</span>
        <span className="mb-2 ml-2 text-sm text-slate-600">{weatherData.condition}</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 p-3">
          <Droplets className="h-4 w-4 text-cyan" />
          <div>
            <p className="text-xs text-slate-500">Humidity</p>
            <p className="text-sm font-semibold">{weatherData.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 p-3">
          <Wind className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-slate-500">Wind</p>
            <p className="text-sm font-semibold">{weatherData.windSpeed} mph</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 p-3">
          <Sun className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-xs text-slate-500">UV Index</p>
            <p className="text-sm font-semibold">{weatherData.uvIndex}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-2">
        {weatherData.forecast.map((day) => (
          <div key={day.day} className="flex-1 rounded-xl bg-slate-50/80 p-2 text-center">
            <p className="text-xs font-medium text-slate-500">{day.day}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{day.high}°</p>
            <p className="text-xs text-slate-400">{day.low}°</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
