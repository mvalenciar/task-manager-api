import type { Request, Response } from "express";
import { prisma } from "../db/client.ts";

export async function createTask(req: Request, res: Response) {
	try {
		const { title, description } = req.body;

		//Leemos el userId que inyecto el middleware
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
		console.error("❌ Error grave en crear Tarea:", error);
		res
			.status(500)
			.json({ error: "Hubo un error interno al intentar crear la tarea." });
	}
}

export async function getAllTasks(req: Request, res: Response) {
	try {
		const userId = req.userId;

		const allTasks = await prisma.task.findMany({
			where: {
				userId: userId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return res
			.status(200)
			.json({ message: "✅ Tareas obtenidas con éxito!", tasks: allTasks });
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ error: "❌ Error grave al obtener las tareas." });
	}
}

export async function updateTask(req: Request, res: Response) {
	try {
		//1. Extraer el id de la petición
		const taskId = Number(req.params.id);
		//2. Extraer los parámetros de la petición
		const { title, description, completed } = req.body;

		//3. validar que existe la tarea con el id de la petición
		const existingTask = await prisma.task.findUnique({
			where: { id: taskId },
		});

		if (!existingTask) {
			return res.status(404).json({ error: "❌ Tarea no encontrada." });
		}

		// 4. Actualizar la tarea con los nuevos datos
		const updateTask = await prisma.task.update({
			where: { id: taskId },
			data: {
				title: title !== undefined ? title : existingTask.title,
				description:
					description !== undefined ? description : existingTask.description,
				completed: completed !== undefined ? completed : existingTask.completed,
			},
		});

		// 5. Responder con éxito absoluto
		res.status(200).json({
			message: "✅ Tarea actualizada con éxito!",
			task: updateTask,
		});
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ error: "❌ Error grave al actualizar la tarea." });
	}
}

export async function deleteTask(req: Request, res: Response) {
	try {
		//1. Extraer el id de la petición
		const taskId = Number(req.params.id);

		//2. validar que existe la tarea con el id de la petición
		const existingTask = await prisma.task.findUnique({
			where: {
				id: taskId,
			},
		});

		if (!existingTask) {
			return res.status(404).json({ error: "❌ Tarea no encontrada." });
		}

		//3. Eliminar la tarea
		const deleteTask = await prisma.task.delete({
			where: {
				id: taskId,
			},
		});
		res.status(200).json({
			message: "✅ Tarea eliminada con éxito!",
			task: deleteTask,
		});
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ error: "❌ Error grave al eliminar la tarea." });
	}
}
