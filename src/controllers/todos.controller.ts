import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const todos: Todo[] = [
  {
    id: randomUUID(),
    title: "Confirm the backend is live",
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    title: "Add your first todo",
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Todo title is required").max(120),
});

const updateTodoSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  completed: z.boolean().optional(),
});

export function listTodos(_req: Request, res: Response) {
  res.json({ todos });
}

export function createTodo(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTodoSchema.parse(req.body);
    const todo: Todo = {
      id: randomUUID(),
      title: data.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.unshift(todo);
    res.status(201).json({ todo });
  } catch (e) {
    next(e);
  }
}

export function updateTodo(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTodoSchema.parse(req.body);
    const todo = todos.find((item) => item.id === req.params.id);
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    if (data.title !== undefined) todo.title = data.title;
    if (data.completed !== undefined) todo.completed = data.completed;

    res.json({ todo });
  } catch (e) {
    next(e);
  }
}

export function deleteTodo(req: Request, res: Response) {
  const index = todos.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Todo not found" });

  todos.splice(index, 1);
  res.status(204).send();
}
