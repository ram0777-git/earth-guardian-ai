/**
 * Live Intelligence Service
 * Fetches real-time disaster, earthquake, weather, and alert data from
 * free public APIs (no API keys required). All responses cached for 5 minutes.
 *
 * Sources:
 *  - USGS Earthquake Feed     (earthquake.usgs.gov — US Geological Survey)
 *  - GDACS Global Disasters   (gdacs.org — UN-backed global alert system)
 *  - NASA EONET Events        (eonet.gsfc.nasa.gov — NASA natural events)
 *  - NOAA Weather Alerts      (api.weather.gov — US National Weather Service)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiveEarthquake {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  timeMs: number;
  url: string;
  tsunami: number;
  sig: number;
  lat: number;
  lng: number;
  depth: number;
}

export interface GDACSEvent {
  id: string;
  type: string;           // EQ, TC, FL, VO, WF, DR
  name: string;
  country: string;
  alertLevel: string;     // Red, Orange, Green
  alertScore: number;
  severity: string;
  severityValue: number;
  fromDate: string;
  lat: number;
  lng: number;
  affectedCountries: string[];
  url: string;
}

export interface LiveDisasterEvent {
  id: string;
  title: string;
  type: string;
  latestDate: string;
  lat: number | null;
  lng: number | null;
}

export interface LiveWeatherAlert {
  id: string;
  event: string;
  severity: string;
  urgency: string;
  headline: string;
  description: string;
  area: string;
  expires: string;
}

export interface LiveIntelligenceResult {
  fetchedAt: string;
  earthquakes: {
    ok: boolean;
    error?: string;
    significant_week: LiveEarthquake[];
    all_24h: LiveEarthquake[];
  };
  gdacs: {
    ok: boolean;
    error?: string;
    items: GDACSEvent[];
  };
  eonet: {
    ok: boolean;
    error?: string;
    items: LiveDisasterEvent[];
  };
  weatherAlerts: {
    ok: boolean;
    error?: string;
    items: LiveWeatherAlert[];
  };
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function toCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 12_000;

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EarthGuardianAI/1.0 (contact@earthguardian.ai; disaster-monitoring)",
        "Accept": "application/json",
        ...(headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── USGS Earthquakes ──────────────────────────────────────────────────────────

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    tsunami: number;
    sig: number;
  };
  geometry: { coordinates: [number, number, number] };
}
interface USGSFeed { features: USGSFeature[] }

function parseUSGS(features: USGSFeature[]): LiveEarthquake[] {
  return features
    .filter(f => f?.properties?.place && f?.geometry?.coordinates)
    .map(f => ({
      id: f.id,
      magnitude: f.properties.mag ?? 0,
      place: f.properties.place,
      time: new Date(f.properties.time).toISOString(),
      timeMs: f.properties.time,
      url: f.properties.url ?? "",
      tsunami: f.properties.tsunami ?? 0,
      sig: f.properties.sig ?? 0,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
    }))
    .sort((a, b) => b.timeMs - a.timeMs);
}

async function fetchEarthquakes(): Promise<LiveIntelligenceResult["earthquakes"]> {
  const CACHE_KEY = "usgs_earthquakes";
  const cached = fromCache<LiveIntelligenceResult["earthquakes"]>(CACHE_KEY);
  if (cached) return cached;

  try {
    const [weekData, dayData] = await Promise.all([
      fetchJson<USGSFeed>("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson"),
      fetchJson<USGSFeed>("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"),
    ]);
    const result: LiveIntelligenceResult["earthquakes"] = {
      ok: true,
      significant_week: parseUSGS(weekData.features ?? []),
      all_24h: parseUSGS(dayData.features ?? []).slice(0, 30),
    };
    toCache(CACHE_KEY, result);
    return result;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "USGS fetch failed",
      significant_week: [],
      all_24h: [],
    };
  }
}

// ── GDACS Global Disaster Events ──────────────────────────────────────────────

interface GDACSFeature {
  properties: {
    eventtype: string;
    eventid: number;
    episodeid: number;
    name: string;
    country: string;
    alertlevel: string;
    alertscore: number;
    fromdate: string;
    todate: string;
    affectedcountries?: Array<{ countryname: string }>;
    severitydata?: { severity: number; severitytext: string };
    url?: { report?: string; details?: string };
  };
  geometry: { coordinates: [number, number] };
}
interface GDACSFeed { features: GDACSFeature[] }

const GDACS_TYPE_NAMES: Record<string, string> = {
  EQ: "Earthquake", TC: "Tropical Cyclone", FL: "Flood",
  VO: "Volcano", WF: "Wildfire", DR: "Drought", TS: "Tsunami",
};

function parseGDACS(features: GDACSFeature[]): GDACSEvent[] {
  return features
    .filter(f => f?.properties)
    .map(f => {
      const p = f.properties;
      const coords = f.geometry?.coordinates ?? [0, 0];
      return {
        id: `gdacs-${p.eventtype}-${p.eventid}-${p.episodeid}`,
        type: GDACS_TYPE_NAMES[p.eventtype] ?? p.eventtype,
        name: p.name ?? `${p.eventtype} in ${p.country}`,
        country: p.country ?? "Unknown",
        alertLevel: p.alertlevel ?? "Unknown",
        alertScore: p.alertscore ?? 0,
        severity: p.severitydata?.severitytext ?? "",
        severityValue: p.severitydata?.severity ?? 0,
        fromDate: p.fromdate ?? "",
        lat: coords[1],
        lng: coords[0],
        affectedCountries: (p.affectedcountries ?? []).map(c => c.countryname),
        url: p.url?.report ?? `https://www.gdacs.org/report.aspx?eventid=${p.eventid}&eventtype=${p.eventtype}`,
      };
    })
    .sort((a, b) => b.alertScore - a.alertScore);
}

const TODAY = new Date();
const WEEK_AGO = new Date(TODAY.getTime() - 7 * 24 * 60 * 60 * 1000);

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function fetchGDACSEvents(): Promise<LiveIntelligenceResult["gdacs"]> {
  const CACHE_KEY = "gdacs_events";
  const cached = fromCache<LiveIntelligenceResult["gdacs"]>(CACHE_KEY);
  if (cached) return cached;

  const fromDate = fmtDate(WEEK_AGO);
  const toDate = fmtDate(TODAY);
  const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;WF;DR&alertlevel=orange;red&fromdate=${fromDate}&todate=${toDate}&pagesize=50&andor=and`;

  try {
    const data = await fetchJson<GDACSFeed>(url);
    const result: LiveIntelligenceResult["gdacs"] = {
      ok: true,
      items: parseGDACS(data.features ?? []),
    };
    toCache(CACHE_KEY, result);
    return result;
  } catch (err) {
    // Fallback: try without severity filter
    try {
      const fallbackUrl = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;WF&fromdate=${fromDate}&todate=${toDate}&pagesize=30&andor=and`;
      const data = await fetchJson<GDACSFeed>(fallbackUrl);
      const result: LiveIntelligenceResult["gdacs"] = {
        ok: true,
        items: parseGDACS(data.features ?? []),
      };
      toCache(CACHE_KEY, result);
      return result;
    } catch {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "GDACS fetch failed",
        items: [],
      };
    }
  }
}

// ── NASA EONET Events ─────────────────────────────────────────────────────────

interface EONETGeometry { date: string; type: string; coordinates: [number, number] }
interface EONETEvent {
  id: string;
  title: string;
  link: string;
  closed: string | null;
  categories: Array<{ id: string; title: string }>;
  geometries: EONETGeometry[];
}
interface EONETFeed { events: EONETEvent[] }

function parseEONET(events: EONETEvent[]): LiveDisasterEvent[] {
  return events.map(e => {
    const geometries = Array.isArray(e.geometries) ? e.geometries : [];
    const latest = geometries.length > 0 ? geometries[geometries.length - 1] : null;
    const coords = latest?.coordinates;
    return {
      id: e.id,
      title: e.title,
      type: e.categories?.[0]?.title ?? "Unknown",
      latestDate: latest?.date ?? "",
      lat: Array.isArray(coords) && coords.length >= 2 ? coords[1] : null,
      lng: Array.isArray(coords) && coords.length >= 2 ? coords[0] : null,
    };
  });
}

async function fetchEONETEvents(): Promise<LiveIntelligenceResult["eonet"]> {
  const CACHE_KEY = "eonet_events";
  const cached = fromCache<LiveIntelligenceResult["eonet"]>(CACHE_KEY);
  if (cached) return cached;

  try {
    const data = await fetchJson<EONETFeed>(
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50&days=14",
    );
    if (!data || !Array.isArray(data.events)) throw new Error("Unexpected EONET response shape");
    const result: LiveIntelligenceResult["eonet"] = {
      ok: true,
      items: parseEONET(data.events),
    };
    toCache(CACHE_KEY, result);
    return result;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "EONET fetch failed",
      items: [],
    };
  }
}

// ── NOAA Weather Alerts (US) ──────────────────────────────────────────────────

interface NOAAFeature {
  id: string;
  properties: {
    event: string;
    severity: string;
    certainty: string;
    urgency: string;
    headline: string;
    description: string;
    areaDesc: string;
    expires: string;
  };
}
interface NOAAFeed { features: NOAAFeature[] }

function parseNOAA(features: NOAAFeature[]): LiveWeatherAlert[] {
  return features
    .filter(f => f?.properties?.event)
    .map(f => ({
      id: f.id,
      event: f.properties.event,
      severity: f.properties.severity ?? "Unknown",
      urgency: f.properties.urgency ?? "Unknown",
      headline: f.properties.headline ?? "",
      description: (f.properties.description ?? "").slice(0, 400),
      area: f.properties.areaDesc ?? "",
      expires: f.properties.expires ?? "",
    }));
}

async function fetchNOAAAlerts(): Promise<LiveIntelligenceResult["weatherAlerts"]> {
  const CACHE_KEY = "noaa_alerts";
  const cached = fromCache<LiveIntelligenceResult["weatherAlerts"]>(CACHE_KEY);
  if (cached) return cached;

  try {
    const data = await fetchJson<NOAAFeed>(
      "https://api.weather.gov/alerts/active?limit=25",
      { "Accept": "application/geo+json" },
    );
    const result: LiveIntelligenceResult["weatherAlerts"] = {
      ok: true,
      items: parseNOAA(data.features ?? []),
    };
    toCache(CACHE_KEY, result);
    return result;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "NOAA fetch failed",
      items: [],
    };
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchLiveIntelligence(): Promise<LiveIntelligenceResult> {
  const [earthquakes, gdacs, eonet, weatherAlerts] = await Promise.all([
    fetchEarthquakes(),
    fetchGDACSEvents(),
    fetchEONETEvents(),
    fetchNOAAAlerts(),
  ]);
  return { fetchedAt: new Date().toISOString(), earthquakes, gdacs, eonet, weatherAlerts };
}

export async function fetchLiveIntelligenceForIntents(
  intents: Set<string>,
): Promise<LiveIntelligenceResult> {
  const needsEarthquakes = intents.has("earthquake") || intents.has("tsunami") || intents.has("live") || intents.has("brief");
  const needsGDACS = intents.has("cyclone") || intents.has("flood") || intents.has("wildfire") || intents.has("volcano") || intents.has("earthquake") || intents.has("live") || intents.has("brief");
  const needsEONET = intents.has("wildfire") || intents.has("volcano") || intents.has("live") || intents.has("brief");
  const needsAlerts = intents.has("alert") || intents.has("weather") || intents.has("storm") || intents.has("live") || intents.has("brief");

  const [earthquakes, gdacs, eonet, weatherAlerts] = await Promise.all([
    needsEarthquakes ? fetchEarthquakes() : Promise.resolve({ ok: true, significant_week: [], all_24h: [] } as LiveIntelligenceResult["earthquakes"]),
    needsGDACS ? fetchGDACSEvents() : Promise.resolve({ ok: true, items: [] } as LiveIntelligenceResult["gdacs"]),
    needsEONET ? fetchEONETEvents() : Promise.resolve({ ok: true, items: [] } as LiveIntelligenceResult["eonet"]),
    needsAlerts ? fetchNOAAAlerts() : Promise.resolve({ ok: true, items: [] } as LiveIntelligenceResult["weatherAlerts"]),
  ]);
  return { fetchedAt: new Date().toISOString(), earthquakes, gdacs, eonet, weatherAlerts };
}

// ── Context builder for Gemini ────────────────────────────────────────────────

const ALERT_EMOJI: Record<string, string> = {
  Red: "🔴", Orange: "🟠", Green: "🟢",
  Extreme: "🔴", Severe: "🟠", Moderate: "🟡", Minor: "🟢",
};

export function buildLiveIntelligenceContext(
  data: LiveIntelligenceResult,
  locationFilter?: string,
): string {
  const sections: string[] = [];
  const loc = locationFilter?.toLowerCase();

  // ── GDACS Global Disasters ───────────────────────────────────────────────
  if (data.gdacs.ok) {
    let items = data.gdacs.items;
    if (loc) {
      items = items.filter(e =>
        e.name.toLowerCase().includes(loc) ||
        e.country.toLowerCase().includes(loc) ||
        e.affectedCountries.some(c => c.toLowerCase().includes(loc)),
      );
    }

    if (items.length > 0) {
      const byAlert = { Red: items.filter(i => i.alertLevel === "Red"), Orange: items.filter(i => i.alertLevel === "Orange") };
      const lines: string[] = [];

      if (byAlert.Red.length > 0) {
        lines.push("### 🔴 RED ALERT (Severe) Events:");
        byAlert.Red.forEach(e => {
          const dateStr = e.fromDate ? new Date(e.fromDate).toDateString() : "N/A";
          lines.push(`- **${e.name}** (${e.type}) — ${e.severity || "Severity N/A"} | Country: ${e.country} | Date: ${dateStr} | Coords: ${e.lat.toFixed(2)},${e.lng.toFixed(2)}`);
        });
      }

      if (byAlert.Orange.length > 0) {
        lines.push("### 🟠 ORANGE ALERT Events:");
        byAlert.Orange.slice(0, 8).forEach(e => {
          const dateStr = e.fromDate ? new Date(e.fromDate).toDateString() : "N/A";
          lines.push(`- **${e.name}** (${e.type}) — ${e.severity || "Severity N/A"} | ${e.country} | ${dateStr}`);
        });
      }

      sections.push(`## 🌐 REAL-TIME GLOBAL DISASTERS (GDACS — UN Disaster Alert System)\nSource: Global Disaster Alert and Coordination System | Retrieved: ${new Date(data.fetchedAt).toUTCString()}\nTotal high/critical events (past 7 days): ${items.length}\n${lines.join("\n")}`);
    } else if (loc) {
      sections.push(`## 🌐 REAL-TIME GLOBAL DISASTERS (GDACS)\nNo Red/Orange alert events found matching "${locationFilter}" in the past 7 days.`);
    } else if (data.gdacs.items.length === 0) {
      sections.push(`## 🌐 REAL-TIME GLOBAL DISASTERS (GDACS)\nNo high-level global disaster alerts active in the past 7 days per GDACS.`);
    }
  } else {
    sections.push(`## 🌐 GLOBAL DISASTERS (GDACS)\n⚠️ Temporarily unavailable: ${data.gdacs.error}`);
  }

  // ── USGS Earthquakes ──────────────────────────────────────────────────────
  if (data.earthquakes.ok) {
    const sigEqs = data.earthquakes.significant_week;
    const dayEqs = data.earthquakes.all_24h;

    const filteredSig = loc ? sigEqs.filter(e => e.place.toLowerCase().includes(loc)) : sigEqs;
    const filteredDay = loc ? dayEqs.filter(e => e.place.toLowerCase().includes(loc)) : dayEqs.slice(0, 15);

    const lines: string[] = [];

    if (filteredSig.length > 0) {
      lines.push("### Significant Earthquakes (past 7 days):");
      filteredSig.forEach(e => {
        lines.push(`- **M${e.magnitude.toFixed(1)}** — ${e.place} | Depth: ${e.depth.toFixed(0)}km | ${new Date(e.time).toUTCString()}${e.tsunami ? " | ⚠️ TSUNAMI ALERT" : ""}`);
      });
    }

    if (filteredDay.length > 0) {
      lines.push(`### M2.5+ Earthquakes (past 24h) — ${filteredDay.length} events:`);
      filteredDay.slice(0, 12).forEach(e => {
        lines.push(`- M${e.magnitude.toFixed(1)} — ${e.place} | ${new Date(e.time).toUTCString()}`);
      });
    }

    if (lines.length > 0) {
      sections.push(`## 🌍 REAL-TIME EARTHQUAKES (USGS)\nSource: USGS Earthquake Hazards Program | Retrieved: ${new Date(data.fetchedAt).toUTCString()}\n${lines.join("\n")}`);
    } else if (loc) {
      sections.push(`## 🌍 REAL-TIME EARTHQUAKES (USGS)\nNo significant earthquakes found near "${locationFilter}" in the past 7 days per USGS.`);
    }
  } else {
    sections.push(`## 🌍 EARTHQUAKES (USGS)\n⚠️ Temporarily unavailable: ${data.earthquakes.error}`);
  }

  // ── NASA EONET Events ─────────────────────────────────────────────────────
  if (data.eonet.ok && data.eonet.items.length > 0) {
    let items = data.eonet.items;
    if (loc) items = items.filter(e => e.title.toLowerCase().includes(loc));

    const byType: Record<string, LiveDisasterEvent[]> = {};
    items.forEach(e => {
      if (!byType[e.type]) byType[e.type] = [];
      byType[e.type].push(e);
    });

    const lines: string[] = [];
    Object.entries(byType).slice(0, 6).forEach(([type, events]) => {
      lines.push(`### ${type} (${events.length} active):`);
      events.slice(0, 5).forEach(e => {
        const dateStr = e.latestDate ? new Date(e.latestDate).toDateString() : "Date N/A";
        const coords = e.lat !== null ? ` | ${e.lat?.toFixed(2)},${e.lng?.toFixed(2)}` : "";
        lines.push(`- ${e.title}${coords} | Updated: ${dateStr}`);
      });
    });

    if (lines.length > 0) {
      sections.push(`## 🛰️ REAL-TIME NATURAL EVENTS (NASA EONET)\nSource: NASA Earth Observatory | Retrieved: ${new Date(data.fetchedAt).toUTCString()}\nTotal active events: ${items.length}\n${lines.join("\n")}`);
    }
  } else if (!data.eonet.ok) {
    sections.push(`## 🛰️ NATURAL EVENTS (NASA EONET)\n⚠️ Temporarily unavailable: ${data.eonet.error}`);
  }

  // ── NOAA Weather Alerts ───────────────────────────────────────────────────
  if (data.weatherAlerts.ok && data.weatherAlerts.items.length > 0) {
    let alerts = data.weatherAlerts.items;
    if (loc) {
      alerts = alerts.filter(a =>
        a.area.toLowerCase().includes(loc) ||
        a.event.toLowerCase().includes(loc),
      );
    }

    // Sort by severity
    const severityOrder = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
    alerts.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));

    const lines = alerts.slice(0, 12).map(a => {
      const emoji = ALERT_EMOJI[a.severity] ?? "⚠️";
      const exp = a.expires ? new Date(a.expires).toUTCString() : "N/A";
      return `- ${emoji} [${a.severity.toUpperCase()}] **${a.event}** — ${a.area}\n  ${a.headline} | Expires: ${exp}`;
    });

    sections.push(`## ⚡ REAL-TIME US WEATHER ALERTS (NOAA)\nSource: NOAA National Weather Service | Retrieved: ${new Date(data.fetchedAt).toUTCString()}\nActive alerts: ${alerts.length}\n${lines.join("\n")}`);
  } else if (!data.weatherAlerts.ok) {
    sections.push(`## ⚡ US WEATHER ALERTS (NOAA)\n⚠️ Temporarily unavailable: ${data.weatherAlerts.error}`);
  }

  if (sections.length === 0) return "";

  return `\n\n---\n# 🔴 REAL-TIME EXTERNAL INTELLIGENCE\n> Live data from GDACS · USGS · NASA EONET · NOAA · Fetched: ${new Date(data.fetchedAt).toUTCString()}\n> ⚠️ Use this data FIRST for any live/current/recent/today questions. Do NOT fabricate events.\n\n${sections.join("\n\n")}\n---`;
}

// ── Utility functions ─────────────────────────────────────────────────────────

export function getRecentEarthquakes(data: LiveIntelligenceResult, n = 10): LiveEarthquake[] {
  const combined = [...data.earthquakes.significant_week, ...data.earthquakes.all_24h];
  const seen = new Set<string>();
  return combined
    .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
    .sort((a, b) => b.timeMs - a.timeMs)
    .slice(0, n);
}

export function filterByLocation(data: LiveIntelligenceResult, keyword: string) {
  const kw = keyword.toLowerCase();
  return {
    earthquakes: [...data.earthquakes.significant_week, ...data.earthquakes.all_24h].filter(e => e.place.toLowerCase().includes(kw)),
    gdacs: data.gdacs.items.filter(e => e.name.toLowerCase().includes(kw) || e.country.toLowerCase().includes(kw) || e.affectedCountries.some(c => c.toLowerCase().includes(kw))),
    eonet: data.eonet.items.filter(e => e.title.toLowerCase().includes(kw)),
  };
}
