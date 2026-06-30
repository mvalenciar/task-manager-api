import { Router } from "express";

import {
	createTask,
	getAllTasks,
	updateTask,
} from "../controllers/task.controller.ts";
import { requireAuthentication } from "../middlewares/auth.middleware.ts";

export const taskRouter = Router();

taskRouter.get("/", requireAuthentication, getAllTasks);

taskRouter.post("/", requireAuthentication, createTask);

taskRouter.put("/:id", requireAuthentication, updateTask);
