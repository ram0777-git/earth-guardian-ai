export interface DisasterEvent {
  id: string;
  type: "earthquake" | "flood" | "wildfire" | "hurricane" | "tsunami" | "volcano" | "landslide";
  title: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  severity: "critical" | "high" | "moderate" | "low";
  magnitude?: number;
  depth?: number;
  time: string;
  affected?: string;
  status: string;
  source: "usgs" | "sample";
  description?: string;
}

export const sampleMapDisasters: DisasterEvent[] = [
  // FLOODS
  {
    id: "s-f1", type: "flood",
    title: "Flash Flood Emergency",
    location: "Harris County, TX",  country: "United States",
    lat: 29.76, lng: -95.37,
    severity: "critical",
    time: "6 hr ago", affected: "2.3M",
    status: "Active Response", source: "sample",
    description: "Severe flash flooding following 8 inches of rainfall in 6 hours. Emergency services deployed across 14 zones.",
  },
  {
    id: "s-f2", type: "flood",
    title: "Monsoon Flooding",
    location: "Dhaka Region", country: "Bangladesh",
    lat: 23.72, lng: 90.40,
    severity: "high",
    time: "2 days ago", affected: "4.2M",
    status: "Emergency Declared", source: "sample",
    description: "Severe monsoon flooding displacing hundreds of thousands in low-lying river delta regions.",
  },
  {
    id: "s-f3", type: "flood",
    title: "Urban Flooding",
    location: "Jakarta Metro Area", country: "Indonesia",
    lat: -6.21, lng: 106.85,
    severity: "high",
    time: "1 day ago", affected: "1.8M",
    status: "Monitoring", source: "sample",
    description: "Annual monsoon flooding worsened by land subsidence. Major highways submerged.",
  },
  {
    id: "s-f4", type: "flood",
    title: "River Flooding",
    location: "Rio Grande Valley, TX", country: "United States",
    lat: 26.2, lng: -98.3,
    severity: "moderate",
    time: "3 days ago", affected: "340K",
    status: "Watch Active", source: "sample",
  },
  // WILDFIRES
  {
    id: "s-w1", type: "wildfire",
    title: "Red Flag Wildfire",
    location: "Los Angeles County, CA", country: "United States",
    lat: 34.05, lng: -118.24,
    severity: "high",
    time: "11 hr ago", affected: "890K",
    status: "Active Containment", source: "sample",
    description: "Wind-driven fire in dry chaparral. 15% contained. Evacuation orders for 3 communities.",
  },
  {
    id: "s-w2", type: "wildfire",
    title: "Forest Fire",
    location: "Attica Region", country: "Greece",
    lat: 38.0, lng: 23.7,
    severity: "critical",
    time: "2 days ago", affected: "120K",
    status: "Active Firefighting", source: "sample",
    description: "Fast-moving wildfire fueled by strong winds and drought conditions. Multiple villages evacuated.",
  },
  {
    id: "s-w3", type: "wildfire",
    title: "Bushfire Alert",
    location: "New South Wales", country: "Australia",
    lat: -33.8, lng: 151.2,
    severity: "moderate",
    time: "1 day ago", affected: "280K",
    status: "Monitoring", source: "sample",
  },
  {
    id: "s-w4", type: "wildfire",
    title: "Taiga Fire",
    location: "Siberia, Krasnoyarsk", country: "Russia",
    lat: 60.0, lng: 90.0,
    severity: "moderate",
    time: "4 days ago", affected: "18K",
    status: "Active", source: "sample",
  },
  // HURRICANES / CYCLONES
  {
    id: "s-h1", type: "hurricane",
    title: "Tropical Storm Watch",
    location: "Miami-Dade County, FL", country: "United States",
    lat: 25.76, lng: -80.19,
    severity: "moderate",
    time: "18 hr ago", affected: "1.1M",
    status: "Watch Active", source: "sample",
    description: "Tropical depression strengthening. 70% probability of Category 1 landfall within 72 hours.",
  },
  {
    id: "s-h2", type: "hurricane",
    title: "Typhoon Warning",
    location: "Northern Luzon", country: "Philippines",
    lat: 17.0, lng: 121.5,
    severity: "critical",
    time: "1 day ago", affected: "3.4M",
    status: "Emergency Evacuation", source: "sample",
    description: "Super Typhoon approaching. Sustained winds 185 km/h. Mass evacuation ordered for coastal zones.",
  },
  {
    id: "s-h3", type: "hurricane",
    title: "Cyclone Alert",
    location: "Mozambique Channel", country: "Mozambique",
    lat: -17.0, lng: 36.0,
    severity: "high",
    time: "2 days ago", affected: "560K",
    status: "Active", source: "sample",
  },
  // TSUNAMIS
  {
    id: "s-t1", type: "tsunami",
    title: "Tsunami Advisory",
    location: "Pacific Coast", country: "Japan",
    lat: 35.68, lng: 139.69,
    severity: "moderate",
    time: "8 hr ago", affected: "2.1M",
    status: "Advisory Active", source: "sample",
    description: "Tsunami advisory issued following M6.8 offshore earthquake. 0.5-1m waves possible along Honshu coast.",
  },
  {
    id: "s-t2", type: "tsunami",
    title: "Tsunami Watch",
    location: "Valparaíso Region", country: "Chile",
    lat: -33.05, lng: -71.62,
    severity: "low",
    time: "3 days ago", affected: "180K",
    status: "Cancelled", source: "sample",
  },
  // VOLCANOES
  {
    id: "s-v1", type: "volcano",
    title: "Kīlauea Eruption",
    location: "Big Island, Hawaii", country: "United States",
    lat: 19.41, lng: -155.29,
    severity: "moderate",
    time: "Ongoing", affected: "45K",
    status: "Active Eruption", source: "sample",
    description: "Ongoing effusive eruption at the summit caldera. Lava lake active. Vog advisory for downwind areas.",
  },
  {
    id: "s-v2", type: "volcano",
    title: "Mount Etna Activity",
    location: "Sicily", country: "Italy",
    lat: 37.75, lng: 15.0,
    severity: "low",
    time: "1 day ago", affected: "12K",
    status: "Elevated Activity", source: "sample",
    description: "Paroxysmal episode with lava fountaining up to 1.5 km. Ash cloud affecting Catania airport.",
  },
  {
    id: "s-v3", type: "volcano",
    title: "Krakatau Activity",
    location: "Sunda Strait", country: "Indonesia",
    lat: -6.1, lng: 105.4,
    severity: "high",
    time: "2 days ago", affected: "220K",
    status: "Eruption Warning", source: "sample",
  },
  {
    id: "s-v4", type: "volcano",
    title: "Popocatépetl Unrest",
    location: "Puebla State", country: "Mexico",
    lat: 19.02, lng: -98.63,
    severity: "moderate",
    time: "3 days ago", affected: "500K",
    status: "Yellow Alert", source: "sample",
  },
  // LANDSLIDES
  {
    id: "s-l1", type: "landslide",
    title: "Landslide Risk Advisory",
    location: "King County, WA", country: "United States",
    lat: 47.5, lng: -122.3,
    severity: "low",
    time: "3 days ago", affected: "62K",
    status: "Advisory", source: "sample",
  },
  {
    id: "s-l2", type: "landslide",
    title: "Landslide Emergency",
    location: "Antioquia Department", country: "Colombia",
    lat: 6.17, lng: -75.59,
    severity: "critical",
    time: "1 day ago", affected: "28K",
    status: "Search & Rescue", source: "sample",
    description: "Massive landslide triggered by heavy rainfall buried 4 communities. Search and rescue ongoing.",
  },
  {
    id: "s-l3", type: "landslide",
    title: "Debris Flow Warning",
    location: "Bukidnon Province", country: "Philippines",
    lat: 8.06, lng: 124.96,
    severity: "high",
    time: "2 days ago", affected: "45K",
    status: "Evacuation Order", source: "sample",
  },
];

export const DISASTER_TYPE_CONFIG: Record<string, {
  label: string;
  emoji: string;
  color: string;
  bg: string;
}> = {
  earthquake: { label: "Earthquakes",  emoji: "⚡", color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  flood:      { label: "Floods",       emoji: "💧", color: "#22d3ee", bg: "rgba(34,211,238,0.12)"  },
  wildfire:   { label: "Wildfires",    emoji: "🔥", color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  hurricane:  { label: "Hurricanes",   emoji: "🌀", color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  tsunami:    { label: "Tsunamis",     emoji: "🌊", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  volcano:    { label: "Volcanoes",    emoji: "🌋", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  landslide:  { label: "Landslides",   emoji: "⛰️", color: "#facc15", bg: "rgba(250,204,21,0.12)"  },
};
