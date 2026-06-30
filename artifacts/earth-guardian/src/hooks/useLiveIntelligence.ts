import { useQuery } from "@tanstack/react-query";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export interface LiveStats {
  fetchedAt: string;
  stats: {
    totalActiveEvents: number;
    earthquakesToday: number;
    significantEarthquakes: number;
    floods: number;
    cyclones: number;
    wildfires: number;
    volcanoes: number;
    storms: number;
    droughts: number;
    countriesAffected: number;
    redAlerts: number;
    orangeAlerts: number;
    noaaAlerts: number;
    highRiskRegions: number;
  };
  sources: { usgs: boolean; gdacs: boolean; eonet: boolean; noaa: boolean };
}

export interface LiveMapEvent {
  id: string;
  type: string;
  name: string;
  lat: number;
  lng: number;
  severity: "critical" | "high" | "moderate" | "low";
  time: string;
  source: string;
  detail: string;
  country: string;
  url: string;
}

export interface LiveEvents {
  fetchedAt: string;
  events: LiveMapEvent[];
  total: number;
}

export interface AIInsights {
  highestRiskArea: string;
  mostActiveDisaster: string;
  predictedEscalation: string;
  summary: string;
  preparedness: string;
  riskLevel: "critical" | "high" | "moderate" | "low";
  generatedAt: string;
  fetchedAt: string;
  sources: { usgs: boolean; gdacs: boolean; eonet: boolean; noaa: boolean };
  rawCounts: {
    earthquakes24h: number;
    gdacEvents: number;
    redAlerts: number;
    noaaAlerts: number;
  };
}

export function useLiveStats() {
  return useQuery<LiveStats>({
    queryKey: ["live-stats"],
    queryFn: () => fetchJson<LiveStats>(`${BASE}/api/raksh/live-stats`),
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
  });
}

export function useLiveEvents() {
  return useQuery<LiveEvents>({
    queryKey: ["live-events"],
    queryFn: () => fetchJson<LiveEvents>(`${BASE}/api/raksh/live-events`),
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 2,
  });
}

export function useAIInsights() {
  return useQuery<AIInsights>({
    queryKey: ["ai-insights"],
    queryFn: () => fetchJson<AIInsights>(`${BASE}/api/raksh/ai-insights`),
    refetchInterval: 5 * 60_000,
    staleTime: 4 * 60_000,
    retry: 1,
  });
}

export interface ProviderStatus {
  gemini: boolean;
  openrouter: boolean;
  groq: boolean;
  currentProvider: string;
  healthy: boolean;
}

export function useProviderStatus() {
  return useQuery<ProviderStatus>({
    queryKey: ["provider-status"],
    queryFn: () => fetchJson<ProviderStatus>(`${BASE}/api/raksh/status`),
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 1,
  });
}

export interface IntelligenceFeedEvent {
  id: string;
  type: string;
  name: string;
  lat: number | null;
  lng: number | null;
  severity: "critical" | "high" | "moderate" | "low";
  time: string;
  source: string;
  country: string;
  location: string;
  detail: string;
  url: string;
  aiSummary: string;
}

export interface IntelligenceFeed {
  fetchedAt: string;
  events: IntelligenceFeedEvent[];
  total: number;
  sources: { usgs: boolean; gdacs: boolean; eonet: boolean; noaa: boolean; internal: boolean };
}

export function useIntelligenceFeed() {
  return useQuery<IntelligenceFeed>({
    queryKey: ["intelligence-feed"],
    queryFn: () => fetchJson<IntelligenceFeed>(`${BASE}/api/raksh/intelligence-feed`),
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 2,
  });
}
