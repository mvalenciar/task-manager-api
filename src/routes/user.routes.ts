import { Router } from "express";
import {
	forgotPassword,
	loginUser,
	registerUser,
	resetPassword,
	verifyEmail,
} from "../controllers/user.controller.js";

export const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/verify-email", verifyEmail);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
