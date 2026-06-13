import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import blogRoutes from "./routes/blog.routes";
import interviewRoutes from "./routes/interviews.routes";
import sessionRoutes from "./routes/sessions.routes";
import { errorHandler } from "./middleware/error";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/", authRoutes);
app.use("/", blogRoutes);
app.use("/", interviewRoutes);
app.use("/", sessionRoutes);

app.use(errorHandler);
