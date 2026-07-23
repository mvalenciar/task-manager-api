import assert from "node:assert";
import request from "supertest";
import { describe, test } from "vitest"; // 👈 🔄 Cambiado de "node:test" a "vitest"
import { app } from "../index.ts";

describe("🛡️ Pruebas del Módulo de Salud (Health)", () => {
	test("It should return status 200 and the server live message", async () => {
		//Supertest hace la petición a la ruta /api/health
		const response = await request(app)
			.get("/api/health")
			.expect("Content-Type", /json/)
			.expect(200);

		// Assert verifica que los datos internos sean exactamente los que esperas
		assert.strictEqual(response.body.status, "ok");
		assert.strictEqual(response.body.message, "API is running");
	});

	test("It should return status 404 if the route is not found", async () => {
		const response = await request(app).get("/api/healing").expect(404);

		assert.strictEqual(response.status, 404);
	});
});
