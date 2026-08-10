import { beforeAll, describe, expect, test, vi } from "vitest";
import { prisma } from "../db/client.ts";
import {
	mockAlias,
	mockEmail,
	mockPassword,
	mockResponseForgotPassword,
	mockResponseLogin,
	mockResponseRegister,
	mockResponseResetPassword,
	mockVerifyEmail,
	spyConsoleError,
	spyLogin,
	spyRegister,
} from "./helpers/user-test.helpers.ts";

vi.mock("../services/emailService.ts", () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(true),
	sendResetPasswordEmail: vi.fn().mockResolvedValue(true),
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

	test("should return 200 status and re-dispatch verification token when trying to register an unverified existing email or alias", async () => {
		const response = await mockResponseRegister(
			mockAlias,
			mockEmail,
			mockPassword,
		);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe(
			"Tu cuenta estaba pendiente de activación. Hemos reenviado un nuevo enlace a tu bandeja de entrada.",
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

	test("should return 200 status and activate the account when a valid verification token is provided", async () => {
		// Buscamos al usuario que creamos en el primer test de registro
		const user = await prisma.user.findUnique({
			where: { email: mockEmail },
		});

		// Le disparamos el token real que Prisma guardó en SQLite de aislamiento
		const response = await mockVerifyEmail(user?.verificationToken as string);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe(
			"¡Cuenta activada con éxito! Ya puedes iniciar sesión de forma segura.",
		);

		// Verificamos la mutación física en la BD de aislamiento
		const updatedUser = await prisma.user.findUnique({
			where: { email: mockEmail },
		});
		expect(updatedUser?.isVerified).toBe(true);
		expect(updatedUser?.verificationToken).toBeNull();
	});

	test("should return status 500 when verify email is fail", async () => {
		const consoleSpy = spyConsoleError();

		await mockResponseRegister("aliasEmail", "email@test.com", "password123");

		const user = await prisma.user.findUnique({
			where: { email: "email@test.com" },
		});

		const prismaSpy = vi
			.spyOn(prisma.user, "update")
			.mockRejectedValue(new Error("Error forzado en verificación de email"));

		const response = await mockVerifyEmail(user?.verificationToken as string);

		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno en el servidor al intentar verificar el correo.",
		);

		consoleSpy.mockRestore();
		prismaSpy.mockRestore();
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
		const response = await mockResponseLogin("noExist", "password123");

		expect(response.status).toBe(401);
		expect(response.body.error).toBe("Email o contraseña incorrectos.");
	});

	test("should return 403 status when trying to login with an unverified account", async () => {
		await mockResponseRegister(
			"new_alias",
			"new_email@test.com",
			"new_password",
		);

		const response = await mockResponseLogin(
			"new_email@test.com",
			"new_password",
		);

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

	// ==========================================
	// 4. RECUPERACIÓN DE CONTRASEÑA (forgotPassword & resetPassword)
	// ==========================================

	test("should return 200 and generate a reset token for an existing email", async () => {
		const forgotPassword = await mockResponseForgotPassword(mockEmail);

		const user = await prisma.user.findUnique({
			where: {
				email: mockEmail,
			},
		});

		expect(forgotPassword.status).toBe(200);
		expect(user?.resetPasswordToken).toBeDefined();
		expect(user?.resetPasswordToken).not.toBeNull();
		expect(user?.resetPasswordExpires).toBeDefined();
		expect(user?.resetPasswordExpires).not.toBeNull();
		expect(forgotPassword.body.message).toBe(
			"¡Enlace de recuperación generado con éxito! Revisa tu bandeja de entrada.",
		);
	});

	test("should return 400 status when no email is provided in the body", async () => {
		const response = await mockResponseForgotPassword("");

		expect(response.status).toBe(400);
		expect(response.body.error).toBe("El correo electrónico es obligatorio.");
	});

	test("should return 200 status when email is no correct", async () => {
		const response = await mockResponseForgotPassword("invalidEmail");

		expect(response.status).toBe(200);
		expect(response.body.message).toBe(
			"Si el correo está registrado, recibirás un enlace de recuperación en breve.",
		);
	});

	test("should return status 500 when forgotten password process is fail", async () => {
		const consoleSpy = spyConsoleError();
		const prismaSpy = vi
			.spyOn(prisma.user, "update")
			.mockRejectedValue(
				new Error("Error forzado en el proceso de recuperación de contraseña"),
			);

		const forgotPassword = await mockResponseForgotPassword(mockEmail);

		const user = await prisma.user.findUnique({
			where: {
				email: mockEmail,
			},
		});

		expect(forgotPassword.status).toBe(500);
		expect(forgotPassword.body.error).toBe(
			"Hubo un error interno en el servidor al procesar la recuperación de contraseña.",
		);

		consoleSpy.mockRestore();
		prismaSpy.mockRestore();
	});

	// ==========================================
	// 5. RESTABLECIMIENTO FINAL (resetPassword)
	// ==========================================

	test("should return 400 when token or password are missing in resetPassword", async () => {
		const response = await mockResponseResetPassword("", "newPassword123");
		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"El token y la contraseña son obligatorios.",
		);
	});

	test("should return 400 when the reset token does not exist in the database", async () => {
		const response = await mockResponseResetPassword(
			"token_falso_inexistente",
			"newPassword123",
		);
		expect(response.status).toBe(400);
		expect(response.body.error).toBe(
			"El enlace de recuperación es inválido o ya ha sido utilizado.",
		);
	});

	test("should return 200, successfully update the password, and destroy the recovery keys", async () => {
		const userBefore = await prisma.user.findUnique({
			where: { email: mockEmail },
		});

		const response = await mockResponseResetPassword(
			userBefore?.resetPasswordToken as string,
			"okinawaNuevaClave2026",
		);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("Contraseña actualizada con éxito.");

		const userAfter = await prisma.user.findUnique({
			where: { email: mockEmail },
		});
		expect(userAfter?.resetPasswordToken).toBeNull();
		expect(userAfter?.resetPasswordExpires).toBeNull();

		expect(userAfter?.password).not.toBe(mockPassword);
	});

	test("should return 500 status when database update fails during password reset", async () => {
		const tempUser = await prisma.user.create({
			data: {
				alias: "user_fail_reset_500",
				email: "fail_reset500@test.com",
				password: "password_viejo_123",
				resetPasswordToken: "token_fresco_exclusivo_para_error_500",
				resetPasswordExpires: new Date(Date.now() + 3600000), // Válido por 1 hora
			},
		});

		const consoleSpy = spyConsoleError();

		// 2. El candado: Obligamos al método 'update' de Prisma a colapsar
		const prismaSpy = vi
			.spyOn(prisma.user, "update")
			.mockRejectedValue(
				new Error("Catástrofe forzada en SQLite para resetPassword"),
			);

		// 3. Disparamos la petición usando el token REAL de nuestro usuario fresco
		const response = await mockResponseResetPassword(
			tempUser.resetPasswordToken as string,
			"nueva_password_123",
		);

		// 4. Como el token existe y es válido, pasará la aduana, tocará el update y saltará al catch (500)
		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"Hubo un error interno en el servidor al intentar cambiar la contraseña.",
		);

		consoleSpy.mockRestore();
		prismaSpy.mockRestore();
	});
});
