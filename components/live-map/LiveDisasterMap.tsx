"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { mapMarkers } from "@/data/sampleData";
import { MapPin, Layers, Filter } from "lucide-react";
import { useState } from "react";

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  moderate: "bg-amber-500",
  low: "bg-emerald-500",
};

export function LiveDisasterMap() {
  const [selectedMarker, setSelectedMarker] = useState(mapMarkers[0]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2 relative min-h-[480px] overflow-hidden p-0">
        {/* Stylized world map background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-cyan/5 to-primary/10">
          <svg viewBox="0 0 800 400" className="h-full w-full opacity-30" aria-hidden="true">
            <ellipse cx="200" cy="180" rx="120" ry="80" fill="#1a73e8" opacity="0.15" />
            <ellipse cx="400" cy="160" rx="80" ry="100" fill="#1a73e8" opacity="0.12" />
            <ellipse cx="550" cy="200" rx="100" ry="70" fill="#1a73e8" opacity="0.15" />
            <ellipse cx="650" cy="280" rx="60" ry="40" fill="#1a73e8" opacity="0.1" />
            <ellipse cx="300" cy="300" rx="50" ry="35" fill="#1a73e8" opacity="0.1" />
          </svg>
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(26,115,232,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(26,115,232,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Map markers */}
        {mapMarkers.map((marker, i) => {
          const x = ((marker.lng + 180) / 360) * 100;
          const y = ((90 - marker.lat) / 180) * 100;
          return (
            <button
              key={marker.id}
              type="button"
              className="absolute z-10 transition-transform hover:scale-125"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              onClick={() => setSelectedMarker(marker)}
              aria-label={marker.name}
            >
              <span className="relative flex h-4 w-4">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${severityColors[marker.severity]}`}
                />
                <span
                  className={`relative inline-flex h-4 w-4 rounded-full border-2 border-white shadow-lg ${severityColors[marker.severity]}`}
                />
              </span>
            </button>
          );
        })}

        {/* Map controls */}
        <div className="absolute left-4 top-4 flex gap-2">
          <div className="glass rounded-xl px-3 py-2 text-xs font-medium text-slate-600 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Satellite View
          </div>
          <div className="glass rounded-xl px-3 py-2 text-xs font-medium text-slate-600 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            All Types
          </div>
        </div>

        <div className="absolute bottom-4 left-4 glass rounded-xl px-4 py-2 text-xs text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
          Live data · Updated 5 min ago
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard>
          <h3 className="text-lg font-semibold text-slate-900">Active Incidents</h3>
          <p className="text-sm text-slate-500">{mapMarkers.length} events monitored globally</p>

          <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto">
            {mapMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                onClick={() => setSelectedMarker(marker)}
                className={`w-full rounded-xl p-3 text-left transition-all ${
                  selectedMarker.id === marker.id
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-white/50 border border-transparent hover:bg-white/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{marker.name}</span>
                  <Badge variant={marker.severity}>{marker.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 capitalize">{marker.type}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        {selectedMarker && (
          <GlassCard variant="strong">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-slate-900">{selectedMarker.name}</h4>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium capitalize">{selectedMarker.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Severity</span>
                <Badge variant={selectedMarker.severity}>{selectedMarker.severity}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coordinates</span>
                <span className="font-medium">{selectedMarker.lat.toFixed(2)}°, {selectedMarker.lng.toFixed(2)}°</span>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
