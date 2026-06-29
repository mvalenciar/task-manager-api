import type { Request, Response } from "express";
import { prisma } from "../db/client.ts";

export async function createTask(req: Request, res: Response) {
	try {
		const { title, description } = req.body;

		//Leemos el userId que inyecto el middelwawre
		const userId = req.userId;

		if (!title) {
			return res
				.status(400)
				.json({ error: "⚠️ El título de la tarea es obligatorio." });
		}

		if (!userId) {
			return res
				.status(401)
				.json({ error: "⚠️ Usuario no autenticado correctamente." });
		}

		// Crear la tarea vinculada de forma relacional al ID del usuario
		const newTask = await prisma.task.create({
			data: {
				title,
				description,
				userId,
			},
		});

		res.status(201).json({
			message: "✅ Tarea creada con éxito!",
			task: newTask,
		});
	} catch (error) {
		console.error("❌ Error grave en crearTarea:", error);
		res
			.status(500)
			.json({ error: "Hubo un error interno al intentar crear la tarea." });
	}
}
