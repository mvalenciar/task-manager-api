import { defineConfig } from "prisma/config"; // 👈 Esta es la importación oficial en v7

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "file:./dev.db", // 👈 Aquí se define la ruta a tu archivo SQLite
  },
});
