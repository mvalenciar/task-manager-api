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

const spyRegister = () => {
	const prismaSpy = vi
		.spyOn(prisma.user, "findFirst")
		.mockRejectedValue(new Error("Error en la base de datos"));

	return prismaSpy;
};

const spyLogin = () => {
	const prismaSpy = vi
		.spyOn(prisma.user, "findUnique")
		.mockRejectedValue(new Error("Error en la base de datos"));

	return prismaSpy;
};

const spyConsoleError = () => {
	const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

	return consoleSpy;
};

const mockVerifyEmail = async () => {
	await prisma.user.update({
		where: { email: mockEmail },
		data: { isVerified: true },
	});
};

const mockResponseRegister = async (
	alias: string | null = null,
	email: string | null = null,
	password: string | null = null,
) => {
	return await request(app).post("/api/users/register").send({
		alias,
		email,
		password,
	});
};

const mockResponseLogin = async (
	email: string | null = null,
	password: string | null = null,
) => {
	return await request(app).post("/api/users/login").send({
		email,
		password,
	});
};

describe("🛡️ User Controller Integration Tests", () => {
	beforeAll(async () => {
		await prisma.user.deleteMany();
	});

	test("should return 201 status and register the user successfully when valid data is provided", async () => {
		const response = await mockResponseRegister(
			mockAlias,
			mockEmail,
			mockPassword,
		);

		expect(response.status).toBe(201);
		expect(response.body.message).toBe(
			"¡Registro exitoso! Por favor, revisa tu bandeja de entrada para activar tu cuenta.",
		);
	});

	test("should return 400 status when trying to register an existing email or alias", async () => {
		const response = await mockResponseRegister(
			mockAlias,
			mockEmail,
			mockPassword,
		);

		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"Este alias y correo electrónico ya está registrado.",
		);
	});

	test("should return 400 status when required fields are missing in registration", async () => {
		const response = await mockResponseRegister(mockEmail, mockPassword);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			"El alias, el correo y la contraseña son obligatorios.",
		);
	});

	test("should return 500 if register procese is fail", async () => {
		const prismaSpy = spyRegister();
		const consoleSpy = spyConsoleError();

		const response = await mockResponseRegister(
			mockAlias,
			mockEmail,
			mockPassword,
		);

		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno en el servidor al procesar el registro.",
		);

		prismaSpy.mockRestore();
		consoleSpy.mockRestore();
	});

	test("should reject login with 403 status when the email account is not verified yet", async () => {
		const response = await mockResponseLogin(mockEmail, mockPassword);

		expect(response.status).toBe(403);
		expect(response.body.error).toBe(
			"Tu cuenta aún no ha sido activada. Por favor, verifica tu correo electrónico antes de ingresar.",
		);
	});

	test("should login successfully and return a JWT token when the account is verified", async () => {
		await mockVerifyEmail();

		const response = await mockResponseLogin(mockEmail, mockPassword);

		expect(response.status).toBe(200);
		expect(response.body.token).toBeDefined();
		expect(response.body.message).toBe("¡Usuario autenticado con éxito!");
	});

	test("should return 400 status when required fields are missing in login", async () => {
		await mockVerifyEmail();

		const response = await mockResponseLogin(mockEmail);

		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"El correo y la contraseña son obligatorios.",
		);
	});

	test("should return 401 status when required field are incorrect in login", async () => {
		await mockVerifyEmail();

		const response = await mockResponseLogin(mockEmail, "1234");

		expect(response.status).toBe(401);
		expect(response.body.error).toBe("Email o contraseña incorrectos.");
	});

	test("should return 500 status when login process is fail", async () => {
		const prismaSpy = spyLogin();

		const consoleSpy = spyConsoleError();

		await mockVerifyEmail();

		const response = await mockResponseLogin(mockEmail, mockPassword);

		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno en el servidor al intentar iniciar sesión.",
		);

		prismaSpy.mockRestore();
		consoleSpy.mockRestore();
	});
});
