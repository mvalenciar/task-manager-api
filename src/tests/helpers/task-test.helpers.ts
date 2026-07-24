import request from "supertest";
import { vi } from "vitest";
import { prisma } from "../../db/client.ts";
import { app } from "../../index.ts";

export const mockTaskAlias = "alias_task";
export const mockTaskEmail = "task@test.com";
export const mockTaskPassword = "task_password";

export const mockTask = {
	title: "Task_1",
	description: "Task_1_description",
};

export const setupTaskTests = async () => {
	await prisma.user.deleteMany();
	await prisma.task.deleteMany();

	await request(app).post("/api/users/register").send({
		alias: mockTaskAlias,
		email: mockTaskEmail,
		password: mockTaskPassword,
	});

	await prisma.user.update({
		where: { email: mockTaskEmail },
		data: {
			isVerified: true,
			verificationToken: null,
		},
	});

	const loginResponse = await request(app).post("/api/users/login").send({
		email: mockTaskEmail,
		password: mockTaskPassword,
	});

	return loginResponse.body.token;
};

export const mockSpyConsoleError = () => {
	const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	return consoleSpy;
};

export const mockResponseCreateTask = async (
	title: string | null,
	description: string | null,
	validToken: string,
) => {
	return await request(app)
		.post("/api/tasks")
		.set("Authorization", `Bearer ${validToken}`)
		.send({
			title,
			description,
		});
};

export const mockResponseGetAllTasks = async (validToken: string) => {
	return await request(app)
		.get("/api/tasks")
		.set("Authorization", `Bearer ${validToken}`);
};

export const mockResponseUpdateTask = async (
	taskId: number,
	validToken: string,
	body: { title?: string; description?: string; completed?: boolean },
) => {
	return await request(app)
		.put(`/api/tasks/${taskId}`)
		.set("Authorization", `Bearer ${validToken}`)
		.send(body);
};

export const mockResponseDeleteTask = async (
	taskId: number,
	validToken: string,
) => {
	return await request(app)
		.delete(`/api/tasks/${taskId}`)
		.set("Authorization", `Bearer ${validToken}`);
};
