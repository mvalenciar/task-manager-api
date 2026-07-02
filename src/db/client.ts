import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";
import process from "node:process";

import { PrismaClient } from "../../generated/prisma/client.ts";

// Configuración de la conexión a la base de datos
const connectionString =
	process.env.NODE_ENV === "test" ? "file:./test.db" : "file:./dev.db";

// Instanciamos el adaptador oficial que pide Prisma v7 para SQLite
const adapter = new PrismaBetterSqlite3({ url: connectionString });

// Inicializamos el cliente pasándole el adaptador
export const prisma = new PrismaClient({ adapter });

prisma
	.$connect()
	.then(() =>
		console.log(
			"💾 ¡Conexión exitosa a la base de datos SQLite con Prisma v7!",
		),
	)
	.catch((err) =>
		console.error("❌ Error al conectar con la base de datos:", err),
	);
