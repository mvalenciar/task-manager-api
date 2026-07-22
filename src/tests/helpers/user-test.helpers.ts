import request from "supertest";
import { vi } from "vitest";
import { prisma } from "../../db/client.ts";
import { app } from "../../index.ts";

export const mockAlias = "test_alias";
export const mockEmail = "test@test.com";
export const mockPassword = "test_password";

export const spyRegister = () => {
	const prismaSpy = vi
		.spyOn(prisma.user, "findFirst")
		.mockRejectedValue(new Error("Error en la base de datos"));

	return prismaSpy;
};

export const spyLogin = () => {
	const prismaSpy = vi
		.spyOn(prisma.user, "findUnique")
		.mockRejectedValue(new Error("Error en la base de datos"));

	return prismaSpy;
};

export const spyConsoleError = () => {
	const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

	return consoleSpy;
};

export const mockVerifyEmail = async () => {
	await prisma.user.update({
		where: { email: mockEmail },
		data: { isVerified: true },
	});
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
