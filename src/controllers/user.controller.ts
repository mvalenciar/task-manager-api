import crypto from "node:crypto";
import bycrypt from "bcrypt";
import type { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import { prisma } from "../db/client.js";
import {
	sendResetPasswordEmail,
	sendVerificationEmail,
} from "../services/emailService.js";

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
			//Si el usuario ya está registrado y verificado
			if (existing_user.isVerified) {
				return res.status(400).json({
					error: "Este alias o correo electrónico ya está registrado y activo.",
				});
			}

			//Si el usuario no está verificado
			const newVerificationToken = crypto.randomBytes(32).toString("hex");
			const hashedPassword = await bycrypt.hash(password, 10); //Se actualiza la clave por si la hubiera cambiado

			await prisma.user.update({
				where: {
					id: existing_user.id,
				},
				data: {
					password: hashedPassword,
					verificationToken: newVerificationToken,
				},
			});

			await sendVerificationEmail(email, alias, newVerificationToken);

			return res.status(200).json({
				message:
					"Tu cuenta estaba pendiente de activación. Hemos reenviado un nuevo enlace a tu bandeja de entrada.",
			});
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
		console.error("❌ Error grave en registrarUsuario:", error);
		res.status(500).json({
			error: "Hubo un error interno en el servidor al procesar el registro.",
		});
	}
}

export async function verifyEmail(req: Request, res: Response) {
	try {
		// 1. Capturamos el token de la URL (Query Params)
		const { token } = req.query;

		if (!token) {
			return res
				.status(400)
				.json({ error: "El token de verificación es obligatorio." });
		}

		//2. Verificar si el token existe en la base de datos
		const user = await prisma.user.findFirst({
			where: { verificationToken: String(token) },
		});
		// 3. Si el token es falso o ya ha expirado, bloqueamos el acceso
		if (!user) {
			return res
				.status(400)
				.json({ error: "El token es inválido o ya ha expirado." });
		}

		//4. Actualizamos la columna de verificación en la base de datos
		await prisma.user.update({
			where: { id: user.id },
			data: {
				isVerified: true,
				verificationToken: null,
			},
		});

		//5. Responder con éxito absoluto (Código 200: OK)
		res.status(200).json({
			message:
				"¡Cuenta activada con éxito! Ya puedes iniciar sesión de forma segura.",
		});
	} catch (error) {
		console.error("❌ Error grave en verifyEmail:", error);
		res.status(500).json({
			error:
				"Hubo un error interno en el servidor al intentar verificar el correo.",
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

		// 3.1 Candado de Ciberseguridad: Bloquear usuarios que no han verificado su correo electrónico
		if (!user.isVerified) {
			return res.status(403).json({
				error:
					"Tu cuenta aún no ha sido activada. Por favor, verifica tu correo electrónico antes de ingresar.",
			});
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

export async function forgotPassword(req: Request, res: Response) {
	try {
		const { email } = req.body;

		// 1. Validación de campos obligatorios
		if (!email) {
			return res.status(400).json({
				error: "El correo electrónico es obligatorio.",
			});
		}

		//2. Verificación de existencia del correo electrónico en la base de datos
		const user = await prisma.user.findUnique({
			where: { email },
		});

		// 3. Por seguridad de la aplicación, en caso de que el usuario no existe, se devuelve un mensaje de ok genérico
		if (!user) {
			return res.status(200).json({
				message:
					"Si el correo está registrado, recibirás un enlace de recuperación en breve.",
			});
		}

		//4. Generación de un token de recuperación de un solo uso
		const resetToken = crypto.randomBytes(32).toString("hex");

		//5. Establecimiento del tiempo de expiración del token
		const tokenExpiry = new Date(Date.now() + 3600000); // 1 hora

		//6. Guardar los datos del token en la base de datos
		await prisma.user.update({
			where: {
				id: user.id,
			},
			data: {
				resetPasswordToken: resetToken,
				resetPasswordExpires: tokenExpiry,
			},
		});

		// 6. Despachar el correo electrónico (Mañana o en el siguiente paso crearemos el helper)
		// Por ahora simularemos la URL de tu frontend
		const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
		console.log(`✉️ Enlace de recuperación generado para Mailtrap: ${resetUrl}`);

		await sendResetPasswordEmail(email, user.alias, resetToken);

		// RESPUESTA DE ÉXITO SEMÁNTICO
		return res.status(200).json({
			message:
				"¡Enlace de recuperación generado con éxito! Revisa tu bandeja de entrada.",
		});
	} catch (error) {
		console.error("❌ Error grave en forgotPassword:", error);
		return res.status(500).json({
			error:
				"Hubo un error interno en el servidor al procesar la recuperación de contraseña.",
		});
	}
}

export async function resetPassword(req: Request, res: Response) {
	try {
		const { token, password } = req.body;

		//1. Validar campos obligatorios
		if (!token || !password) {
			return res.status(400).json({
				error: "El token y la contraseña son obligatorios.",
			});
		}

		//2. Verificar si el token existe en la base de datos
		const user = await prisma.user.findFirst({
			where: { resetPasswordToken: token },
		});

		//3. Si el token no existe, devolvemos un mensaje de error indicando un fallo en el enlace recibido
		if (!user) {
			return res.status(400).json({
				error: "El enlace de recuperación es inválido o ya ha sido utilizado.",
			});
		}

		//4. Verificar si el token ha expirado
		if (
			user.resetPasswordExpires &&
			user.resetPasswordExpires.getTime() < Date.now()
		) {
			return res.status(400).json({
				error:
					"El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.",
			});
		}

		//5. Encriptación perimetral de la nueva contraseña
		const saltRounds = 10;
		const hashedPassword = await bycrypt.hash(password, saltRounds);

		//6. Actualización de la contraseña en la base de datos
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword, // Inyectamos el nuevo hash
				resetPasswordToken: null, // Destruimos la llave (un solo uso)
				resetPasswordExpires: null, // Limpiamos el reloj de control
			},
		});

		//7. Respuesta de éxito absoluto
		return res.status(200).json({
			message: "Contraseña actualizada con éxito.",
		});
	} catch (error) {
		console.error("❌ Error grave en resetPassword:", error);
		return res.status(500).json({
			error:
				"Hubo un error interno en el servidor al intentar cambiar la contraseña.",
		});
	}
}
