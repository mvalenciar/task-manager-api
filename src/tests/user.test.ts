import request from "supertest";
import { beforeAll, describe, expect, test } from "vitest";
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

		// 👈 ¡Tus aserciones nativas y hermosas de Vitest!
		expect(response.status).toBe(201);
		expect(response.body.message).toBe(
			"¡Usuario registrado con éxito en la base de datos!",
		);
	});
});
