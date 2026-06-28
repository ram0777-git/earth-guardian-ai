import { Router, type IRouter } from "express";

const router: IRouter = Router();

const riskFactors = [
  { id: "rf-1", name: "Seismic Activity", score: 62, level: "moderate", description: "Elevated micro-seismic events detected along the San Andreas fault segment." },
  { id: "rf-2", name: "Flood Risk", score: 78, level: "high", description: "Heavy rainfall forecast with saturated soil conditions in low-lying areas." },
  { id: "rf-3", name: "Wildfire Risk", score: 45, level: "moderate", description: "Moderate fire weather index with dry vegetation in eastern hills." },
  { id: "rf-4", name: "Hurricane Exposure", score: 12, level: "low", description: "No tropical systems within 500 miles. Minimal hurricane-related risk." },
  { id: "rf-5", name: "Infrastructure Vulnerability", score: 55, level: "moderate", description: "Aging levee systems in flood-prone zones require monitoring during peak rainfall." },
  { id: "rf-6", name: "Population Density Impact", score: 71, level: "high", description: "High population density in coastal zones amplifies potential evacuation complexity." },
];

router.get("/risk-factors", (_req, res) => {
  return res.json(riskFactors);
});

router.get("/risk-score", (_req, res) => {
  return res.json({
    overall: 68,
    level: "high",
    timestamp: new Date().toISOString(),
  });
});

export default router;
