import { Router, type IRouter } from "express";
import { alerts } from "../data/liveData";

const router: IRouter = Router();

router.get("/alerts", (_req, res) => {
  res.json(alerts);
});

export default router;
