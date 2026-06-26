import { Router } from "express";
import { registerUser } from "../controllers/user.controller.ts";

export const userRouter = Router();

userRouter.post("/register", registerUser);
