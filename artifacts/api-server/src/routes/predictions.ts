import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/predictions", (_req, res) => {
  return res.json({
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
  });
});

router.get("/timeline", (_req, res) => {
  return res.json([
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
      description: "Pacific Tsunami Warning Centre cancelled advisory for coastal California following offshore quake.",
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
  ]);
});

export default router;
