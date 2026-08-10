import cron from "node-cron";
import { prisma } from "../db/client.js";

export function initCleanupCron() {
	// 🎯 Ejecución estricta todos los días a la medianoche (00:00 AM)
	cron.schedule("0 0 * * *", async () => {
		console.log(
			"🧹 [CRON] Iniciando depuración automática de cuentas huérfanas...",
		);

		try {
			// Calculamos el tiempo límite: Hace 48 horas exactas desde este instante
			const expirationLimit = new Date(Date.now() - 48 * 60 * 60 * 1000);

			// Le ordenamos a Prisma borrar los registros que cumplan las dos condiciones
			const deletedRecords = await prisma.user.deleteMany({
				where: {
					isVerified: false, // 1. Cuentas no activadas (emails erróneos o fantasmas)
					createdAt: { lt: expirationLimit }, // 2. Creadas hace más de 48 horas
				},
			});

			if (deletedRecords.count > 0) {
				console.log(
					`✅ [CRON] Éxito: Se eliminaron ${deletedRecords.count} cuentas inactivas expiradas.`,
				);
			} else {
				console.log(
					"ℹ️ [CRON] No se encontraron cuentas expiradas para depurar hoy.",
				);
			}
		} catch (error) {
			console.error(
				"❌ [CRON] Error grave en la tarea de depuración automática:",
				error,
			);
		}
	});
}
