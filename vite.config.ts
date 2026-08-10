import { builtinModules } from "node:module";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		ssr: true,
		target: "node22",
		outDir: "dist",
		rollupOptions: {
			input: "src/index.ts",
			output: {
				entryFileNames: "index.js",
				format: "esm",
			},
			external: [
				"@prisma/client",
				"express",
				"cors",
				"dotenv",
				"bcrypt",
				"jsonwebtoken",
				"node-cron",
				"nodemailer",
				...builtinModules,
				...builtinModules.map((m) => `node:${m}`),
			],
		},
	},
});
