import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/weather", (_req, res) => {
  return res.json({
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
  });
});

export default router;
