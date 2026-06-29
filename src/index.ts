import cors from "cors";
import express from "express";
import "dotenv/config";
import process from "node:process";

// Activar la conexión con Prisma
import "./db/client.ts";

//Rutas
import { taskRouter } from "./routes/task.routes.ts";
import { userRouter } from "./routes/user.routes.ts";

const app = express();
// Se usara por defecto el puerto 4000 o el que se especifique en el archivo .env
const PORT = process.env.PORT || 4000;

// Se habilitara el CORS para que se permita la comunicación entre el front-end y el back-end
app.use(cors());

// Se habilitara la lectura de paquetes JSON
app.use(express.json());

// Ruta de prueba inicial
app.get("/api/health", (_, res) => {
	res.json({ status: "ok", message: "API is running" });
});

// Manejador de registro de usuario
app.use("/api/users", userRouter);

// Manejador de tareas
app.use("/api/tasks", taskRouter);

// Manejador de rutas no encontradas
app.use((_, res) => {
	res.status(404).json({ status: "error", message: "Route not found" });
});

// Iniciar el servidor
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
