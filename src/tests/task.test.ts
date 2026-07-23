import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { prisma } from "../db/client.ts";
import {
	mockResponseCreateTask,
	mockResponseDeleteTask,
	mockResponseGetAllTasks,
	mockResponseUpdateTask,
	mockSpyConsoleError,
	mockTask,
	setupTaskTests,
} from "./helpers/task-test.helpers.ts";

vi.mock("../services/emailService.ts", () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

describe("🛡️ Task Controller Integration Tests", () => {
	let validToken: string;
	let taskIdCreated: number;

	beforeAll(async () => {
		const generatedToken = await setupTaskTests();
		validToken = generatedToken;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("should return 400 status when trying to create a task without title", async () => {
		const response = await mockResponseCreateTask(
			"",
			mockTask.description,
			validToken,
		);

		expect(response.status).toBe(400);
		expect(response.body.error).toBe("⚠️ El título de la tarea es obligatorio.");
	});

	test("should return 201 status and create the task successfully", async () => {
		const response = await mockResponseCreateTask(
			mockTask.title,
			mockTask.description,
			validToken,
		);

		expect(response.status).toBe(201);
		expect(response.body.message).toBe("✅ Tarea creada con éxito!");
		expect(response.body.task).toHaveProperty("id");
		expect(response.body.task.title).toBe(mockTask.title);
		expect(response.body.task.description).toBe(mockTask.description);

		taskIdCreated = response.body.task.id;
	});

	test("should return 500 status when create the task fail", async () => {
		vi.spyOn(prisma.task, "create").mockRejectedValue(
			new Error("Error forzado en la creación de la tarea"),
		);

		mockSpyConsoleError();

		const response = await mockResponseCreateTask(
			mockTask.title,
			mockTask.description,
			validToken,
		);

		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno al intentar crear la tarea.",
		);
	});

	test("should return status 200 when get all tasks", async () => {
		const response = await mockResponseGetAllTasks(validToken);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("✅ Tareas obtenidas con éxito!");
		expect(response.body.tasks).toContainEqual(
			expect.objectContaining({
				title: mockTask.title,
				description: mockTask.description,
			}),
		);
	});

	test("should return status 500 when get all task is fail", async () => {
		vi.spyOn(prisma.task, "findMany").mockRejectedValue(
			new Error("Error forzado en la obtención de las tareas"),
		);

		mockSpyConsoleError();

		const response = await mockResponseGetAllTasks(validToken);

		expect(response.status).toBe(500);
		expect(response.body.error).toBe("❌ Error grave al obtener las tareas.");
	});

	test("should return 200 status and update the task successfully", async () => {
		const response = await mockResponseUpdateTask(taskIdCreated, validToken, {
			title: "Task_1_Updated",
			completed: true,
		});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("✅ Tarea actualizada con éxito!");
		expect(response.body.task.title).toBe("Task_1_Updated");
		expect(response.body.task.completed).toBe(true);
		expect(response.body.task.description).toBe(mockTask.description);
	});

	test("should return 404 status when trying to update a non-existing task", async () => {
		const response = await mockResponseUpdateTask(9999, validToken, {
			title: "Ghost Task",
		});

		expect(response.status).toBe(404);
		expect(response.body.error).toBe("❌ Tarea no encontrada.");
	});

	test("should return 404 when trying delete no-existing task", async () => {
		const response = await mockResponseDeleteTask(9999, validToken);

		expect(response.status).toBe(404);
		expect(response.body.error).toBe("❌ Tarea no encontrada.");
	});

	test("should return status 200 when delete the task successfully", async () => {
		const response = await mockResponseDeleteTask(taskIdCreated, validToken);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("✅ Tarea eliminada con éxito!");
	});
});
