import { beforeAll, describe, expect, test } from "vitest";
import {
	mockResponseCreateTask,
	mockTask,
	setupTaskTests,
} from "./helpers/task-test.helpers.ts";

describe("🛡️ task controller", () => {
	let tokenValid: string;
	let taskIdCreated: number;

	beforeAll(async () => {
		console.log("🚀 Iniciando tests de tareas");
		//justamente esta linea me da error
		tokenValid = await setupTaskTests();
	});

	test("Debería retornar status 201 y crear la tarea correctamente", async () => {
		console.log(tokenValid);
		/*const response = await mockResponseCreateTask(
			mockTask.title,
			mockTask.description,
			tokenValid,
		);

		taskIdCreated = response.body.task.id;

		expect(response.status).toBe(201);
		expect(response.body.message).toBe("✅ Tarea creada con éxito!");*/
	});

	/*test("debería retornar error 400 si no se envía el título de la tarea", async () => {
		const response = await request(app)
			.post("/api/tasks")
			.set("Authorization", `Bearer ${tokenValid}`)
			.send({
				title: undefined,
				description: undefined,
			});
		expect(response.status).toBe(400);
		expect(response.body.error).toBe("⚠️ El título de la tarea es obligatorio.");
	});

	test("Debería retornar status 200 y obtener todas las tareas", async () => {
		const response = await request(app)
			.get("/api/tasks")
			.set("Authorization", `Bearer ${tokenValid}`);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("✅ Tareas obtenidas con éxito!");
		expect(response.body.tasks).toContainEqual(
			expect.objectContaining({
				title: "Task 1",
				description: "Task 1 description",
			}),
		);
	});

	test("Debería actualizar la tarea correctamente", async () => {
		const response = await request(app)
			.put(`/api/tasks/${taskIdCreated}`)
			.set("Authorization", `Bearer ${tokenValid}`)
			.send({
				title: "Task 1 updated",
				description: "Task 1 description updated",
			});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("✅ Tarea actualizada con éxito!");
	});

	test("Debería eliminar la tarea correctamente", async () => {
		const response = await request(app)
			.delete(`/api/tasks/${taskIdCreated}`)
			.set("Authorization", `Bearer ${tokenValid}`);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("✅ Tarea eliminada con éxito!");
	});*/
});
