import { Router } from "express";
import {
	loginUser,
	registerUser,
	verifyEmail,
} from "../controllers/user.controller.ts";

export const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/verify-email", verifyEmail);
