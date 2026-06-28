// Central live data store — single source of truth for all routes and Raksh AI

export const disasters = [
  { id: "m-1", name: "Houston Flood Zone", type: "flood", severity: "critical", lat: 29.76, lng: -95.37, description: "Severe flooding in Harris County. Multiple road closures and residential areas submerged.", timestamp: new Date().toISOString() },
  { id: "m-2", name: "Bay Area Seismic", type: "earthquake", severity: "moderate", lat: 37.77, lng: -122.42, description: "Elevated seismic activity detected along the Hayward Fault. Magnitude 4.2 event recorded.", timestamp: new Date().toISOString() },
  { id: "m-3", name: "LA Wildfire Alert", type: "wildfire", severity: "high", lat: 34.05, lng: -118.24, description: "Red flag fire weather conditions. Dry winds, low humidity, vegetation highly flammable.", timestamp: new Date().toISOString() },
  { id: "m-4", name: "Miami Storm Watch", type: "hurricane", severity: "moderate", lat: 25.76, lng: -80.19, description: "Tropical storm monitoring active. Wind speeds 65 mph, moving NNE at 12 mph.", timestamp: new Date().toISOString() },
  { id: "m-5", name: "Tokyo Tsunami Monitor", type: "tsunami", severity: "low", lat: 35.68, lng: 139.69, description: "Ocean buoy monitoring active following M5.1 offshore quake. Advisory in effect.", timestamp: new Date().toISOString() },
  { id: "m-6", name: "Central Valley Drought", type: "drought", severity: "high", lat: 36.78, lng: -119.42, description: "Severe drought D2 classification. Reservoir levels at 34% capacity.", timestamp: new Date().toISOString() },
  { id: "m-7", name: "Philippines Landslide", type: "landslide", severity: "critical", lat: 14.6, lng: 121.0, description: "High landslide risk due to 3 days of continuous heavy rainfall. Evacuation in progress.", timestamp: new Date().toISOString() },
  { id: "m-8", name: "Jakarta Flood Risk", type: "flood", severity: "high", lat: -6.21, lng: 106.85, description: "Coastal flooding threat elevated. Tidal surge expected to compound monsoon rainfall.", timestamp: new Date().toISOString() },
];

export const alerts = [
  { id: "alert-1", title: "Flash Flood Warning", location: "Harris County, Texas", severity: "critical", time: "12 min ago", type: "flood" },
  { id: "alert-2", title: "Elevated Seismic Activity", location: "San Francisco Bay Area, CA", severity: "moderate", time: "34 min ago", type: "earthquake" },
  { id: "alert-3", title: "Red Flag Fire Weather", location: "Los Angeles County, CA", severity: "high", time: "1 hr ago", type: "wildfire" },
  { id: "alert-4", title: "Tropical Storm Watch", location: "Miami-Dade County, FL", severity: "moderate", time: "2 hr ago", type: "hurricane" },
  { id: "alert-5", title: "Landslide Risk Advisory", location: "King County, Washington", severity: "low", time: "3 hr ago", type: "landslide" },
];

export const weather = {
  location: "San Francisco, CA",
  temperature: 62,
  condition: "Partly Cloudy",
  humidity: 72,
  windSpeed: 14,
  uvIndex: 6,
  forecast: [
    { day: "Fri", high: 64, low: 52, condition: "Cloudy" },
    { day: "Sat", high: 68, low: 54, condition: "Sunny" },
    { day: "Sun", high: 71, low: 56, condition: "Clear" },
    { day: "Mon", high: 65, low: 53, condition: "Rain" },
    { day: "Tue", high: 63, low: 51, condition: "Overcast" },
  ],
};

export const riskFactors = [
  { id: "rf-1", name: "Seismic Activity", score: 62, level: "moderate", description: "Elevated micro-seismic events detected along the San Andreas fault segment." },
  { id: "rf-2", name: "Flood Risk", score: 78, level: "high", description: "Heavy rainfall forecast with saturated soil conditions in low-lying areas." },
  { id: "rf-3", name: "Wildfire Risk", score: 45, level: "moderate", description: "Moderate fire weather index with dry vegetation in eastern hills." },
  { id: "rf-4", name: "Hurricane Exposure", score: 12, level: "low", description: "No tropical systems within 500 miles. Minimal hurricane-related risk." },
  { id: "rf-5", name: "Infrastructure Vulnerability", score: 55, level: "moderate", description: "Aging levee systems in flood-prone zones require monitoring during peak rainfall." },
  { id: "rf-6", name: "Population Density Impact", score: 71, level: "high", description: "High population density in coastal zones amplifies potential evacuation complexity." },
];

export const riskScore = { overall: 68, level: "high", timestamp: new Date().toISOString() };

export const predictions = {
  primaryThreat: "Coastal Flooding",
  confidence: 78,
  timeframe: "Next 48 hours",
  summary: "Heavy rainfall combined with high tide cycles increases coastal flooding risk along the eastern shoreline. Residents in Zone B should prepare evacuation kits.",
  factors: [
    { label: "Rainfall Intensity", impact: 85 },
    { label: "Tidal Surge", impact: 72 },
    { label: "Drainage Capacity", impact: 45 },
    { label: "Soil Saturation", impact: 68 },
  ],
};

export const timeline = [
  { id: "tl-1", title: "Magnitude 4.2 Earthquake Detected", description: "Minor shaking reported in Oakland and Berkeley areas. No structural damage confirmed.", time: "Today, 6:42 AM", type: "earthquake", status: "monitoring" },
  { id: "tl-2", title: "Flood Watch Issued for Bay Area", description: "National Weather Service issued a flood watch effective through Saturday evening.", time: "Yesterday, 3:15 PM", type: "flood", status: "active" },
  { id: "tl-3", title: "Wildfire Containment Reached 85%", description: "Creek Fire in Sonoma County now 85% contained. Evacuation orders lifted for Zone 3.", time: "Jun 24, 11:30 AM", type: "wildfire", status: "resolved" },
  { id: "tl-4", title: "Tsunami Advisory Cancelled", description: "Pacific Tsunami Warning Centre cancelled advisory for coastal California following offshore quake.", time: "Jun 22, 8:00 AM", type: "tsunami", status: "resolved" },
  { id: "tl-5", title: "Drought Conditions Worsening", description: "Central Valley classified as D2 Severe Drought. Water conservation measures recommended.", time: "Jun 20, 9:00 AM", type: "drought", status: "active" },
];
