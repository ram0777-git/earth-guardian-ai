import type {
  Alert,
  AIPrediction,
  ChartDataPoint,
  EmergencyStep,
  Feature,
  MapMarker,
  RiskFactor,
  Statistic,
  SupportedDisaster,
  TeamMember,
  TimelineEvent,
  Volunteer,
  WeatherData,
} from "./types";

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/risk-analysis", label: "Risk Analysis" },
  { href: "/live-map", label: "Live Map" },
  { href: "/emergency-planner", label: "Emergency Planner" },
  { href: "/volunteer-network", label: "Volunteers" },
  { href: "/raksh", label: "Raksh AI" },
  { href: "/about", label: "About" },
];

export const features: Feature[] = [
  {
    id: "ai-prediction",
    title: "AI Disaster Prediction",
    description:
      "Machine learning models analyze satellite imagery, seismic sensors, and weather patterns to forecast disasters up to 72 hours in advance.",
    icon: "brain",
  },
  {
    id: "real-time-alerts",
    title: "Real-Time Alerts",
    description:
      "Instant push notifications and SMS alerts when risk thresholds are exceeded in your monitored regions.",
    icon: "bell",
  },
  {
    id: "live-mapping",
    title: "Live Disaster Mapping",
    description:
      "Interactive global map with live incident markers, evacuation zones, and shelter locations updated every 5 minutes.",
    icon: "map",
  },
  {
    id: "emergency-planning",
    title: "Smart Emergency Planning",
    description:
      "Personalized evacuation routes, supply checklists, and family communication plans tailored to your location.",
    icon: "clipboard",
  },
  {
    id: "volunteer-network",
    title: "Volunteer Coordination",
    description:
      "Connect with certified volunteers and relief organizations in your area for community-driven disaster response.",
    icon: "users",
  },
  {
    id: "risk-scoring",
    title: "Regional Risk Scoring",
    description:
      "Composite risk scores combining geological, meteorological, and historical data for any location worldwide.",
    icon: "gauge",
  },
];

export const statistics: Statistic[] = [
  {
    id: "accuracy",
    label: "Model Accuracy",
    value: "95%",
    numericValue: 95,
    suffix: "%",
    change: "+2.1% improvement",
    trend: "up",
  },
  {
    id: "regions",
    label: "Regions Monitored",
    value: "847",
    numericValue: 847,
    change: "Global coverage active",
    trend: "neutral",
  },
  {
    id: "lives",
    label: "Lives Protected",
    value: "1.8M",
    numericValue: 1.8,
    suffix: "M",
    decimals: 1,
    change: "+240K this year",
    trend: "up",
  },
  {
    id: "countries",
    label: "Countries",
    value: "120",
    numericValue: 120,
    change: "Across 6 continents",
    trend: "up",
  },
];

export const supportedDisasters: SupportedDisaster[] = [
  {
    id: "earthquake",
    name: "Earthquakes",
    description: "Seismic activity detection via USGS and regional sensor networks",
    icon: "activity",
    accuracy: 91,
  },
  {
    id: "flood",
    name: "Floods",
    description: "River level monitoring and rainfall accumulation forecasting",
    icon: "waves",
    accuracy: 93,
  },
  {
    id: "wildfire",
    name: "Wildfires",
    description: "Thermal satellite imagery and drought index correlation",
    icon: "flame",
    accuracy: 89,
  },
  {
    id: "hurricane",
    name: "Hurricanes",
    description: "Tropical cyclone tracking with wind shear analysis",
    icon: "wind",
    accuracy: 96,
  },
  {
    id: "tsunami",
    name: "Tsunamis",
    description: "Ocean buoy data and underwater seismic event detection",
    icon: "water",
    accuracy: 88,
  },
  {
    id: "drought",
    name: "Droughts",
    description: "Soil moisture indices and precipitation anomaly modeling",
    icon: "sun",
    accuracy: 90,
  },
];

export const recentAlerts: Alert[] = [
  {
    id: "alert-1",
    title: "Flash Flood Warning",
    location: "Harris County, Texas",
    severity: "critical",
    time: "12 min ago",
    type: "flood",
  },
  {
    id: "alert-2",
    title: "Elevated Seismic Activity",
    location: "San Francisco Bay Area, CA",
    severity: "moderate",
    time: "34 min ago",
    type: "earthquake",
  },
  {
    id: "alert-3",
    title: "Red Flag Fire Weather",
    location: "Los Angeles County, CA",
    severity: "high",
    time: "1 hr ago",
    type: "wildfire",
  },
  {
    id: "alert-4",
    title: "Tropical Storm Watch",
    location: "Miami-Dade County, FL",
    severity: "moderate",
    time: "2 hr ago",
    type: "hurricane",
  },
  {
    id: "alert-5",
    title: "Landslide Risk Advisory",
    location: "King County, Washington",
    severity: "low",
    time: "3 hr ago",
    type: "landslide",
  },
];

export const weatherData: WeatherData = {
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

export const aiPrediction: AIPrediction = {
  primaryThreat: "Coastal Flooding",
  confidence: 78,
  timeframe: "Next 48 hours",
  summary:
    "Heavy rainfall combined with high tide cycles increases coastal flooding risk along the eastern shoreline. Residents in Zone B should prepare evacuation kits.",
  factors: [
    { label: "Rainfall Intensity", impact: 85 },
    { label: "Tidal Surge", impact: 72 },
    { label: "Drainage Capacity", impact: 45 },
    { label: "Soil Saturation", impact: 68 },
  ],
};

export const chartData: ChartDataPoint[] = [
  { month: "Jan", earthquakes: 42, floods: 28, wildfires: 15 },
  { month: "Feb", earthquakes: 38, floods: 35, wildfires: 12 },
  { month: "Mar", earthquakes: 45, floods: 52, wildfires: 18 },
  { month: "Apr", earthquakes: 41, floods: 48, wildfires: 22 },
  { month: "May", earthquakes: 39, floods: 61, wildfires: 35 },
  { month: "Jun", earthquakes: 44, floods: 55, wildfires: 48 },
  { month: "Jul", earthquakes: 37, floods: 42, wildfires: 62 },
  { month: "Aug", earthquakes: 43, floods: 38, wildfires: 71 },
  { month: "Sep", earthquakes: 46, floods: 45, wildfires: 58 },
  { month: "Oct", earthquakes: 40, floods: 50, wildfires: 42 },
  { month: "Nov", earthquakes: 42, floods: 44, wildfires: 28 },
  { month: "Dec", earthquakes: 38, floods: 36, wildfires: 19 },
];

export const timelineEvents: TimelineEvent[] = [
  {
    id: "tl-1",
    title: "Magnitude 4.2 Earthquake Detected",
    description: "Minor shaking reported in Oakland and Berkeley areas. No structural damage confirmed.",
    time: "Today, 6:42 AM",
    type: "earthquake",
    status: "monitoring",
  },
  {
    id: "tl-2",
    title: "Flood Watch Issued for Bay Area",
    description: "National Weather Service issued a flood watch effective through Saturday evening.",
    time: "Yesterday, 3:15 PM",
    type: "flood",
    status: "active",
  },
  {
    id: "tl-3",
    title: "Wildfire Containment Reached 85%",
    description: "Creek Fire in Sonoma County now 85% contained. Evacuation orders lifted for Zone 3.",
    time: "Jun 24, 11:30 AM",
    type: "wildfire",
    status: "resolved",
  },
  {
    id: "tl-4",
    title: "Tsunami Advisory Cancelled",
    description: "Pacific Tsunami Warning Center cancelled advisory for coastal California following offshore quake.",
    time: "Jun 22, 8:00 AM",
    type: "tsunami",
    status: "resolved",
  },
  {
    id: "tl-5",
    title: "Drought Conditions Worsening",
    description: "Central Valley classified as D2 Severe Drought. Water conservation measures recommended.",
    time: "Jun 20, 9:00 AM",
    type: "drought",
    status: "active",
  },
];

export const riskFactors: RiskFactor[] = [
  {
    id: "rf-1",
    name: "Seismic Activity",
    score: 62,
    level: "moderate",
    description: "Elevated micro-seismic events detected along the San Andreas fault segment.",
  },
  {
    id: "rf-2",
    name: "Flood Risk",
    score: 78,
    level: "high",
    description: "Heavy rainfall forecast with saturated soil conditions in low-lying areas.",
  },
  {
    id: "rf-3",
    name: "Wildfire Risk",
    score: 45,
    level: "moderate",
    description: "Moderate fire weather index with dry vegetation in eastern hills.",
  },
  {
    id: "rf-4",
    name: "Hurricane Exposure",
    score: 12,
    level: "low",
    description: "No tropical systems within 500 miles. Minimal hurricane-related risk.",
  },
  {
    id: "rf-5",
    name: "Infrastructure Vulnerability",
    score: 55,
    level: "moderate",
    description: "Aging levee systems in flood-prone zones require monitoring during peak rainfall.",
  },
  {
    id: "rf-6",
    name: "Population Density Impact",
    score: 71,
    level: "high",
    description: "High population density in coastal zones amplifies potential evacuation complexity.",
  },
];

export const mapMarkers: MapMarker[] = [
  { id: "m-1", name: "Houston Flood Zone", lat: 29.76, lng: -95.37, type: "flood", severity: "critical" },
  { id: "m-2", name: "Bay Area Seismic", lat: 37.77, lng: -122.42, type: "earthquake", severity: "moderate" },
  { id: "m-3", name: "LA Wildfire Alert", lat: 34.05, lng: -118.24, type: "wildfire", severity: "high" },
  { id: "m-4", name: "Miami Storm Watch", lat: 25.76, lng: -80.19, type: "hurricane", severity: "moderate" },
  { id: "m-5", name: "Tokyo Tsunami Monitor", lat: 35.68, lng: 139.69, type: "tsunami", severity: "low" },
  { id: "m-6", name: "Central Valley Drought", lat: 36.78, lng: -119.42, type: "drought", severity: "high" },
  { id: "m-7", name: "Philippines Landslide", lat: 14.6, lng: 121.0, type: "landslide", severity: "critical" },
  { id: "m-8", name: "Jakarta Flood Risk", lat: -6.21, lng: 106.85, type: "flood", severity: "high" },
];

export const emergencySteps: EmergencyStep[] = [
  {
    id: "es-1",
    title: "Build a 72-hour emergency kit",
    description: "Stock water (1 gallon/person/day), non-perishable food, flashlight, first-aid supplies, and medications.",
    completed: true,
    priority: "essential",
  },
  {
    id: "es-2",
    title: "Identify evacuation routes",
    description: "Map at least two routes from home and workplace. Practice driving them during non-emergency times.",
    completed: true,
    priority: "essential",
  },
  {
    id: "es-3",
    title: "Create family communication plan",
    description: "Designate an out-of-area contact. Ensure all family members know how to reach each other.",
    completed: false,
    priority: "essential",
  },
  {
    id: "es-4",
    title: "Secure important documents",
    description: "Store copies of IDs, insurance policies, and medical records in a waterproof container.",
    completed: false,
    priority: "recommended",
  },
  {
    id: "es-5",
    title: "Register for local alerts",
    description: "Sign up for Earth Guardian AI alerts and your county's emergency notification system.",
    completed: true,
    priority: "essential",
  },
  {
    id: "es-6",
    title: "Learn basic first aid",
    description: "Complete a CPR and first-aid certification course through your local Red Cross chapter.",
    completed: false,
    priority: "recommended",
  },
  {
    id: "es-7",
    title: "Install smoke and CO detectors",
    description: "Place detectors on every floor and test batteries monthly.",
    completed: true,
    priority: "recommended",
  },
  {
    id: "es-8",
    title: "Join community preparedness group",
    description: "Connect with neighbors through the Volunteer Network for coordinated response.",
    completed: false,
    priority: "optional",
  },
];

export const volunteers: Volunteer[] = [
  {
    id: "v-1",
    name: "Maria Santos",
    role: "Emergency Medical Responder",
    location: "San Francisco, CA",
    availability: "Weekends",
    skills: ["First Aid", "Triage", "Spanish"],
    hoursContributed: 342,
  },
  {
    id: "v-2",
    name: "James Chen",
    role: "Search & Rescue Coordinator",
    location: "Oakland, CA",
    availability: "On-call",
    skills: ["Navigation", "Rope Rescue", "Drone Operation"],
    hoursContributed: 518,
  },
  {
    id: "v-3",
    name: "Aisha Patel",
    role: "Community Outreach Lead",
    location: "San Jose, CA",
    availability: "Weekdays",
    skills: ["Public Speaking", "Social Media", "Hindi"],
    hoursContributed: 276,
  },
  {
    id: "v-4",
    name: "Robert Kim",
    role: "Logistics & Supply Manager",
    location: "Berkeley, CA",
    availability: "Flexible",
    skills: ["Inventory", "Transportation", "Korean"],
    hoursContributed: 189,
  },
  {
    id: "v-5",
    name: "Elena Rodriguez",
    role: "Shelter Operations Volunteer",
    location: "Fremont, CA",
    availability: "Evenings",
    skills: ["Food Service", "Childcare", "Spanish"],
    hoursContributed: 421,
  },
  {
    id: "v-6",
    name: "David Thompson",
    role: "Amateur Radio Operator",
    location: "Palo Alto, CA",
    availability: "24/7",
    skills: ["HAM Radio", "Technical Support", "Morse Code"],
    hoursContributed: 634,
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "tm-1",
    name: "Dr. Sarah Mitchell",
    role: "Lead AI Researcher",
    bio: "Former Google DeepMind researcher specializing in geospatial machine learning and disaster prediction models.",
  },
  {
    id: "tm-2",
    name: "Carlos Mendez",
    role: "Full-Stack Engineer",
    bio: "Built scalable real-time alert systems serving 2M+ users. GDG community organizer and hackathon mentor.",
  },
  {
    id: "tm-3",
    name: "Priya Sharma",
    role: "UX & Product Design",
    bio: "Material Design certified designer focused on accessible emergency interfaces for diverse communities.",
  },
  {
    id: "tm-4",
    name: "Michael O'Brien",
    role: "Emergency Management Advisor",
    bio: "20 years with FEMA coordinating disaster response operations across the Pacific Northwest.",
  },
];

export const overallRiskScore = 68;
