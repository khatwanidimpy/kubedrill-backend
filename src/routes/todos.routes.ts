import { Router } from "express";
import { createTodo, deleteTodo, listTodos, updateTodo } from "../controllers/todos.controller";

const router = Router();

router.get("/todos", listTodos);
router.post("/todos", createTodo);
router.patch("/todos/:id", updateTodo);
router.delete("/todos/:id", deleteTodo);

export default router;
