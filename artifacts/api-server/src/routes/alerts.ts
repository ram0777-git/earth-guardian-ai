import { Router, type IRouter } from "express";

const router: IRouter = Router();

const alerts = [
  { id: "alert-1", title: "Flash Flood Warning", location: "Harris County, Texas", severity: "critical", time: "12 min ago", type: "flood" },
  { id: "alert-2", title: "Elevated Seismic Activity", location: "San Francisco Bay Area, CA", severity: "moderate", time: "34 min ago", type: "earthquake" },
  { id: "alert-3", title: "Red Flag Fire Weather", location: "Los Angeles County, CA", severity: "high", time: "1 hr ago", type: "wildfire" },
  { id: "alert-4", title: "Tropical Storm Watch", location: "Miami-Dade County, FL", severity: "moderate", time: "2 hr ago", type: "hurricane" },
  { id: "alert-5", title: "Landslide Risk Advisory", location: "King County, Washington", severity: "low", time: "3 hr ago", type: "landslide" },
];

router.get("/alerts", (_req, res) => {
  res.json(alerts);
});

export default router;
