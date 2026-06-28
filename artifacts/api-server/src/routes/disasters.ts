import { Router, type IRouter } from "express";
import { disasters } from "../data/liveData";

const router: IRouter = Router();

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
