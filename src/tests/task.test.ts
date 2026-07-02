import request from "supertest";
import { beforeAll, describe, expect, test } from "vitest";
import { prisma } from "../db/client.ts";
import { app } from "../index.ts";

describe("🛡️ task controller", () => {
	let tokenValid: string;

	beforeAll(async () => {
		try {
			// Limpiamos las tablas para empezar desde cero
			await prisma.task.deleteMany({});
			await prisma.user.deleteMany({});

			const emailTest = "user_tasks@test.com";
			const passwordTest = "password123";

			// 2. Registramos al dueño de las tareas de forma fantasma
			await request(app)
				.post("/api/users/register")
				.send({ email: emailTest, password: passwordTest });

			// 3. Hacemos el Login para que el servidor nos devuelva el JWT real
			const loginRes = await request(app)
				.post("/api/users/login")
				.send({ email: emailTest, password: passwordTest });

			// 4. 🎯 Guardamos el token emitido en nuestra variable global
			tokenValid = loginRes.body.token;
		} catch (error) {
			console.error("Error configurando el entorno de tareas:", error);
		}
	});

	test("Debería retornar status 201 y crear la tarea correctamente", async () => {
		const response = await request(app)
			.post("/api/tasks")
			.set("Authorization", `Bearer ${tokenValid}`)
			.send({
				title: "Task 1",
				description: "Task 1 description",
			});

		expect(response.status).toBe(201);
		expect(response.body.message).toBe("✅ Tarea creada con éxito!");
	});

	/*test("Debería retornar status 200 y obtener todas las tareas", async () => {
		const response = await request(app).get("/api/tasks");

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("✅ Tareas obtenidas con éxito!");
	});*/
});
