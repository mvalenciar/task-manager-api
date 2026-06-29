// Enseñamos a TypeScript que la Request de Express ahora incluye opcionalmente el userId
declare global {
	namespace Express {
		interface Request {
			userId?: number;
		}
	}
}

export {};
