export type DisasterType =
  | "earthquake"
  | "flood"
  | "wildfire"
  | "hurricane"
  | "tsunami"
  | "drought"
  | "landslide";

export type AlertSeverity = "low" | "moderate" | "high" | "critical";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Statistic {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface SupportedDisaster {
  id: string;
  name: string;
  description: string;
  icon: string;
  accuracy: number;
}

export interface Alert {
  id: string;
  title: string;
  location: string;
  severity: AlertSeverity;
  time: string;
  type: DisasterType;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  forecast: { day: string; high: number; low: number; condition: string }[];
}

export interface AIPrediction {
  primaryThreat: string;
  confidence: number;
  timeframe: string;
  summary: string;
  factors: { label: string; impact: number }[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  type: DisasterType;
  status: "resolved" | "active" | "monitoring";
}

export interface ChartDataPoint {
  month: string;
  earthquakes: number;
  floods: number;
  wildfires: number;
}

export interface RiskFactor {
  id: string;
  name: string;
  score: number;
  level: AlertSeverity;
  description: string;
}

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: DisasterType;
  severity: AlertSeverity;
}

export interface EmergencyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "essential" | "recommended" | "optional";
}

export interface Volunteer {
  id: string;
  name: string;
  role: string;
  location: string;
  availability: string;
  skills: string[];
  hoursContributed: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
}
