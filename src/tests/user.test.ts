import request from "supertest";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { prisma } from "../db/client.ts";
import { app } from "../index.ts";

const mockAlias = "test_alias";
const mockEmail = "test@test.com";
const mockPassword = "test_password";

vi.mock("../services/emailService.ts", () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

describe("🛡️ User Controller Integration Tests", () => {
	beforeAll(async () => {
		await prisma.user.deleteMany();
	});

	test("should return 201 status and register the user successfully when valid data is provided", async () => {
		const response = await request(app).post("/api/users/register").send({
			alias: mockAlias,
			email: mockEmail,
			password: mockPassword,
		});

		expect(response.status).toBe(201);
		expect(response.body.message).toBe(
			"¡Registro exitoso! Por favor, revisa tu bandeja de entrada para activar tu cuenta.",
		);
	});

	test("should return 400 status when trying to register an existing email or alias", async () => {
		const response = await request(app).post("/api/users/register").send({
			alias: mockAlias,
			email: mockEmail,
			password: mockPassword,
		});

		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"Este alias y correo electrónico ya está registrado.",
		);
	});

	test("should return 400 status when required fields are missing in registration", async () => {
		const response = await request(app).post("/api/users/register").send({
			email: mockEmail,
			password: mockPassword,
		});

		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			"El alias, el correo y la contraseña son obligatorios.",
		);
	});

	test("should return 500 if register procese is fail", async () => {
		const prismaSpy = vi
			.spyOn(prisma.user, "findFirst")
			.mockRejectedValue(new Error("Error en la base de datos"));

		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const response = await request(app).post("/api/users/register").send({
			alias: mockAlias,
			email: mockEmail,
			password: mockPassword,
		});

		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno en el servidor al procesar el registro.",
		);

		prismaSpy.mockRestore();
		consoleSpy.mockRestore();
	});
});
