import { Router, type IRouter } from "express";
import { weather } from "../data/liveData";

const router: IRouter = Router();

router.get("/weather", (_req, res) => {
  return res.json(weather);
});

export default router;
