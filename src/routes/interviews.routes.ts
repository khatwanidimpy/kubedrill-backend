import { Router } from "express";
import {
  createInterview,
  deleteInterview,
  getInterview,
  getResult,
  listInterviews,
  listResults,
  submitInterview,
  updateInterview,
} from "../controllers/interviews.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/interviews", requireAuth, listInterviews);
router.get("/interviews/:id", requireAuth, getInterview);
router.post("/interviews", requireAuth, requireRole("ADMIN"), createInterview);
router.put("/interviews/:id", requireAuth, requireRole("ADMIN"), updateInterview);
router.delete("/interviews/:id", requireAuth, requireRole("ADMIN"), deleteInterview);
router.post("/interviews/:id/submit", requireAuth, submitInterview);

router.get("/results", requireAuth, listResults);
router.get("/results/:id", requireAuth, getResult);

export default router;
