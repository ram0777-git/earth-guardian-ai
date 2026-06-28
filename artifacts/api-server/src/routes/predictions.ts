import { Router, type IRouter } from "express";
import { predictions, timeline } from "../data/liveData";

const router: IRouter = Router();

router.get("/predictions", (_req, res) => {
  return res.json(predictions);
});

router.get("/timeline", (_req, res) => {
  return res.json(timeline);
});

export default router;
