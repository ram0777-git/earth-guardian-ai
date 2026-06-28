import { Router, type IRouter } from "express";
import healthRouter from "./health";
import disastersRouter from "./disasters";
import alertsRouter from "./alerts";
import riskRouter from "./risk";
import weatherRouter from "./weather";
import predictionsRouter from "./predictions";
import rakshRouter from "./raksh";

const router: IRouter = Router();

router.use(healthRouter);
router.use(disastersRouter);
router.use(alertsRouter);
router.use(riskRouter);
router.use(weatherRouter);
router.use(predictionsRouter);
router.use(rakshRouter);

export default router;
