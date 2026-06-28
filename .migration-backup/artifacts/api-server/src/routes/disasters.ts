import { Router, type IRouter } from "express";

const router: IRouter = Router();

const disasters = [
  { id: "m-1", name: "Houston Flood Zone", type: "flood", severity: "critical", lat: 29.76, lng: -95.37, description: "Severe flooding in Harris County", timestamp: new Date().toISOString() },
  { id: "m-2", name: "Bay Area Seismic", type: "earthquake", severity: "moderate", lat: 37.77, lng: -122.42, description: "Elevated seismic activity detected", timestamp: new Date().toISOString() },
  { id: "m-3", name: "LA Wildfire Alert", type: "wildfire", severity: "high", lat: 34.05, lng: -118.24, description: "Red flag fire weather conditions", timestamp: new Date().toISOString() },
  { id: "m-4", name: "Miami Storm Watch", type: "hurricane", severity: "moderate", lat: 25.76, lng: -80.19, description: "Tropical storm monitoring", timestamp: new Date().toISOString() },
  { id: "m-5", name: "Tokyo Tsunami Monitor", type: "tsunami", severity: "low", lat: 35.68, lng: 139.69, description: "Ocean buoy monitoring active", timestamp: new Date().toISOString() },
  { id: "m-6", name: "Central Valley Drought", type: "drought", severity: "high", lat: 36.78, lng: -119.42, description: "Severe drought conditions persist", timestamp: new Date().toISOString() },
  { id: "m-7", name: "Philippines Landslide", type: "landslide", severity: "critical", lat: 14.6, lng: 121.0, description: "High landslide risk due to heavy rainfall", timestamp: new Date().toISOString() },
  { id: "m-8", name: "Jakarta Flood Risk", type: "flood", severity: "high", lat: -6.21, lng: 106.85, description: "Coastal flooding threat elevated", timestamp: new Date().toISOString() },
];

router.get("/disasters", (_req, res) => {
  res.json(disasters);
});

router.get("/disasters/:id", (req, res) => {
  const disaster = disasters.find(d => d.id === req.params.id);
  if (!disaster) {
    return res.status(404).json({ error: "Disaster not found" });
  }
  return res.json(disaster);
});

export default router;
