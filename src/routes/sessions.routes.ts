import { Router } from "express";
import { createSession, getSession } from "../controllers/sessions.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/sessions", requireAuth, createSession);
router.get("/sessions/:id", requireAuth, getSession);

export default router;
