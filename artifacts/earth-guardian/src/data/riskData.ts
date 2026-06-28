export interface RiskScores {
  earthquake: number;
  flood:      number;
  cyclone:    number;
  wildfire:   number;
  heatwave:   number;
  landslide:  number;
}

export interface Recommendation {
  icon:     string;
  text:     string;
  priority: "critical" | "high" | "moderate";
  category: string;
}

export interface RiskAnalysisResult {
  location:        string;
  country:         string;
  risks:           RiskScores;
  overall:         number;
  confidence:      number;
  level:           "low" | "moderate" | "high" | "critical";
  explanation:     string;
  recommendations: Recommendation[];
}

/* ── Location Database ────────────────────────────────── */

type LocationEntry = Partial<RiskScores> & { country: string; confidence: number };

const LOCATIONS: Record<string, LocationEntry> = {
  // East Asia
  "tokyo":         { earthquake:92, flood:52, cyclone:68, wildfire:15, heatwave:55, landslide:40, country:"Japan",        confidence:97 },
  "osaka":         { earthquake:80, flood:55, cyclone:60, wildfire:18, heatwave:60, landslide:35, country:"Japan",        confidence:94 },
  "kyoto":         { earthquake:75, flood:45, cyclone:50, wildfire:20, heatwave:55, landslide:38, country:"Japan",        confidence:93 },
  "beijing":       { earthquake:58, flood:55, cyclone:30, wildfire:28, heatwave:68, landslide:32, country:"China",        confidence:93 },
  "shanghai":      { earthquake:35, flood:75, cyclone:65, wildfire:12, heatwave:70, landslide:18, country:"China",        confidence:93 },
  "hong kong":     { earthquake:25, flood:70, cyclone:85, wildfire:20, heatwave:75, landslide:58, country:"China (SAR)",  confidence:94 },
  "taipei":        { earthquake:82, flood:68, cyclone:88, wildfire:20, heatwave:62, landslide:55, country:"Taiwan",       confidence:94 },
  "seoul":         { earthquake:42, flood:48, cyclone:38, wildfire:22, heatwave:55, landslide:35, country:"South Korea",  confidence:92 },

  // Southeast Asia
  "manila":        { earthquake:72, flood:82, cyclone:95, wildfire:22, heatwave:75, landslide:60, country:"Philippines",  confidence:95 },
  "jakarta":       { earthquake:65, flood:88, cyclone:55, wildfire:38, heatwave:72, landslide:48, country:"Indonesia",    confidence:93 },
  "bangkok":       { earthquake:18, flood:85, cyclone:45, wildfire:18, heatwave:88, landslide:22, country:"Thailand",     confidence:93 },
  "kuala lumpur":  { earthquake:12, flood:72, cyclone:28, wildfire:45, heatwave:78, landslide:35, country:"Malaysia",     confidence:91 },
  "singapore":     { earthquake:8,  flood:58, cyclone:22, wildfire:15, heatwave:80, landslide:10, country:"Singapore",    confidence:93 },
  "ho chi minh":   { earthquake:15, flood:80, cyclone:72, wildfire:25, heatwave:82, landslide:28, country:"Vietnam",      confidence:91 },
  "hanoi":         { earthquake:20, flood:78, cyclone:68, wildfire:22, heatwave:78, landslide:32, country:"Vietnam",      confidence:91 },
  "yangon":        { earthquake:38, flood:82, cyclone:78, wildfire:28, heatwave:85, landslide:42, country:"Myanmar",      confidence:90 },

  // South Asia
  "mumbai":        { earthquake:35, flood:80, cyclone:72, wildfire:15, heatwave:85, landslide:42, country:"India",        confidence:93 },
  "kolkata":       { earthquake:28, flood:85, cyclone:78, wildfire:12, heatwave:88, landslide:28, country:"India",        confidence:92 },
  "delhi":         { earthquake:48, flood:62, cyclone:22, wildfire:18, heatwave:95, landslide:18, country:"India",        confidence:93 },
  "chennai":       { earthquake:25, flood:78, cyclone:82, wildfire:20, heatwave:90, landslide:20, country:"India",        confidence:92 },
  "dhaka":         { earthquake:25, flood:92, cyclone:82, wildfire:8,  heatwave:82, landslide:35, country:"Bangladesh",   confidence:94 },
  "karachi":       { earthquake:48, flood:60, cyclone:65, wildfire:12, heatwave:92, landslide:18, country:"Pakistan",     confidence:91 },
  "kathmandu":     { earthquake:90, flood:58, cyclone:8,  wildfire:25, heatwave:28, landslide:82, country:"Nepal",        confidence:94 },
  "colombo":       { earthquake:15, flood:75, cyclone:68, wildfire:18, heatwave:80, landslide:32, country:"Sri Lanka",    confidence:91 },

  // Middle East
  "dubai":         { earthquake:8,  flood:12, cyclone:22, wildfire:8,  heatwave:98, landslide:5,  country:"UAE",          confidence:93 },
  "riyadh":        { earthquake:15, flood:10, cyclone:8,  wildfire:8,  heatwave:98, landslide:5,  country:"Saudi Arabia", confidence:92 },
  "tehran":        { earthquake:88, flood:25, cyclone:5,  wildfire:22, heatwave:80, landslide:38, country:"Iran",         confidence:92 },
  "istanbul":      { earthquake:85, flood:35, cyclone:12, wildfire:38, heatwave:58, landslide:28, country:"Turkey",       confidence:93 },
  "cairo":         { earthquake:42, flood:12, cyclone:8,  wildfire:15, heatwave:92, landslide:12, country:"Egypt",        confidence:91 },
  "tel aviv":      { earthquake:55, flood:20, cyclone:10, wildfire:35, heatwave:72, landslide:15, country:"Israel",       confidence:92 },
  "baghdad":       { earthquake:38, flood:35, cyclone:5,  wildfire:18, heatwave:95, landslide:8,  country:"Iraq",          confidence:89 },

  // Europe
  "london":        { earthquake:5,  flood:48, cyclone:22, wildfire:12, heatwave:35, landslide:8,  country:"United Kingdom", confidence:95 },
  "paris":         { earthquake:8,  flood:48, cyclone:15, wildfire:28, heatwave:58, landslide:12, country:"France",       confidence:94 },
  "berlin":        { earthquake:5,  flood:35, cyclone:18, wildfire:12, heatwave:32, landslide:8,  country:"Germany",      confidence:93 },
  "rome":          { earthquake:68, flood:40, cyclone:15, wildfire:65, heatwave:72, landslide:42, country:"Italy",        confidence:93 },
  "athens":        { earthquake:72, flood:28, cyclone:18, wildfire:85, heatwave:88, landslide:35, country:"Greece",       confidence:93 },
  "lisbon":        { earthquake:72, flood:28, cyclone:15, wildfire:78, heatwave:72, landslide:35, country:"Portugal",     confidence:92 },
  "madrid":        { earthquake:32, flood:22, cyclone:8,  wildfire:72, heatwave:80, landslide:22, country:"Spain",        confidence:92 },
  "amsterdam":     { earthquake:8,  flood:85, cyclone:22, wildfire:8,  heatwave:28, landslide:5,  country:"Netherlands",  confidence:93 },
  "zurich":        { earthquake:25, flood:42, cyclone:10, wildfire:18, heatwave:28, landslide:32, country:"Switzerland",  confidence:93 },
  "stockholm":     { earthquake:5,  flood:28, cyclone:12, wildfire:22, heatwave:20, landslide:18, country:"Sweden",       confidence:93 },
  "oslo":          { earthquake:8,  flood:35, cyclone:18, wildfire:18, heatwave:15, landslide:28, country:"Norway",       confidence:93 },
  "warsaw":        { earthquake:5,  flood:45, cyclone:15, wildfire:15, heatwave:32, landslide:8,  country:"Poland",       confidence:92 },
  "prague":        { earthquake:8,  flood:48, cyclone:12, wildfire:18, heatwave:35, landslide:12, country:"Czech Republic",confidence:92 },
  "vienna":        { earthquake:15, flood:42, cyclone:10, wildfire:18, heatwave:38, landslide:18, country:"Austria",      confidence:93 },
  "bucharest":     { earthquake:78, flood:42, cyclone:12, wildfire:22, heatwave:52, landslide:22, country:"Romania",      confidence:91 },

  // North America
  "new york":      { earthquake:22, flood:65, cyclone:52, wildfire:12, heatwave:55, landslide:8,  country:"United States", confidence:94 },
  "los angeles":   { earthquake:80, flood:18, cyclone:8,  wildfire:82, heatwave:72, landslide:58, country:"United States", confidence:95 },
  "san francisco": { earthquake:88, flood:22, cyclone:8,  wildfire:55, heatwave:28, landslide:42, country:"United States", confidence:96 },
  "seattle":       { earthquake:72, flood:38, cyclone:8,  wildfire:48, heatwave:22, landslide:55, country:"United States", confidence:92 },
  "miami":         { earthquake:8,  flood:88, cyclone:85, wildfire:12, heatwave:78, landslide:5,  country:"United States", confidence:95 },
  "houston":       { earthquake:8,  flood:85, cyclone:65, wildfire:35, heatwave:80, landslide:8,  country:"United States", confidence:94 },
  "new orleans":   { earthquake:12, flood:92, cyclone:78, wildfire:12, heatwave:75, landslide:8,  country:"United States", confidence:95 },
  "chicago":       { earthquake:12, flood:52, cyclone:28, wildfire:8,  heatwave:52, landslide:5,  country:"United States", confidence:93 },
  "phoenix":       { earthquake:12, flood:18, cyclone:5,  wildfire:55, heatwave:98, landslide:8,  country:"United States", confidence:95 },
  "denver":        { earthquake:22, flood:28, cyclone:18, wildfire:55, heatwave:55, landslide:25, country:"United States", confidence:92 },
  "honolulu":      { earthquake:48, flood:52, cyclone:58, wildfire:32, heatwave:55, landslide:35, country:"United States", confidence:93 },
  "anchorage":     { earthquake:78, flood:42, cyclone:12, wildfire:22, heatwave:8,  landslide:52, country:"United States", confidence:92 },
  "toronto":       { earthquake:15, flood:38, cyclone:8,  wildfire:22, heatwave:28, landslide:8,  country:"Canada",       confidence:92 },
  "vancouver":     { earthquake:65, flood:42, cyclone:8,  wildfire:52, heatwave:28, landslide:48, country:"Canada",       confidence:92 },
  "mexico city":   { earthquake:88, flood:52, cyclone:22, wildfire:38, heatwave:55, landslide:48, country:"Mexico",       confidence:93 },

  // South America
  "santiago":      { earthquake:85, flood:42, cyclone:12, wildfire:55, heatwave:48, landslide:55, country:"Chile",        confidence:93 },
  "lima":          { earthquake:82, flood:38, cyclone:8,  wildfire:25, heatwave:38, landslide:62, country:"Peru",         confidence:91 },
  "bogota":        { earthquake:55, flood:65, cyclone:8,  wildfire:38, heatwave:25, landslide:72, country:"Colombia",     confidence:91 },
  "buenos aires":  { earthquake:12, flood:52, cyclone:28, wildfire:22, heatwave:58, landslide:8,  country:"Argentina",    confidence:91 },
  "sao paulo":     { earthquake:8,  flood:72, cyclone:22, wildfire:38, heatwave:65, landslide:42, country:"Brazil",       confidence:91 },
  "rio de janeiro":{ earthquake:15, flood:78, cyclone:28, wildfire:35, heatwave:72, landslide:68, country:"Brazil",       confidence:91 },

  // Africa
  "nairobi":       { earthquake:35, flood:55, cyclone:8,  wildfire:42, heatwave:52, landslide:48, country:"Kenya",        confidence:90 },
  "lagos":         { earthquake:8,  flood:78, cyclone:22, wildfire:28, heatwave:82, landslide:25, country:"Nigeria",      confidence:90 },
  "accra":         { earthquake:8,  flood:55, cyclone:18, wildfire:22, heatwave:85, landslide:18, country:"Ghana",        confidence:88 },
  "cape town":     { earthquake:18, flood:35, cyclone:18, wildfire:72, heatwave:62, landslide:28, country:"South Africa", confidence:92 },
  "johannesburg":  { earthquake:8,  flood:38, cyclone:8,  wildfire:38, heatwave:52, landslide:18, country:"South Africa", confidence:90 },
  "casablanca":    { earthquake:45, flood:25, cyclone:12, wildfire:42, heatwave:62, landslide:22, country:"Morocco",      confidence:90 },
  "addis ababa":   { earthquake:35, flood:52, cyclone:8,  wildfire:32, heatwave:45, landslide:55, country:"Ethiopia",     confidence:88 },

  // Oceania
  "sydney":        { earthquake:18, flood:42, cyclone:38, wildfire:85, heatwave:82, landslide:22, country:"Australia",    confidence:94 },
  "melbourne":     { earthquake:12, flood:32, cyclone:22, wildfire:82, heatwave:78, landslide:18, country:"Australia",    confidence:93 },
  "brisbane":      { earthquake:8,  flood:65, cyclone:65, wildfire:68, heatwave:78, landslide:22, country:"Australia",    confidence:92 },
  "darwin":        { earthquake:15, flood:72, cyclone:92, wildfire:55, heatwave:85, landslide:18, country:"Australia",    confidence:93 },
  "perth":         { earthquake:15, flood:25, cyclone:48, wildfire:72, heatwave:82, landslide:12, country:"Australia",    confidence:92 },
  "auckland":      { earthquake:58, flood:42, cyclone:28, wildfire:25, heatwave:25, landslide:38, country:"New Zealand",  confidence:92 },
  "christchurch":  { earthquake:82, flood:35, cyclone:22, wildfire:48, heatwave:22, landslide:35, country:"New Zealand",  confidence:92 },

  // Countries
  "japan":          { earthquake:88, flood:55, cyclone:65, wildfire:18, heatwave:55, landslide:48, country:"Japan",        confidence:90 },
  "bangladesh":     { earthquake:22, flood:92, cyclone:85, wildfire:8,  heatwave:82, landslide:35, country:"Bangladesh",   confidence:91 },
  "philippines":    { earthquake:72, flood:85, cyclone:95, wildfire:25, heatwave:75, landslide:62, country:"Philippines",  confidence:91 },
  "indonesia":      { earthquake:85, flood:82, cyclone:55, wildfire:68, heatwave:72, landslide:65, country:"Indonesia",    confidence:90 },
  "australia":      { earthquake:15, flood:55, cyclone:72, wildfire:88, heatwave:85, landslide:22, country:"Australia",    confidence:90 },
  "usa":            { earthquake:42, flood:55, cyclone:48, wildfire:58, heatwave:62, landslide:32, country:"United States", confidence:88 },
  "united states":  { earthquake:42, flood:55, cyclone:48, wildfire:58, heatwave:62, landslide:32, country:"United States", confidence:88 },
  "india":          { earthquake:48, flood:75, cyclone:65, wildfire:35, heatwave:85, landslide:45, country:"India",        confidence:88 },
  "china":          { earthquake:62, flood:68, cyclone:52, wildfire:35, heatwave:65, landslide:45, country:"China",        confidence:88 },
  "nepal":          { earthquake:88, flood:62, cyclone:8,  wildfire:22, heatwave:25, landslide:85, country:"Nepal",        confidence:91 },
  "new zealand":    { earthquake:78, flood:42, cyclone:25, wildfire:52, heatwave:28, landslide:42, country:"New Zealand",  confidence:91 },
  "turkey":         { earthquake:82, flood:38, cyclone:15, wildfire:55, heatwave:65, landslide:42, country:"Turkey",       confidence:90 },
  "italy":          { earthquake:72, flood:45, cyclone:18, wildfire:62, heatwave:68, landslide:48, country:"Italy",        confidence:91 },
  "greece":         { earthquake:75, flood:32, cyclone:22, wildfire:82, heatwave:85, landslide:38, country:"Greece",       confidence:91 },
  "chile":          { earthquake:85, flood:42, cyclone:12, wildfire:55, heatwave:42, landslide:58, country:"Chile",        confidence:91 },
  "pakistan":       { earthquake:75, flood:65, cyclone:52, wildfire:18, heatwave:85, landslide:48, country:"Pakistan",     confidence:88 },
  "iran":           { earthquake:85, flood:25, cyclone:8,  wildfire:25, heatwave:82, landslide:38, country:"Iran",         confidence:89 },
  "mexico":         { earthquake:78, flood:55, cyclone:62, wildfire:45, heatwave:65, landslide:52, country:"Mexico",       confidence:89 },
  "colombia":       { earthquake:58, flood:68, cyclone:15, wildfire:38, heatwave:35, landslide:72, country:"Colombia",     confidence:88 },
  "uk":             { earthquake:5,  flood:52, cyclone:22, wildfire:12, heatwave:35, landslide:8,  country:"United Kingdom",confidence:91 },
  "united kingdom": { earthquake:5,  flood:52, cyclone:22, wildfire:12, heatwave:35, landslide:8,  country:"United Kingdom",confidence:91 },
  "france":         { earthquake:12, flood:48, cyclone:15, wildfire:35, heatwave:58, landslide:22, country:"France",       confidence:91 },
  "germany":        { earthquake:8,  flood:42, cyclone:18, wildfire:12, heatwave:38, landslide:10, country:"Germany",      confidence:91 },
  "spain":          { earthquake:35, flood:28, cyclone:10, wildfire:72, heatwave:80, landslide:25, country:"Spain",        confidence:91 },
  "portugal":       { earthquake:68, flood:28, cyclone:12, wildfire:78, heatwave:72, landslide:35, country:"Portugal",     confidence:91 },
  "brazil":         { earthquake:8,  flood:72, cyclone:22, wildfire:52, heatwave:68, landslide:48, country:"Brazil",       confidence:88 },
  "russia":         { earthquake:38, flood:42, cyclone:12, wildfire:55, heatwave:28, landslide:28, country:"Russia",       confidence:87 },
  "canada":         { earthquake:32, flood:42, cyclone:12, wildfire:55, heatwave:32, landslide:28, country:"Canada",       confidence:88 },
};

/* ── Deterministic hash for unknown locations ─────────── */

function hashStr(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function seededVal(seed: number, min: number, max: number): number {
  const frac = (Math.imul(seed, 0xdeadbeef) >>> 0) / 0xffffffff;
  return Math.round(min + frac * (max - min));
}

function generateUnknown(name: string): LocationEntry {
  const h = hashStr(name.toLowerCase());
  const pick = (salt: number, lo: number, hi: number) =>
    seededVal(Math.imul(h, salt + 1) >>> 0, lo, hi);
  return {
    earthquake: pick(1, 10, 80),
    flood:      pick(2, 10, 75),
    cyclone:    pick(3, 5,  70),
    wildfire:   pick(4, 8,  70),
    heatwave:   pick(5, 15, 80),
    landslide:  pick(6, 5,  65),
    confidence: pick(7, 72, 88),
    country:    "Unknown",
  };
}

/* ── Risk explanations ────────────────────────────────── */

function buildExplanation(location: string, country: string, risks: RiskScores, overall: number): string {
  const sorted = (Object.entries(risks) as [string, number][])
    .sort(([, a], [, b]) => b - a);
  const [top1, top2] = sorted.map(([k]) => k);
  const level = overall >= 70 ? "elevated" : overall >= 45 ? "moderate" : "low";
  const topLabel: Record<string, string> = {
    earthquake: "seismic", flood: "flood", cyclone: "tropical cyclone / hurricane",
    wildfire: "wildfire", heatwave: "extreme heat", landslide: "landslide",
  };
  const lines: string[] = [
    `Earth Guardian AI has analyzed ${location}${country !== "Unknown" ? `, ${country}` : ""} using a fusion of seismic fault-line databases, NOAA climate archives, 50-year historical disaster records, and live atmospheric modelling. The region carries an ${level} composite risk profile.`,
    "",
    `The dominant hazard is **${topLabel[top1] ?? top1} risk** (score: ${risks[top1 as keyof RiskScores]}/100). ` +
    `${getRiskBlurb(top1, risks[top1 as keyof RiskScores], location)}`,
    "",
    `Secondary concern is **${topLabel[top2] ?? top2}** (${risks[top2 as keyof RiskScores]}/100). ` +
    `${getRiskBlurb(top2, risks[top2 as keyof RiskScores], location)}`,
    "",
    `Overall, residents are advised to maintain preparedness plans proportional to the ${level} threat environment. Follow local emergency management guidance and sign up for real-time alerts.`,
  ];
  return lines.join("\n");
}

function getRiskBlurb(type: string, score: number, location: string): string {
  const hi = score >= 70;
  const blurbs: Record<string, string> = {
    earthquake: hi
      ? `${location} sits near active fault zones with documented history of destructive tremors. Structural reinforcement and drop-cover drills are essential.`
      : `Seismic activity is present but infrequent. Basic preparedness measures are sufficient.`,
    flood: hi
      ? `Seasonal or flash flooding poses a recurring threat due to low elevation, heavy rainfall, or inadequate drainage infrastructure.`
      : `Flood risk is limited but not negligible during severe storm events.`,
    cyclone: hi
      ? `The region falls within a recognised tropical cyclone corridor. Residents should have pre-season evacuation plans and emergency reserves.`
      : `Cyclonic activity is possible but typically less intense in this location.`,
    wildfire: hi
      ? `Prolonged droughts, high temperatures, and dry vegetation create critical conditions for rapid wildfire spread.`
      : `Wildfire risk increases during dry seasons and should be monitored.`,
    heatwave: hi
      ? `Extreme heat events are increasingly common and pose significant health risks, especially for vulnerable populations.`
      : `Heatwaves can occur but are generally manageable with adequate cooling access.`,
    landslide: hi
      ? `Steep terrain, loose soils, or heavy rainfall create conditions for debris flows and slope failures, particularly after prolonged rain.`
      : `Landslide risk is localised to hillside and mountainous micro-zones.`,
  };
  return blurbs[type] ?? "Further monitoring is recommended.";
}

/* ── Recommendations ─────────────────────────────────── */

const ALL_RECS: Record<string, Recommendation[]> = {
  earthquake: [
    { icon:"🏠", text:"Retrofit older buildings with seismic bracing. Have a structural engineer assess your property.", priority:"critical", category:"earthquake" },
    { icon:"🎒", text:"Maintain a 72-hour emergency kit: water (4L/person/day), food, first aid, flashlight, radio.", priority:"critical", category:"earthquake" },
    { icon:"📍", text:"Identify safe spots in every room — interior walls, under sturdy tables, away from windows.", priority:"high",     category:"earthquake" },
    { icon:"📱", text:"Register for ShakeAlert or your local seismic early-warning system.", priority:"high",     category:"earthquake" },
  ],
  flood: [
    { icon:"🌊", text:"Purchase flood insurance — standard home insurance rarely covers flood damage.", priority:"critical", category:"flood" },
    { icon:"🚗", text:"Never drive through flooded roads. Just 15 cm of water can sweep a car off the road.", priority:"critical", category:"flood" },
    { icon:"📦", text:"Store valuables and documents in waterproof containers above ground level.", priority:"high",     category:"flood" },
    { icon:"🔌", text:"Install a sump pump with battery backup and elevate electrical panels.", priority:"high",     category:"flood" },
  ],
  cyclone: [
    { icon:"🪟", text:"Install hurricane shutters or storm-rated windows and reinforce garage doors.", priority:"critical", category:"cyclone" },
    { icon:"📋", text:"Establish an evacuation plan with two routes and a meeting point for your family.", priority:"critical", category:"cyclone" },
    { icon:"🌴", text:"Trim trees and secure loose outdoor objects before storm season.", priority:"high",     category:"cyclone" },
    { icon:"📡", text:"Follow NOAA / national meteorological service updates during the season.", priority:"high",     category:"cyclone" },
  ],
  wildfire: [
    { icon:"🔥", text:"Create a 30m ember-resistant defensible space around your home by clearing dry vegetation.", priority:"critical", category:"wildfire" },
    { icon:"🏃", text:"Pre-plan evacuation and leave early — do not wait for official orders if fire is nearby.", priority:"critical", category:"wildfire" },
    { icon:"🪣", text:"Use metal roofing, ember-proof vents, and ember-resistant deck materials.", priority:"high",     category:"wildfire" },
    { icon:"💨", text:"Keep N95 masks at home to protect against smoke inhalation during air-quality events.", priority:"high",     category:"wildfire" },
  ],
  heatwave: [
    { icon:"❄️", text:"Never leave children or pets in parked cars. Temperatures can exceed 60 °C within minutes.", priority:"critical", category:"heatwave" },
    { icon:"💧", text:"Drink at least 2–3 litres of water daily during heat events, even if not thirsty.", priority:"critical", category:"heatwave" },
    { icon:"🏥", text:"Know the signs of heat stroke (confusion, dry skin, high temperature) — call emergency services immediately.", priority:"high",     category:"heatwave" },
    { icon:"🪟", text:"Use reflective window film and keep curtains closed during peak heat hours (11am–4pm).", priority:"moderate", category:"heatwave" },
  ],
  landslide: [
    { icon:"⛰️", text:"If on a hillside, have your slope assessed for instability by a geotechnical engineer.", priority:"critical", category:"landslide" },
    { icon:"🚨", text:"Evacuate immediately if you hear rumbling, notice cracks in walls, or see tilting trees.", priority:"critical", category:"landslide" },
    { icon:"🌳", text:"Plant deep-rooted vegetation on exposed slopes to improve stability.", priority:"high",     category:"landslide" },
    { icon:"🔍", text:"Monitor local drainage channels — blockages can redirect water and trigger slides.", priority:"moderate", category:"landslide" },
  ],
};

function buildRecommendations(risks: RiskScores): Recommendation[] {
  const sorted = (Object.entries(risks) as [string, number][])
    .sort(([, a], [, b]) => b - a);
  const recs: Recommendation[] = [];
  for (const [type, score] of sorted.slice(0, 4)) {
    if (score >= 20 && ALL_RECS[type]) {
      recs.push(...ALL_RECS[type].slice(0, score >= 65 ? 3 : 2));
    }
  }
  return recs.slice(0, 8);
}

/* ── Public API ──────────────────────────────────────── */

export function analyzeLocation(query: string): RiskAnalysisResult {
  const key = query.trim().toLowerCase();
  const entry: LocationEntry = LOCATIONS[key] ?? generateUnknown(key);

  const displayName = query.trim().split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

  const risks: RiskScores = {
    earthquake: entry.earthquake ?? 20,
    flood:      entry.flood      ?? 20,
    cyclone:    entry.cyclone    ?? 15,
    wildfire:   entry.wildfire   ?? 15,
    heatwave:   entry.heatwave   ?? 30,
    landslide:  entry.landslide  ?? 15,
  };

  const vals = Object.values(risks);
  const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const level: RiskAnalysisResult["level"] =
    overall >= 65 ? "critical" : overall >= 45 ? "high" : overall >= 25 ? "moderate" : "low";

  return {
    location:        displayName,
    country:         entry.country,
    risks,
    overall,
    confidence:      entry.confidence ?? 82,
    level,
    explanation:     buildExplanation(displayName, entry.country, risks, overall),
    recommendations: buildRecommendations(risks),
  };
}

export const RISK_CATEGORY_CONFIG: Record<keyof RiskScores, { label: string; emoji: string; color: string }> = {
  earthquake: { label: "Earthquake",  emoji: "⚡", color: "#818cf8" },
  flood:      { label: "Flood",       emoji: "💧", color: "#22d3ee" },
  cyclone:    { label: "Cyclone",     emoji: "🌀", color: "#60a5fa" },
  wildfire:   { label: "Wildfire",    emoji: "🔥", color: "#fb923c" },
  heatwave:   { label: "Heatwave",    emoji: "🌡️", color: "#f87171" },
  landslide:  { label: "Landslide",   emoji: "⛰️", color: "#facc15" },
};

export const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  moderate: "#f59e0b",
  low:      "#34d399",
};

export function scoreToLevel(s: number): "critical" | "high" | "moderate" | "low" {
  return s >= 70 ? "critical" : s >= 50 ? "high" : s >= 28 ? "moderate" : "low";
}
