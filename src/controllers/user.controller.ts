import bycrypt from "bcrypt";
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

		// 2.1 Encreiptación de la contraseña
		const saltRounds = 10;
		const hashedPassword = await bycrypt.hash(password, saltRounds);

		// 3. Insertar el nuevo usuario usando la contraseña encriptada en la base de datos
		const new_user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
			},
			// Seguridad: Seleccionamos solo campos públicos para no devolver la contraseña en el JSON
			select: {
				id: true,
				email: true,
				createdAt: true,
			},
		});

		// 4. Responder con éxito absoluto (Código 201: Creado)
		res.status(201).json({
			message: "¡Usuario registrado con éxito en la base de datos!",
			user: new_user,
		});
		//
	} catch (error) {
		console.log("❌ Error grave en registrarUsuario:", error);
		res.status(500).json({
			error: "Hubo un error interno en el servidor al procesar el registro.",
		});
	}
}

export async function loginUser(req: Request, res: Response) {
	try {
		const { email, password } = req.body;

		//1. Validar campos obligatorios
		if (!email || !password) {
			return res
				.status(400)
				.json({ error: "El correo y la contraseña son obligatorios." });
		}

		//2. Verificar si existe el usuario
		const user = await prisma.user.findUnique({
			where: { email },
		});

		//3. Mensaje de error si el usuario no existe
		if (!user) {
			return res.status(401).json({ error: "Email o contraseña incorrectos." });
		}

		//4. Comparamos la clave limpia con el hash de la base de datos
		const isPasswordCorrect = await bycrypt.compare(password, user.password);

		if (!isPasswordCorrect) {
			return res.status(401).json({ error: "Email o contraseña incorrectos." });
		}

		//5. Éxito absoluto
		res.status(200).json({
			message: "¡Usuario autenticado con éxito!",
			user: {
				id: user.id,
				email: user.email,
				createdAt: user.createdAt,
			},
		});
	} catch (error) {
		console.error("❌ Error grave en iniciarSesion:", error);
		res
			.status(500)
			.json({
				error:
					"Hubo un error interno en el servidor al intentar iniciar sesión.",
			});
	}
}
