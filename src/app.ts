import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todos.routes";
import { errorHandler } from "./middleware/error";

export const app = express();

app.use(cors());
app.use(express.json());

function lazyRoutes(loader: () => Promise<{ default: express.Router }>): express.Router {
  const router = express.Router();

  router.use(async (req, res, next) => {
    try {
      const mod = await loader();
      return mod.default(req, res, next);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KubeDrill API</title>
    <style>
      :root {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #eef3f8;
        color: #172033;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        padding: 32px 18px;
      }

      main {
        width: min(980px, 100%);
        margin: 0 auto;
      }

      .shell {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
        gap: 20px;
        align-items: stretch;
      }

      .panel {
        border: 1px solid #d9e1ee;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 20px 45px rgba(23, 32, 51, 0.08);
        padding: 28px;
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
        font-size: clamp(2rem, 6vw, 4rem);
        line-height: 0.95;
        letter-spacing: 0;
      }

      p {
        margin: 0;
        color: #536176;
        font-size: 1.05rem;
        line-height: 1.6;
      }

      h2 {
        margin: 0 0 16px;
        font-size: 1.25rem;
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

      form {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
      }

      input {
        min-width: 0;
        flex: 1;
        border: 1px solid #c8d6ea;
        border-radius: 6px;
        padding: 11px 12px;
        font: inherit;
      }

      button {
        border: 0;
        border-radius: 6px;
        background: #176b45;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        padding: 11px 14px;
      }

      button.icon {
        width: 40px;
        height: 40px;
        padding: 0;
        display: grid;
        place-items: center;
        background: #edf3fa;
        color: #344256;
      }

      ul {
        display: grid;
        gap: 10px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      li {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) 40px;
        gap: 10px;
        align-items: center;
        border: 1px solid #d9e1ee;
        border-radius: 8px;
        padding: 10px;
      }

      li.done span {
        color: #6b7688;
        text-decoration: line-through;
      }

      .empty {
        border: 1px dashed #c8d6ea;
        border-radius: 8px;
        color: #536176;
        padding: 16px;
        text-align: center;
      }

      .error {
        color: #b42318;
        min-height: 24px;
        margin-top: 12px;
        font-size: 0.95rem;
      }

      @media (max-width: 760px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .panel {
          padding: 22px;
        }

        form {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="shell">
        <section class="panel">
          <div class="status"><span class="dot" aria-hidden="true"></span> Backend is running</div>
          <h1>KubeDrill API</h1>
          <p>This server is live on Vercel. Try the todo list to send real GET, POST, PATCH, and DELETE requests to the backend.</p>
          <div class="links" aria-label="Useful API links">
            <a href="/health">Health check</a>
            <a href="/todos">Todos JSON</a>
            <a href="/blog-posts">Blog posts</a>
          </div>
        </section>

        <section class="panel" aria-labelledby="todo-title">
          <h2 id="todo-title">Todo backend demo</h2>
          <form id="todo-form">
            <input id="todo-input" name="title" maxlength="120" placeholder="Add a todo" autocomplete="off" />
            <button type="submit">Add</button>
          </form>
          <ul id="todo-list" aria-live="polite"></ul>
          <p id="todo-error" class="error"></p>
        </section>
      </div>
    </main>

    <script>
      const list = document.querySelector("#todo-list");
      const form = document.querySelector("#todo-form");
      const input = document.querySelector("#todo-input");
      const error = document.querySelector("#todo-error");

      async function request(path, options) {
        const response = await fetch(path, {
          headers: { "Content-Type": "application/json" },
          ...options,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Request failed");
        }

        return response.status === 204 ? null : response.json();
      }

      function render(todos) {
        if (!todos.length) {
          list.innerHTML = '<li class="empty">No todos yet.</li>';
          return;
        }

        list.innerHTML = todos.map((todo) => \`
          <li class="\${todo.completed ? "done" : ""}" data-id="\${todo.id}">
            <button class="icon" data-action="toggle" aria-label="\${todo.completed ? "Mark todo active" : "Mark todo complete"}">\${todo.completed ? "✓" : "○"}</button>
            <span>\${todo.title.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]))}</span>
            <button class="icon" data-action="delete" aria-label="Delete todo">×</button>
          </li>
        \`).join("");
      }

      async function loadTodos() {
        try {
          error.textContent = "";
          const data = await request("/todos");
          render(data.todos);
        } catch (err) {
          error.textContent = err.message;
        }
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = input.value.trim();
        if (!title) return;

        try {
          await request("/todos", { method: "POST", body: JSON.stringify({ title }) });
          input.value = "";
          await loadTodos();
        } catch (err) {
          error.textContent = err.message;
        }
      });

      list.addEventListener("click", async (event) => {
        const button = event.target.closest("button");
        const item = event.target.closest("li[data-id]");
        if (!button || !item) return;

        try {
          if (button.dataset.action === "delete") {
            await request(\`/todos/\${item.dataset.id}\`, { method: "DELETE" });
          } else {
            await request(\`/todos/\${item.dataset.id}\`, {
              method: "PATCH",
              body: JSON.stringify({ completed: !item.classList.contains("done") }),
            });
          }
          await loadTodos();
        } catch (err) {
          error.textContent = err.message;
        }
      });

      loadTodos();
    </script>
  </body>
</html>`);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/todos", todoRoutes);
app.use("/", lazyRoutes(() => import("./routes/auth.routes")));
app.use("/", lazyRoutes(() => import("./routes/blog.routes")));
app.use("/", lazyRoutes(() => import("./routes/interviews.routes")));
app.use("/", lazyRoutes(() => import("./routes/sessions.routes")));

app.use(errorHandler);
