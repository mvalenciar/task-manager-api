import request from "supertest";
import { vi } from "vitest";
import { prisma } from "../../db/client.ts";
import { app } from "../../index.ts";

export const mockAlias = "test_alias";
export const mockEmail = "test@test.com";
export const mockPassword = "test_password";

// Intercepta la creación real del usuario para forzar de forma limpia el error 500
export const spyRegister = () => {
	const prismaSpy = vi
		.spyOn(prisma.user, "create")
		.mockRejectedValue(new Error("Error forzado en la creación del usuario"));

	return prismaSpy;
};

// Intercepta el inicio de sesión del usuario para forzar de forma limpia el error 500
export const spyLogin = () => {
	const prismaSpy = vi
		.spyOn(prisma.user, "findUnique")
		.mockRejectedValue(new Error("Error forzado en inicio de sesión"));

	return prismaSpy;
};

// Intercepta los errores de la consola para forzar de forma limpia el error 500
export const spyConsoleError = () => {
	const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

	return consoleSpy;
};

// Simulación petición http para verificación del email vía query params
export const mockVerifyEmail = async (token?: string) => {
	const req = request(app).get("/api/users/verify-email");

	if (token !== undefined) {
		return await req.query({ token });
	}

	return await req;
};

export const mockResponseRegister = async (
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

export const mockResponseLogin = async (
	email: string | null = null,
	password: string | null = null,
) => {
	return await request(app).post("/api/users/login").send({
		email,
		password,
	});
};
