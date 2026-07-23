import request from "supertest";
import { prisma } from "../../db/client.ts";
import { app } from "../../index.ts";
import {
	mockAlias,
	mockEmail,
	mockPassword,
	mockResponseRegister,
	mockVerifyEmail,
} from "./user-test.helpers.ts";

export const mockTask = {
	title: "Task_1",
	description: "Task_1_description",
};

export const setupTaskTests = async () => {
	try {
		// Limpiamos las tablas para empezar desde cero
		await prisma.task.deleteMany({});
		await prisma.user.deleteMany({});

		// 2. Registramos al dueño de las tareas de forma fantasma
		await mockResponseRegister(mockAlias, mockEmail, mockPassword);
		await mockVerifyEmail();

		// 3. Hacemos el Login para que el servidor nos devuelva el JWT real
		const loginRes = await request(app).post("/api/users/login").send({
			email: mockEmail,
			password: mockPassword,
		});

		// 4. 🎯 Guardamos el token emitido en nuestra variable global
		return loginRes.body.token;
	} catch (error) {
		console.error("Error configurando el entorno de tareas:", error);
	}
};

export const mockResponseCreateTask = async (
	title: string,
	description: string,
	tokenValid: string,
) => {
	return await request(app)
		.post("/api/tasks")
		.set("Authorization", `Bearer ${tokenValid}`)
		.send({
			title,
			description,
		});
};
