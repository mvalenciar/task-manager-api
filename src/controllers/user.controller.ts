import crypto from "node:crypto";
import bycrypt from "bcrypt";
import type { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import { prisma } from "../db/client.ts";
import { sendVerificationEmail } from "../services/emailService.ts";

export async function registerUser(req: Request, res: Response) {
	try {
		const { alias, email, password } = req.body;

		//1. Validar campos obligatorios
		if (!alias || !email || !password) {
			return res.status(400).json({
				message: "El alias, el correo y la contraseña son obligatorios.",
			});
		}

		//2. Verificar si el correo y el alias ya existe
		const existing_user = await prisma.user.findFirst({
			where: {
				OR: [{ email }, { alias }],
			},
		});

		if (existing_user) {
			return res
				.status(400)
				.json({ error: "Este alias y correo electrónico ya está registrado." });
		}

		// 2.1 Encriptación  de la contraseña
		const saltRounds = 10;
		const hashedPassword = await bycrypt.hash(password, saltRounds);

		// 2.2 Generación de un token de verificación
		const verificationToken = crypto.randomBytes(32).toString("hex");

		// 3. Insertar el nuevo usuario usando la contraseña encriptada en la base de datos
		const new_user = await prisma.user.create({
			data: {
				alias,
				email,
				password: hashedPassword,
				verificationToken,
			},
			// Seguridad: Seleccionamos solo campos públicos para no devolver la contraseña en el JSON
			select: {
				id: true,
				alias: true,
				email: true,
				createdAt: true,
			},
		});

		// 3.1 Despachar el correo electrónico de activación con la llave criptográfica
		await sendVerificationEmail(email, alias, verificationToken);

		// 4. Responder con éxito absoluto (Código 201: Creado)
		res.status(201).json({
			message:
				"¡Registro exitoso! Por favor, revisa tu bandeja de entrada para activar tu cuenta.",
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

		//4.1 Creación del token
		const payload = { userId: user.id };
		const secretKey = process.env.JWT_SECRET || "clave_por_defecto_segura";
		const token = Jwt.sign(payload, secretKey, { expiresIn: "24h" });

		//5. Éxito absoluto
		res.status(200).json({
			message: "¡Usuario autenticado con éxito!",
			token,
			user: {
				id: user.id,
				email: user.email,
				createdAt: user.createdAt,
			},
		});
	} catch (error) {
		console.error("❌ Error grave en iniciar sesión:", error);
		res.status(500).json({
			error: "Hubo un error interno en el servidor al intentar iniciar sesión.",
		});
	}
}
