import bcrypt from "bcrypt";
import { prisma } from "../src/db/client.js";

async function main() {
	console.log("🌱 Arrancando el sembrado de la base de datos...");

	const demoEmail = "demo@taskmanager.com";

	// 1. Verificar si el usuario demo ya existe para no duplicarlo
	const existingUser = await prisma.user.findUnique({
		where: { email: demoEmail },
	});

	if (!existingUser) {
		// 2. Encriptamos la contraseña con el mismo estándar de tu controlador
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash("Demo1234*", saltRounds);

		// 3. Insertamos el usuario demo directamente con estado verificado
		await prisma.user.create({
			data: {
				alias: "Invitado_Demo",
				email: demoEmail,
				password: hashedPassword,
				isVerified: true, // Queda verificado de forma nativa e inmediata
				verificationToken: null,
			},
		});

		console.log(
			"🎯 ¡Cuenta Demo sembrada con éxito en la base de datos relacional!",
		);
	} else {
		console.log(
			"✨ La cuenta Demo ya existía. Sincronización omitida de forma segura.",
		);
	}
}

main()
	.catch((e) => {
		console.error("❌ Error catastrófico en el proceso de seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
