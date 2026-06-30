import process from "node:process";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function requireAuthentication(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		// 1. Capturar el token desde las cabeceras (Headers)
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			return res
				.status(401)
				.json({ error: "🔒 Acceso denegado. Token ausente o mal formado." });
		}

		// 2. Extraer el token del header
		const token = authHeader.split("Bearer ")[1];

		// 3. verificar el token
		const secretKey = process.env.JWT_SECRET || "clave_por_defecto_segura";

		// jwt.verify descifrar el token
		const decoded = jwt.verify(token, secretKey) as { userId: number };

		// 4. Inyectar el userId descifrado en la petición
		req.userId = decoded.userId;

		next();
	} catch (error) {
		console.log(error);
		return res.status(401).json({
			error: "🔒 Token inválido o expirado. Inicie sesión nuevamente.",
		});
	}
}
