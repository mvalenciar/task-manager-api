import { beforeAll, describe, expect, test, vi } from "vitest";
import { prisma } from "../db/client.ts";
import {
	mockAlias,
	mockEmail,
	mockPassword,
	mockResponseLogin,
	mockResponseRegister,
	mockVerifyEmail,
	spyConsoleError,
	spyLogin,
	spyRegister,
} from "./helpers/user-test.helpers.ts";

vi.mock("../services/emailService.ts", () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

describe("🛡️ User Controller Integration Tests", () => {
	beforeAll(async () => {
		await prisma.user.deleteMany();
	});

	// ==========================================
	// 1. REGISTRO DE USUARIOS (registerUser)
	// ==========================================

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
		expect(response.body.user).toHaveProperty("id");
		expect(response.body.user.password).toBe(undefined);
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
		const response = await mockResponseRegister("", mockEmail, mockPassword);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			"El alias, el correo y la contraseña son obligatorios.",
		);
	});

	test("should return 500 if register procese is fail", async () => {
		const prismaSpy = spyRegister();
		const consoleSpy = spyConsoleError();

		const response = await mockResponseRegister(
			"failUser",
			"fail@test.com",
			"password123",
		);

		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno en el servidor al procesar el registro.",
		);

		prismaSpy.mockRestore();
		consoleSpy.mockRestore();
	});

	// ==========================================
	// 2. VERIFICACIÓN DE EMAIL (verifyEmail)
	// ==========================================
	test("should return 400 status if no token is provided in the query params", async () => {
		const response = await mockVerifyEmail("");

		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"El token de verificación es obligatorio.",
		);
	});

	test("should return 400 status if the verification token is invalid or expired", async () => {
		const response = await mockVerifyEmail("invalidToken");
		expect(response.status).toBe(400);
		expect(response.body.error).toBe("El token es inválido o ya ha expirado.");
	});

	// ==========================================
	// 3. AUTENTICACIÓN (loginUser)
	// ==========================================
	test("should return 400 status during login when email or password fields are missing", async () => {
		const response = await mockResponseLogin("", "");

		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"El correo y la contraseña son obligatorios.",
		);
	});

	test("should return 401 status when user credentials do not exist", async () => {
		const response = await mockResponseLogin("noexit", "password123");

		expect(response.status).toBe(401);
		expect(response.body.error).toBe("Email o contraseña incorrectos.");
	});

	test("should return 403 status when trying to login with an unverified account", async () => {
		const response = await mockResponseLogin(mockEmail, mockPassword);

		expect(response.status).toBe(403);
		expect(response.body.error).toBe(
			"Tu cuenta aún no ha sido activada. Por favor, verifica tu correo electrónico antes de ingresar.",
		);
	});

	test("should return 401 status when password is incorrect", async () => {
		const user = await prisma.user.findUnique({
			where: {
				email: mockEmail,
			},
		});

		await mockVerifyEmail(user?.verificationToken as string);

		const response = await mockResponseLogin(mockEmail, "1234");

		expect(response.status).toBe(401);
		expect(response.body.error).toBe("Email o contraseña incorrectos.");
	});

	test("should return 200 status and a valid JWT token when valid credentials are provided", async () => {
		const response = await mockResponseLogin(mockEmail, mockPassword);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("¡Usuario autenticado con éxito!");
		expect(response.body.user.email).toBe(mockEmail);
		expect(response.body.token).toBeDefined();
	});

	test("should return 500 status when login process fails", async () => {
		const prismaSpy = spyLogin();
		const consoleSpy = spyConsoleError();

		try {
			const response = await mockResponseLogin(mockEmail, mockPassword);

			expect(response.status).toBe(500);
			expect(response.body.error).toBe(
				"Hubo un error interno en el servidor al intentar iniciar sesión.",
			);
		} finally {
			prismaSpy.mockRestore();
			consoleSpy.mockRestore();
		}
	});
});
