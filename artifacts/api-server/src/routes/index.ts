import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import orgRouter from "./org";
import donorsRouter from "./donors";
import programsRouter from "./programs";
import fundingRouter from "./funding";
import dashboardRouter from "./dashboard";
import { requireAuth } from "../middlewares/auth";
import { mutationLimiter } from "../middlewares/rateLimit";

const router: IRouter = Router();

// Public routes (no authentication required)
router.use(healthRouter);
router.use(authRouter);

// Everything below requires a valid session (cookie or Bearer token)
router.use(requireAuth);
router.use(mutationLimiter);

router.use(orgRouter);
router.use(donorsRouter);
router.use(programsRouter);
router.use(fundingRouter);
router.use(dashboardRouter);

export default router;
