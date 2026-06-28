import { Router, type IRouter } from "express";
import { riskFactors, riskScore } from "../data/liveData";

const router: IRouter = Router();

router.get("/risk-factors", (_req, res) => {
  return res.json(riskFactors);
});

router.get("/risk-score", (_req, res) => {
  return res.json(riskScore);
});

export default router;
