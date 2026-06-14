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

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KubeDrill API</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f5f7fb;
        color: #172033;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px;
      }

      main {
        width: min(720px, 100%);
        border: 1px solid #d9e1ee;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 20px 45px rgba(23, 32, 51, 0.08);
        padding: 32px;
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: #176b45;
        font-weight: 700;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #22c55e;
        box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.16);
      }

      h1 {
        margin: 16px 0 8px;
        font-size: clamp(2rem, 5vw, 3.5rem);
        line-height: 1;
      }

      p {
        margin: 0;
        color: #536176;
        font-size: 1.05rem;
        line-height: 1.6;
      }

      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }

      a {
        color: #0f5fb8;
        border: 1px solid #c8d6ea;
        border-radius: 6px;
        padding: 10px 12px;
        text-decoration: none;
        font-weight: 650;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          background: #0d1117;
          color: #f3f6fb;
        }

        main {
          background: #151b23;
          border-color: #2a3443;
          box-shadow: none;
        }

        p {
          color: #b6c2d2;
        }

        .status {
          color: #67e8a7;
        }

        a {
          color: #8ec5ff;
          border-color: #34445a;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="status"><span class="dot" aria-hidden="true"></span> Backend is running</div>
      <h1>KubeDrill API</h1>
      <p>The backend is online and ready to serve requests. Use the health endpoint for uptime checks, or call the API routes from the frontend.</p>
      <div class="links" aria-label="Useful API links">
        <a href="/health">Health check</a>
        <a href="/blog-posts">Blog posts</a>
      </div>
    </main>
  </body>
</html>`);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/", authRoutes);
app.use("/", blogRoutes);
app.use("/", interviewRoutes);
app.use("/", sessionRoutes);

app.use(errorHandler);
