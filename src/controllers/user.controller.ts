import type { Request, Response } from "express";
import { prisma } from "../db/client.ts";

export async function registerUser(req: Request, res: Response) {
	try {
		const { email, password } = req.body;

		//1. Validar campos obligatorios
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: "El correo y la contraseña son obligatorios." });
		}

		//2. Verificar si el correo ya existe
		const existing_user = await prisma.user.findUnique({
			where: { email },
		});

		if (existing_user) {
			return res
				.status(400)
				.json({ error: "Este correo electrónico ya está registrado." });
		}

		// 3. Crear el nuevo usuario en la base de datos SQLite
	} catch (error) {}
}
