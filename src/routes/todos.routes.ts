import { Router } from "express";
import { createTodo, deleteTodo, listTodos, updateTodo } from "../controllers/todos.controller";

const router = Router();

router.get("/", listTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
