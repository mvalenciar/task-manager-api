import { defineConfig } from "prisma/config"; // Importación oficial en v7

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: "file:./dev.db", // Definición de la ruta a tu archivo SQLite
	},
});
