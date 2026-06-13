import { Router } from "express";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPost,
  listBlogPosts,
  updateBlogPost,
} from "../controllers/blog.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/blog-posts", listBlogPosts);
router.get("/blog-posts/:slug", getBlogPost);
router.post("/blog-posts", requireAuth, requireRole("ADMIN"), createBlogPost);
router.put("/blog-posts/:id", requireAuth, requireRole("ADMIN"), updateBlogPost);
router.delete("/blog-posts/:id", requireAuth, requireRole("ADMIN"), deleteBlogPost);

export default router;
