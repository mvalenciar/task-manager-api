import request from "supertest";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { prisma } from "../db/client.ts";
import { app } from "../index.ts";

describe("🛡️ user controller (Con Vitest)", () => {
	beforeAll(async () => {
		try {
			await prisma.user.deleteMany({});
		} catch {}
	});

	test("Debería retornar estado 201 y crear el usuario correctamente", async () => {
		const response = await request(app).post("/api/users/register").send({
			email: "miltontest_vitest@correo.com",
			password: "password123",
		});

		expect(response.status).toBe(201);
		expect(response.body.message).toBe(
			"¡Usuario registrado con éxito en la base de datos!",
		);
	});

	test("Debería iniciar sesión y retornar un token JWT", async () => {
		const response = await request(app).post("/api/users/login").send({
			email: "miltontest_vitest@correo.com",
			password: "password123",
		});

		expect(response.status).toBe(200);
		expect(response.body.token).toBeDefined();
	});

	test("Debería retornar un error 401 si el usuario no existe", async () => {
		const response = await request(app).post("/api/users/login").send({
			email: "miltontest_vitest@correo.com",
			password: "password321",
		});
		expect(response.status).toBe(401);
		expect(response.body.error).toBe("Email o contraseña incorrectos.");
	});

	test("Debería retornar un error 400 si falta el email o la contraseña", async () => {
		const response = await request(app).post("/api/users/login").send({
			email: "miltontest_vitest@correo.com",
		});

		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"El correo y la contraseña son obligatorios.",
		);
	});

	test("Debería retornar un error 500 si hay un error interno", async () => {
		const prismaSpy = vi
			.spyOn(prisma.user, "findUnique")
			.mockRejectedValue(
				new Error("Fallo simulado del disco duro o base de datos"),
			);

		const response = await request(app).post("/api/users/login").send({
			email: "miltontest_vitest@correo.com",
			password: "password123",
		});
		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno en el servidor al intentar iniciar sesión.",
		);

		prismaSpy.mockRestore();
	});
});
